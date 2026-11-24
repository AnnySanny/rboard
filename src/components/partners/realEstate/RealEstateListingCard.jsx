
import { useEffect, useMemo, useRef, useState } from "react";
import {
    House,
    Phone,
    Video,
    Eye,
    Clock3,
    Pencil,
    Trash2,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Play,
} from "lucide-react";

import ListingImageGallery from "../../listings/ListingImageGallery";
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
        const existingScript =
            document.getElementById("rboard-facebook-sdk");

        if (existingScript) {
            let attempts = 0;

            const interval = setInterval(() => {
                if (window.FB?.XFBML?.parse) {
                    clearInterval(interval);
                    resolve(window.FB);
                } else if (++attempts >= 100) {
                    clearInterval(interval);
                    reject(new Error("Facebook SDK недоступний"));
                }
            }, 100);

            return;
        }

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
            script.remove();
            reject(new Error("Не вдалося завантажити Facebook SDK"));
        };

        document.body.appendChild(script);
    }).catch((error) => {
        facebookSdkPromise = null;
        throw error;
    });

    return facebookSdkPromise;
};

const formatDate = (value) => {
    if (!value) return "Не вказано";

    const date =
        value?.toDate?.() ||
        (value instanceof Date ? value : new Date(value));

    if (Number.isNaN(date.getTime())) {
        return "Не вказано";
    }

    return date.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatNumber = (value) =>
    new Intl.NumberFormat("uk-UA", {
        maximumFractionDigits: 2,
    }).format(Number(value));

const formatTime = (seconds) => {
    const total = Number(seconds);

    if (!Number.isFinite(total) || total < 0) {
        return "00:00";
    }

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remaining = Math.floor(total % 60);

    const pad = (number) => String(number).padStart(2, "0");

    return hours > 0
        ? `${pad(hours)}:${pad(minutes)}:${pad(remaining)}`
        : `${pad(minutes)}:${pad(remaining)}`;
};

const getStatusData = (status) => {
    switch (status) {
        case "approved":
            return {
                label: "Опубліковано",
                className:
                    "border-emerald-100 bg-emerald-50 text-emerald-700",
            };

        case "cancelled":
            return {
                label: "Відхилено",
                className:
                    "border-red-100 bg-red-50 text-red-700",
            };

        default:
            return {
                label: "На перевірці",
                className:
                    "border-amber-100 bg-amber-50 text-amber-700",
            };
    }
};

function InfoItem({ label, value }) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    return (
        <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value}
            </p>
        </div>
    );
}

export default function RealEstateListingCard({
    listing,
    onDelete,
    onEdit,
    deleting = false,
}) {
    const [showVideo, setShowVideo] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [sdkFailed, setSdkFailed] = useState(false);
    const [activeRotation, setActiveRotation] = useState("none");
    const [videoMessage, setVideoMessage] = useState("");

    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const pendingSeekRef = useRef(null);
    const seekGuardRef = useRef(0);
    const videoStageRef = useRef(null);
    const previousRotationRef = useRef("none");
    const realEstate = listing.realEstate || {};
    const video = realEstate.video;

    const images = Array.isArray(listing.images)
        ? listing.images
        : [];

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

    const playerId = `rboard-real-estate-${listing.id}`;

    const status = getStatusData(listing.status);

    const cityName =
        typeof listing.city === "string"
            ? listing.city
            : listing.city?.name ||
            listing.city?.label ||
            listing.city?.city ||
            "";

    const location = [
        cityName,
        listing.street,
    ].filter(Boolean).join(", ");

    const currency = {
        USD: "$",
        UAH: "₴",
        EUR: "€",
    }[realEstate.currency] || realEstate.currency || "";

    const propertyType =
        realEstate.propertyType === "house"
            ? "Будинок"
            : realEstate.propertyType === "land"
                ? "Земельна ділянка"
                : "Нерухомість";

    const mainContact =
        listing.contactOriginal ||
        listing.contact ||
        "";

    const secondContact =
        realEstate.secondContact || "";

    // Ініціалізація Facebook-плеєра
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
                    String(
                        Math.max(
                            220,
                            Math.min(400, container.clientWidth || 400)
                        )
                    )
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

                    // Якщо користувач натиснув таймкод
                    // до завантаження плеєра
                    const pending = pendingSeekRef.current;

                    if (pending) {
                        try {
                            seekGuardRef.current = Date.now() + 1200;
                            setActiveRotation(pending.rotation);
                            event.instance.seek(pending.seconds);
                            pendingSeekRef.current = null;
                        } catch (error) {
                            console.error(
                                "Помилка переходу до таймкоду:",
                                error
                            );
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
                    "Відображається звичайне Facebook-відео."
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

    // Синхронізація повороту під час відтворення
    useEffect(() => {
        if (!showVideo || !playerReady || sdkFailed) {
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

                const currentChapter = timecodes
                    .filter(
                        (item) =>
                            Number.isFinite(Number(item.seconds)) &&
                            Number(item.seconds) <= position
                    )
                    .sort(
                        (a, b) =>
                            Number(b.seconds) - Number(a.seconds)
                    )[0];

                const rotation =
                    ["right", "left"].includes(currentChapter?.rotation)
                        ? currentChapter.rotation
                        : "none";

                setActiveRotation((previous) =>
                    previous === rotation ? previous : rotation
                );
            } catch (error) {
                console.error(
                    "Помилка синхронізації відео:",
                    error
                );
            }
        };

        syncRotation();

        const interval = setInterval(syncRotation, 400);

        return () => clearInterval(interval);
    }, [showVideo, playerReady, sdkFailed, timecodes]);
    // Плавне центрування відео після зміни повороту
    useEffect(() => {
        const rotationChanged =
            previousRotationRef.current !== activeRotation;

        previousRotationRef.current = activeRotation;

        if (!rotationChanged || !showVideo || !playerReady) {
            return;
        }

        const element = videoStageRef.current;

        if (!element) return;

        const rect = element.getBoundingClientRect();

        // Не прокручуємо сторінку, якщо відео поза екраном
        if (
            rect.bottom <= 0 ||
            rect.top >= window.innerHeight
        ) {
            return;
        }

        // Даємо контейнеру завершити зміну розмірів
        const timeout = setTimeout(() => {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
        }, 250);

        return () => clearTimeout(timeout);

    }, [activeRotation, showVideo, playerReady]);
    const handleTimecodeClick = (item) => {
        const seconds = Number(item.seconds);

        if (!Number.isFinite(seconds) || seconds < 0) {
            return;
        }

        const rotation =
            ["right", "left"].includes(item.rotation)
                ? item.rotation
                : "none";

        pendingSeekRef.current = {
            seconds,
            rotation,
        };

        // Якщо плеєр згорнутий — відкриваємо його
        if (!showVideo) {
            setShowVideo(true);
            return;
        }

        // Якщо плеєр уже готовий — перемотуємо одразу
        if (playerReady && playerRef.current) {
            try {
                seekGuardRef.current = Date.now() + 1200;
                setActiveRotation(rotation);

                playerRef.current.seek(seconds);
                pendingSeekRef.current = null;
                setVideoMessage("");
            } catch (error) {
                console.error(
                    "Помилка переходу до таймкоду:",
                    error
                );

                setVideoMessage(
                    "Не вдалося перейти до фрагмента."
                );
            }

            return;
        }

        if (sdkFailed) {
            setVideoMessage(
                "Для переходу за таймкодами потрібен Facebook SDK."
            );
        }
    };

    const handleToggleVideo = () => {
        if (showVideo) {
            pendingSeekRef.current = null;
            playerRef.current = null;
            setPlayerReady(false);
            setActiveRotation("none");
        }

        setShowVideo((previous) => !previous);
    };

    return (
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">

            {/* Верхній ряд */}
            <div className="flex flex-wrap items-start justify-between gap-3">

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2">

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                        <BadgeCheck size={14} />
                        Партнерське
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {listing.type || "Продаж"}
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {propertyType}
                    </span>

                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock3 size={14} />
                        {formatDate(listing.createdAt)}
                    </span>

                    {listing.status === "approved" && listing.expiresAt && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs">
                            <Clock3 size={14} />

                            <span className="text-slate-500">
                                Активне до:
                            </span>

                            <span className="font-bold text-emerald-700">
                                {formatDate(listing.expiresAt)}
                            </span>
                        </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <Eye size={15} />
                        {listing.views ?? 0}
                    </span>
                </div>

                {/* Кнопки дій */}
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={!onEdit}
                        title={
                            onEdit
                                ? "Редагувати"
                                : "Редагування партнерських оголошень додамо окремо"
                        }
                        aria-label="Редагувати оголошення"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Pencil size={17} />
                    </button>

                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={deleting}
                        title="Видалити"
                        aria-label="Видалити оголошення"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                        {deleting ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                        ) : (
                            <Trash2 size={17} />
                        )}
                    </button>
                </div>
            </div>

            {/* Назва */}
            <h2 className="mt-4 text-xl font-black leading-snug text-slate-950 sm:text-2xl">
                {listing.title || "Без назви"}
            </h2>

            {/* Ціна */}
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                    Вартість об'єкта
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl font-black tracking-tight text-blue-700 sm:text-3xl">
                        {realEstate.price !== null &&
                            realEstate.price !== undefined
                            ? `${formatNumber(realEstate.price)} ${currency}`
                            : "Ціна не вказана"}
                    </span>

                    {realEstate.priceMode === "per_sotka" && (
                        <span className="text-sm font-semibold text-blue-600">
                            / сотку
                        </span>
                    )}

                    {realEstate.negotiable && (
                        <span className="text-xs font-semibold text-slate-500">
                            · можливий торг
                        </span>
                    )}
                </div>
            </div>

            {/* Характеристики */}
            <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <House size={18} className="text-blue-600" />
                    Характеристики об'єкта
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <InfoItem label="Тип" value={propertyType} />

                    {realEstate.buildingArea != null && (
                        <InfoItem
                            label="Площа будинку"
                            value={`${formatNumber(realEstate.buildingArea)} м²`}
                        />
                    )}

                    {realEstate.landArea != null && (
                        <InfoItem
                            label="Площа ділянки"
                            value={`${formatNumber(realEstate.landArea)} соток`}
                        />
                    )}

                    {realEstate.floors != null && (
                        <InfoItem
                            label="Поверхів"
                            value={realEstate.floors}
                        />
                    )}

                    <InfoItem
                        label="Тип ціни"
                        value={
                            realEstate.priceMode === "per_sotka"
                                ? "За 1 сотку"
                                : "За весь об'єкт"
                        }
                    />
                    <InfoItem
                        label="Місцезнаходження"
                        value={location || "Не вказано"}
                    />
                </div>
            </div>

            {/* Контакти */}
            <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Phone size={18} className="text-blue-600" />
                    Контакти
                </h3>

                <div className="grid gap-2 sm:grid-cols-2">
                    <InfoItem
                        label="Автор"
                        value={listing.authorName || "Не вказано"}
                    />

                    {mainContact && (
                        <InfoItem
                            label="Основний номер"
                            value={mainContact}
                        />
                    )}

                    {secondContact && (
                        <InfoItem
                            label="Другий номер"
                            value={secondContact}
                        />
                    )}
                </div>
            </div>

            {/* Фотографії */}
            {images.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">
                        Фотографії ({images.length})
                    </h3>

                    <ListingImageGallery images={images} />
                </div>
            )}

            {/* Facebook-відео */}
            {videoUrl && (
                <div className="mt-5 border-t border-slate-100 pt-5">

                    {/* Заголовок та керування */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Video size={18} className="text-blue-600" />

                            <h3 className="text-sm font-bold text-slate-900">
                                Відеоогляд
                            </h3>

                            {timecodes.length > 0 && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                    {timecodes.length} фрагментів
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleToggleVideo}
                                aria-expanded={showVideo}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                                {showVideo ? (
                                    <>
                                        <ChevronUp size={16} />
                                        Згорнути відео
                                    </>
                                ) : (
                                    <>
                                        <Play size={15} />
                                        Показати відео
                                        <ChevronDown size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Плеєр показуємо лише за потреби */}
                    {showVideo && (
                        <div className="mt-4">
                            <div
                                ref={videoStageRef}
                                className="rounded-2xl bg-slate-950 p-2 sm:p-4"
                            >
                                <RotatableVideoStage
                                    orientation="vertical"
                                    rotation={activeRotation}
                                >
                                    {sdkFailed ? (
                                        <iframe
                                            src={embedUrl}
                                            title={`Відеоогляд: ${listing.title}`}
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

                            {videoMessage && (
                                <p className="mt-2 text-xs text-slate-500">
                                    {videoMessage}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Таймкоди доступні навіть при згорнутому відео */}
                    {timecodes.length > 0 && (
                        <div className="mt-4 hidden rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 md:block">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                Фрагменти відео
                            </p>

                            <div className="grid gap-2 sm:grid-cols-2">
                                {timecodes.map((item, index) => (
                                    <button
                                        key={`${item.seconds}-${index}`}
                                        type="button"
                                        onClick={() => handleTimecodeClick(item)}
                                        className="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                        title={`Перейти до ${formatTime(item.seconds)}`}
                                    >
                                        <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold tabular-nums text-blue-700 group-hover:bg-blue-100">
                                            {formatTime(item.seconds)}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm font-semibold text-slate-800">
                                                {item.title || "Без назви"}
                                            </p>

                                            {item.rotation &&
                                                item.rotation !== "none" && (
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {item.rotation === "right"
                                                            ? "Поворот праворуч 90°"
                                                            : "Поворот ліворуч 90°"}
                                                    </p>
                                                )}
                                        </div>

                                        <Play
                                            size={15}
                                            className="mt-1 shrink-0 text-slate-300 transition group-hover:text-blue-600"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
