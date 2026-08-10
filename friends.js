window.RGFriends = (() => {
  "use strict";

  /*
    Canonical deployed RTDB schema:
      friendRequests/{requestId}
      userFriendRequests/{uid}/incoming/{requestId}
      userFriendRequests/{uid}/outgoing/{requestId}
      friendships/{friendshipId}
      userFriends/{uid}/{friendUid}

    A short-lived frontend build referenced top-level incomingFriendRequests /
    outgoingFriendRequests paths. Keep those callers compatible by redirecting
    them to the deployed userFriendRequests branches.
  */
  const rawDatabaseRef = database.ref.bind(database);

  function mapCompatibilityPath(value) {
    if (typeof value !== "string") return value;

    const path = String(value).replace(/^\/+|\/+$/g, "");

    let match = path.match(/^incomingFriendRequests\/([^/]+)(?:\/(.*))?$/);
    if (match) {
      const tail = match[2] ? `/${match[2]}` : "";
      return `userFriendRequests/${match[1]}/incoming${tail}`;
    }

    match = path.match(/^outgoingFriendRequests\/([^/]+)(?:\/(.*))?$/);
    if (match) {
      const tail = match[2] ? `/${match[2]}` : "";
      return `userFriendRequests/${match[1]}/outgoing${tail}`;
    }

    return value;
  }

  if (!window.__RG_FRIEND_RULES_PATH_BRIDGE__) {
    window.__RG_FRIEND_RULES_PATH_BRIDGE__ = true;

    database.ref = path => {
      if (typeof path !== "string") {
        return rawDatabaseRef(path);
      }

      return rawDatabaseRef(mapCompatibilityPath(path));
    };
  }

  function timestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  function getFriendshipId(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  function getFriendRequestId(senderUid, receiverUid) {
    return `${senderUid}_${receiverUid}`;
  }

  function friendIndexRecord(friendshipId, since) {
    return {
      friendshipId,
      since: since || timestamp()
    };
  }

  function bestEffort(label, action) {
    return Promise.resolve()
      .then(action)
      .catch(error => {
        console.warn(`[RG Friends] ${label} failed:`, error);
        return null;
      });
  }

  async function migrateLegacyRequestIndexes() {
    // No migration is required. The deployed schema is userFriendRequests.
    return;
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
            console.warn("[RG Friends] Friend index repair failed:", error);
            return friendMap;
          });
      })
      .catch(error => {
        console.warn("[RG Friends] Friendship lookup failed:", error);
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
      return Promise.reject(new Error("You cannot add yourself as a friend."));
    }

    const friendshipId = getFriendshipId(currentUser.uid, targetPlayer.uid);
    const outgoingRequestId = getFriendRequestId(
      currentUser.uid,
      targetPlayer.uid
    );
    const reverseRequestId = getFriendRequestId(
      targetPlayer.uid,
      currentUser.uid
    );

    /*
      friendRequests is readable to authenticated users in the deployed rules,
      so these duplicate checks are safe and avoid a confusing permission error
      when a pending request already exists.
    */
    return Promise.all([
      database.ref(`friendships/${friendshipId}`).once("value"),
      database.ref(`friendRequests/${outgoingRequestId}`).once("value"),
      database.ref(`friendRequests/${reverseRequestId}`).once("value")
    ]).then(async ([friendshipSnapshot, outgoingSnapshot, reverseSnapshot]) => {
      if (friendshipSnapshot.exists()) {
        throw new Error("You are already friends with this player.");
      }

      if (outgoingSnapshot.exists()) {
        throw new Error("Friend request already sent.");
      }

      if (reverseSnapshot.exists()) {
        throw new Error("This player already sent you a friend request.");
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

      await database.ref().update(updates);
      return request;
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
          throw new Error("This friend request is no longer pending.");
        }

        const friendshipId = getFriendshipId(
          request.senderUid,
          request.receiverUid
        );

        /*
          The deployed friendship validation requires id, users, createdAt and
          lifetimeGifts. lifetimeGifts begins at zero for a new friendship.
        */
        const friendship = {
          id: friendshipId,
          users: {
            [request.senderUid]: true,
            [request.receiverUid]: true
          },
          createdAt: timestamp(),
          lifetimeGifts: 0
        };

        const receiverIndex = friendIndexRecord(friendshipId);
        const senderIndex = friendIndexRecord(friendshipId);

        const updates = {};
        updates[`friendships/${friendshipId}`] = friendship;
        updates[`userFriends/${currentUid}/${request.senderUid}`] = receiverIndex;
        updates[`userFriends/${request.senderUid}/${currentUid}`] = senderIndex;
        updates[`friendRequests/${requestId}`] = null;
        updates[`userFriendRequests/${currentUid}/incoming/${requestId}`] = null;
        updates[
          `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
        ] = null;

        await database.ref().update(updates);

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

        const updates = {};
        updates[`friendRequests/${requestId}`] = null;
        updates[`userFriendRequests/${currentUid}/incoming/${requestId}`] = null;
        updates[
          `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
        ] = null;

        await database.ref().update(updates);
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

        const updates = {};
        updates[`friendRequests/${requestId}`] = null;
        updates[`userFriendRequests/${currentUid}/outgoing/${requestId}`] = null;
        updates[
          `userFriendRequests/${request.receiverUid}/incoming/${requestId}`
        ] = null;

        await database.ref().update(updates);
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
        bestEffort("friend index repair", () => database.ref().update(repairs));
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

      fallbackQuery.on("value", handleFallbackSnapshot, handleFallbackError);
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
    if (!uid || typeof callback !== "function") return null;

    const ref = database.ref(`userFriendRequests/${uid}/incoming`);
    const handler = snapshot => callback(snapshot.val() || {});
    const errorHandler = error => {
      console.error("Incoming friend request listener failed:", error);
      callback({});
    };

    ref.on("value", handler, errorHandler);
    return () => ref.off("value", handler);
  }

  function listenToOutgoingRequests(uid, callback) {
    if (!uid || typeof callback !== "function") return null;

    const ref = database.ref(`userFriendRequests/${uid}/outgoing`);
    const handler = snapshot => callback(snapshot.val() || {});
    const errorHandler = error => {
      console.error("Outgoing friend request listener failed:", error);
      callback({});
    };

    ref.on("value", handler, errorHandler);
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

          const rgId = String(player.rgId || player.rivalsId || "").trim();

          const searchText = [
            displayName,
            rgId,
            player.rivalsIgn || ""
          ]
            .join(" ")
            .toLowerCase();

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
    if (!uid) return Promise.resolve([]);

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
    repairOwnFriendIndex,
    migrateLegacyRequestIndexes
  };
})();
