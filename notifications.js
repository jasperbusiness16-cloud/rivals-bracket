let rgNotificationListener = null;

/**
 * Creates a notification for a player.
 *
 * This is useful for testing and for same-client events.
 * Cross-user systems such as gifts should eventually call this
 * securely through Firebase Functions.
 */
function createNotification(uid, notification = {}) {
  if (!uid) {
    return Promise.reject(new Error("Missing notification recipient."));
  }

  const notificationRef = database
    .ref(`notifications/${uid}`)
    .push();

  return notificationRef.set({
    type: notification.type || "general",
    title: notification.title || "Rivals Gauntlet",
    message: notification.message || "",
    link: notification.link || "",
    fromUserId: notification.fromUserId || "",
    fromName: notification.fromName || "",
    read: false,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  });
}

/**
 * Listens to a player's notifications in real time.
 */
function listenToNotifications(uid, callback) {
  if (!uid || typeof callback !== "function") return;

  if (rgNotificationListener) {
    rgNotificationListener.ref.off(
      "value",
      rgNotificationListener.handler
    );
  }

  const ref = database
    .ref(`notifications/${uid}`)
    .orderByChild("createdAt")
    .limitToLast(50);

  const handler = snapshot => {
    const data = snapshot.val() || {};

    const notifications = Object.entries(data)
      .map(([id, notification]) => ({
        id,
        ...notification
      }))
      .sort((a, b) => {
        return Number(b.createdAt || 0) -
          Number(a.createdAt || 0);
      });

    callback(notifications);
  };

  ref.on("value", handler);

  rgNotificationListener = {
    ref,
    handler
  };
}

/**
 * Marks one notification as read.
 */
function markNotificationRead(uid, notificationId) {
  if (!uid || !notificationId) {
    return Promise.reject(
      new Error("Missing notification information.")
    );
  }

  return database
    .ref(`notifications/${uid}/${notificationId}`)
    .update({
      read: true,
      readAt: firebase.database.ServerValue.TIMESTAMP
    });
}

/**
 * Marks every unread notification as read.
 */
function markAllNotificationsRead(uid) {
  if (!uid) {
    return Promise.reject(new Error("Missing player account."));
  }

  return database
    .ref(`notifications/${uid}`)
    .once("value")
    .then(snapshot => {
      const notifications = snapshot.val() || {};
      const updates = {};

      Object.entries(notifications).forEach(([id, notification]) => {
        if (!notification.read) {
          updates[`${id}/read`] = true;
          updates[`${id}/readAt`] =
            firebase.database.ServerValue.TIMESTAMP;
        }
      });

      if (!Object.keys(updates).length) {
        return null;
      }

      return database
        .ref(`notifications/${uid}`)
        .update(updates);
    });
}

/**
 * Deletes a notification.
 */
function deleteNotification(uid, notificationId) {
  if (!uid || !notificationId) {
    return Promise.reject(
      new Error("Missing notification information.")
    );
  }

  return database
    .ref(`notifications/${uid}/${notificationId}`)
    .remove();
}

/**
 * Stops the active notification listener.
 */
function stopNotificationListener() {
  if (!rgNotificationListener) return;

  rgNotificationListener.ref.off(
    "value",
    rgNotificationListener.handler
  );

  rgNotificationListener = null;
}
