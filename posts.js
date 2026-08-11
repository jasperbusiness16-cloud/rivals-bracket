const RGPosts = (() => {
  function getPostsRef() {
    return database.ref("officialPosts");
  }

  function getCommentsRef(postId) {
    return database.ref(`postComments/${postId}`);
  }

  function escapeText(value) {
    return String(value || "").trim();
  }

  function listenToPosts(callback, limit = 50) {
    if (typeof callback !== "function") return null;

    const ref = getPostsRef()
      .orderByChild("createdAt")
      .limitToLast(limit);

    const handler = snapshot => {
      const data = snapshot.val() || {};

      const posts = Object.entries(data)
        .map(([id, post]) => ({
          id,
          ...(post || {})
        }))
        .filter(post => post.published !== false)
        .sort(
          (a, b) =>
            Number(b.createdAt || 0) -
            Number(a.createdAt || 0)
        );

      callback(posts);
    };

    ref.on("value", handler);

    return () => {
      ref.off("value", handler);
    };
  }

  function loadPosts(limit = 50) {
    return getPostsRef()
      .orderByChild("createdAt")
      .limitToLast(limit)
      .once("value")
      .then(snapshot => {
        const data = snapshot.val() || {};

        return Object.entries(data)
          .map(([id, post]) => ({
            id,
            ...(post || {})
          }))
          .filter(post => post.published !== false)
          .sort(
            (a, b) =>
              Number(b.createdAt || 0) -
              Number(a.createdAt || 0)
          );
      });
  }

  function loadLatestPost() {
    return loadPosts(1).then(posts => posts[0] || null);
  }

  function getPost(postId) {
    if (!postId) {
      return Promise.reject(
        new Error("Missing post ID.")
      );
    }

    return database
      .ref(`officialPosts/${postId}`)
      .once("value")
      .then(snapshot => {
        const post = snapshot.val();

        if (!post) return null;

        return {
          id: postId,
          ...post
        };
      });
  }

  function listenToComments(postId, callback) {
    if (!postId || typeof callback !== "function") {
      return null;
    }

    const ref = getCommentsRef(postId)
      .orderByChild("createdAt");

    const handler = snapshot => {
      const data = snapshot.val() || {};

      const comments = Object.entries(data)
        .map(([id, comment]) => ({
          id,
          ...(comment || {})
        }))
        .filter(comment => !comment.deleted)
        .sort(
          (a, b) =>
            Number(a.createdAt || 0) -
            Number(b.createdAt || 0)
        );

      callback(comments);
    };

    ref.on("value", handler);

    return () => {
      ref.off("value", handler);
    };
  }

  function addComment(postId, user, player, message) {
    if (!postId) {
      return Promise.reject(
        new Error("Missing post ID.")
      );
    }

    if (!user?.uid) {
      return Promise.reject(
        new Error("You must be signed in to comment.")
      );
    }

    const cleanedMessage = escapeText(message);

    if (cleanedMessage.length < 1) {
      return Promise.reject(
        new Error("Enter a comment first.")
      );
    }

    if (cleanedMessage.length > 500) {
      return Promise.reject(
        new Error("Comments cannot exceed 500 characters.")
      );
    }

    const commentRef = getCommentsRef(postId).push();

    const comment = {
      id: commentRef.key,
      postId,
      userId: user.uid,
      displayName:
        player?.displayName ||
        user.displayName ||
        "Player",
      rgId: player?.rgId || "",
      message: cleanedMessage,
      edited: false,
      deleted: false,
      createdAt:
        firebase.database.ServerValue.TIMESTAMP
    };

    const updates = {};

    updates[
      `postComments/${postId}/${commentRef.key}`
    ] = comment;

    updates[
      `officialPosts/${postId}/commentCount`
    ] = firebase.database.ServerValue.increment(1);

    return database.ref().update(updates);
  }

  function deleteOwnComment(
    postId,
    commentId,
    currentUid
  ) {
    if (!postId || !commentId || !currentUid) {
      return Promise.reject(
        new Error("Invalid comment.")
      );
    }

    const commentRef = database.ref(
      `postComments/${postId}/${commentId}`
    );

    return commentRef
      .once("value")
      .then(snapshot => {
        const comment = snapshot.val();

        if (!comment) {
          throw new Error(
            "This comment no longer exists."
          );
        }

        if (comment.userId !== currentUid) {
          throw new Error(
            "You cannot delete this comment."
          );
        }

        const updates = {};

        updates[
          `postComments/${postId}/${commentId}/deleted`
        ] = true;

        updates[
          `postComments/${postId}/${commentId}/deletedAt`
        ] = firebase.database.ServerValue.TIMESTAMP;

        updates[
          `officialPosts/${postId}/commentCount`
        ] = firebase.database.ServerValue.increment(-1);

        return database.ref().update(updates);
      });
  }

  function formatPostDate(timestamp) {
    const value = Number(timestamp || 0);

    if (!value) return "";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function getPostCategoryLabel(category) {
    const labels = {
      announcement: "Announcement",
      tournament: "Tournament",
      registration: "Registration",
      results: "Results",
      prediction: "Predictions",
      community: "Community",
      prize_pool: "Prize Pool"
    };

    return labels[category] || "Official Update";
  }

  return {
    listenToPosts,
    loadPosts,
    loadLatestPost,
    getPost,
    listenToComments,
    addComment,
    deleteOwnComment,
    formatPostDate,
    getPostCategoryLabel
  };
})();

/* ========================================================================
   POSTS PAGE LAUNCH HOTFIX
   - Align owner/admin post deletion with deployed RTDB rules.
   - Keep the mobile feed toolbar flush with the card top.
   ======================================================================== */
(() => {
  "use strict";

  if (!/\/posts(?:\.html)?$/i.test(window.location.pathname)) return;

  const style = document.createElement("style");
  style.setAttribute("data-rg-posts-launch-fix", "true");
  style.textContent = `
    @media (max-width: 680px) {
      body.account-body .rg-feed-toolbar {
        position: relative !important;
        top: auto !important;
      }
    }
  `;
  document.head.appendChild(style);

  function showPostsStatus(message, color = "#f7f5ff") {
    const status = document.getElementById("postsStatus");
    if (!status) return;

    status.textContent = message || "";
    status.style.color = color;
    status.classList.toggle("show", Boolean(message));

    if (message) {
      window.setTimeout(() => {
        status.classList.remove("show");
      }, 3300);
    }
  }

  async function deletePostUsingDeployedRules(postId) {
    const user = window.auth?.currentUser;
    if (!user?.uid || !postId) return;

    const [roleSnapshot, postSnapshot] = await Promise.all([
      database.ref(`users/${user.uid}/role`).once("value"),
      database.ref(`officialPosts/${postId}`).once("value")
    ]);

    const role = String(roleSnapshot.val() || "player").toLowerCase();
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only Rivals Gauntlet staff can delete official posts.");
    }

    const post = postSnapshot.val();
    if (!post) {
      throw new Error("This post no longer exists.");
    }

    const confirmed = window.confirm(
      `Delete “${post.title || "Official Update"}”?\n\nThis permanently removes the post and its comments.`
    );
    if (!confirmed) return;

    const commentsSnapshot = await database
      .ref(`postComments/${postId}`)
      .once("value");

    const updates = {
      [`officialPosts/${postId}`]: null,
      [`postLikes/${postId}`]: null,
      [`postCommentLikes/${postId}`]: null,
      [`postCommentReplies/${postId}`]: null,
      [`postCommentReplyLikes/${postId}`]: null
    };

    /*
      Deployed rules grant staff writes at:
        postComments/{postId}/{commentId}
      but not at:
        postComments/{postId}
      So each comment must be deleted through its permitted child path.
    */
    commentsSnapshot.forEach(commentSnapshot => {
      updates[`postComments/${postId}/${commentSnapshot.key}`] = null;
    });

    await database.ref().update(updates);
    showPostsStatus("Post deleted.", "#ffcb6b");
  }

  document.addEventListener(
    "click",
    event => {
      const deleteButton = event.target.closest?.("[data-delete-post]");
      if (!deleteButton) return;

      /* Stop the older inline delete handler from issuing its invalid
         postComments/{postId} parent delete. */
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      deleteButton.disabled = true;

      deletePostUsingDeployedRules(deleteButton.dataset.deletePost)
        .catch(error => {
          console.error("Post deletion failed:", error);
          showPostsStatus(
            String(error?.code || "").toLowerCase().includes("permission")
              ? "Firebase denied this staff post deletion."
              : error?.message || "The post could not be deleted.",
            "#ff6a7f"
          );
        })
        .finally(() => {
          deleteButton.disabled = false;
        });
    },
    true
  );
})();