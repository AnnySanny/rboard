
import { useEffect, useRef, useState } from "react";
import {
  Video,
  Play,
  AlertCircle,
} from "lucide-react";

import VideoTimecodes, {
  timecodeToSeconds,
} from "./VideoTimecodes";

import RotatableVideoStage from "./RotatableVideoStage";

let facebookSdkPromise = null;

const loadFacebookSdk = () => {
  if (window.FB?.XFBML?.parse) {
    return Promise.resolve(window.FB);
  }

  if (facebookSdkPromise) {
    return facebookSdkPromise;
  }

  facebookSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.id = "rboard-facebook-sdk";
    script.src =
      "https://connect.facebook.net/uk_UA/sdk.js#xfbml=0&version=v27.0";
    script.async = true;

    script.onload = () => {
      if (window.FB?.XFBML?.parse) {
        resolve(window.FB);
      } else {
        reject(new Error("Facebook SDK недоступний"));
      }
    };

    script.onerror = () => {
      reject(new Error("Не вдалося завантажити SDK"));
    };

    document.body.appendChild(script);
  }).catch((error) => {
    facebookSdkPromise = null;
    document.getElementById("rboard-facebook-sdk")?.remove();
    throw error;
  });

  return facebookSdkPromise;
};

const getFacebookUrl = (value) => {
  if (!value?.trim()) return "";

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      (
        hostname !== "facebook.com" &&
        !hostname.endsWith(".facebook.com")
      )
    ) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
};

export default function FacebookVideoPreview({
  value = "",
  onChange,
  timecodes = [],
  onTimecodesChange,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [activeRotation, setActiveRotation] =
    useState("none");

  const seekGuardRef = useRef(0);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const facebookUrl = getFacebookUrl(value);


  // Налаштування та повторне створення плеєра
  useEffect(() => {
    if (!showPreview || !facebookUrl) return;

    let active = true;
    let sdk = null;
    let readyHandler = null;

    const container = containerRef.current;

    playerRef.current = null;
    setPlayerReady(false);
    setSdkFailed(false);
    setMessage("Завантаження Facebook-плеєра...");

    const initialize = async () => {
      try {
        sdk = await loadFacebookSdk();

        if (!active || !container) return;

        // Видаляємо попередній плеєр.
        // React не керує цими дочірніми елементами.
        container.replaceChildren();

        const videoNode = document.createElement("div");

        videoNode.id = "rboard-video-player";
        videoNode.className = "fb-video";

        videoNode.setAttribute(
          "data-href",
          facebookUrl
        );

        // Вертикальне: до 400 px
        // Горизонтальне: до 760 px
        // На мобільних враховуємо реальну ширину.
        const maxWidth = 400;

        const width = Math.max(
          220,
          Math.min(
            maxWidth,
            container.clientWidth || maxWidth
          )
        );

        videoNode.setAttribute(
          "data-width",
          String(width)
        );

        videoNode.setAttribute(
          "data-show-text",
          "false"
        );

        videoNode.setAttribute(
          "data-allowfullscreen",
          "true"
        );

        container.appendChild(videoNode);

        readyHandler = (event) => {
          if (
            !active ||
            event.type !== "video" ||
            event.id !== "rboard-video-player"
          ) {
            return;
          }

          playerRef.current = event.instance;

          setPlayerReady(true);
          setMessage(
            "Плеєр готовий. Можна перевіряти таймкоди."
          );
        };

        sdk.Event.subscribe(
          "xfbml.ready",
          readyHandler
        );

        sdk.XFBML.parse(container);
      } catch (error) {
        if (!active) return;

        console.error(
          "Помилка Facebook SDK:",
          error
        );

        setSdkFailed(true);
        setMessage(
          "SDK недоступний. Відображається звичайний плеєр."
        );
      }
    };

    initialize();

    return () => {
      active = false;
      playerRef.current = null;

      if (sdk && readyHandler) {
        sdk.Event.unsubscribe(
          "xfbml.ready",
          readyHandler
        );
      }

      container?.replaceChildren();
    };
  }, [showPreview, facebookUrl]);

  // Перемотування до таймкоду

  const seekTo = (seconds, rotation = "none") => {
    if (!playerRef.current) {
      setMessage("Плеєр ще не готовий.");
      return;
    }

    try {
      // Не даємо синхронізації відразу
      // повернути попередній кут
      seekGuardRef.current = Date.now() + 1200;

      const nextRotation =
        rotation === "right" || rotation === "left"
          ? rotation
          : "none";

      setActiveRotation(nextRotation);

      // Перемотка без перезавантаження відео
      playerRef.current.seek(seconds);

      setMessage(
        `Перехід до ${seconds}-ї секунди.`
      );
    } catch (error) {
      console.error(
        "Помилка перемотування відео:",
        error
      );

      setMessage("Не вдалося перемотати відео.");
    }
  };


  // Автоматично змінюємо поворот під час відтворення
  useEffect(() => {
    if (!showPreview || !playerReady || sdkFailed) {
      return;
    }

    const syncRotation = () => {
      if (Date.now() < seekGuardRef.current) {
        return;
      }

      try {
        const position =
          playerRef.current?.getCurrentPosition?.();

        if (
          typeof position !== "number" ||
          !Number.isFinite(position)
        ) {
          return;
        }

        // Шукаємо останній таймкод,
        // який уже настав
        const currentChapter = timecodes
          .map((item) => ({
            seconds: timecodeToSeconds(item.time),
            rotation: item.rotation || "none",
          }))
          .filter(
            (item) =>
              item.seconds !== null &&
              item.seconds <= position
          )
          .sort(
            (first, second) =>
              second.seconds - first.seconds
          )[0];

        const nextRotation =
          currentChapter?.rotation === "right" ||
            currentChapter?.rotation === "left"
            ? currentChapter.rotation
            : "none";

        setActiveRotation((previous) =>
          previous === nextRotation
            ? previous
            : nextRotation
        );
      } catch (error) {
        console.error(
          "Помилка синхронізації повороту:",
          error
        );
      }
    };

    syncRotation();

    const interval = setInterval(syncRotation, 400);

    return () => clearInterval(interval);
  }, [
    showPreview,
    playerReady,
    sdkFailed,
    timecodes,
  ]);

  const fallbackUrl =
    "https://www.facebook.com/plugins/video.php" +
    `?href=${encodeURIComponent(facebookUrl)}` +
    "&show_text=false&width=400"

  const handleUrlChange = (event) => {
    onChange(event.target.value);

    setShowPreview(false);
    setPlayerReady(false);
    setSdkFailed(false);
    playerRef.current = null;
    setMessage("");
  };



  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">

      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <Video size={19} className="text-blue-600" />

        <h3 className="text-sm font-bold text-slate-900">
          Відеоогляд нерухомості
        </h3>
      </div>

      {/* URL */}
      <div>
        <label
          htmlFor="facebookVideoUrl"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Посилання на Facebook-відео
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="facebookVideoUrl"
            type="url"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://www.facebook.com/..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!facebookUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Play size={17} />
            Переглянути
          </button>
        </div>

        {!facebookUrl && Boolean(value.trim()) && (
          <p className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={15} />
            Потрібне коректне HTTPS-посилання Facebook.
          </p>
        )}
      </div>

      {/* Facebook-плеєр */}
      {showPreview && facebookUrl && (
        <div className="space-y-3">

          <div className="rounded-2xl bg-slate-950 p-2 sm:p-4">
            <RotatableVideoStage
              orientation="vertical"
              rotation={activeRotation}
            >
              {sdkFailed ? (
                <iframe
                  src={fallbackUrl}
                  title="Відеоогляд нерухомості"
                  className="block"
                  style={{
                    width: 400,
                    height: 760,
                    border: "none",
                  }}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div
                  ref={containerRef}
                  className="w-full text-center"
                />
              )}
            </RotatableVideoStage>
          </div>


          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={`text-xs ${sdkFailed
                ? "text-amber-600"
                : "text-slate-500"
                }`}
            >
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Таймкоди */}
      {facebookUrl && (
        <VideoTimecodes
          value={timecodes}
          onChange={onTimecodesChange}
          onSeek={seekTo}
          playerReady={playerReady}
        />
      )}

      {!showPreview && facebookUrl && (
        <p className="text-xs text-slate-500">
          Натисніть «Переглянути», щоб відкрити
          відео й перевірити таймкоди.
        </p>
      )}
    </div>
  );
}
