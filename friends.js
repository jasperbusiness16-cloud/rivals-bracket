window.RGFriends = (() => {

  function getFriendshipId(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  function getFriendRequestId(senderUid, receiverUid) {
    return `${senderUid}_${receiverUid}`;
  }

  function sendFriendRequest(currentUser, targetPlayer) {
    if (!currentUser?.uid) {
      return Promise.reject(
        new Error("You must be signed in.")
      );
    }

    if (!targetPlayer?.uid) {
      return Promise.reject(
        new Error("Player account not found.")
      );
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
      database
        .ref(`friendships/${friendshipId}`)
        .once("value"),

      database
        .ref(`friendRequests/${outgoingRequestId}`)
        .once("value"),

      database
        .ref(`friendRequests/${reverseRequestId}`)
        .once("value")
    ])
    .then(results => {
      const friendship = results[0];
      const outgoingRequest = results[1];
      const incomingRequest = results[2];

      if (friendship.exists()) {
        throw new Error(
          "You are already friends with this player."
        );
      }

      if (outgoingRequest.exists()) {
        throw new Error(
          "Friend request already sent."
        );
      }

      if (incomingRequest.exists()) {
        throw new Error(
          "This player already sent you a friend request."
        );
      }

      const request = {
        id: outgoingRequestId,

        senderUid: currentUser.uid,
        senderName:
          currentUser.displayName || "Player",

        receiverUid: targetPlayer.uid,
        receiverName:
          targetPlayer.displayName || "Player",

        status: "pending",
        createdAt: firebase.database.ServerValue.TIMESTAMP
      };

      const updates = {};

      updates[
        `friendRequests/${outgoingRequestId}`
      ] = request;

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
      return Promise.reject(
        new Error("Invalid friend request.")
      );
    }

    const requestRef = database.ref(
      `friendRequests/${requestId}`
    );

    return requestRef.once("value")
      .then(snapshot => {
        if (!snapshot.exists()) {
          throw new Error(
            "Friend request no longer exists."
          );
        }

        const request = snapshot.val();

        if (request.receiverUid !== currentUid) {
          throw new Error(
            "You cannot accept this friend request."
          );
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

          createdAt:
            firebase.database.ServerValue.TIMESTAMP,

          lifetimeGifts: {
            [request.senderUid]: 0,
            [request.receiverUid]: 0
          }
        };

        const updates = {};

        updates[
          `friendships/${friendshipId}`
        ] = friendship;

        updates[
          `userFriends/${request.senderUid}/${request.receiverUid}`
        ] = {
          friendshipId,
          since:
            firebase.database.ServerValue.TIMESTAMP
        };

        updates[
          `userFriends/${request.receiverUid}/${request.senderUid}`
        ] = {
          friendshipId,
          since:
            firebase.database.ServerValue.TIMESTAMP
        };

        updates[
          `friendRequests/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.receiverUid}/incoming/${requestId}`
        ] = null;

        return database.ref().update(updates);
      });
  }


  function declineFriendRequest(currentUid, requestId) {
    if (!currentUid || !requestId) {
      return Promise.reject(
        new Error("Invalid friend request.")
      );
    }

    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(snapshot => {
        if (!snapshot.exists()) return;

        const request = snapshot.val();

        if (request.receiverUid !== currentUid) {
          throw new Error(
            "You cannot decline this friend request."
          );
        }

        const updates = {};

        updates[
          `friendRequests/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.receiverUid}/incoming/${requestId}`
        ] = null;

        return database.ref().update(updates);
      });
  }


  function cancelFriendRequest(currentUid, requestId) {
    if (!currentUid || !requestId) {
      return Promise.reject(
        new Error("Invalid friend request.")
      );
    }

    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(snapshot => {
        if (!snapshot.exists()) return;

        const request = snapshot.val();

        if (request.senderUid !== currentUid) {
          throw new Error(
            "You cannot cancel this friend request."
          );
        }

        const updates = {};

        updates[
          `friendRequests/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.senderUid}/outgoing/${requestId}`
        ] = null;

        updates[
          `userFriendRequests/${request.receiverUid}/incoming/${requestId}`
        ] = null;

        return database.ref().update(updates);
      });
  }


 function listenToFriends(uid, callback) {
  if (!uid || typeof callback !== "function") {
    return null;
  }

  const userFriendsRef = database.ref(
    `userFriends/${uid}`
  );

  let fallbackQuery = null;
  let fallbackRunning = false;

  const handleFallbackSnapshot = snapshot => {
    const friendMap = {};

    snapshot.forEach(friendshipSnapshot => {
      const friendship =
        friendshipSnapshot.val() || {};

      const users = friendship.users || {};

      const friendUid = Object.keys(users).find(
        userUid =>
          userUid !== uid &&
          users[userUid] === true
      );

      if (!friendUid) {
        return;
      }

      friendMap[friendUid] = {
        friendshipId: friendshipSnapshot.key,
        since: Number(
          friendship.createdAt || 0
        )
      };
    });

    callback(friendMap);
  };

  const handleFallbackError = error => {
    console.error(
      "Friendship fallback listener failed:",
      error
    );

    callback({});
  };

  const startFallbackListener = () => {
    if (fallbackRunning) {
      return;
    }

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
    console.error(
      "userFriends listener failed:",
      error
    );

    startFallbackListener();
  };

  userFriendsRef.on(
    "value",
    handleUserFriendsSnapshot,
    handleUserFriendsError
  );

  return () => {
    userFriendsRef.off(
      "value",
      handleUserFriendsSnapshot
    );

    if (fallbackQuery) {
      fallbackQuery.off(
        "value",
        handleFallbackSnapshot
      );
    }
  };
}


  function listenToIncomingRequests(uid, callback) {
    const ref = database.ref(
      `userFriendRequests/${uid}/incoming`
    );

    const handler = snapshot => {
      callback(snapshot.val() || {});
    };

    ref.on("value", handler);

    return () => ref.off("value", handler);
  }


  function listenToOutgoingRequests(uid, callback) {
    const ref = database.ref(
      `userFriendRequests/${uid}/outgoing`
    );

    const handler = snapshot => {
      callback(snapshot.val() || {});
    };

    ref.on("value", handler);

    return () => ref.off("value", handler);
  }


  function getRequest(requestId) {
    return database
      .ref(`friendRequests/${requestId}`)
      .once("value")
      .then(snapshot => snapshot.val());
  }


  function getPlayer(uid) {
    return database
      .ref(`players/${uid}`)
      .once("value")
      .then(snapshot => {
        const player = snapshot.val();

        if (!player) return null;

        return {
          uid,
          ...player
        };
      });
  }


  function getFriends(uid) {
    return database
      .ref(`userFriends/${uid}`)
      .once("value")
      .then(snapshot => {
        const friendships = snapshot.val() || {};
        const friendUids = Object.keys(friendships);

        return Promise.all(
          friendUids.map(friendUid =>
            getPlayer(friendUid)
          )
        );
      })
      .then(players =>
        players.filter(Boolean)
      );
  }


  return {
    getFriendshipId,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    listenToFriends,
    listenToIncomingRequests,
    listenToOutgoingRequests,
    getRequest,
    getPlayer,
    getFriends
  };

})();
