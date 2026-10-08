
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    collection,
    getCountFromServer,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import {
    FaTelegramPlane,
    FaInstagram,
    FaFacebookF,
} from "react-icons/fa";
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    FileText,
    Users,
    MessageSquare,
    ShieldCheck,
    PlusCircle,
    Newspaper,
    MapPinned,
    BarChart3,
    Loader2,
    ScrollText,
    X,
} from "lucide-react";

import { db } from "../../firebase";
import {
    getSocialStats,
    saveSocialStats,
    getLocalDayKey,
} from "../../utils/socialStats";

const getStartOfToday = () => {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
    );
};

const formatDate = (date) =>
    new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);

const formatWeekday = (date) =>
    new Intl.DateTimeFormat("uk-UA", {
        weekday: "short",
    })
        .format(date)
        .replace(".", "");

const formatTime = (date) =>
    new Intl.DateTimeFormat("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);

const Dashboard = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const [statistics, setStatistics] = useState({
        listings: 0,
        newListings: 0,
        users: 0,
        newUsers: 0,
        telegramUsers: 0,
        newTelegramUsers: 0,
        feedback: 0,
        pendingListings: 0,
    });

    const [statisticsLoading, setStatisticsLoading] = useState(true);
    const [statisticsError, setStatisticsError] = useState(false);

    const [socialStatistics, setSocialStatistics] = useState({
        instagram: { count: 0, todayChange: 0 },
        facebook: { count: 0, todayChange: 0 },
    });

    const [socialLoading, setSocialLoading] = useState(true);
    const [socialModal, setSocialModal] = useState(null);
    const [socialInput, setSocialInput] = useState("");
    const [socialSaving, setSocialSaving] = useState(false);
    const [socialError, setSocialError] = useState("");

    const todayKey = getLocalDayKey(currentDate);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let active = true;

        const loadSocial = async () => {
            try {
                setSocialLoading(true);

                const [instagram, facebook] = await Promise.all([
                    getSocialStats("instagram"),
                    getSocialStats("facebook"),
                ]);

                if (active) {
                    setSocialStatistics({ instagram, facebook });
                }
            } catch (error) {
                console.error(
                    "Помилка завантаження соціальної статистики:",
                    error
                );
            } finally {
                if (active) {
                    setSocialLoading(false);
                }
            }
        };

        loadSocial();

        return () => {
            active = false;
        };
    }, [todayKey]);

    useEffect(() => {
        let active = true;

        const loadStatistics = async () => {
            try {
                setStatisticsLoading(true);
                setStatisticsError(false);

                const startOfToday = Timestamp.fromDate(
                    getStartOfToday()
                );

                const listingsRef = collection(db, "listings");
                const usersRef = collection(db, "users");
                const telegramUsersRef = collection(
                    db,
                    "telegramSubscribers"
                );
                const feedbackRef = collection(db, "feedback");

                const [
                    listingsSnapshot,
                    newListingsSnapshot,
                    telegramUsersSnapshot,
                    newTelegramUsersSnapshot,
                    usersSnapshot,
                    newUsersSnapshot,
                    feedbackSnapshot,
                    pendingSnapshot,
                ] = await Promise.all([
                    getCountFromServer(listingsRef),

                    getCountFromServer(
                        query(
                            listingsRef,
                            where("createdAt", ">=", startOfToday)
                        )
                    ),

                    getCountFromServer(telegramUsersRef),

                    getCountFromServer(
                        query(
                            telegramUsersRef,
                            where("createdAt", ">=", startOfToday)
                        )
                    ),

                    getCountFromServer(usersRef),

                    getCountFromServer(
                        query(
                            usersRef,
                            where("createdAt", ">=", startOfToday)
                        )
                    ),

                    getCountFromServer(
                        query(
                            feedbackRef,
                            where("status", "==", "new")
                        )
                    ),

                    getCountFromServer(
                        query(
                            listingsRef,
                            where("status", "==", "pending")
                        )
                    ),
                ]);

                if (!active) return;

                setStatistics({
                    listings: listingsSnapshot.data().count,
                    newListings: newListingsSnapshot.data().count,
                    users: usersSnapshot.data().count,
                    newUsers: newUsersSnapshot.data().count,
                    telegramUsers: telegramUsersSnapshot.data().count,
                    newTelegramUsers:
                        newTelegramUsersSnapshot.data().count,
                    feedback: feedbackSnapshot.data().count,
                    pendingListings: pendingSnapshot.data().count,
                });
            } catch (error) {
                console.error(
                    "Помилка завантаження статистики:",
                    error
                );

                if (active) {
                    setStatisticsError(true);
                }
            } finally {
                if (active) {
                    setStatisticsLoading(false);
                }
            }
        };

        loadStatistics();

        return () => {
            active = false;
        };
    }, [todayKey]);

    const openSocialModal = (platform) => {
        setSocialModal(platform);
        setSocialInput(
            String(socialStatistics[platform].count)
        );
        setSocialError("");
    };

    const closeSocialModal = () => {
        if (!socialSaving) {
            setSocialModal(null);
            setSocialError("");
        }
    };

    const handleSaveSocial = async (event) => {
        event.preventDefault();

        if (!socialModal) return;

        const raw = socialInput.trim();
        const value = Number(raw);

        if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value)) {
            setSocialError("Введи ціле невід’ємне число");
            return;
        }

        setSocialSaving(true);
        setSocialError("");

        try {
            await saveSocialStats(socialModal, value);

            const updated = await getSocialStats(socialModal);

            setSocialStatistics((previous) => ({
                ...previous,
                [socialModal]: updated,
            }));

            setSocialModal(null);
        } catch (error) {
            console.error(
                "Помилка збереження соціальної статистики:",
                error
            );

            setSocialError("Не вдалося зберегти значення");
        } finally {
            setSocialSaving(false);
        }
    };

    const navigationItems = [
        {
            title: "Оголошення",
            description:
                "Перегляд, модерація та керування оголошеннями сервісу.",
            path: "/dashboard/listings",
            icon: FileText,
        },
        {
            title: "Користувачі",
            description:
                "Перегляд користувачів, блокування та керування профілями.",
            path: "/dashboard/users",
            icon: Users,
        },
        {
            title: "Зв’язок",
            description:
                "Повідомлення, пропозиції та звернення від користувачів.",
            path: "/dashboard/contacts",
            icon: MessageSquare,
        },
        {
            title: "Створити оголошення",
            description:
                "Швидке створення нового оголошення від адміністратора.",
            path: "/dashboard/create-listing",
            icon: PlusCircle,
        },
        {
            title: "Новини",
            description:
                "Створення та керування новинами сервісу.",
            path: "/dashboard/news",
            icon: Newspaper,
        },
        {
            title: "Туристичні місця",
            description:
                "Керування туристичними місцями та цікавими локаціями.",
            path: "/dashboard/tourist-places",
            icon: MapPinned,
        },
        {
            title: "Статистика",
            description:
                "Детальні показники використання та активності RBoard.",
            path: "/dashboard/statistics",
            icon: BarChart3,
        },
        {
            title: "Логи системи",
            description:
                "Показ дій адміністраторів у системі RBoard.",
            path: "/dashboard/logs",
            icon: ScrollText,
        },
    ];

    const socialItems = [
        {
            key: "instagram",
            title: "Instagram",
            Icon: FaInstagram,
            color: "text-pink-600",
            background: "bg-pink-50",
        },
        {
            key: "facebook",
            title: "Facebook",
            Icon: FaFacebookF,
            color: "text-blue-600",
            background: "bg-blue-50",
        },
    ];

    const changeBadge = (value) => (
        <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${value >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
        >
            {value > 0 ? "+" : ""}
            {value}
        </span>
    );

    return (
        <section className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600">
                            <ShieldCheck size={18} />
                            Панель керування
                        </div>

                        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Вітаємо в адміністративній панелі
                        </h1>

                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                            Керуйте оголошеннями, користувачами та іншими
                            розділами сервісу RBoard.
                        </p>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:min-w-[285px]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                <CalendarDays size={21} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Сьогодні
                                </p>

                                <p className="mt-0.5 text-lg font-black text-slate-950">
                                    {formatDate(currentDate)}

                                    <span className="ml-2 uppercase text-blue-600">
                                        {formatWeekday(currentDate)}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="my-4 h-px bg-blue-100" />

                        <div className="flex items-center gap-3">
                            <Clock3
                                size={20}
                                className="text-blue-600"
                            />

                            <span className="font-mono text-2xl font-black tracking-tight text-slate-950">
                                {formatTime(currentDate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>


            <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Коротка статистика
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Поточний стан сервісу RBoard.
                        </p>
                    </div>

                    {(statisticsLoading || socialLoading) && (
                        <Loader2
                            size={20}
                            className="animate-spin text-blue-600"
                        />
                    )}
                </div>

                {statisticsError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                        Не вдалося завантажити статистику.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" />
                                <h3 className="text-sm font-bold text-slate-800">
                                    Активність платформи
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    {
                                        key: "listings",
                                        title: "Оголошення",
                                        count: statistics.listings,
                                        Icon: FileText,
                                        color: "text-blue-600",
                                        background: "bg-blue-50",
                                        to: "/dashboard/listings",
                                        change: statistics.newListings,
                                    },
                                    {
                                        key: "pending",
                                        title: "На модерації",
                                        count: statistics.pendingListings,
                                        Icon: ShieldCheck,
                                        color: "text-amber-600",
                                        background: "bg-amber-50",
                                        to: "/dashboard/listings",
                                    },
                                    {
                                        key: "feedback",
                                        title: "Нові звернення",
                                        count: statistics.feedback,
                                        Icon: MessageSquare,
                                        color: "text-violet-600",
                                        background: "bg-violet-50",
                                        to: "/dashboard/contacts",
                                    },
                                ].map((item) => (
                                    <NavLink
                                        key={item.key}
                                        to={item.to}
                                        className="group flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-semibold text-slate-500">
                                                {item.title}
                                            </span>

                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.background} ${item.color}`}
                                            >
                                                <item.Icon size={18} />
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <p className="break-words text-3xl font-black tracking-tight text-slate-950 tabular-nums">
                                                {statisticsLoading
                                                    ? "—"
                                                    : new Intl.NumberFormat("uk-UA").format(
                                                        item.count
                                                    )}
                                            </p>

                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                {item.change !== undefined ? (
                                                    <div className="flex items-center gap-2">
                                                        {changeBadge(item.change)}
                                                        <span className="text-xs text-slate-400">
                                                            сьогодні
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Переглянути
                                                    </span>
                                                )}

                                                <ArrowRight
                                                    size={15}
                                                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                                                />
                                            </div>
                                        </div>
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-blue-600" />
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Аудиторія RBoard
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        {
                                            key: "site",
                                            title: "Користувачі сайту",
                                            count: statistics.users,
                                            change: statistics.newUsers,
                                            Icon: Users,
                                            color: "text-blue-600",
                                            background: "bg-blue-50",
                                        },
                                        {
                                            key: "telegram",
                                            title: "Telegram-бот",
                                            count: statistics.telegramUsers,
                                            change: statistics.newTelegramUsers,
                                            Icon: FaTelegramPlane,
                                            color: "text-sky-500",
                                            background: "bg-sky-50",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.background} ${item.color}`}
                                                >
                                                    <item.Icon size={16} />
                                                </div>

                                                <span className="min-w-0 text-xs font-semibold text-slate-500">
                                                    {item.title}
                                                </span>
                                            </div>

                                            <p className="mt-4 break-words text-[clamp(1.25rem,2vw,1.875rem)] font-black tracking-tight text-slate-950 tabular-nums">
                                                {statisticsLoading
                                                    ? "—"
                                                    : new Intl.NumberFormat("uk-UA").format(
                                                        item.count
                                                    )}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                {changeBadge(item.change)}
                                                <span className="text-xs text-slate-400">
                                                    сьогодні
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <FaInstagram
                                            size={17}
                                            className="text-pink-600"
                                        />
                                        <h3 className="text-sm font-bold text-slate-800">
                                            Соціальні мережі
                                        </h3>
                                    </div>

                                    <span className="text-[11px] text-slate-400">
                                        Ручне оновлення
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {socialItems.map((item) => {
                                        const data = socialStatistics[item.key];

                                        return (
                                            <div
                                                key={item.key}
                                                className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="min-w-0 truncate text-xs font-semibold text-slate-500">
                                                        {item.title}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onDoubleClick={() =>
                                                            openSocialModal(item.key)
                                                        }
                                                        title={`Подвійний клік — редагувати ${item.title}`}
                                                        aria-label={`Редагувати ${item.title}`}
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.background} ${item.color} transition hover:scale-110`}
                                                    >
                                                        <item.Icon size={16} />
                                                    </button>
                                                </div>

                                                <p className="mt-4 break-words text-[clamp(1.25rem,2vw,1.875rem)] font-black tracking-tight text-slate-950 tabular-nums">
                                                    {socialLoading
                                                        ? "—"
                                                        : new Intl.NumberFormat(
                                                            "uk-UA"
                                                        ).format(data.count)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    {changeBadge(data.todayChange)}
                                                    <span className="text-xs text-slate-400">
                                                        сьогодні
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <div className="mb-5">
                    <h2 className="text-xl font-black text-slate-950">
                        Керування сервісом
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Швидкий перехід до основних розділів
                        адміністративної панелі.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {navigationItems.map(
                        ({
                            title,
                            description,
                            path,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                                        <Icon size={21} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="font-bold text-slate-950">
                                                {title}
                                            </h3>

                                            <ArrowRight
                                                size={17}
                                                className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                                            />
                                        </div>

                                        <p className="mt-1.5 text-sm leading-6 text-slate-500">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </NavLink>
                        )
                    )}
                </div>
            </div>

            {socialModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeSocialModal();
                        }
                    }}
                >
                    <form
                        onSubmit={handleSaveSocial}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="social-modal-title"
                        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${socialModal === "instagram"
                                            ? "bg-pink-50 text-pink-600"
                                            : "bg-blue-50 text-blue-600"
                                        }`}
                                >
                                    {socialModal === "instagram" ? (
                                        <FaInstagram size={23} />
                                    ) : (
                                        <FaFacebookF size={21} />
                                    )}
                                </div>

                                <div>
                                    <h2
                                        id="social-modal-title"
                                        className="text-lg font-black text-slate-950"
                                    >
                                        Оновити підписників
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {socialModal === "instagram"
                                            ? "Instagram"
                                            : "Facebook"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeSocialModal}
                                disabled={socialSaving}
                                aria-label="Закрити"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-500">
                                Зараз підписників
                            </p>

                            <p className="mt-1 text-2xl font-black text-slate-950">
                                {socialStatistics[socialModal].count}
                            </p>
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="social-count"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Нова кількість підписників
                            </label>

                            <input
                                id="social-count"
                                type="number"
                                min="0"
                                step="1"
                                required
                                autoFocus
                                value={socialInput}
                                onChange={(event) =>
                                    setSocialInput(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        {socialError && (
                            <p className="mt-3 text-sm font-medium text-red-600">
                                {socialError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={socialSaving}
                                onClick={closeSocialModal}
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Скасувати
                            </button>

                            <button
                                type="submit"
                                disabled={socialSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                            >
                                {socialSaving && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {socialSaving
                                    ? "Збереження..."
                                    : "Зберегти"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
};

export default Dashboard;
