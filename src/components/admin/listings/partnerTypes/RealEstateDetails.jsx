
import { useEffect, useMemo, useRef, useState } from "react";
import {
    House,
    Phone,
    Video,
    Play,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from "lucide-react";

import RotatableVideoStage from "../../../partners/realEstate/RotatableVideoStage";

const formatNumber = (value) =>
    new Intl.NumberFormat("uk-UA", {
        maximumFractionDigits: 2,
    }).format(Number(value));

const formatTime = (value) => {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const pad = (number) => String(number).padStart(2, "0");

    return hours
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`;
};

const loadFacebookSdk = () => {
    if (window.FB?.XFBML?.parse && window.FB?.Event?.subscribe) {
        return Promise.resolve(window.FB);
    }

    return new Promise((resolve, reject) => {
        let attempts = 0;

        const interval = setInterval(() => {
            if (window.FB?.XFBML?.parse && window.FB?.Event?.subscribe) {
                clearInterval(interval);
                resolve(window.FB);
            } else if (++attempts >= 100) {
                clearInterval(interval);
                reject(new Error("Facebook SDK недоступний"));
            }
        }, 100);

        if (!document.getElementById("rboard-facebook-sdk")) {
            const script = document.createElement("script");

            script.id = "rboard-facebook-sdk";
            script.src =
                "https://connect.facebook.net/uk_UA/sdk.js#xfbml=0&version=v27.0";
            script.async = true;

            script.onerror = () => {
                clearInterval(interval);
                reject(new Error("Помилка завантаження Facebook SDK"));
            };

            document.body.appendChild(script);
        }
    });
};

function DetailItem({ label, value }) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value}
            </p>
        </div>
    );
}

export default function RealEstateDetails({ listing }) {
    const [showDetails, setShowDetails] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [sdkFailed, setSdkFailed] = useState(false);
    const [rotation, setRotation] = useState("none");
    const [videoMessage, setVideoMessage] = useState("");

    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const pendingSeekRef = useRef(null);
    const seekGuardRef = useRef(0);

    const realEstate = listing.realEstate || {};
    const video = realEstate.video;

    const rawTimecodes = video?.timecodes;

    const timecodes = useMemo(
        () =>
            Array.isArray(rawTimecodes)
                ? [...rawTimecodes].sort(
                    (a, b) => Number(a.seconds) - Number(b.seconds)
                )
                : [],
        [rawTimecodes]
    );

    const videoUrl =
        typeof video?.url === "string" &&
            /^https:\/\/([a-z0-9-]+\.)*facebook\.com\//i.test(video.url)
            ? video.url
            : "";

    const embedUrl = videoUrl
        ? "https://www.facebook.com/plugins/video.php" +
        `?href=${encodeURIComponent(videoUrl)}` +
        "&show_text=false&width=400"
        : "";

    const playerId = `admin-real-estate-video-${listing.id}`;

    const currency = {
        USD: "$",
        EUR: "€",
        UAH: "₴",
    }[realEstate.currency] || realEstate.currency || "";

    const propertyType =
        realEstate.propertyType === "house"
            ? "Будинок"
            : realEstate.propertyType === "land"
                ? "Земельна ділянка"
                : "Нерухомість";

    // Завантажуємо плеєр тільки після розгортання
    useEffect(() => {
        if (!showVideo || !videoUrl) return;

        let active = true;
        let sdk = null;
        let readyHandler = null;

        const container = containerRef.current;

        playerRef.current = null;
        setPlayerReady(false);
        setSdkFailed(false);
        setVideoMessage("Завантаження відео...");

        const initialize = async () => {
            try {
                sdk = await loadFacebookSdk();

                if (!active || !container) return;

                container.replaceChildren();

                const videoNode = document.createElement("div");

                videoNode.id = playerId;
                videoNode.className = "fb-video";
                videoNode.setAttribute("data-href", videoUrl);
                videoNode.setAttribute(
                    "data-width",
                    String(Math.min(400, container.clientWidth || 400))
                );
                videoNode.setAttribute("data-show-text", "false");
                videoNode.setAttribute("data-allowfullscreen", "true");

                container.appendChild(videoNode);

                readyHandler = (event) => {
                    if (
                        !active ||
                        event.type !== "video" ||
                        event.id !== playerId
                    ) {
                        return;
                    }

                    playerRef.current = event.instance;
                    setPlayerReady(true);
                    setVideoMessage("");

                    if (pendingSeekRef.current) {
                        const item = pendingSeekRef.current;

                        try {
                            seekGuardRef.current = Date.now() + 1200;
                            setRotation(item.rotation || "none");
                            event.instance.seek(Number(item.seconds));
                            pendingSeekRef.current = null;
                        } catch (error) {
                            console.error("Помилка таймкоду:", error);
                            setVideoMessage(
                                "Не вдалося перейти до фрагмента."
                            );
                        }
                    }
                };

                sdk.Event.subscribe("xfbml.ready", readyHandler);
                sdk.XFBML.parse(container);
            } catch (error) {
                if (!active) return;

                console.error("Помилка Facebook SDK:", error);
                setSdkFailed(true);
                setVideoMessage(
                    "Інтерактивний плеєр недоступний. " +
                    "Показано звичайне Facebook-відео."
                );
            }
        };

        initialize();

        return () => {
            active = false;
            playerRef.current = null;

            if (sdk && readyHandler) {
                sdk.Event.unsubscribe("xfbml.ready", readyHandler);
            }

            container?.replaceChildren();
        };
    }, [showVideo, videoUrl, playerId]);

    // Поворот відповідно до поточного фрагмента
    useEffect(() => {
        if (!showVideo || !playerReady || sdkFailed) return;

        const syncRotation = () => {
            if (Date.now() < seekGuardRef.current) return;

            const position =
                playerRef.current?.getCurrentPosition?.();

            if (!Number.isFinite(position)) return;

            const chapter = [...timecodes]
                .reverse()
                .find((item) => Number(item.seconds) <= position);

            const nextRotation =
                ["left", "right"].includes(chapter?.rotation)
                    ? chapter.rotation
                    : "none";

            setRotation((previous) =>
                previous === nextRotation ? previous : nextRotation
            );
        };

        syncRotation();

        const interval = setInterval(syncRotation, 400);

        return () => clearInterval(interval);
    }, [showVideo, playerReady, sdkFailed, timecodes]);

    const handleTimecodeClick = (item) => {
        const seconds = Number(item.seconds);

        if (!Number.isFinite(seconds) || seconds < 0) return;

        if (sdkFailed) {
            setVideoMessage(
                "Перемотування недоступне без Facebook SDK."
            );
            return;
        }

        pendingSeekRef.current = item;

        if (!showVideo) {
            setShowVideo(true);
            return;
        }

        if (playerReady && playerRef.current) {
            try {
                seekGuardRef.current = Date.now() + 1200;
                setRotation(item.rotation || "none");
                playerRef.current.seek(seconds);
                pendingSeekRef.current = null;
                setVideoMessage("");
            } catch (error) {
                console.error("Помилка переходу до фрагмента:", error);
                setVideoMessage(
                    "Не вдалося перейти до фрагмента."
                );
            }
        }
    };

    const handleToggleVideo = () => {
        if (showVideo) {
            pendingSeekRef.current = null;
            playerRef.current = null;
            setPlayerReady(false);
            setRotation("none");
        }

        setShowVideo((previous) => !previous);
    };

    return (
        <div className="mt-5 min-w-0 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">

            <button
                type="button"
                onClick={() => {
                    if (showDetails && showVideo) {
                        handleToggleVideo();
                    }

                    setShowDetails(!showDetails);
                }}
                aria-expanded={showDetails}
                className="flex w-full items-center justify-between gap-3 text-left"
            >
                <div className="flex min-w-0 items-center gap-2">
                    <House
                        size={18}
                        className="shrink-0 text-violet-600"
                    />

                    <h3 className="text-sm font-bold text-slate-900">
                        Дані нерухомості
                    </h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {propertyType}
                    </span>

                    <ChevronDown
                        size={19}
                        className={`text-violet-600 transition-transform duration-200 ${showDetails ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </button>


{showDetails && (
    <>
        {/* Ціна */}
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-500">
                    Вартість об'єкта
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xl font-black text-blue-700">
                        {realEstate.price != null
                            ? `${formatNumber(realEstate.price)} ${currency}`
                            : "Не вказано"}
                    </span>

                    {realEstate.priceMode === "per_sotka" && (
                        <span className="text-xs font-bold text-blue-600">
                            / сотку
                        </span>
                    )}

                    {realEstate.negotiable && (
                        <span className="text-xs font-medium text-slate-500">
                            · можливий торг
                        </span>
                    )}
                </div>
            </div>

            {/* Спеціальні характеристики */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <DetailItem
                    label="Тип об'єкта"
                    value={propertyType}
                />

                {realEstate.buildingArea != null && (
                    <DetailItem
                        label="Площа будинку"
                        value={`${formatNumber(realEstate.buildingArea)} м²`}
                    />
                )}

                {realEstate.landArea != null && (
                    <DetailItem
                        label="Площа ділянки"
                        value={`${formatNumber(realEstate.landArea)} соток`}
                    />
                )}

                {realEstate.floors != null && (
                    <DetailItem
                        label="Поверхів"
                        value={realEstate.floors}
                    />
                )}

                {realEstate.priceMode && (
                    <DetailItem
                        label="Тип ціни"
                        value={
                            realEstate.priceMode === "per_sotka"
                                ? "За 1 сотку"
                                : "За весь об'єкт"
                        }
                    />
                )}
            </div>

            {/* Додатковий телефон */}
            {realEstate.secondContact && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <Phone size={17} className="mt-0.5 shrink-0 text-blue-600" />

                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Додатковий контакт
                        </p>

                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                            {realEstate.secondContact}
                        </p>
                    </div>
                </div>
            )}

            {/* Відеоогляд */}
            {videoUrl && (
                <div className="mt-4 border-t border-violet-100 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Video size={17} className="text-blue-600" />
                            Відеоогляд

                            {timecodes.length > 0 && (
                                <span className="hidden rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 md:inline-flex">
                                    {timecodes.length} фрагментів
                                </span>
                            )}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Facebook
                                <ExternalLink size={13} />
                            </a>

                            <button
                                type="button"
                                onClick={handleToggleVideo}
                                aria-expanded={showVideo}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                            >
                                {showVideo ? (
                                    <>
                                        <ChevronUp size={15} />
                                        Згорнути
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} />
                                        Показати відео
                                        <ChevronDown size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {showVideo && (
                        <div className="mt-4 rounded-xl bg-slate-950 p-2">
                            <RotatableVideoStage
                                orientation="vertical"
                                rotation={rotation}
                            >
                                {sdkFailed ? (
                                    <iframe
                                        src={embedUrl}
                                        title={`Відеоогляд: ${listing.title}`}
                                        style={{
                                            width: 400,
                                            height: 760,
                                            border: "none",
                                        }}
                                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div
                                        ref={containerRef}
                                        className="w-full text-center"
                                    />
                                )}
                            </RotatableVideoStage>

                            {videoMessage && (
                                <p className="mt-2 text-center text-xs text-slate-300">
                                    {videoMessage}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Список фрагментів */}
                    {timecodes.length > 0 && (
                        <div className="mt-3 hidden space-y-2 md:block">
                            {timecodes.map((item, index) => (
                                <button
                                    key={`${item.seconds}-${index}`}
                                    type="button"
                                    onClick={() => handleTimecodeClick(item)}
                                    className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                >
                                    <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-bold tabular-nums text-blue-700">
                                        {formatTime(item.seconds)}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block break-words text-sm font-semibold text-slate-800">
                                            {item.title || "Без назви"}
                                        </span>

                                        {item.rotation &&
                                            item.rotation !== "none" && (
                                                <span className="mt-1 block text-xs text-slate-500">
                                                    {item.rotation === "right"
                                                        ? "Поворот праворуч 90°"
                                                        : "Поворот ліворуч 90°"}
                                                </span>
                                            )}
                                    </span>

                                    <Play
                                        size={15}
                                        className="mt-1 shrink-0 text-blue-500"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </>
    )}
</div>
    );
}
