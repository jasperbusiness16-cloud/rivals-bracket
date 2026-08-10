window.RGFriends = (() => {
  "use strict";

  function getFriendshipId(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  function getFriendRequestId(senderUid, receiverUid) {
    return `${senderUid}_${receiverUid}`;
  }

  function timestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  function isPermissionError(error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "").toLowerCase();

    return (
      code.includes("permission") ||
      code.includes("denied") ||
      message.includes("permission_denied") ||
      message.includes("permission denied")
    );
  }

  function bestEffort(label, action) {
    return Promise.resolve()
      .then(action)
      .catch(error => {
        console.warn(`[RG Friends] ${label} failed:`, error);
        return null;
      });
  }

  function friendIndexRecord(friendshipId, since) {
    return {
      friendshipId,
      since: since || timestamp()
    };
  }

  function repairOwnFriendIndex(uid) {
    if (!uid) return Promise.resolve({});

    return database
      .ref("friendships")
      .orderByChild(`users/${uid}`)
      .equalTo(true)
      .once("value")
      .then(snapshot => {
        const updates = {};
        const friendMap = {};

        snapshot.forEach(friendshipSnapshot => {
          const friendship = friendshipSnapshot.val() || {};
          const users = friendship.users || {};

          const friendUid = Object.keys(users).find(
            userUid => userUid !== uid && users[userUid] === true
          );

          if (!friendUid) return;

          const record = {
            friendshipId: friendshipSnapshot.key,
            since: Number(friendship.createdAt || 0)
          };

          friendMap[friendUid] = record;
          updates[`userFriends/${uid}/${friendUid}`] = record;
        });

        if (!Object.keys(updates).length) {
          return friendMap;
        }

        return database
          .ref()
          .update(updates)
          .then(() => friendMap)
          .catch(error => {
            console.warn(
              "[RG Friends] Could not repair the local friend index:",
              error
            );

            return friendMap;
          });
      })
      .catch(error => {
        console.warn(
          "[RG Friends] Canonical friendship lookup failed:",
          error
        );

        return {};
      });
  }

  function sendFriendRequest(currentUser, targetPlayer) {
    if (!currentUser?.uid) {
      return Promise.reject(new Error("You must be signed in."));
    }

    if (!targetPlayer?.uid) {
      return Promise.reject(new Error("Player account not found."));
    }

    if (currentUser.uid === targetPlayer.uid) {
      return Promise.reject(
        new Error("You cannot add yourself as a friend.")
      );
    }

    const friendshipId = getFriendshipId(
      currentUser.uid,
      targetPlayer.uid
    );

    const outgoingRequestId = getFriendRequestId(
      currentUser.uid,
      targetPlayer.uid
    );

    const reverseRequestId = getFriendRequestId(
      targetPlayer.uid,
      currentUser.uid
    );

    return Promise.all([
      database.ref(`friendships/${friendshipId}`).once("value"),
      database.ref(`friendRequests/${outgoingRequestId}`).once("value"),
      database.ref(`friendRequests/${reverseRequestId}`).once("value")
    ]).then(results => {
      if (results[0].exists()) {
        throw new Error("You are already friends with this player.");
      }

      if (results[1].exists()) {
        throw new Error("Friend request already sent.");
      }

      if (results[2].exists()) {
        throw new Error(
          "This player already sent you a friend request."
        );
      }

      const request = {
        id: outgoingRequestId,
        senderUid: currentUser.uid,
        senderName: currentUser.displayName || "Player",
        receiverUid: targetPlayer.uid,
        receiverName: targetPlayer.displayName || "Player",
        status: "pending",
        createdAt: timestamp()
      };

      const updates = {};

      updates[`friendRequests/${outgoingRequestId}`] = request;
      updates[
        `userFriendRequests/${currentUser.uid}/outgoing/${outgoingRequestId}`
      ] = true;
      updates[
        `userFriendRequests/${targetPlayer.uid}/incoming/${outgoingRequestId}`
      ] = true;

      return database.ref().update(updates);
    });
  }

  function acceptFriendRequest(currentUid, requestId) {
    if (!currentUid || !requestId) {
      return Promise.reject(new Error("Invalid friend request."));
    }

    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(async snapshot => {
        if (!snapshot.exists()) {
          throw new Error("Friend request no longer exists.");
        }

        const request = snapshot.val() || {};

        if (request.receiverUid !== currentUid) {
          throw new Error("You cannot accept this friend request.");
        }

        if (request.status !== "pending") {
          throw new Error(
            "This friend request is no longer pending."
          );
        }

        const friendshipId = getFriendshipId(
          request.senderUid,
          request.receiverUid
        );

        const friendship = {
          id: friendshipId,
          users: {
            [request.senderUid]: true,
            [request.receiverUid]: true
          },
          createdAt: timestamp()
        };

        const ownIndex = friendIndexRecord(friendshipId);

        /*
          Keep the canonical friendship and the accepting player's own
          state in the required transaction. The previous implementation
          also required writes into the sender's protected userFriends
          branch; one denied optional index write rejected the whole accept.
        */
        const requiredUpdates = {};
        requiredUpdates[`friendships/${friendshipId}`] = friendship;
        requiredUpdates[
          `userFriends/${currentUid}/${request.senderUid}`
        ] = ownIndex;
        requiredUpdates[`friendRequests/${requestId}`] = null;
        requiredUpdates[
          `userFriendRequests/${currentUid}/incoming/${requestId}`
        ] = null;

        try {
          await database.ref().update(requiredUpdates);
        } catch (error) {
          /*
            Some older rulesets do not expose userFriends at all. In that
            case preserve the canonical friendship and request transition,
            then repair the local index separately when permissions allow it.
          */
          if (!isPermissionError(error)) throw error;

          const canonicalUpdates = {};
          canonicalUpdates[`friendships/${friendshipId}`] = friendship;
          canonicalUpdates[`friendRequests/${requestId}`] = null;
          canonicalUpdates[
            `userFriendRequests/${currentUid}/incoming/${requestId}`
          ] = null;

          await database.ref().update(canonicalUpdates);

          await bestEffort(
            "accepting player friend index",
            () =>
              database
                .ref(`userFriends/${currentUid}/${request.senderUid}`)
                .set(friendIndexRecord(friendshipId))
          );
        }

        /* Sender-side mirrors are useful indexes, not friendship authority. */
        await Promise.all([
          bestEffort(
            "sender friend index",
            () =>
              database
                .ref(`userFriends/${request.senderUid}/${currentUid}`)
                .set(friendIndexRecord(friendshipId))
          ),
          bestEffort(
            "sender outgoing request cleanup",
            () =>
              database
                .ref(
                  `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
                )
                .remove()
          )
        ]);

        return {
          friendshipId,
          senderUid: request.senderUid,
          receiverUid: request.receiverUid
        };
      });
  }

  function declineFriendRequest(currentUid, requestId) {
    if (!currentUid || !requestId) {
      return Promise.reject(new Error("Invalid friend request."));
    }

    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(async snapshot => {
        if (!snapshot.exists()) return;

        const request = snapshot.val() || {};

        if (request.receiverUid !== currentUid) {
          throw new Error("You cannot decline this friend request.");
        }

        const requiredUpdates = {};
        requiredUpdates[`friendRequests/${requestId}`] = null;
        requiredUpdates[
          `userFriendRequests/${currentUid}/incoming/${requestId}`
        ] = null;

        await database.ref().update(requiredUpdates);

        await bestEffort(
          "sender outgoing request cleanup",
          () =>
            database
              .ref(
                `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
              )
              .remove()
        );
      });
  }

  function cancelFriendRequest(currentUid, requestId) {
    if (!currentUid || !requestId) {
      return Promise.reject(new Error("Invalid friend request."));
    }

    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(async snapshot => {
        if (!snapshot.exists()) return;

        const request = snapshot.val() || {};

        if (request.senderUid !== currentUid) {
          throw new Error("You cannot cancel this friend request.");
        }

        const requiredUpdates = {};
        requiredUpdates[`friendRequests/${requestId}`] = null;
        requiredUpdates[
          `userFriendRequests/${currentUid}/outgoing/${requestId}`
        ] = null;

        await database.ref().update(requiredUpdates);

        await bestEffort(
          "receiver incoming request cleanup",
          () =>
            database
              .ref(
                `userFriendRequests/${request.receiverUid}/incoming/${requestId}`
              )
              .remove()
        );
      });
  }

  function listenToFriends(uid, callback) {
    if (!uid || typeof callback !== "function") return null;

    const userFriendsRef = database.ref(`userFriends/${uid}`);
    let fallbackQuery = null;
    let fallbackRunning = false;

    const handleFallbackSnapshot = snapshot => {
      const friendMap = {};
      const repairs = {};

      snapshot.forEach(friendshipSnapshot => {
        const friendship = friendshipSnapshot.val() || {};
        const users = friendship.users || {};
        const friendUid = Object.keys(users).find(
          userUid => userUid !== uid && users[userUid] === true
        );

        if (!friendUid) return;

        const record = {
          friendshipId: friendshipSnapshot.key,
          since: Number(friendship.createdAt || 0)
        };

        friendMap[friendUid] = record;
        repairs[`userFriends/${uid}/${friendUid}`] = record;
      });

      callback(friendMap);

      if (Object.keys(repairs).length) {
        bestEffort(
          "friend index repair",
          () => database.ref().update(repairs)
        );
      }
    };

    const handleFallbackError = error => {
      console.error("Friendship fallback listener failed:", error);
      callback({});
    };

    const startFallbackListener = () => {
      if (fallbackRunning) return;

      fallbackRunning = true;
      fallbackQuery = database
        .ref("friendships")
        .orderByChild(`users/${uid}`)
        .equalTo(true);

      fallbackQuery.on(
        "value",
        handleFallbackSnapshot,
        handleFallbackError
      );
    };

    const handleUserFriendsSnapshot = snapshot => {
      const friends = snapshot.val() || {};

      if (Object.keys(friends).length > 0) {
        callback(friends);
        return;
      }

      startFallbackListener();
    };

    const handleUserFriendsError = error => {
      console.error("userFriends listener failed:", error);
      startFallbackListener();
    };

    userFriendsRef.on(
      "value",
      handleUserFriendsSnapshot,
      handleUserFriendsError
    );

    return () => {
      userFriendsRef.off("value", handleUserFriendsSnapshot);

      if (fallbackQuery) {
        fallbackQuery.off("value", handleFallbackSnapshot);
      }
    };
  }

  function listenToIncomingRequests(uid, callback) {
    const ref = database.ref(`userFriendRequests/${uid}/incoming`);
    const handler = snapshot => callback(snapshot.val() || {});

    ref.on("value", handler);
    return () => ref.off("value", handler);
  }

  function listenToOutgoingRequests(uid, callback) {
    const ref = database.ref(`userFriendRequests/${uid}/outgoing`);
    const handler = snapshot => callback(snapshot.val() || {});

    ref.on("value", handler);
    return () => ref.off("value", handler);
  }

  function getRequest(requestId) {
    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(snapshot => snapshot.val());
  }

  function searchPlayers(query) {
    const normalized = String(query || "").trim().toLowerCase();

    if (normalized.length < 3) return Promise.resolve([]);

    const currentUid = window.auth?.currentUser?.uid || "";

    return database
      .ref("players")
      .once("value")
      .then(snapshot => {
        const results = [];

        snapshot.forEach(playerSnapshot => {
          const uid = playerSnapshot.key;
          const player = playerSnapshot.val() || {};

          if (!uid || uid === currentUid) return;

          const displayName = String(
            player.displayName ||
            player.username ||
            player.rivalsIgn ||
            "Player"
          ).trim();

          const rgId = String(
            player.rgId || player.rivalsId || ""
          ).trim();

          const searchText = [
            displayName,
            rgId,
            player.rivalsIgn || ""
          ].join(" ").toLowerCase();

          if (!searchText.includes(normalized)) return;

          results.push({
            uid,
            displayName,
            rgId
          });
        });

        return results
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
          .slice(0, 10);
      });
  }

  function getPlayer(uid) {
    return database
      .ref(`players/${uid}`)
      .once("value")
      .then(snapshot => {
        const player = snapshot.val();
        return player ? { uid, ...player } : null;
      });
  }

  function getFriends(uid) {
    return database
      .ref(`userFriends/${uid}`)
      .once("value")
      .then(async snapshot => {
        let friendships = snapshot.val() || {};

        if (!Object.keys(friendships).length) {
          friendships = await repairOwnFriendIndex(uid);
        }

        return Promise.all(
          Object.keys(friendships).map(friendUid => getPlayer(friendUid))
        );
      })
      .then(players => players.filter(Boolean));
  }

  /*
    Heal an old/missing per-user friend index whenever that user opens the
    site. The canonical friendships collection remains the source of truth.
  */
  if (window.auth?.onAuthStateChanged) {
    window.auth.onAuthStateChanged(user => {
      if (!user?.uid) return;

      repairOwnFriendIndex(user.uid).catch(() => {});
    });
  }

  return {
    getFriendshipId,
    searchPlayers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    listenToFriends,
    listenToIncomingRequests,
    listenToOutgoingRequests,
    getRequest,
    getPlayer,
    getFriends,
    repairOwnFriendIndex
  };
})();
