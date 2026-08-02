(() => {
  "use strict";

  const MODE =
    String(
      window.RG_BROADCAST_MODE ||
      ""
    )
      .trim()
      .toLowerCase();

  const CONFIG = {
    intermission: {
      enabled: true,
      volume: 0.30,
      duckedVolume: 0.08,
      crossfadeMs: 2400,
      loopPlaylist: true,

      tracks: [
  "audio/slow1.mp3",
  "audio/slow2.mp3",
  "audio/slow3.mp3",
  "audio/slow4.mp3",
  "audio/slow5.mp3"
]
    },

    credits: {
      enabled: true,
      volume: 0.35,
      duckedVolume: 0.12,
      crossfadeMs: 1800,
      loopPlaylist: true,

      tracks: [
        "audio/credits.mp3"
      ]
    },

    champion: {
      enabled: true,
      volume: 0.42,
      duckedVolume: 0.14,
      crossfadeMs: 700,
      loopPlaylist: false,

      tracks: [
        "audio/champion.mp3"
      ]
    }
  };

  const config =
    CONFIG[MODE];

  if (
    !config ||
    config.enabled !== true ||
    !Array.isArray(
      config.tracks
    ) ||
    !config.tracks.length
  ) {
    return;
  }

  const players = [
    new Audio(),
    new Audio()
  ];

  players.forEach(
    player => {
      player.preload =
        "auto";

      player.playsInline =
        true;

      player.volume =
        0;
    }
  );

  let activePlayerIndex =
    0;

  let playlistIndex =
    0;

  let started =
    false;

  let ducked =
    false;

  let fadeFrame =
    0;

  let stopped =
    false;

  function activePlayer() {
    return players[
      activePlayerIndex
    ];
  }

  function inactivePlayer() {
    return players[
      activePlayerIndex === 0
        ? 1
        : 0
    ];
  }

  function targetVolume() {
    return ducked
      ? config.duckedVolume
      : config.volume;
  }

  function cancelFade() {
    if (!fadeFrame) {
      return;
    }

    cancelAnimationFrame(
      fadeFrame
    );

    fadeFrame = 0;
  }

  function fadeBetween(
    outgoing,
    incoming,
    duration,
    target,
    callback
  ) {
    cancelFade();

    const startTime =
      performance.now();

    const outgoingStart =
      outgoing
        ? outgoing.volume
        : 0;

    const incomingStart =
      incoming
        ? incoming.volume
        : 0;

    function step(now) {
      const progress =
        Math.min(
          1,
          (
            now -
            startTime
          ) /
          Math.max(
            1,
            duration
          )
        );

      const eased =
        progress < 0.5
          ? 2 *
            progress *
            progress

          : 1 -
            Math.pow(
              -2 *
              progress +
              2,
              2
            ) /
            2;

      if (outgoing) {
        outgoing.volume =
          Math.max(
            0,
            outgoingStart *
            (
              1 -
              eased
            )
          );
      }

      if (incoming) {
        incoming.volume =
          Math.max(
            0,
            Math.min(
              1,
              incomingStart +
              (
                target -
                incomingStart
              ) *
              eased
            )
          );
      }

      if (
        progress <
        1
      ) {
        fadeFrame =
          requestAnimationFrame(
            step
          );

        return;
      }

      fadeFrame =
        0;

      if (outgoing) {
        outgoing.pause();

        outgoing.currentTime =
          0;

        outgoing.volume =
          0;
      }

      if (incoming) {
        incoming.volume =
          target;
      }

      if (
        typeof callback ===
        "function"
      ) {
        callback();
      }
    }

    fadeFrame =
      requestAnimationFrame(
        step
      );
  }

  function nextTrack() {
    if (
      !config.tracks.length
    ) {
      return "";
    }

    const track =
      config.tracks[
        playlistIndex %
        config.tracks.length
      ];

    playlistIndex +=
      1;

    return track;
  }

  function playTrack(
    source,
    immediate = false
  ) {
    if (
      stopped ||
      !source
    ) {
      return;
    }

    const outgoing =
      activePlayer();

    const incoming =
      inactivePlayer();

    incoming.pause();

    incoming.currentTime =
      0;

    incoming.src =
      source;

    incoming.loop =
      false;

    incoming.volume =
      0;

    incoming.onended =
      () => {
        if (stopped) {
          return;
        }

        if (
          config.loopPlaylist ||
          playlistIndex <
          config.tracks.length
        ) {
          playTrack(
            nextTrack()
          );
        }
      };

    incoming.onerror =
      () => {
        console.warn(
          "Broadcast audio failed to load:",
          source
        );

        if (
          config.loopPlaylist ||
          playlistIndex <
          config.tracks.length
        ) {
          window.setTimeout(
            () => {
              playTrack(
                nextTrack(),
                true
              );
            },
            500
          );
        }
      };

    incoming
      .play()
      .then(
        () => {
          fadeBetween(
            outgoing.paused
              ? null
              : outgoing,

            incoming,

            immediate
              ? 450
              : config
                .crossfadeMs,

            targetVolume(),

            () => {
              activePlayerIndex =
                activePlayerIndex === 0
                  ? 1
                  : 0;
            }
          );
        }
      )
      .catch(
        error => {
          console.warn(
            "Broadcast audio is waiting for a tap or OBS autoplay permission:",
            error
          );
        }
      );
  }

  function start() {
    if (
      started ||
      stopped
    ) {
      return;
    }

    started =
      true;

    playlistIndex =
      0;

    playTrack(
      nextTrack(),
      true
    );
  }

  function stop(
    immediate = false
  ) {
    if (stopped) {
      return;
    }

    stopped =
      true;

    cancelFade();

    if (immediate) {
      players.forEach(
        player => {
          player.pause();

          player.currentTime =
            0;

          player.volume =
            0;
        }
      );

      return;
    }

    const louder =
      players[0].volume >=
      players[1].volume
        ? players[0]
        : players[1];

    fadeBetween(
      louder,
      null,
      650,
      0,

      () => {
        players.forEach(
          player => {
            player.pause();

            player.currentTime =
              0;

            player.volume =
              0;
          }
        );
      }
    );
  }

  function setDucked(
    value
  ) {
    ducked =
      Boolean(value);

    const player =
      activePlayer();

    if (
      !started ||
      player.paused
    ) {
      return;
    }

    const startingVolume =
      player.volume;

    const desiredVolume =
      targetVolume();

    const startedAt =
      performance.now();

    cancelFade();

    function step(now) {
      const progress =
        Math.min(
          1,
          (
            now -
            startedAt
          ) /
          450
        );

      player.volume =
        startingVolume +
        (
          desiredVolume -
          startingVolume
        ) *
        progress;

      if (
        progress <
        1
      ) {
        fadeFrame =
          requestAnimationFrame(
            step
          );
      } else {
        fadeFrame =
          0;
      }
    }

    fadeFrame =
      requestAnimationFrame(
        step
      );
  }

  function attachVideo(
    video
  ) {
    if (
      !video ||
      video.dataset
        .rgAudioBound ===
        "true"
    ) {
      return;
    }

    video.dataset
      .rgAudioBound =
        "true";

    function refreshDuck() {
      setDucked(
        !video.muted &&
        video.volume > 0 &&
        !video.paused &&
        !video.ended
      );
    }

    video.addEventListener(
      "playing",
      refreshDuck
    );

    video.addEventListener(
      "volumechange",
      refreshDuck
    );

    video.addEventListener(
      "pause",
      () => {
        setDucked(false);
      }
    );

    video.addEventListener(
      "ended",
      () => {
        setDucked(false);
      }
    );

    video.addEventListener(
      "emptied",
      () => {
        setDucked(false);
      }
    );

    refreshDuck();
  }

  function scanForVideos() {
    document
      .querySelectorAll(
        "video.media-main, #activeVideo"
      )
      .forEach(
        attachVideo
      );
  }

  const observer =
    new MutationObserver(
      scanForVideos
    );

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );

  document.addEventListener(
    "click",
    start,
    {
      once: true
    }
  );

  document.addEventListener(
    "touchstart",
    start,
    {
      once: true,
      passive: true
    }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.hidden
      ) {
        stop(true);
      }
    }
  );

  window.addEventListener(
    "pagehide",
    () => {
      stop(true);
    }
  );

  window.RGBroadcastAudio = {
    start,
    stop,
    setDucked,
    mode: MODE
  };

  scanForVideos();

  start();
})();
