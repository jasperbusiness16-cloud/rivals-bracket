(function () {
  "use strict";

  const MAX_IMAGE_BYTES =
    8 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
  ]);

  const CATEGORIES = {
    announcement: "Announcement",
    tournament: "Tournament",
    registration: "Registration",
    results: "Results",
    shop: "Shop Update",
    prediction: "Predictions",
    community: "Community",
    prize_pool: "Prize Pool"
  };

  const state = {
    api: null,
database: null,
storage: null,
content: null,
currentUser: null,
    roleId: "",

    postsRef: null,
    postsCallback: null,

    posts: [],
    activeTournamentId: "",

    selectedPostId: "",
    filter: "all",
    search: "",

    formDirty: false,
    saving: false,

    localImage: null,
    draft: createEmptyDraft()
  };

  function createEmptyDraft() {
    return {
      title: "",
      body: "",
      category: "announcement",

      image: "",
      imageUrl: "",
      imagePath: "",
      imageName: "",
      imageType: "",
      imageSize: 0,
      imageWidth: 0,
      imageHeight: 0,
      imageUploadPending: false,

      linkUrl: "",
      linkLabel: "",

      scope: "global",
      tournamentId: "",

      published: true,
      pinned: false
    };
  }

  function clean(
    value,
    fallback = ""
  ) {
    return String(
      value == null
        ? fallback
        : value
    ).trim();
  }

  function escapeHtml(value) {
    if (
      state.api &&
      typeof state.api
        .escapeHtml ===
        "function"
    ) {
      return state.api.escapeHtml(
        value
      );
    }

    return String(
      value == null
        ? ""
        : value
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    if (
      state.api &&
      typeof state.api
        .showToast ===
        "function"
    ) {
      state.api.showToast(
        message
      );

      return;
    }

    console.log(message);
  }

  function isPermissionDenied(
    error
  ) {
    if (
      state.api &&
      typeof state.api
        .isPermissionDenied ===
        "function"
    ) {
      return state.api
        .isPermissionDenied(error);
    }

    const code = clean(
      error?.code
    ).toLowerCase();

    const message = clean(
      error?.message
    ).toLowerCase();

    return (
      code.includes(
        "permission"
      ) ||
      message.includes(
        "permission"
      )
    );
  }

  function formatNumber(value) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  function formatBytes(value) {
    const bytes =
      Number(value || 0);

    if (!bytes) {
      return "0 KB";
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${Math.max(
        1,
        Math.round(
          bytes / 1024
        )
      )} KB`;
    }

    return `${(
      bytes /
      (
        1024 *
        1024
      )
    ).toFixed(1)} MB`;
  }

  function formatDate(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "No date";
    }

    try {
      return new Intl
        .DateTimeFormat(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          }
        )
        .format(
          new Date(
            timestamp
          )
        );
    } catch {
      return "No date";
    }
  }

  function getCategoryLabel(
    category
  ) {
    return (
      CATEGORIES[
        category
      ] ||
      "Announcement"
    );
  }

  function getPostImage(post) {
    return clean(
      post?.image ||
      post?.imageUrl
    );
  }

  function getAuthorName() {
    const user =
      state.currentUser;

    if (
      clean(
        user?.displayName
      )
    ) {
      return clean(
        user.displayName
      );
    }

    if (
      clean(user?.email)
    ) {
      return clean(
        user.email
      ).split("@")[0];
    }

    return "Rivals Gauntlet";
  }

  function normalizePost(
    id,
    value
  ) {
    const post =
      value || {};

    return {
      id,

      title:
        clean(post.title),

      body:
        clean(post.body),

      category:
        clean(
          post.category,
          "announcement"
        ),

      image:
        clean(
          post.image ||
          post.imageUrl
        ),

      imageUrl:
        clean(
          post.imageUrl ||
          post.image
        ),

      imagePath:
        clean(
          post.imagePath
        ),

      imageName:
        clean(
          post.imageName
        ),

      imageType:
        clean(
          post.imageType
        ),

      imageSize:
        Number(
          post.imageSize ||
          0
        ),

      imageWidth:
        Number(
          post.imageWidth ||
          0
        ),

      imageHeight:
        Number(
          post.imageHeight ||
          0
        ),

      imageUploadPending:
        Boolean(
          post.imageUploadPending
        ),

      linkUrl:
        clean(
          post.linkUrl
        ),

      linkLabel:
        clean(
          post.linkLabel
        ),

      scope:
        clean(
          post.scope,
          post.tournamentId
            ? "tournament"
            : "global"
        ),

      tournamentId:
        clean(
          post.tournamentId
        ),

      published:
        post.published !==
        false,

      pinned:
        Boolean(post.pinned),

      authorId:
        clean(
          post.authorId
        ),

      authorName:
        clean(
          post.authorName,
          "Rivals Gauntlet"
        ),

      commentCount:
        Number(
          post.commentCount ||
          0
        ),

      createdAt:
        Number(
          post.createdAt ||
          0
        ),

      publishedAt:
        Number(
          post.publishedAt ||
          0
        ),

      updatedAt:
        Number(
          post.updatedAt ||
          0
        )
    };
  }

  function sortPosts(
    posts
  ) {
    return [...posts]
      .sort(
        (a, b) => {
          if (
            a.pinned !==
            b.pinned
          ) {
            return a.pinned
              ? -1
              : 1;
          }

          const aTime =
            Number(
              a.updatedAt ||
              a.createdAt ||
              0
            );

          const bTime =
            Number(
              b.updatedAt ||
              b.createdAt ||
              0
            );

          return (
            bTime -
            aTime
          );
        }
      );
  }

  function getSelectedPost() {
    if (
      !state.selectedPostId
    ) {
      return null;
    }

    return (
      state.posts.find(
        post =>
          post.id ===
          state.selectedPostId
      ) ||
      null
    );
  }

  function query(selector) {
    return state.content
      ?.querySelector(
        selector
      ) || null;
  }

  function setStatus(
    message,
    type = ""
  ) {
    const status =
      query(
        "#nexusPostEditorStatus"
      );

    if (!status) {
      return;
    }

    status.textContent =
      message || "";

    status.className =
      "nexus-post-editor-status";

    if (type) {
      status.classList.add(
        type
      );
    }
  }

  function setButtonLoading(
    button,
    loading,
    text
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      button.dataset
        .originalHtml =
          button.innerHTML;

      button.disabled =
        true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${escapeHtml(text)}
      `;

      return;
    }

    button.disabled =
      false;

    if (
      button.dataset
        .originalHtml
    ) {
      button.innerHTML =
        button.dataset
          .originalHtml;

      delete button.dataset
        .originalHtml;
    }
  }

  function renderShell() {
    state.content.innerHTML = `
      <section class="nexus-posts">

        <header class="nexus-posts-header">
          <div>
            <span class="nexus-posts-eyebrow">
              Official Content Management
            </span>

            <h2>
              Posts & Announcements
            </h2>

            <p>
              Create, preview, publish, pin and manage official Rivals Gauntlet updates.
            </p>
          </div>

          <div class="nexus-posts-header-actions">
            <button
              class="nexus-post-button"
              type="button"
              data-post-action="open-public-feed"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              View Public Feed
            </button>

            <button
              class="nexus-post-button primary"
              type="button"
              data-post-action="new-post"
            >
              <i class="fa-solid fa-plus"></i>
              New Post
            </button>
          </div>
        </header>

        <div class="nexus-post-image-backend-notice">
          <i class="fa-solid fa-shield-halved"></i>

          <div>
          <strong>
  Owner Image Upload Active
</strong>

<span>
  Camera Roll images upload directly to the protected official-posts Storage folder. Only the authorized owner UID can create, replace, or delete files.
</span>
          </div>
        </div>

        <section class="nexus-post-metrics">
          <article>
            <span>Total Posts</span>
            <strong id="nexusPostMetricTotal">0</strong>
            <small>All official content</small>
          </article>

          <article>
            <span>Published</span>
            <strong id="nexusPostMetricPublished">0</strong>
            <small>Visible on the public feed</small>
          </article>

          <article>
            <span>Drafts</span>
            <strong id="nexusPostMetricDrafts">0</strong>
            <small>Not publicly visible</small>
          </article>

          <article>
            <span>Pinned</span>
            <strong id="nexusPostMetricPinned">0</strong>
            <small>Priority announcements</small>
          </article>
        </section>

        <section class="nexus-post-workspace">

          <article class="nexus-post-panel nexus-post-editor-panel">

            <header class="nexus-post-panel-head">
              <div>
                <span>Post Editor</span>

                <h3 id="nexusPostEditorTitle">
                  Create New Post
                </h3>
              </div>

              <span
                id="nexusPostEditorMode"
                class="nexus-post-mode draft"
              >
                New
              </span>
            </header>

            <form id="nexusPostForm">

              <div class="nexus-post-form-grid">

                <label class="nexus-post-field full">
                  <span>Title</span>

                  <input
                    id="nexusPostTitle"
                    type="text"
                    maxlength="120"
                    placeholder="Post title"
                    required
                  >
                </label>

                <label class="nexus-post-field">
                  <span>Category</span>

                  <select id="nexusPostCategory">
                    ${Object.entries(
                      CATEGORIES
                    )
                      .map(
                        ([
                          value,
                          label
                        ]) => `
                          <option
                            value="${escapeHtml(value)}"
                          >
                            ${escapeHtml(label)}
                          </option>
                        `
                      )
                      .join("")}
                  </select>
                </label>

                <label class="nexus-post-field">
                  <span>Content Scope</span>

                  <select id="nexusPostScope">
                    <option value="global">
                      Global Announcement
                    </option>

                    <option value="tournament">
                      Active Tournament
                    </option>
                  </select>
                </label>

                <label class="nexus-post-field full">
                  <span>Body</span>

                  <textarea
                    id="nexusPostBody"
                    maxlength="5000"
                    placeholder="Write the official announcement..."
                    required
                  ></textarea>

                  <small>
                    <b id="nexusPostBodyCount">0</b>
                    / 5,000 characters
                  </small>
                </label>

                <label class="nexus-post-field">
                  <span>Optional Link URL</span>

                  <input
                    id="nexusPostLinkUrl"
                    type="url"
                    placeholder="https://..."
                  >
                </label>

                <label class="nexus-post-field">
                  <span>Link Button Label</span>

                  <input
                    id="nexusPostLinkLabel"
                    type="text"
                    maxlength="40"
                    placeholder="Learn More"
                  >
                </label>

              </div>

              <section class="nexus-post-image-section">

                <div class="nexus-post-section-heading">
                  <div>
                    <span>Announcement Artwork</span>
                    <h4>Post Image</h4>
                  </div>

               <strong>
  JPG, PNG or WebP • Maximum 8 MB
</strong>
                </div>

               <input
  id="nexusPostImageFile"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  hidden
>

                <div
                  id="nexusPostImageWorkspace"
                  class="nexus-post-image-workspace"
                ></div>

                <div class="nexus-post-image-actions">

                  <label
                    for="nexusPostImageFile"
                    class="nexus-post-button primary nexus-post-file-button"
                  >
                    <i class="fa-solid fa-images"></i>
                    Choose from Camera Roll
                  </label>

                  <button
                    class="nexus-post-button"
                    type="button"
                    data-post-action="remove-image"
                  >
                    <i class="fa-solid fa-trash"></i>
                    Remove Image
                  </button>

                </div>

                <label class="nexus-post-field nexus-post-url-field">
                  <span>
                    Existing Image URL or Temporary URL
                  </span>

                  <input
                    id="nexusPostImageUrl"
                    type="url"
                    placeholder="https://..."
                  >

                  <small>
                    Image URLs continue to work with the existing public feed.
                  </small>
                </label>

              </section>

              <div class="nexus-post-toggle-grid">

                <label class="nexus-post-toggle">
                  <input
                    id="nexusPostPublished"
                    type="checkbox"
                    checked
                  >

                  <span>
                    <strong>Published</strong>
                    <small>Visible on the public feed</small>
                  </span>
                </label>

                <label class="nexus-post-toggle">
                  <input
                    id="nexusPostPinned"
                    type="checkbox"
                  >

                  <span>
                    <strong>Pinned</strong>
                    <small>Keep above normal posts</small>
                  </span>
                </label>

              </div>

              <div class="nexus-post-save-row">

                <div>
               <strong>
  Firebase Content + Image Save
</strong>

<span>
  Post content saves to Realtime Database and selected artwork uploads to Firebase Storage.
</span>
                </div>

                <button
                  id="nexusPostSaveButton"
                  class="nexus-post-button primary"
                  type="submit"
                >
                  <i class="fa-solid fa-paper-plane"></i>
                  Publish Post
                </button>

              </div>

              <p
                id="nexusPostEditorStatus"
                class="nexus-post-editor-status"
              ></p>

            </form>
          </article>

          <aside class="nexus-post-preview-panel">

            <header class="nexus-post-panel-head">
              <div>
                <span>Public Feed Preview</span>
                <h3>Live Preview</h3>
              </div>

              <span class="nexus-post-mode preview">
                Preview
              </span>
            </header>

            <div
              id="nexusPostPreview"
              class="nexus-post-preview"
            ></div>

          </aside>

        </section>

        <section class="nexus-post-panel nexus-post-library-panel">

          <header class="nexus-post-library-head">

            <div>
              <span>Content Library</span>
              <h3>Existing Posts</h3>
            </div>

            <div class="nexus-post-library-tools">

              <label class="nexus-post-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="nexusPostSearch"
                  type="search"
                  placeholder="Search posts..."
                >
              </label>

              <select id="nexusPostFilter">
                <option value="all">
                  All Posts
                </option>

                <option value="published">
                  Published
                </option>

                <option value="draft">
                  Drafts
                </option>

                <option value="pinned">
                  Pinned
                </option>

                <option value="image_pending">
                  Image Pending
                </option>
              </select>

            </div>
          </header>

          <div
            id="nexusPostLibrary"
            class="nexus-post-library"
          >
            <div class="nexus-post-empty">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <strong>Loading Posts</strong>
            </div>
          </div>

        </section>

      </section>
    `;

    fillForm();
    renderImageWorkspace();
    renderPreview();
    renderMetrics();
    renderLibrary();
  }

  function fillForm() {
    const draft =
      state.draft;

    const fields = {
      "#nexusPostTitle":
        draft.title,

      "#nexusPostCategory":
        draft.category,

      "#nexusPostScope":
        draft.scope,

      "#nexusPostBody":
        draft.body,

      "#nexusPostLinkUrl":
        draft.linkUrl,

      "#nexusPostLinkLabel":
        draft.linkLabel,

      "#nexusPostImageUrl":
        draft.imageUrl ||
        draft.image
    };

    Object.entries(
      fields
    ).forEach(
      ([
        selector,
        value
      ]) => {
        const element =
          query(selector);

        if (element) {
          element.value =
            value || "";
        }
      }
    );

    const published =
      query(
        "#nexusPostPublished"
      );

    const pinned =
      query(
        "#nexusPostPinned"
      );

    if (published) {
      published.checked =
        draft.published !==
        false;
    }

    if (pinned) {
      pinned.checked =
        Boolean(
          draft.pinned
        );
    }

    updateEditorLabels();
    updateBodyCount();
  }

  function updateEditorLabels() {
    const title =
      query(
        "#nexusPostEditorTitle"
      );

    const mode =
      query(
        "#nexusPostEditorMode"
      );

    const saveButton =
      query(
        "#nexusPostSaveButton"
      );

    const editing =
      Boolean(
        state.selectedPostId
      );

    const published =
      state.draft.published !==
      false;

    if (title) {
      title.textContent =
        editing
          ? "Edit Post"
          : "Create New Post";
    }

    if (mode) {
      mode.textContent =
        editing
          ? "Editing"
          : "New";

      mode.className =
        `nexus-post-mode ${
          editing
            ? "editing"
            : "draft"
        }`;
    }

    if (saveButton) {
      saveButton.innerHTML =
        published
          ? `
            <i class="fa-solid fa-paper-plane"></i>
            ${
              editing
                ? "Save Published Post"
                : "Publish Post"
            }
          `
          : `
            <i class="fa-solid fa-floppy-disk"></i>
            ${
              editing
                ? "Save Draft Changes"
                : "Save Draft"
            }
          `;
    }
  }

  function updateBodyCount() {
    const counter =
      query(
        "#nexusPostBodyCount"
      );

    if (counter) {
      counter.textContent =
        formatNumber(
          state.draft
            .body.length
        );
    }
  }

  function syncDraftFromForm() {
    state.draft.title =
      clean(
        query(
          "#nexusPostTitle"
        )?.value
      );

    state.draft.category =
      clean(
        query(
          "#nexusPostCategory"
        )?.value,
        "announcement"
      );

    state.draft.scope =
      clean(
        query(
          "#nexusPostScope"
        )?.value,
        "global"
      );

    state.draft.tournamentId =
      state.draft.scope ===
      "tournament"
        ? state.activeTournamentId
        : "";

    state.draft.body =
      clean(
        query(
          "#nexusPostBody"
        )?.value
      );

    state.draft.linkUrl =
      clean(
        query(
          "#nexusPostLinkUrl"
        )?.value
      );

    state.draft.linkLabel =
      clean(
        query(
          "#nexusPostLinkLabel"
        )?.value
      );

    state.draft.imageUrl =
      clean(
        query(
          "#nexusPostImageUrl"
        )?.value
      );

    state.draft.image =
      state.draft.imageUrl;

    state.draft.published =
      Boolean(
        query(
          "#nexusPostPublished"
        )?.checked
      );

    state.draft.pinned =
      Boolean(
        query(
          "#nexusPostPinned"
        )?.checked
      );
  }

  function renderMetrics() {
    const total =
      state.posts.length;

    const published =
      state.posts.filter(
        post =>
          post.published !==
          false
      ).length;

    const drafts =
      state.posts.filter(
        post =>
          post.published ===
          false
      ).length;

    const pinned =
      state.posts.filter(
        post =>
          post.pinned
      ).length;

    const values = {
      "#nexusPostMetricTotal":
        total,

      "#nexusPostMetricPublished":
        published,

      "#nexusPostMetricDrafts":
        drafts,

      "#nexusPostMetricPinned":
        pinned
    };

    Object.entries(
      values
    ).forEach(
      ([
        selector,
        value
      ]) => {
        const element =
          query(selector);

        if (element) {
          element.textContent =
            formatNumber(value);
        }
      }
    );
  }

  function renderPreview() {
    const container =
      query(
        "#nexusPostPreview"
      );

    if (!container) {
      return;
    }

    const draft =
      state.draft;

    const imageUrl =
      state.localImage
        ?.objectUrl ||
      clean(
        draft.imageUrl ||
        draft.image
      );

    const bodyMarkup =
      escapeHtml(
        draft.body ||
        "Your official post content will appear here."
      ).replaceAll(
        "\n",
        "<br>"
      );

    const linkMarkup =
      draft.linkUrl
        ? `
          <a
            class="nexus-post-preview-link"
            href="${escapeHtml(draft.linkUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(
              draft.linkLabel ||
              "Learn More"
            )}

            <i class="fa-solid fa-arrow-right"></i>
          </a>
        `
        : "";

    const imageMarkup =
      imageUrl
        ? `
          <div class="nexus-post-preview-image">
            <img
              src="${escapeHtml(imageUrl)}"
              alt="${escapeHtml(
                draft.title ||
                "Post preview"
              )}"
            >

            ${
              state.localImage
                ? `
                  <span>
                    Local Preview • Uploads on Save
                  </span>
                `
                : ""
            }
          </div>
        `
        : (
          draft.imageUploadPending
            ? `
              <div class="nexus-post-preview-pending">
                <i class="fa-solid fa-image"></i>

                <strong>
                  Image Upload Pending
                </strong>

                <span>
                  ${escapeHtml(
                    draft.imageName ||
                    "Camera Roll image"
                  )}
                </span>
              </div>
            `
            : ""
        );

    container.innerHTML = `
      <article class="nexus-public-post-preview">

        <div class="nexus-public-post-meta">

          <span class="nexus-public-post-category">
            ${escapeHtml(
              getCategoryLabel(
                draft.category
              )
            )}
          </span>

          <span class="nexus-public-post-state ${
            draft.published
              ? "published"
              : "draft"
          }">
            ${
              draft.published
                ? "Published"
                : "Draft"
            }
          </span>

        </div>

        <h3>
          ${escapeHtml(
            draft.title ||
            "Your Post Title"
          )}
        </h3>

        ${imageMarkup}

        <p>
          ${bodyMarkup}
        </p>

        ${linkMarkup}

        <footer>

          <span>
            ${
              draft.pinned
                ? "📌 Pinned • "
                : ""
            }
            Posted by
            ${escapeHtml(
              getAuthorName()
            )}
          </span>

          <span>
            💬 0 Comments
          </span>

        </footer>

      </article>
    `;
  }

  function renderImageWorkspace() {
    const container =
      query(
        "#nexusPostImageWorkspace"
      );

    if (!container) {
      return;
    }

    const draft =
      state.draft;

    if (state.localImage) {
      const image =
        state.localImage;

      container.innerHTML = `
        <div class="nexus-post-image-preview">

          <div class="nexus-post-image-preview-media">
            <img
              src="${escapeHtml(image.objectUrl)}"
              alt="Selected announcement artwork"
            >
          </div>

          <div class="nexus-post-image-preview-copy">

         <span class="nexus-post-image-state uploaded">
  Ready to Upload
</span>

            <strong>
              ${escapeHtml(
                image.file.name
              )}
            </strong>

            <small>
              ${escapeHtml(
                image.file.type ||
                "Unknown image type"
              )}
              •
              ${escapeHtml(
                formatBytes(
                  image.file.size
                )
              )}

              ${
                image.width &&
                image.height
                  ? ` • ${image.width} × ${image.height}`
                  : ""
              }
            </small>

          <p>
  This image will upload to Firebase Storage when the post is saved.
</p>

          </div>

        </div>
      `;

      return;
    }

    const imageUrl =
      clean(
        draft.imageUrl ||
        draft.image
      );

    if (imageUrl) {
      container.innerHTML = `
        <div class="nexus-post-image-preview">

          <div class="nexus-post-image-preview-media">
            <img
              src="${escapeHtml(imageUrl)}"
              alt="Existing announcement artwork"
            >
          </div>

          <div class="nexus-post-image-preview-copy">

            <span class="nexus-post-image-state uploaded">
              Existing Image URL
            </span>

            <strong>
              Announcement Artwork
            </strong>

            <small>
              ${
                draft.imageWidth &&
                draft.imageHeight
                  ? `${draft.imageWidth} × ${draft.imageHeight}`
                  : "Public image"
              }
            </small>

            <p>
              This image is already represented by a URL and can be published normally.
            </p>

          </div>

        </div>
      `;

      return;
    }

    if (
      draft.imageUploadPending
    ) {
      container.innerHTML = `
        <div class="nexus-post-image-preview pending-record">

          <div class="nexus-post-image-placeholder">
            <i class="fa-solid fa-image"></i>
          </div>

          <div class="nexus-post-image-preview-copy">

            <span class="nexus-post-image-state pending">
              Upload Pending
            </span>

            <strong>
              ${escapeHtml(
                draft.imageName ||
                "Camera Roll Image"
              )}
            </strong>

            <small>
              ${escapeHtml(
                draft.imageType ||
                "Image"
              )}
              •
              ${escapeHtml(
                formatBytes(
                  draft.imageSize
                )
              )}
            </small>

            <p>
              The original local file is not stored in Realtime Database. Reselect it after the secure upload backend is available.
            </p>

          </div>

        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="nexus-post-image-empty">

        <i class="fa-solid fa-image"></i>

        <strong>
          No Image Selected
        </strong>

        <span>
          Choose artwork from the Camera Roll or enter an existing image URL.
        </span>

      </div>
    `;
  }

  function getVisiblePosts() {
    const search =
      state.search
        .toLowerCase();

    return sortPosts(
      state.posts.filter(
        post => {
          if (
            state.filter ===
              "published" &&
            post.published ===
              false
          ) {
            return false;
          }

          if (
            state.filter ===
              "draft" &&
            post.published !==
              false
          ) {
            return false;
          }

          if (
            state.filter ===
              "pinned" &&
            !post.pinned
          ) {
            return false;
          }

          if (
            state.filter ===
              "image_pending" &&
            !post.imageUploadPending
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          const haystack = [
            post.title,
            post.body,
            post.authorName,
            getCategoryLabel(
              post.category
            )
          ]
            .join(" ")
            .toLowerCase();

          return haystack
            .includes(search);
        }
      )
    );
  }

  function renderLibrary() {
    const container =
      query(
        "#nexusPostLibrary"
      );

    if (!container) {
      return;
    }

    const posts =
      getVisiblePosts();

    if (!posts.length) {
      container.innerHTML = `
        <div class="nexus-post-empty">

          <i class="fa-solid fa-newspaper"></i>

          <strong>
            No Matching Posts
          </strong>

          <span>
            Create a post or adjust the current filters.
          </span>

        </div>
      `;

      return;
    }

    container.innerHTML =
      posts
        .map(
          post => {
            const image =
              getPostImage(
                post
              );

            const stateLabel =
              post.published !==
              false
                ? "Published"
                : "Draft";

            const stateClass =
              post.published !==
              false
                ? "published"
                : "draft";

            return `
              <article class="nexus-post-library-item">

                <div class="nexus-post-library-image ${
                  image
                    ? ""
                    : "empty"
                }">
                  ${
                    image
                      ? `
                        <img
                          src="${escapeHtml(image)}"
                          alt="${escapeHtml(
                            post.title ||
                            "Post image"
                          )}"
                        >
                      `
                      : `
                        <i class="fa-solid fa-newspaper"></i>
                      `
                  }
                </div>

                <div class="nexus-post-library-main">

                  <div class="nexus-post-library-meta">

                    <span class="nexus-public-post-category">
                      ${escapeHtml(
                        getCategoryLabel(
                          post.category
                        )
                      )}
                    </span>

                    <span class="nexus-post-list-state ${stateClass}">
                      ${stateLabel}
                    </span>

                    ${
                      post.pinned
                        ? `
                          <span class="nexus-post-list-state pinned">
                            Pinned
                          </span>
                        `
                        : ""
                    }

                    ${
                      post.imageUploadPending
                        ? `
                          <span class="nexus-post-list-state image-pending">
                            Image Pending
                          </span>
                        `
                        : ""
                    }

                  </div>

                  <h4>
                    ${escapeHtml(
                      post.title ||
                      "Untitled Post"
                    )}
                  </h4>

                  <p>
                    ${escapeHtml(
                      post.body
                        .slice(
                          0,
                          180
                        )
                    )}
                    ${
                      post.body.length >
                      180
                        ? "..."
                        : ""
                    }
                  </p>

                  <small>
                    ${escapeHtml(
                      formatDate(
                        post.updatedAt ||
                        post.createdAt
                      )
                    )}
                    •
                    ${formatNumber(
                      post.commentCount
                    )}
                    Comments
                    •
                    ${escapeHtml(
                      post.authorName ||
                      "Rivals Gauntlet"
                    )}
                  </small>

                </div>

                <div class="nexus-post-library-actions">

                  <button
                    type="button"
                    data-post-action="edit-post"
                    data-post-id="${escapeHtml(post.id)}"
                  >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                  </button>

                  <button
                    type="button"
                    data-post-action="toggle-published"
                    data-post-id="${escapeHtml(post.id)}"
                  >
                    <i class="fa-solid ${
                      post.published !==
                      false
                        ? "fa-eye-slash"
                        : "fa-eye"
                    }"></i>

                    ${
                      post.published !==
                      false
                        ? "Unpublish"
                        : "Publish"
                    }
                  </button>

                  <button
                    type="button"
                    data-post-action="toggle-pinned"
                    data-post-id="${escapeHtml(post.id)}"
                  >
                    <i class="fa-solid fa-thumbtack"></i>

                    ${
                      post.pinned
                        ? "Unpin"
                        : "Pin"
                    }
                  </button>

                  <button
                    class="danger"
                    type="button"
                    data-post-action="delete-post"
                    data-post-id="${escapeHtml(post.id)}"
                  >
                    <i class="fa-solid fa-trash"></i>
                    Delete
                  </button>

                </div>

              </article>
            `;
          }
        )
        .join("");
  }

  function releaseLocalImage() {
    if (
      state.localImage
        ?.objectUrl
    ) {
      URL.revokeObjectURL(
        state.localImage
          .objectUrl
      );
    }

    state.localImage =
      null;

    const input =
      query(
        "#nexusPostImageFile"
      );

    if (input) {
      input.value = "";
    }
  }

  function getImageDimensions(
    objectUrl
  ) {
    return new Promise(
      resolve => {
        const image =
          new Image();

        image.onload = () => {
          resolve({
            width:
              Number(
                image.naturalWidth ||
                0
              ),

            height:
              Number(
                image.naturalHeight ||
                0
              )
          });
        };

        image.onerror = () => {
          resolve({
            width: 0,
            height: 0
          });
        };

        image.src =
          objectUrl;
      }
    );
  }

  function isAllowedImage(file) {
    if (!file) {
      return false;
    }

    if (
      ALLOWED_IMAGE_TYPES.has(
        clean(
          file.type
        ).toLowerCase()
      )
    ) {
      return true;
    }

    const extension =
      clean(
        file.name
      )
        .toLowerCase()
        .split(".")
        .pop();

    return [
  "jpg",
  "jpeg",
  "png",
  "webp"
].includes(extension);
  }

  async function selectLocalImage(
    file
  ) {
    if (!file) {
      return;
    }

    if (!isAllowedImage(file)) {
      showToast(
  "Select a JPG, PNG or WebP image."
);

      setStatus(
        "That image format is not supported.",
        "error"
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_BYTES
    ) {
      showToast(
        "The selected image exceeds the 8 MB limit."
      );

      setStatus(
        "Choose an image smaller than 8 MB.",
        "error"
      );

      return;
    }

    releaseLocalImage();

    const objectUrl =
      URL.createObjectURL(
        file
      );

    const dimensions =
      await getImageDimensions(
        objectUrl
      );

    state.localImage = {
      file,
      objectUrl,
      width:
        dimensions.width,
      height:
        dimensions.height
    };

    state.draft.imageName =
      clean(file.name);

    state.draft.imageType =
      clean(file.type);

    state.draft.imageSize =
      Number(
        file.size ||
        0
      );

    state.draft.imageWidth =
      dimensions.width;

    state.draft.imageHeight =
      dimensions.height;

    state.draft.imagePath =
      "";

    state.draft.imageUploadPending =
      true;

    state.formDirty =
      true;

    renderImageWorkspace();
    renderPreview();

    setStatus(
  "Image ready. It will upload when you save the post.",
  "success"
);
  }

  function removeImage() {
    releaseLocalImage();

    state.draft.image = "";
    state.draft.imageUrl = "";
    state.draft.imagePath = "";
    state.draft.imageName = "";
    state.draft.imageType = "";
    state.draft.imageSize = 0;
    state.draft.imageWidth = 0;
    state.draft.imageHeight = 0;
    state.draft.imageUploadPending =
      false;

    const urlInput =
      query(
        "#nexusPostImageUrl"
      );

    if (urlInput) {
      urlInput.value = "";
    }

    state.formDirty =
      true;

    renderImageWorkspace();
    renderPreview();

    setStatus(
      "Post image removed.",
      "success"
    );
  }

  function confirmDiscardChanges() {
    if (!state.formDirty) {
      return true;
    }

    return window.confirm(
      "Discard the unsaved post changes?"
    );
  }

  function resetEditor(
    skipConfirmation = false
  ) {
    if (
      !skipConfirmation &&
      !confirmDiscardChanges()
    ) {
      return;
    }

    releaseLocalImage();

    state.selectedPostId =
      "";

    state.draft =
      createEmptyDraft();

    state.draft.tournamentId =
      state.activeTournamentId;

    state.formDirty =
      false;

    fillForm();
    renderImageWorkspace();
    renderPreview();

    setStatus("");
  }

  function editPost(postId) {
    const post =
      state.posts.find(
        item =>
          item.id ===
          postId
      );

    if (!post) {
      showToast(
        "That post could not be found."
      );

      return;
    }

    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    releaseLocalImage();

    state.selectedPostId =
      post.id;

    state.draft = {
      title:
        post.title,

      body:
        post.body,

      category:
        post.category,

      image:
        post.image,

      imageUrl:
        post.imageUrl ||
        post.image,

      imagePath:
        post.imagePath,

      imageName:
        post.imageName,

      imageType:
        post.imageType,

      imageSize:
        post.imageSize,

      imageWidth:
        post.imageWidth,

      imageHeight:
        post.imageHeight,

      imageUploadPending:
        post.imageUploadPending,

      linkUrl:
        post.linkUrl,

      linkLabel:
        post.linkLabel,

      scope:
        post.scope,

      tournamentId:
        post.tournamentId,

      published:
        post.published,

      pinned:
        post.pinned
    };

    state.formDirty =
      false;

    fillForm();
    renderImageWorkspace();
    renderPreview();

    setStatus(
      "Editing existing post.",
      "info"
    );

    state.content
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  function validateDraft() {
  const draft =
    state.draft;

  if (!draft.title) {
    return "Enter a post title.";
  }

  if (!draft.body) {
    return "Enter the post body.";
  }

  if (
    draft.linkUrl &&
    !/^https?:\/\//i.test(
      draft.linkUrl
    )
  ) {
    return (
      "The optional link must begin with " +
      "http:// or https://."
    );
  }

  /*
   * Older drafts may contain only
   * pending image metadata. The actual
   * phone file was never stored, so it
   * must be selected again.
   */
  if (
    draft.imageUploadPending &&
    !state.localImage &&
    !clean(
      draft.imageUrl ||
      draft.image
    )
  ) {
    return (
      "Reselect the pending Camera Roll image, " +
      "enter an existing image URL, or remove it."
    );
  }

  return "";
}

function sanitizeStorageFileName(
  file
) {
  const rawName =
    clean(
      file?.name,
      "announcement-image"
    );

  const mimeType =
    clean(
      file?.type
    ).toLowerCase();

  let extension =
    rawName
      .toLowerCase()
      .split(".")
      .pop();

  if (
    extension ===
    rawName.toLowerCase()
  ) {
    extension = "";
  }

  if (
    extension === "jpeg"
  ) {
    extension = "jpg";
  }

  if (
    ![
      "jpg",
      "png",
      "webp"
    ].includes(extension)
  ) {
    if (
      mimeType ===
      "image/png"
    ) {
      extension = "png";
    } else if (
      mimeType ===
      "image/webp"
    ) {
      extension = "webp";
    } else {
      extension = "jpg";
    }
  }

  const baseName =
    rawName
      .replace(
        /\.[^.]+$/,
        ""
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(
        0,
        60
      ) ||
    "announcement-image";

  return `${baseName}.${extension}`;
}

function createImageStoragePath(
  postId,
  file
) {
  return (
    `official-posts/${postId}/` +
    `${Date.now()}-` +
    sanitizeStorageFileName(
      file
    )
  );
}

function uploadAnnouncementImage(
  postId
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const localImage =
        state.localImage;

      if (
        !localImage?.file
      ) {
        resolve(null);
        return;
      }

      if (!state.storage) {
        reject(
          new Error(
            "Firebase Storage is not initialized."
          )
        );

        return;
      }

      const file =
        localImage.file;

      const storagePath =
        createImageStoragePath(
          postId,
          file
        );

      const storageRef =
        state.storage.ref(
          storagePath
        );

      const uploadTask =
        storageRef.put(
          file,
          {
            contentType:
              file.type,

            customMetadata: {
              postId:
                String(postId),

              uploadedBy:
                state.currentUser
                  ?.uid ||
                ""
            }
          }
        );

      uploadTask.on(
        "state_changed",

        snapshot => {
          const total =
            Number(
              snapshot
                .totalBytes ||
              0
            );

          const transferred =
            Number(
              snapshot
                .bytesTransferred ||
              0
            );

          const progress =
            total > 0
              ? Math.round(
                  (
                    transferred /
                    total
                  ) *
                  100
                )
              : 0;

          setStatus(
            `Uploading image: ${progress}%`,
            "info"
          );
        },

        error => {
          reject(error);
        },

        async () => {
          try {
            const downloadUrl =
              await uploadTask
                .snapshot
                .ref
                .getDownloadURL();

            resolve({
              url:
                downloadUrl,

              path:
                storagePath,

              name:
                clean(
                  file.name
                ),

              type:
                clean(
                  file.type
                ),

              size:
                Number(
                  file.size ||
                  0
                ),

              width:
                Number(
                  localImage
                    .width ||
                  0
                ),

              height:
                Number(
                  localImage
                    .height ||
                  0
                )
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    }
  );
}

async function deleteAnnouncementImage(
  storagePath
) {
  const path =
    clean(storagePath);

  if (
    !path ||
    !path.startsWith(
      "official-posts/"
    ) ||
    !state.storage
  ) {
    return;
  }

  try {
    await state.storage
      .ref(path)
      .delete();
  } catch (error) {
    const code =
      clean(
        error?.code
      ).toLowerCase();

    if (
      code !==
      "storage/object-not-found"
    ) {
      console.warn(
        "Old announcement image could not be deleted:",
        error
      );
    }
  }
}

async function savePost(
  button
) {
  if (state.saving) {
    return;
  }

  syncDraftFromForm();

  const validationError =
    validateDraft();

  if (validationError) {
    setStatus(
      validationError,
      "error"
    );

    showToast(
      validationError
    );

    return;
  }

  const editing =
    Boolean(
      state.selectedPostId
    );

  const existing =
    getSelectedPost();

  const ref =
    editing
      ? state.database.ref(
          `officialPosts/${state.selectedPostId}`
        )
      : state.database
          .ref(
            "officialPosts"
          )
          .push();

  const postId =
    editing
      ? state.selectedPostId
      : ref.key;

  if (!postId) {
    setStatus(
      "Nexus could not create a post ID.",
      "error"
    );

    return;
  }

  state.saving =
    true;

  setButtonLoading(
    button,
    true,
    state.localImage
      ? "Uploading Image..."
      : "Saving..."
  );

  let uploadedImage =
    null;

  try {
    /*
     * Upload the selected phone image
     * before writing the post record.
     */
    if (state.localImage) {
      uploadedImage =
        await uploadAnnouncementImage(
          postId
        );
    }

    const typedImageUrl =
      clean(
        state.draft.imageUrl ||
        state.draft.image
      );

    const existingImageUrl =
      getPostImage(
        existing
      );

    const finalImageUrl =
      uploadedImage?.url ||
      typedImageUrl;

    const preservingExistingImage =
      Boolean(
        !uploadedImage &&
        existing &&
        finalImageUrl &&
        finalImageUrl ===
          existingImageUrl
      );

    const finalImagePath =
      uploadedImage
        ? uploadedImage.path
        : (
            preservingExistingImage
              ? clean(
                  existing
                    ?.imagePath
                )
              : ""
          );

    const finalImageName =
      uploadedImage
        ? uploadedImage.name
        : (
            preservingExistingImage
              ? clean(
                  existing
                    ?.imageName
                )
              : ""
          );

    const finalImageType =
      uploadedImage
        ? uploadedImage.type
        : (
            preservingExistingImage
              ? clean(
                  existing
                    ?.imageType
                )
              : ""
          );

    const finalImageSize =
      uploadedImage
        ? uploadedImage.size
        : (
            preservingExistingImage
              ? Number(
                  existing
                    ?.imageSize ||
                  0
                )
              : 0
          );

    const finalImageWidth =
      uploadedImage
        ? uploadedImage.width
        : (
            preservingExistingImage
              ? Number(
                  existing
                    ?.imageWidth ||
                  0
                )
              : 0
          );

    const finalImageHeight =
      uploadedImage
        ? uploadedImage.height
        : (
            preservingExistingImage
              ? Number(
                  existing
                    ?.imageHeight ||
                  0
                )
              : 0
          );

    const timestamp =
      firebase.database
        .ServerValue
        .TIMESTAMP;

    const becamePublished =
      state.draft.published &&
      (
        !existing ||
        existing.published ===
          false
      );

    const postData = {
      title:
        state.draft.title,

      body:
        state.draft.body,

      category:
        state.draft.category,

      /*
       * Keep image for compatibility
       * with the existing posts.html.
       */
      image:
        finalImageUrl,

      imageUrl:
        finalImageUrl,

      imagePath:
        finalImagePath,

      imageName:
        finalImageName,

      imageType:
        finalImageType,

      imageSize:
        finalImageSize,

      imageWidth:
        finalImageWidth,

      imageHeight:
        finalImageHeight,

      imageUploadPending:
        false,

      linkUrl:
        state.draft.linkUrl,

      linkLabel:
        state.draft.linkLabel,

      scope:
        state.draft.scope,

      tournamentId:
        state.draft.scope ===
        "tournament"
          ? state.activeTournamentId
          : "",

      published:
        state.draft.published,

      pinned:
        state.draft.pinned,

      authorId:
        state.currentUser
          ?.uid ||
        existing
          ?.authorId ||
        "",

      authorName:
        existing
          ?.authorName ||
        getAuthorName(),

      commentCount:
        Number(
          existing
            ?.commentCount ||
          0
        ),

      createdAt:
        existing
          ?.createdAt ||
        timestamp,

      publishedAt:
        becamePublished
          ? timestamp
          : (
              existing
                ?.publishedAt ||
              (
                state.draft
                  .published
                  ? timestamp
                  : null
              )
            ),

      updatedAt:
        timestamp
    };

    await ref.set(
      postData
    );

    /*
     * Delete the previous Storage file
     * after the new post record saves.
     */
    const previousImagePath =
      clean(
        existing?.imagePath
      );

    if (
      previousImagePath &&
      previousImagePath !==
        finalImagePath
    ) {
      await deleteAnnouncementImage(
        previousImagePath
      );
    }

    state.formDirty =
      false;

    const message =
      editing
        ? (
            state.draft.published
              ? "Post and image updated."
              : "Draft and image updated."
          )
        : (
            state.draft.published
              ? "Post published."
              : "Draft saved."
          );

    showToast(message);

    resetEditor(true);

    setStatus(
      message,
      "success"
    );
  } catch (error) {
    /*
     * Avoid leaving an orphaned upload
     * when the RTDB post save fails.
     */
    if (
      uploadedImage?.path
    ) {
      await deleteAnnouncementImage(
        uploadedImage.path
      );
    }

    console.error(
      "Post or image save failed:",
      error
    );

    const code =
      clean(
        error?.code
      ).toLowerCase();

    let message =
      error?.message ||
      "The post could not be saved.";

    if (
      code.includes(
        "storage/unauthorized"
      )
    ) {
      message =
        "Firebase Storage denied the upload. Confirm you are signed into the owner account.";
    } else if (
      code.includes(
        "storage/quota-exceeded"
      )
    ) {
      message =
        "Firebase Storage quota has been exceeded.";
    } else if (
      code.includes(
        "storage/canceled"
      )
    ) {
      message =
        "The image upload was canceled.";
    } else if (
      isPermissionDenied(
        error
      )
    ) {
      message =
        "Firebase rules blocked the post or image save.";
    }

    showToast(message);

    setStatus(
      message,
      "error"
    );
  } finally {
    state.saving =
      false;

    setButtonLoading(
      button,
      false
    );

    updateEditorLabels();
  }
}

  async function togglePublished(
    postId,
    button
  ) {
    const post =
      state.posts.find(
        item =>
          item.id ===
          postId
      );

    if (!post) {
      return;
    }

    const nextPublished =
      post.published ===
      false;

    if (
      nextPublished &&
      post.imageUploadPending
    ) {
      showToast(
        "This draft has an image awaiting secure upload and cannot be published yet."
      );

      return;
    }

    setButtonLoading(
      button,
      true,
      nextPublished
        ? "Publishing..."
        : "Unpublishing..."
    );

    try {
      await state.database
        .ref(
          `officialPosts/${postId}`
        )
        .update({
          published:
            nextPublished,

          publishedAt:
            nextPublished
              ? firebase.database
                  .ServerValue
                  .TIMESTAMP
              : (
                  post.publishedAt ||
                  null
                ),

          updatedAt:
            firebase.database
              .ServerValue
              .TIMESTAMP
        });

      showToast(
        nextPublished
          ? "Post published."
          : "Post unpublished."
      );
    } catch (error) {
      console.error(
        "Post visibility update failed:",
        error
      );

      showToast(
        isPermissionDenied(
          error
        )
          ? "Firebase rules blocked the visibility update."
          : "The post visibility could not be changed."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  async function togglePinned(
    postId,
    button
  ) {
    const post =
      state.posts.find(
        item =>
          item.id ===
          postId
      );

    if (!post) {
      return;
    }

    setButtonLoading(
      button,
      true,
      post.pinned
        ? "Unpinning..."
        : "Pinning..."
    );

    try {
      await state.database
        .ref(
          `officialPosts/${postId}`
        )
        .update({
          pinned:
            !post.pinned,

          updatedAt:
            firebase.database
              .ServerValue
              .TIMESTAMP
        });

      showToast(
        post.pinned
          ? "Post unpinned."
          : "Post pinned."
      );
    } catch (error) {
      console.error(
        "Post pin update failed:",
        error
      );

      showToast(
        isPermissionDenied(
          error
        )
          ? "Firebase rules blocked the pin update."
          : "The pin state could not be changed."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  async function deletePost(
    postId,
    button
  ) {
    const post =
      state.posts.find(
        item =>
          item.id ===
          postId
      );

    if (!post) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${post.title || "this post"}"?\n\n` +
        "The post and all of its comments will be removed."
      );

    if (!confirmed) {
      return;
    }

    setButtonLoading(
      button,
      true,
      "Deleting..."
    );

    try {
      await state.database
        .ref()
        .update({
          [`officialPosts/${postId}`]:
            null,

          [`postComments/${postId}`]:
            null
        });

      if (
        state.selectedPostId ===
        postId
      ) {
        resetEditor(true);
      }

      showToast(
        "Post deleted."
      );
    } catch (error) {
      console.error(
        "Post deletion failed:",
        error
      );

      showToast(
        isPermissionDenied(
          error
        )
          ? "Firebase rules blocked the post deletion."
          : "The post could not be deleted."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  function attachPostsListener() {
    detachPostsListener();

    state.postsRef =
      state.database.ref(
        "officialPosts"
      );

    state.postsCallback =
      snapshot => {
        const posts = [];

        snapshot.forEach(
          child => {
            posts.push(
              normalizePost(
                child.key,
                child.val()
              )
            );
          }
        );

        state.posts =
          sortPosts(posts);

        renderMetrics();
        renderLibrary();
      };

    state.postsRef.on(
      "value",
      state.postsCallback,
      error => {
        console.error(
          "Official post listener failed:",
          error
        );

        const container =
          query(
            "#nexusPostLibrary"
          );

        if (container) {
          container.innerHTML = `
            <div class="nexus-post-empty error">
              <i class="fa-solid fa-triangle-exclamation"></i>

              <strong>
                Posts Could Not Be Loaded
              </strong>

              <span>
                ${
                  isPermissionDenied(
                    error
                  )
                    ? "Firebase rules denied access to officialPosts."
                    : escapeHtml(
                        error?.message ||
                        "Unknown error"
                      )
                }
              </span>
            </div>
          `;
        }
      }
    );
  }

  function detachPostsListener() {
    if (
      state.postsRef &&
      state.postsCallback
    ) {
      state.postsRef.off(
        "value",
        state.postsCallback
      );
    }

    state.postsRef =
      null;

    state.postsCallback =
      null;
  }

  function handleInput(event) {
    const target =
      event.target;

    if (
      target.id ===
      "nexusPostSearch"
    ) {
      state.search =
        clean(target.value);

      renderLibrary();
      return;
    }

    if (
      !target.closest(
        "#nexusPostForm"
      )
    ) {
      return;
    }

    syncDraftFromForm();

    state.formDirty =
      true;

    updateEditorLabels();
    updateBodyCount();

    if (
      target.id ===
      "nexusPostImageUrl"
    ) {
      if (
        clean(
          target.value
        )
      ) {
        state.draft
          .imageUploadPending =
            false;

        releaseLocalImage();
      }

      renderImageWorkspace();
    }

    renderPreview();
  }

  async function handleChange(event) {
    const target =
      event.target;

    if (
      target.id ===
      "nexusPostFilter"
    ) {
      state.filter =
        clean(
          target.value,
          "all"
        );

      renderLibrary();
      return;
    }

    if (
      target.id ===
      "nexusPostImageFile"
    ) {
      const file =
        target.files?.[0] ||
        null;

      await selectLocalImage(
        file
      );

      return;
    }

    if (
      target.closest(
        "#nexusPostForm"
      )
    ) {
      syncDraftFromForm();

      state.formDirty =
        true;

      updateEditorLabels();
      updateBodyCount();
      renderPreview();
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest(
        "[data-post-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset
        .postAction;

    const postId =
      clean(
        button.dataset
          .postId
      );

    switch (action) {
      case "open-public-feed":
        window.open(
          "posts.html",
          "_blank",
          "noopener"
        );
        break;

      case "new-post":
        resetEditor();
        break;

      case "remove-image":
        removeImage();
        break;

      case "edit-post":
        editPost(postId);
        break;

      case "toggle-published":
        void togglePublished(
          postId,
          button
        );
        break;

      case "toggle-pinned":
        void togglePinned(
          postId,
          button
        );
        break;

      case "delete-post":
        void deletePost(
          postId,
          button
        );
        break;

      default:
        break;
    }
  }

  function handleSubmit(event) {
    if (
      event.target.id !==
      "nexusPostForm"
    ) {
      return;
    }

    event.preventDefault();

    const button =
      query(
        "#nexusPostSaveButton"
      );

    void savePost(
      button
    );
  }

  async function initialize() {
    state.activeTournamentId =
      await state.api
        .getCurrentTournamentId()
        .catch(
          () => "open1"
        );

    state.draft.tournamentId =
      state.activeTournamentId;

    renderShell();
    attachPostsListener();
  }

  function render(api) {
    cleanup();

    state.api = api;

state.database =
  api.database;

if (
  typeof firebase.storage !==
  "function"
) {
  api.content.innerHTML = `
    <div class="nexus-post-empty error">
      <i class="fa-solid fa-triangle-exclamation"></i>

      <strong>
        Firebase Storage SDK Missing
      </strong>

      <span>
        Add firebase-storage.js before firebase.js in nexus-control.html.
      </span>
    </div>
  `;

  api.showToast(
    "Firebase Storage failed to load."
  );

  return;
}

state.storage =
  firebase.storage();

state.content =
  api.content;

    state.currentUser =
      api.currentUser;

    state.roleId =
      api.roleId || "";

    state.posts = [];
    state.selectedPostId = "";
    state.filter = "all";
    state.search = "";
    state.formDirty = false;
    state.saving = false;
    state.draft =
      createEmptyDraft();

    state.content.innerHTML = `
      <div class="nexus-post-loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span>Loading Posts & Announcements...</span>
      </div>
    `;

    state.content.addEventListener(
      "click",
      handleClick
    );

    state.content.addEventListener(
      "input",
      handleInput
    );

    state.content.addEventListener(
      "change",
      handleChange
    );

    state.content.addEventListener(
      "submit",
      handleSubmit
    );

    initialize()
      .catch(
        error => {
          console.error(
            "Posts module initialization failed:",
            error
          );

          state.content.innerHTML = `
            <div class="nexus-post-empty error">

              <i class="fa-solid fa-triangle-exclamation"></i>

              <strong>
                Posts Module Failed to Load
              </strong>

              <span>
                ${escapeHtml(
                  error?.message ||
                  "Unknown error"
                )}
              </span>

            </div>
          `;
        }
      );
  }

  function cleanup() {
    detachPostsListener();
    releaseLocalImage();

    if (state.content) {
      state.content.removeEventListener(
        "click",
        handleClick
      );

      state.content.removeEventListener(
        "input",
        handleInput
      );

      state.content.removeEventListener(
        "change",
        handleChange
      );

      state.content.removeEventListener(
        "submit",
        handleSubmit
      );
    }

    state.api = null;
state.database = null;
state.storage = null;
state.content = null;
    state.currentUser = null;
    state.roleId = "";

    state.posts = [];
    state.selectedPostId = "";
    state.activeTournamentId = "";

    state.formDirty = false;
    state.saving = false;

    state.draft =
      createEmptyDraft();
  }

  window.NexusPosts = {
    render,
    cleanup
  };
})();
