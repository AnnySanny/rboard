
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { createPortal } from "react-dom";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import Swal from "sweetalert2";

import {
    X,
    House,
    Trees,
    Ruler,
    Building2,
    Layers3,
    MapPin,
    Eye,
    Clock3,
    Handshake,
    PlayCircle,
    ExternalLink,
    MessageCircle,
    Phone,
    Copy,
    Mail,
    Facebook,
    Instagram,
    CheckCircle2,
    LoaderCircle,
    Maximize2,
} from "lucide-react";

import {
    FaTelegramPlane,
    FaViber,
    FaWhatsapp,
    FaTiktok,
} from "react-icons/fa";

import { auth, db } from "../../../firebase";
import {
    CONTACT_TYPES,
    detectContactType,
    getContactHref,
} from "../../../utils/contactUtils";
import { registerListingView } from "../../../utils/listingViews";

import ListingImageGallery from "../../listings/ListingImageGallery";
import ListingAuthor from "../../listings/ListingAuthor";
import ListingAdditionalLinksDisplay from "../../listings/ListingAdditionalLinksDisplay";
import RealEstateCard from "./RealEstateCard";

const formatNumber = (value) =>
    new Intl.NumberFormat("uk-UA", {
        maximumFractionDigits: 2,
    }).format(Number(value));

const toDate = (value) => {
    if (!value) return null;

    const date =
        value?.toDate?.() ||
        (value instanceof Date ? value : new Date(value));

    return Number.isNaN(date.getTime())
        ? null
        : date;
};

const formatDate = (value) => {
    const date = toDate(value);

    if (!date) return "Не вказано";

    return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const hasValue = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0;

const getRemainingTime = (value, currentTime) => {
    const date = toDate(value);

    if (!date) return null;

    const minutes = Math.floor(
        (date.getTime() - currentTime) / 60000
    );

    if (minutes <= 0) return null;

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);

    return `${days} д, ${hours} г, ${minutes % 60} хв`;
};

const formatTimecode = (value) => {
    const total = Math.max(
        0,
        Math.floor(Number(value) || 0)
    );

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const pad = (number) =>
        String(number).padStart(2, "0");

    return hours
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`;
};

const getFacebookUrl = (value) => {
    try {
        const url = new URL(String(value || "").trim());

        if (url.protocol !== "https:") return null;

        const host = url.hostname.toLowerCase();

        if (
            host === "facebook.com" ||
            host.endsWith(".facebook.com") ||
            host === "fb.watch"
        ) {
            return url.toString();
        }
    } catch (error) {
        return null;
    }

    return null;
};

const getTimecodeUrl = (videoUrl, seconds) => {
    const url = new URL(videoUrl);

    url.searchParams.set(
        "t",
        String(Math.max(0, Math.floor(Number(seconds) || 0)))
    );

    return url.toString();
};

const getAdditionalContactValue = (additional, key) => {
    const value = additional?.[key];

    if (typeof value === "string") {
        return value.trim();
    }

    if (
        value &&
        typeof value === "object" &&
        value.enabled === true &&
        typeof value.value === "string"
    ) {
        return value.value.trim();
    }

    return "";
};

const getContacts = (listing) => {
    const phoneRows = [];
    const socialLinks = [];

    if (!listing) return { phoneRows, socialLinks };

    const addPhone = (value, service) => {
        const trimmed = String(value || "").trim();
        const normalized = trimmed.replace(/\D/g, "");

        if (!normalized) return;

        const existing = phoneRows.find(
            (row) => row.normalized === normalized
        );

        if (existing) {
            if (!existing.services.includes(service)) {
                existing.services.push(service);
            }
            return;
        }

        phoneRows.push({
            normalized,
            value: trimmed,
            services: [service],
        });
    };

    const addLink = (value, service) => {
        const trimmed = String(value || "").trim();

        if (!trimmed) return;

        if (
            socialLinks.some(
                (link) =>
                    link.service === service &&
                    link.value === trimmed
            )
        ) {
            return;
        }

        socialLinks.push({
            service,
            value: trimmed,
            href: getContactHref(trimmed),
        });
    };

    if (listing.hidePhone !== true) {
        const main =
            listing.contactOriginal ||
            listing.contact ||
            "";

        if (main) {
            const type = detectContactType(main);

            switch (type) {
                case CONTACT_TYPES.PHONE:
                    addPhone(main, "main");
                    break;
                case CONTACT_TYPES.EMAIL:
                    addLink(main, "email");
                    break;
                case CONTACT_TYPES.TELEGRAM:
                    addLink(main, "telegram");
                    break;
                case CONTACT_TYPES.VIBER:
                    addLink(main, "viber");
                    break;
                case CONTACT_TYPES.WHATSAPP:
                    addLink(main, "whatsapp");
                    break;
                case CONTACT_TYPES.INSTAGRAM:
                    addLink(main, "instagram");
                    break;
                case CONTACT_TYPES.FACEBOOK:
                    addLink(main, "facebook");
                    break;
                default:
                    break;
            }
        }

        const second = listing.realEstate?.secondContact;

        if (
            second &&
            detectContactType(second) === CONTACT_TYPES.PHONE
        ) {
            addPhone(second, "secondary");
        }
    }

    const additional = listing.additionalContacts || {};

    const telegram = getAdditionalContactValue(
        additional,
        "telegram"
    );

    if (telegram) {
        if (
            detectContactType(telegram) ===
            CONTACT_TYPES.PHONE
        ) {
            addPhone(telegram, "telegram");
        } else {
            addLink(telegram, "telegram");
        }
    }

    const viber = getAdditionalContactValue(
        additional,
        "viber"
    );

    const whatsapp = getAdditionalContactValue(
        additional,
        "whatsapp"
    );

    if (viber) addPhone(viber, "viber");
    if (whatsapp) addPhone(whatsapp, "whatsapp");

    ["instagram", "facebook", "tiktok"].forEach(
        (service) => {
            const value = getAdditionalContactValue(
                additional,
                service
            );

            if (value) addLink(value, service);
        }
    );

    return { phoneRows, socialLinks };
};

const getServiceIcon = (service) => {
    switch (service) {
        case "telegram":
            return <FaTelegramPlane size={15} />;
        case "viber":
            return <FaViber size={15} />;
        case "whatsapp":
            return <FaWhatsapp size={15} />;
        case "instagram":
            return <Instagram size={15} />;
        case "facebook":
            return <Facebook size={15} />;
        case "tiktok":
            return <FaTiktok size={15} />;
        case "email":
            return <Mail size={15} />;
        default:
            return <Phone size={15} />;
    }
};

const serviceLabels = {
    main: "Телефон",
    secondary: "Додатковий телефон",
    telegram: "Telegram",
    viber: "Viber",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    email: "Email",
};

const serviceStyles = {
    telegram: "border-sky-200 bg-sky-50 text-sky-700",
    viber: "border-violet-200 bg-violet-50 text-violet-700",
    whatsapp: "border-emerald-200 bg-emerald-50 text-emerald-700",
    instagram: "border-pink-200 bg-pink-50 text-pink-700",
    facebook: "border-blue-200 bg-blue-50 text-blue-700",
    tiktok: "border-slate-300 bg-slate-100 text-slate-900",
    email: "border-slate-200 bg-white text-slate-700",
};


function InfoItem({ icon: Icon, label, value }) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    return (
        <div className="flex min-w-0 items-start gap-2.5 border-b border-slate-100 py-2.5">
            <Icon
                size={17}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0 text-blue-500"
            />

            <div className="min-w-0">
                <p className="text-[11px] font-normal text-slate-500">
                    {label}
                </p>

                <p className="mt-0.5 break-words text-sm font-medium text-slate-700">
                    {value}
                </p>
            </div>
        </div>
    );
}



let facebookSdkPromise = null;

const loadFacebookSdk = () => {
    if (
        window.FB?.XFBML?.parse &&
        window.FB?.Event?.subscribe
    ) {
        return Promise.resolve(window.FB);
    }

    if (facebookSdkPromise) {
        return facebookSdkPromise;
    }

    facebookSdkPromise = new Promise((resolve, reject) => {
        let completed = false;

        const finish = (error = null) => {
            if (completed) return;

            if (error) {
                completed = true;
                reject(error);
                return;
            }

            if (
                window.FB?.XFBML?.parse &&
                window.FB?.Event?.subscribe
            ) {
                completed = true;
                resolve(window.FB);
            }
        };

        const previousInit = window.fbAsyncInit;

        window.fbAsyncInit = () => {
            try {
                if (typeof previousInit === "function") {
                    previousInit();
                } else {
                    window.FB.init({
                        xfbml: false,
                        version: "v27.0",
                    });
                }

                finish();
            } catch (error) {
                finish(error);
            }
        };

        const existingScript = document.querySelector(
            'script[src*="connect.facebook.net"][src*="/sdk.js"]'
        );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                () => finish(),
                { once: true }
            );

            existingScript.addEventListener(
                "error",
                () => finish(
                    new Error("Facebook SDK недоступний.")
                ),
                { once: true }
            );

            if (window.FB) {
                finish();
            }

            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://connect.facebook.net/uk_UA/sdk.js";

        script.async = true;
        script.id = "facebook-jssdk";

        script.onload = () => {
            if (
                !window.FB?.XFBML?.parse ||
                !window.FB?.Event?.subscribe
            ) {
                finish(
                    new Error("Facebook SDK не ініціалізовано.")
                );
            } else {
                finish();
            }
        };

        script.onerror = () => {
            finish(
                new Error("Не вдалося завантажити Facebook SDK.")
            );
        };

        document.head.appendChild(script);
    });

    facebookSdkPromise = facebookSdkPromise.catch(
        (error) => {
            facebookSdkPromise = null;
            throw error;
        }
    );

    return facebookSdkPromise;
};


function FacebookVideo({ video, listingId }) {
    const reactId = useId();

    const playerId = `rboard-video-${reactId.replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    )}`;

    const stageRef = useRef(null);
    const playerShellRef = useRef(null);
    const embedRef = useRef(null);
    const playerRef = useRef(null);
    const pendingSeekRef = useRef(null);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [playerWidth, setPlayerWidth] = useState(0);
    const [playerScale, setPlayerScale] = useState(1);
    const [playerStatus, setPlayerStatus] = useState("idle");
    const [activeTimecode, setActiveTimecode] = useState(null);
    const [rotation, setRotation] = useState("none");
    const videoUrl = getFacebookUrl(video?.url);

    const timecodes = Array.isArray(video?.timecodes)
        ? [...video.timecodes]
            .filter(
                (item) =>
                    Number.isFinite(Number(item.seconds)) &&
                    Number(item.seconds) >= 0
            )
            .sort((a, b) => a.seconds - b.seconds)
        : [];


    const rotationDegrees =
        rotation === "left"
            ? -90
            : rotation === "right"
                ? 90
                : 0;

    const isRotated =
        rotation === "left" || rotation === "right";
    // Скидання при переході на інше оголошення
    useEffect(() => {
        setViewerOpen(false);
        setPlayerWidth(0);
        setPlayerScale(1);
        setPlayerStatus("idle");
        setActiveTimecode(null);

        playerRef.current = null;
        pendingSeekRef.current = null;
    }, [listingId, videoUrl]);

    // Закриття переглядача клавішею Escape
    useEffect(() => {
        if (!viewerOpen) return;

        const handleEscape = (event) => {
            if (event.key !== "Escape") return;

            event.preventDefault();
            event.stopImmediatePropagation();

            playerRef.current?.pause?.();
            setViewerOpen(false);
            setPlayerWidth(0);
            setPlayerStatus("idle");
        };

        window.addEventListener(
            "keydown",
            handleEscape,
            true
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleEscape,
                true
            );
        };
    }, [viewerOpen]);

    // Визначаємо ширину Facebook-програвача
    // тільки після відкриття окремого переглядача
    useEffect(() => {
        if (!viewerOpen) return;

        const stage = stageRef.current;

        if (!stage) return;

        const width = Math.max(
            220,
            Math.min(
                760,
                Math.floor(stage.clientWidth - 32)
            )
        );

        setPlayerWidth(width);
        setPlayerScale(1);
    }, [viewerOpen]);

    // Facebook Embedded Video Player API
    useEffect(() => {
        if (
            !viewerOpen ||
            !videoUrl ||
            playerWidth <= 0
        ) {
            return;
        }

        let cancelled = false;
        let fbSdk = null;
        let readyTimeout = null;
        let playSubscription = null;

        playerRef.current = null;
        setPlayerStatus("loading");

        const applyPendingSeek = (player) => {
            const seconds = pendingSeekRef.current;

            if (seconds === null) return;

            try {
                player.seek(seconds);
                pendingSeekRef.current = null;
            } catch (error) {
                console.warn(
                    "Не вдалося перейти до таймкоду:",
                    error
                );
            }
        };

        const handleReady = (message) => {
            if (
                cancelled ||
                message.type !== "video" ||
                (message.id && message.id !== playerId)
            ) {
                return;
            }

            const player = message.instance;

            if (!player) return;

            playerRef.current = player;
            setPlayerStatus("ready");

            if (readyTimeout) {
                clearTimeout(readyTimeout);
            }

            if (typeof player.subscribe === "function") {
                playSubscription = player.subscribe(
                    "startedPlaying",
                    () => {
                        if (!cancelled) {
                            applyPendingSeek(player);
                        }
                    }
                );
            }

            // Можливо, користувач натиснув таймкод
            // ще до завантаження Facebook
            if (pendingSeekRef.current !== null) {
                try {
                    player.seek(pendingSeekRef.current);
                } catch (error) {
                    console.warn(
                        "Очікуємо готовності відео:",
                        error
                    );
                }

                try {
                    player.play();
                } catch (error) {
                    // Браузер може вимагати натискання Play
                }
            }
        };

        loadFacebookSdk()
            .then((fb) => {
                if (cancelled) return;

                fbSdk = fb;

                fb.Event.subscribe(
                    "xfbml.ready",
                    handleReady
                );

                readyTimeout = setTimeout(() => {
                    if (
                        !cancelled &&
                        !playerRef.current
                    ) {
                        setPlayerStatus("error");
                    }
                }, 15000);

                if (embedRef.current) {
                    fb.XFBML.parse(
                        embedRef.current.parentElement
                    );
                }
            })
            .catch((error) => {
                if (cancelled) return;

                console.error(
                    "Помилка Facebook SDK:",
                    error
                );

                setPlayerStatus("error");
            });

        return () => {
            cancelled = true;

            if (readyTimeout) {
                clearTimeout(readyTimeout);
            }

            if (fbSdk?.Event?.unsubscribe) {
                fbSdk.Event.unsubscribe(
                    "xfbml.ready",
                    handleReady
                );
            }

            if (
                typeof playSubscription === "function"
            ) {
                playSubscription();
            } else {
                playSubscription?.release?.();
            }

            playerRef.current = null;
        };
    }, [
        viewerOpen,
        videoUrl,
        playerWidth,
        playerId,
    ]);

    // Пропорційно вписуємо вже створений Facebook
    // iframe в область перегляду, не змінюючи
    // його власні пропорції
    useEffect(() => {
        if (
            !viewerOpen ||
            playerWidth <= 0
        ) {
            return;
        }

        const stage = stageRef.current;
        const shell = playerShellRef.current;

        if (!stage || !shell) return;

        let frame = null;
        let observedIframe = null;

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => measure())
                : null;

        const measure = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }

            frame = requestAnimationFrame(() => {
                const iframe = shell.querySelector("iframe");

                if (
                    iframe &&
                    iframe !== observedIframe
                ) {
                    observedIframe = iframe;
                    resizeObserver?.observe(iframe);
                }

                const contentWidth =
                    iframe?.offsetWidth ||
                    shell.offsetWidth ||
                    playerWidth;

                const contentHeight =
                    iframe?.offsetHeight ||
                    shell.offsetHeight ||
                    1;

                const availableWidth = Math.max(
                    1,
                    stage.clientWidth - 24
                );

                const availableHeight = Math.max(
                    1,
                    stage.clientHeight - 24
                );

                const fittedWidth = isRotated
                    ? contentHeight
                    : contentWidth;

                const fittedHeight = isRotated
                    ? contentWidth
                    : contentHeight;

                const scale = Math.min(
                    1,
                    availableWidth / fittedWidth,
                    availableHeight / fittedHeight
                );

                setPlayerScale((previous) =>
                    Math.abs(previous - scale) > 0.005
                        ? scale
                        : previous
                );
            });
        };

        const mutationObserver = new MutationObserver(
            measure
        );

        mutationObserver.observe(shell, {
            childList: true,
            subtree: true,
        });

        resizeObserver?.observe(stage);
        resizeObserver?.observe(shell);

        window.addEventListener("resize", measure);

        measure();

        return () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }

            mutationObserver.disconnect();
            resizeObserver?.disconnect();

            window.removeEventListener(
                "resize",
                measure
            );
        };
    }, [viewerOpen, playerWidth, isRotated]);

    const closeViewer = () => {
        try {
            playerRef.current?.pause?.();
        } catch (error) {
            console.warn(
                "Не вдалося призупинити відео:",
                error
            );
        }

        setViewerOpen(false);
        setPlayerWidth(0);
        setPlayerScale(1);
        setPlayerStatus("idle");
        setRotation("none");
        setActiveTimecode(null);
        playerRef.current = null;
        pendingSeekRef.current = null;
    };

    const openViewer = () => {
        setViewerOpen(true);
    };

    const handleTimecodeClick = (item) => {
        const seconds = Math.max(
            0,
            Math.floor(Number(item.seconds) || 0)
        );

        setActiveTimecode(seconds);
        pendingSeekRef.current = seconds;

        setRotation(
            item.rotation === "left" ||
                item.rotation === "right"
                ? item.rotation
                : "none"
        );

        // Перше натискання одразу відкриває
        // окремий переглядач
        if (!viewerOpen) {
            setViewerOpen(true);
            return;
        }

        if (playerStatus === "error") {
            window.open(
                getTimecodeUrl(videoUrl, seconds),
                "_blank",
                "noopener,noreferrer"
            );
            return;
        }

        const player = playerRef.current;

        if (!player) return;

        try {
            player.seek(seconds);
            pendingSeekRef.current = null;
        } catch (error) {
            console.warn(
                "Помилка перемотування:",
                error
            );
        }

        try {
            player.play();
        } catch (error) {
            // Може знадобитися ручне натискання Play
        }
    };

    const renderTimecode = (
        item,
        index,
        inViewer = false
    ) => {
        const seconds = Math.floor(
            Number(item.seconds)
        );

        const active = activeTimecode === seconds;

        return (
            <button
                key={`${seconds}-${index}`}
                type="button"
                onClick={() => handleTimecodeClick(item)}
                aria-pressed={active}
                title={
                    item.title ||
                    `Перейти до ${formatTimecode(seconds)}`
                }
                className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${inViewer ? "w-full" : ""
                    } ${active
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                    }`}
            >
                <span
                    className={`shrink-0 rounded-md px-1.5 py-1 text-[11px] font-semibold tabular-nums ${active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                        }`}
                >
                    {formatTimecode(seconds)}
                </span>

                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {item.title || `Фрагмент ${index + 1}`}
                </span>
            </button>
        );
    };

    if (!videoUrl) return null;

    return (
        <section className="mt-5 border-t border-slate-100 pt-5">
            {/* Звичайний вигляд у модалці оголошення */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <PlayCircle
                        size={18}
                        strokeWidth={1.7}
                        className="text-blue-600"
                    />
                    Відеоогляд об'єкта
                </h3>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    Facebook
                </span>
            </div>

            {/* Тільки кнопка, без програвача */}
            <button
                type="button"
                onClick={openViewer}
                className="group mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-200">
                        <PlayCircle size={24} />
                    </span>

                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                            Переглянути відеоогляд
                        </span>

                        <span className="mt-1 block text-[11px] text-slate-500">
                            Відкрити окремий переглядач
                        </span>
                    </span>
                </span>

                <Maximize2
                    size={18}
                    className="shrink-0 text-slate-400 transition group-hover:text-blue-600"
                />
            </button>

            {/* Таймкоди в модалці лише відкривають переглядач */}
            {timecodes.length > 0 && (
                <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Clock3
                            size={15}
                            className="text-blue-600"
                        />

                        <span className="text-xs font-medium text-slate-600">
                            Швидкий перехід
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {timecodes.map((item, index) =>
                            renderTimecode(item, index)
                        )}
                    </div>
                </div>
            )}
            {/* Окремий повноекранний переглядач */}
            {viewerOpen &&
                createPortal(
                    <div
                        data-rboard-video-overlay="true"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Повноекранний відеоогляд"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                        className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col overflow-hidden bg-slate-950 p-3 text-white sm:p-4"
                    >
                        {/* Верхня панель */}
                        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <PlayCircle
                                    size={20}
                                    className="shrink-0 text-blue-400"
                                />

                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-white">
                                        Відеоогляд нерухомості
                                    </h3>

                                    <p className="text-[11px] text-slate-400">
                                        Facebook Video
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeViewer}
                                aria-label="Закрити відео"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ПК: відео ліворуч, таймкоди праворуч */}
                        {/* Мобільний: відео зверху, таймкоди знизу */}
                        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-1">
                            {/* Область відео */}
                            <div
                                ref={stageRef}
                                className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black"
                            >
                                {/* Facebook-програвач створюється тільки тут */}
                                {playerWidth > 0 && (
                                    <div
                                        ref={playerShellRef}
                                        className="shrink-0 transition-transform duration-300 ease-in-out"
                                        style={{
                                            width: playerWidth,
                                            transform: `rotate(${rotationDegrees}deg) scale(${playerScale})`,
                                            transformOrigin: "center center",
                                        }}
                                    >
                                        <div
                                            key={listingId}
                                            ref={embedRef}
                                            id={playerId}
                                            className="fb-video"
                                            data-href={videoUrl}
                                            data-width={playerWidth}
                                            data-show-text="false"
                                            data-allowfullscreen="true"
                                            data-autoplay="false"
                                        />
                                    </div>
                                )}

                                {playerStatus === "error" ? (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 px-5 text-center">
                                        <PlayCircle
                                            size={32}
                                            className="text-slate-400"
                                        />

                                        <p className="text-sm font-medium text-white">
                                            Не вдалося відкрити відео
                                        </p>

                                        <p className="max-w-xs text-xs leading-5 text-slate-400">
                                            Facebook може обмежувати
                                            відтворення на інших сайтах.
                                        </p>

                                        <a
                                            href={videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-900"
                                        >
                                            Відкрити у Facebook
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                ) : playerStatus !== "ready" && (
                                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/90">
                                        <LoaderCircle
                                            size={26}
                                            className="animate-spin text-blue-400"
                                        />

                                        <span className="text-xs text-slate-400">
                                            Завантаження відео...
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Панель таймкодів */}
                            <aside className="flex max-h-[34vh] min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 lg:max-h-none">
                                <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Clock3
                                            size={17}
                                            className="text-blue-600"
                                        />

                                        <h4 className="text-sm font-semibold text-slate-800">
                                            Таймкоди відео
                                        </h4>
                                    </div>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Натисніть, щоб перейти до фрагмента
                                    </p>
                                </div>

                                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                                    {timecodes.length > 0 ? (
                                        timecodes.map((item, index) =>
                                            renderTimecode(
                                                item,
                                                index,
                                                true
                                            )
                                        )
                                    ) : (
                                        <p className="py-4 text-center text-xs text-slate-500">
                                            Таймкоди не додані
                                        </p>
                                    )}
                                </div>

                                <div className="shrink-0 border-t border-slate-100 p-3">
                                    <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                    >
                                        Відкрити у Facebook
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </aside>
                        </div>
                    </div>,
                    document.body
                )}
        </section>
    );
}



function PartnerRelatedListings({
    listing,
    onSelectRelated,
}) {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(false);

    const partnerUid =
        listing?.partnerUid ||
        listing?.author?.uid;

    useEffect(() => {
        if (!partnerUid || !listing?.id) {
            setRelated([]);
            return;
        }

        let active = true;
        setLoading(true);
        setRelated([]);

        const loadRelated = async () => {
            try {
                const snapshot = await getDocs(
                    query(
                        collection(db, "listings"),
                        where("partnerUid", "==", partnerUid),
                        where("partnerType", "==", "real_estate"),
                        where("status", "==", "approved"),
                        where(
                            "expiresAt",
                            ">",
                            Timestamp.now()
                        ),
                        orderBy("expiresAt", "asc"),
                        limit(5)
                    )
                );

                if (!active) return;

                setRelated(
                    snapshot.docs
                        .filter((doc) => doc.id !== listing.id)
                        .map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }))
                        .slice(0, 4)
                );
            } catch (error) {
                if (active) {
                    console.error(
                        "Помилка завантаження схожої нерухомості:",
                        error
                    );
                    setRelated([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadRelated();

        return () => {
            active = false;
        };
    }, [partnerUid, listing?.id]);

    if (!loading && related.length === 0) {
        return null;
    }

    return (
        <section className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-7">
            <h3 className="mb-4 flex items-center gap-2 text-base font-black text-slate-950">
                <House size={19} className="text-blue-600" />
                Інші об'єкти цього партнера
            </h3>

            {loading ? (
                <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                    <LoaderCircle
                        size={18}
                        className="animate-spin"
                    />
                    Завантаження об'єктів...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {related.map((item) => (
                        <RealEstateCard
                            key={item.id}
                            listing={item}
                            onClick={
                                onSelectRelated
                                    ? () => onSelectRelated(item)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function RealEstateDetailsModal({
    listing,
    onClose,
    onSelectRelated,
}) {
    const navigate = useNavigate();
    const modalRef = useRef(null);

    const [currentUser, setCurrentUser] = useState(undefined);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(
            () => setCurrentTime(Date.now()),
            60000
        );

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!listing?.id) return;

        modalRef.current?.scrollTo({
            top: 0,
            behavior: "instant",
        });
    }, [listing?.id]);

    useEffect(() => {
        if (!listing) return;

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";
        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !document.fullscreenElement
            ) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [listing, onClose]);

    useEffect(() => {
        if (!listing?.id) return;

        const registerView = async () => {
            try {
                await registerListingView(listing.id);
            } catch (error) {
                console.error(
                    "Помилка реєстрації перегляду:",
                    error
                );
            }
        };

        registerView();
    }, [listing?.id]);

    if (!listing) return null;

    const realEstate = listing.realEstate || {};
    const isLand = realEstate.propertyType === "land";
    const isCommercial = realEstate.propertyType === "commercial";
    const authorUid =
        listing.author?.uid ||
        listing.partnerUid ||
        null;

    const city =
        typeof listing.city === "string"
            ? listing.city
            : listing.city?.name || "";

    const location =
        [city, listing.street]
            .filter(Boolean)
            .join(", ") ||
        listing.location ||
        "Місце не вказано";

    const currencySymbols = {
        USD: "$",
        EUR: "€",
        UAH: "₴",
    };

    const price =
        realEstate.price !== null &&
            realEstate.price !== undefined &&
            realEstate.price !== "" &&
            Number.isFinite(Number(realEstate.price))
            ? `${formatNumber(realEstate.price)} ${currencySymbols[realEstate.currency] ||
            realEstate.currency ||
            ""
            }`
            : "Ціна не вказана";

    const priceSuffix =
        isLand &&
            realEstate.priceMode === "per_sotka"
            ? " / сотка"
            : "";

    const remainingTime = getRemainingTime(
        listing.expiresAt,
        currentTime
    );

    const { phoneRows, socialLinks } =
        getContacts(listing);

    const video = realEstate.video;

    const handleCopyContact = async (value) => {
        try {
            await navigator.clipboard.writeText(value);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Контакт скопійовано",
                showConfirmButton: false,
                timer: 1600,
            });
        } catch (error) {
            console.error(
                "Помилка копіювання контакту:",
                error
            );
        }
    };

    const handleOpenChat = async () => {
        if (currentUser === undefined) return;

        if (!currentUser) {
            await Swal.fire({
                icon: "info",
                title: "Потрібна авторизація",
                text: "Щоб написати автору, увійдіть у свій обліковий запис RBoard.",
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });
            return;
        }

        if (!authorUid || !listing.id) return;

        if (currentUser.uid === authorUid) {
            await Swal.fire({
                icon: "info",
                title: "Це ваше оголошення",
                text: "Ви не можете написати самому собі.",
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });
            return;
        }

        const params = new URLSearchParams({
            to: authorUid,
            listing: listing.id,
        });

        navigate(`/user/chats?${params.toString()}`);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
            onMouseDown={onClose}
            role="presentation"
        >
            <article
                ref={modalRef}
                className="listing-modal-scroll relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="real-estate-modal-title"
            >
                {/* Кнопка закриття */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити вікно"
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:bg-slate-100 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                >
                    <X size={19} />
                </button>

                {/* Шапка */}
                <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5 pr-14 sm:p-8 sm:pr-20">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                                {listing.type ||
                                    listing.category ||
                                    "Продаж"}
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                                <Handshake size={14} />
                                Партнер
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                <Clock3 size={15} />
                                {formatDate(listing.createdAt)}
                            </span>
                        </div>

                        <h2
                            id="real-estate-modal-title"
                            className="mt-4 break-words text-2xl font-black leading-tight text-slate-950 sm:mt-5 sm:text-3xl"
                        >
                            {listing.title || "Об'єкт нерухомості"}
                        </h2>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 sm:text-sm">
                            <span className="inline-flex items-start gap-1.5">
                                <MapPin
                                    size={17}
                                    className="shrink-0 text-blue-600"
                                />
                                {location}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                                <Eye
                                    size={17}
                                    className="text-blue-600"
                                />
                                Перегляди:{" "}
                                <b className="text-blue-600">
                                    {listing.views ?? 0}
                                </b>
                            </span>

                            {remainingTime && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3
                                        size={17}
                                        className="text-blue-600"
                                    />
                                    Активне ще:{" "}
                                    <b className="text-blue-600">
                                        {remainingTime}
                                    </b>
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Основна частина */}
                <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">

                    {/* Ліва колонка */}
                    <section className="min-w-0">
                        {/* Ціна */}

                        <div className="border-b border-slate-100 pb-4">
                            <p className="text-xs font-medium text-slate-500">
                                Вартість об'єкта
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                    <span className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
                                        {price}
                                    </span>

                                    {priceSuffix && (
                                        <span className="text-xs font-medium text-slate-500">
                                            {priceSuffix}
                                        </span>
                                    )}
                                </div>

                                {realEstate.negotiable === true && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        Можливий торг
                                    </span>
                                )}
                            </div>
                        </div>


                        {/* Характеристики */}

                        {/* Характеристики нерухомості */}
                        <div className="mt-5">
                            <h3 className="mb-2 text-sm font-semibold text-slate-800">
                                Характеристики нерухомості
                            </h3>

                            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                                <InfoItem
                                    icon={
                                        isLand
                                            ? Trees
                                            : isCommercial
                                                ? Building2
                                                : House
                                    }
                                    label="Тип об'єкта"
                                    value={
                                        isLand
                                            ? "Земельна ділянка"
                                            : isCommercial
                                                ? "Комерція"
                                                : "Будинок"
                                    }
                                />

                                {!isLand && hasValue(realEstate.buildingArea) && (
                                    <InfoItem
                                        icon={Ruler}
                                        label={
                                            isCommercial
                                                ? "Площа приміщення"
                                                : "Площа будинку"
                                        }
                                        value={`${formatNumber(realEstate.buildingArea)} м²`}
                                    />
                                )}

                                {hasValue(realEstate.landArea) && (
                                    <InfoItem
                                        icon={Trees}
                                        label="Площа ділянки"
                                        value={`${formatNumber(realEstate.landArea)} сот.`}
                                    />
                                )}

                                {!isLand && hasValue(realEstate.floors) && (
                                    <InfoItem
                                        icon={Layers3}
                                        label="Поверхи"
                                        value={`${formatNumber(realEstate.floors)} пов.`}
                                    />
                                )}
                            </div>
                        </div>


                        {/* Опис, якщо є */}
                        {(listing.comment || listing.description) && (
                            <div className="mt-6">
                                <h3 className="text-base font-black text-slate-950">
                                    Опис об'єкта
                                </h3>

                                <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-700">
                                    {listing.comment || listing.description}
                                </p>
                            </div>
                        )}

                        {/* Та сама галерея, що в стандартній модалці */}
                        <ListingImageGallery
                            images={listing.images || []}
                        />

                        {/* Відеоогляд */}
                        <FacebookVideo
                            video={video}
                            listingId={listing.id}
                        />
                    </section>

                    {/* Права колонка: контакти та чат */}
                    <aside className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <h3 className="text-base font-black text-slate-950">
                            Контактна інформація
                        </h3>

                        <div className="mt-5 space-y-5">
                            <ListingAuthor listing={listing} />

                            {phoneRows.length === 0 &&
                                socialLinks.length === 0 ? (
                                <p className="text-xs font-semibold text-slate-600">
                                    Контакти не вказано
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {phoneRows.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                                Телефон та месенджери
                                            </p>

                                            <div className="space-y-2">
                                                {phoneRows.map((row) => (
                                                    <div
                                                        key={row.normalized}
                                                        className="rounded-xl border border-slate-200 bg-white p-2.5"
                                                    >
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {row.services.map(
                                                                (service) => (
                                                                    <span
                                                                        key={service}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-700"
                                                                    >
                                                                        <span className="text-blue-600">
                                                                            {getServiceIcon(service)}
                                                                        </span>

                                                                        {serviceLabels[service]}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                                                            <span className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">
                                                                {row.value}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopyContact(
                                                                        row.value
                                                                    )
                                                                }
                                                                aria-label="Скопіювати номер"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600 transition hover:bg-blue-50"
                                                            >
                                                                <Copy size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {socialLinks.length > 0 && (
                                        <div className="border-t border-slate-200 pt-3">
                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                                Інші способи зв'язку
                                            </p>

                                            <div className="flex flex-wrap gap-1.5">
                                                {socialLinks.map(
                                                    (contact, index) => {
                                                        const href =
                                                            contact.href ||
                                                            (contact.service === "email"
                                                                ? `mailto:${contact.value}`
                                                                : contact.value.startsWith("http")
                                                                    ? contact.value
                                                                    : null);

                                                        if (!href) return null;

                                                        return (
                                                            <a
                                                                key={`${contact.service}-${index}`}
                                                                href={href}
                                                                target={
                                                                    contact.service === "email"
                                                                        ? undefined
                                                                        : "_blank"
                                                                }
                                                                rel={
                                                                    contact.service === "email"
                                                                        ? undefined
                                                                        : "noopener noreferrer"
                                                                }
                                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition hover:opacity-80 ${serviceStyles[contact.service] ||
                                                                    "border-slate-200 bg-white text-slate-700"
                                                                    }`}
                                                            >
                                                                {getServiceIcon(
                                                                    contact.service
                                                                )}

                                                                {serviceLabels[
                                                                    contact.service
                                                                ] || contact.service}
                                                            </a>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {Array.isArray(listing.additionalLinks) &&
                                listing.additionalLinks.length > 0 && (
                                    <div className="border-t border-slate-200 pt-4">
                                        <ListingAdditionalLinksDisplay
                                            links={listing.additionalLinks}
                                        />
                                    </div>
                                )}

                            {authorUid &&
                                currentUser?.uid !== authorUid && (
                                    <button
                                        type="button"
                                        onClick={handleOpenChat}
                                        disabled={currentUser === undefined}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <MessageCircle size={18} />
                                        Написати автору
                                    </button>
                                )}
                        </div>
                    </aside>
                </div>

                {/* Схожі об'єкти саме цього партнера */}
                <PartnerRelatedListings
                    listing={listing}
                    onSelectRelated={onSelectRelated}
                />
            </article>
        </div>
    );
}
