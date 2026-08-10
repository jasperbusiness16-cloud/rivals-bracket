window.RGFriends = (() => {
  "use strict";

  /*
    Friend-request path compatibility
    ---------------------------------
    The production UI historically used:
      userFriendRequests/{uid}/incoming/{requestId}
      userFriendRequests/{uid}/outgoing/{requestId}

    The current RTDB rules expose:
      incomingFriendRequests/{uid}/{requestId}
      outgoingFriendRequests/{uid}/{requestId}

    Keep old callers working by transparently mapping their references to the
    rule-supported paths. We retain an unwrapped reference function so an
    existing legacy index can be migrated once after sign-in.
  */
  const rawDatabaseRef = database.ref.bind(database);

  function normalizePath(value) {
    return String(value || "").replace(/^\/+|\/+$/g, "");
  }

  function mapFriendRequestIndexPath(value) {
    const path = normalizePath(value);
    const match = path.match(
      /^userFriendRequests\/([^/]+)\/(incoming|outgoing)(?:\/(.+))?$/i
    );

    if (!match) return value;

    const uid = match[1];
    const direction = match[2].toLowerCase();
    const tail = match[3] ? `/${match[3]}` : "";
    const root = direction === "incoming"
      ? "incomingFriendRequests"
      : "outgoingFriendRequests";

    return `${root}/${uid}${tail}`;
  }

  if (!window.__RG_FRIEND_REQUEST_PATH_BRIDGE__) {
    window.__RG_FRIEND_REQUEST_PATH_BRIDGE__ = true;

    database.ref = path => {
      if (typeof path !== "string") {
        return rawDatabaseRef(path);
      }

      return rawDatabaseRef(
        mapFriendRequestIndexPath(path)
      );
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

  async function migrateLegacyRequestIndexes(uid) {
    if (!uid) return;

    const legacyIncoming = rawDatabaseRef(
      `userFriendRequests/${uid}/incoming`
    );
    const legacyOutgoing = rawDatabaseRef(
      `userFriendRequests/${uid}/outgoing`
    );

    const [incomingResult, outgoingResult] =
      await Promise.allSettled([
        legacyIncoming.once("value"),
        legacyOutgoing.once("value")
      ]);

    const updates = {};

    if (incomingResult.status === "fulfilled") {
      const incoming = incomingResult.value.val() || {};

      Object.entries(incoming).forEach(([requestId, value]) => {
        if (!requestId || !value) return;
        updates[`incomingFriendRequests/${uid}/${requestId}`] = true;
      });
    }

    if (outgoingResult.status === "fulfilled") {
      const outgoing = outgoingResult.value.val() || {};

      Object.entries(outgoing).forEach(([requestId, value]) => {
        if (!requestId || !value) return;
        updates[`outgoingFriendRequests/${uid}/${requestId}`] = true;
      });
    }

    if (!Object.keys(updates).length) return;

    await rawDatabaseRef().update(updates);
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

    /*
      Do not pre-read friendRequests or request-index paths here. The deployed
      rules can deny ordinary accounts on empty request/index paths before a
      record exists. The canonical friendship path is readable to authenticated
      users, so it is the only safe preflight check needed for sending.
    */
    return database
      .ref(`friendships/${friendshipId}`)
      .once("value")
      .then(async friendshipSnapshot => {
        if (friendshipSnapshot.exists()) {
          throw new Error("You are already friends with this player.");
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
          `outgoingFriendRequests/${currentUser.uid}/${outgoingRequestId}`
        ] = true;
        updates[
          `incomingFriendRequests/${targetPlayer.uid}/${outgoingRequestId}`
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

        const updates = {};
        updates[`friendships/${friendshipId}`] = friendship;
        updates[
          `userFriends/${currentUid}/${request.senderUid}`
        ] = friendIndexRecord(friendshipId);
        updates[`friendRequests/${requestId}`] = null;
        updates[
          `incomingFriendRequests/${currentUid}/${requestId}`
        ] = null;
        updates[
          `outgoingFriendRequests/${request.senderUid}/${requestId}`
        ] = null;

        await database.ref().update(updates);

        await bestEffort(
          "sender friend index",
          () =>
            database
              .ref(`userFriends/${request.senderUid}/${currentUid}`)
              .set(friendIndexRecord(friendshipId))
        );

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
        updates[
          `incomingFriendRequests/${currentUid}/${requestId}`
        ] = null;
        updates[
          `outgoingFriendRequests/${request.senderUid}/${requestId}`
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
        updates[
          `outgoingFriendRequests/${currentUid}/${requestId}`
        ] = null;
        updates[
          `incomingFriendRequests/${request.receiverUid}/${requestId}`
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
    const errorHandler = error => {
      console.error("Incoming friend request listener failed:", error);
      callback({});
    };

    ref.on("value", handler, errorHandler);
    return () => ref.off("value", handler);
  }

  function listenToOutgoingRequests(uid, callback) {
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

  if (window.auth?.onAuthStateChanged) {
    window.auth.onAuthStateChanged(user => {
      if (!user?.uid) return;

      migrateLegacyRequestIndexes(user.uid)
        .catch(error => {
          console.warn(
            "[RG Friends] Legacy request index migration was unavailable:",
            error
          );
        });

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
