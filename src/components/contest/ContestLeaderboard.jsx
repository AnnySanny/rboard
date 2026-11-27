import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocsFromServer,
    documentId,
    Timestamp,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import {
    Trophy,
    Users,
    UserRound,
    RefreshCw,
    LoaderCircle,
    ChevronDown,
    AlertCircle,
    Medal,
    Clock3,
    ChevronRight,
    Trash2,
} from "lucide-react";

import { auth, db } from "../../firebase";
import Swal from "sweetalert2";

import {
    CONTEST_ID,
    useContest,
} from "../../context/ContestContext";

const PAGE_SIZE = 20;
const CACHE_DURATION = 5 * 60 * 1000;
const REFRESH_DELAY = 60 * 1000;

const CACHE_KEY = `rboard_leaderboard_${CONTEST_ID}_v1`;
const REFRESH_KEY = `${CACHE_KEY}_refresh`;

const restoreParticipant = (participant) => ({
    ...participant,

    lastFoundAt: participant.lastFoundAt
        ? new Timestamp(
            participant.lastFoundAt.seconds,
            participant.lastFoundAt.nanoseconds
        )
        : null,
});

const readLeaderboardCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);

        if (!raw) return null;

        const cache = JSON.parse(raw);

        if (
            !Array.isArray(cache.participants) ||
            !Number.isFinite(cache.updatedAt) ||
            cache.updatedAt > Date.now()
        ) {
            return null;
        }

        return {
            ...cache,

            participants: cache.participants.map(
                restoreParticipant
            ),

            lastDocument: cache.lastDocument
                ? restoreParticipant(cache.lastDocument)
                : null,
        };

    } catch {
        return null;
    }
};

const saveLeaderboardCache = (cache) => {
    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(cache)
        );
    } catch (error) {
        console.warn(
            "Не вдалося зберегти кеш рейтингу:",
            error
        );
    }
};

const readLastRefresh = () => {
    try {
        const value = Number(
            localStorage.getItem(REFRESH_KEY) || 0
        );

        return Number.isFinite(value) &&
            value <= Date.now()
            ? value
            : 0;

    } catch {
        return 0;
    }
};

const saveLastRefresh = (timestamp) => {
    try {
        localStorage.setItem(
            REFRESH_KEY,
            String(timestamp)
        );
    } catch {
        // Обмеження продовжить працювати в межах компонента.
    }
};
const prizes = [
    {
        rank: 1,
        title: "1000 грн",
        description: "1 місце",
        cardClass: "border-amber-200 bg-amber-50",
        iconClass: "bg-amber-100 text-amber-600",
        textClass: "text-amber-700",
    },
    {
        rank: 2,
        title: "Скидка на хімчистку автомобіля",
        description: "2 місце",
        cardClass: "border-slate-300 bg-slate-100",
        iconClass: "bg-slate-200 text-slate-600",
        textClass: "text-slate-700",
    },
    {
        rank: 3,
        title: "Подарункова торба продуктів",
        description: "3 місце",
        cardClass: "border-orange-200 bg-orange-50",
        iconClass: "bg-orange-100 text-orange-600",
        textClass: "text-orange-700",
    },
];

const getRankClass = (rank) => {
    switch (rank) {
        case 1:
            return "bg-amber-100 text-amber-700";

        case 2:
            return "bg-slate-200 text-slate-600";

        case 3:
            return "bg-orange-100 text-orange-700";

        default:
            return "bg-slate-100 text-slate-500";
    }
};

const getRankRowClass = (rank) => {
    switch (rank) {
        case 1:
            return "bg-amber-50/80 hover:bg-amber-100/70";

        case 2:
            return "bg-slate-100/80 hover:bg-slate-200/70";

        case 3:
            return "bg-orange-50/80 hover:bg-orange-100/70";

        default:
            return "bg-white hover:bg-slate-50";
    }
};

const getProgressClass = (rank) => {
    switch (rank) {
        case 1:
            return "bg-amber-500";

        case 2:
            return "bg-slate-400";

        case 3:
            return "bg-orange-500";

        default:
            return "bg-[#2861ed]";
    }
};

const lastFoundFormatter = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

const formatLastFound = (value) => {
    if (!value?.toDate) return "—";

    return lastFoundFormatter.format(value.toDate());
};

const ContestLeaderboard = ({ adminView = false }) => {
    const {
        contest,
        isContestEnabled,
        isSynced,
        leaderboardRevision,
    } = useContest();

    const canView = adminView
        ? isSynced && Boolean(contest)
        : isContestEnabled;

    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDocument, setLastDocument] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState("");
    const [deletingUid, setDeletingUid] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(0);

    const [nextRefreshAt, setNextRefreshAt] = useState(
        () => adminView
            ? 0
            : readLastRefresh() + REFRESH_DELAY
    );

    const requestId = useRef(0);
    const cacheRef = useRef(null);

    const totalBoots = contest?.totalBoots || 0;

    const refreshBlocked = nextRefreshAt > Date.now();

    const applyCache = useCallback((cache) => {
        cacheRef.current = cache;

        setParticipants(cache.participants);
        setLastDocument(cache.lastDocument);
        setHasMore(cache.hasMore);
        setUpdatedAt(cache.updatedAt);
    }, []);

    const loadLeaderboard = useCallback(async (cursor = null) => {
        if (!canView) return;

        const currentRequest = ++requestId.current;

        if (cursor) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setLoadingMore(false);

            const now = Date.now();
            if (!adminView) {
                saveLastRefresh(now);
            }

            setNextRefreshAt(now + REFRESH_DELAY);
        }

        setError("");

        try {
            const leaderboardRef = collection(
                db,
                "contests",
                CONTEST_ID,
                "leaderboard"
            );

            const constraints = [
                orderBy("foundCount", "desc"),
                orderBy("lastFoundAt", "asc"),
                orderBy(documentId(), "asc"),
            ];

            if (cursor) {
                constraints.push(
                    startAfter(
                        cursor.foundCount,
                        cursor.lastFoundAt,
                        cursor.uid
                    )
                );
            }

            constraints.push(limit(PAGE_SIZE));

            const leaderboardQuery = query(
                leaderboardRef,
                ...constraints
            );

            const snapshot = await getDocsFromServer(
                leaderboardQuery
            );

            if (currentRequest !== requestId.current) {
                return;
            }

            const items = snapshot.docs.map((document) => {
                const data = document.data();

                return {
                    uid: document.id,
                    login: data.login || "",
                    avatarUrl: data.avatarUrl || "",
                    foundCount: data.foundCount || 0,
                    lastFoundAt: data.lastFoundAt || null,
                };
            });

            let nextParticipants = items;

            if (cursor) {
                const previous =
                    cacheRef.current?.participants || [];

                const existingIds = new Set(
                    previous.map((item) => item.uid)
                );

                nextParticipants = [
                    ...previous,

                    ...items.filter(
                        (item) => !existingIds.has(item.uid)
                    ),
                ];
            }

            const cache = {
                participants: nextParticipants,
                revision: leaderboardRevision,
                lastDocument:
                    items[items.length - 1] ||
                    cursor ||
                    null,

                hasMore: snapshot.size === PAGE_SIZE,

                updatedAt: cursor
                    ? cacheRef.current?.updatedAt || Date.now()
                    : Date.now(),
            };

            applyCache(cache);

            if (!adminView) {
                saveLeaderboardCache(cache);
            }

        } catch (error) {
            if (currentRequest !== requestId.current) {
                return;
            }

            console.error(
                "Помилка завантаження лідерборду:",
                error
            );

            setError(
                "Не вдалося завантажити рейтинг учасників."
            );

        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
                setLoadingMore(false);
            }
        }

    }, [
        canView,
        adminView,
        leaderboardRevision,
        applyCache,
    ]);

    useEffect(() => {
        if (!canView) return;

        const cache = adminView
            ? null
            : readLeaderboardCache();

        const validCache =
            cache &&
            cache.revision === leaderboardRevision;

        if (validCache) {
            applyCache(cache);
        } else {
            cacheRef.current = null;

            setParticipants([]);
            setLastDocument(null);
            setHasMore(false);
            setUpdatedAt(0);

            if (!adminView) {
                try {
                    localStorage.removeItem(CACHE_KEY);
                } catch {
                    // Кеш недоступний.
                }
            }
        }

        if (
            validCache &&
            Date.now() - cache.updatedAt < CACHE_DURATION
        ) {
            setLoading(false);
            setLoadingMore(false);
            setError("");
        } else {
            loadLeaderboard();
        }

        return () => {
            requestId.current += 1;
        };

    }, [
        canView,
        adminView,
        leaderboardRevision,
        applyCache,
        loadLeaderboard,
    ]);

    useEffect(() => {
        if (!nextRefreshAt) return;

        const remaining = nextRefreshAt - Date.now();

        if (remaining <= 0) {
            setNextRefreshAt(0);
            return;
        }

        const timeout = setTimeout(() => {
            setNextRefreshAt(0);
        }, remaining);

        return () => clearTimeout(timeout);

    }, [nextRefreshAt]);

    const handleRefresh = () => {
        if (loading || loadingMore || deletingUid) return;

        const availableAt = adminView
            ? nextRefreshAt
            : Math.max(
                nextRefreshAt,
                readLastRefresh() + REFRESH_DELAY
            );

        if (Date.now() < availableAt) {
            setNextRefreshAt(availableAt);
            return;
        }

        loadLeaderboard();
    };

    const handleDeleteParticipant = async (participant) => {
        if (
            !adminView ||
            deletingUid ||
            loading ||
            loadingMore
        ) {
            return;
        }

        setDeletingUid(participant.uid);

        try {
            const result = await Swal.fire({
                icon: "warning",

                title: "Видалити учасника?",

                text: `Усі знайдені чобітки користувача ${participant.login || "Учасник RBoard"
                    } будуть обнулені. Користувач зможе повторно взяти участь у конкурсі.`,

                showCancelButton: true,

                confirmButtonText: "Видалити",
                cancelButtonText: "Скасувати",

                confirmButtonColor: "#dc2626",
            });

            if (!result.isConfirmed) return;

            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error(
                    "Необхідно повторно авторизуватися."
                );
            }

            const token = await currentUser.getIdToken();

            const response = await fetch(
                "/.netlify/functions/contest-reset-participant",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        uid: participant.uid,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Не вдалося видалити учасника."
                );
            }

            if (!data.reset) {
                loadLeaderboard();
            }

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Результати учасника обнулено",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

        } catch (error) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Не вдалося видалити учасника",
                text: error.message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
            });
        } finally {
            setDeletingUid(null);
        }
    };
    const handleLoadMore = () => {
        if (
            loading ||
            loadingMore ||
            !hasMore ||
            deletingUid ||
            !lastDocument
        ) {
            return;
        }

        loadLeaderboard(lastDocument);
    };

    if (!canView) return null;

    return (
        <section
            className={adminView
                ? "min-w-0"
                : "border-y border-slate-200 bg-white"}
        >

            <div
                className={adminView
                    ? "w-full min-w-0"
                    : "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20"}
            >

                {!adminView && (
                    <>
                        {/* Заголовок */}

                        <div className="text-center">

                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-16 sm:w-16">
                                <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
                            </div>

                            <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-blue-600 sm:mt-5 sm:text-sm">
                                Результати конкурсу
                            </span>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                Таблиця лідерів
                            </h2>

                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:mt-4 sm:text-lg sm:leading-7">
                                Слідкуйте за результатами учасників
                                та їхніми успіхами у пошуку
                                святкових чобітків.
                            </p>

                        </div>
                        {/* Призи конкурсу */}

                        <div className="mx-auto mt-5 max-w-4xl sm:mt-8">

                            <h3 className="mb-3 text-center text-lg font-black tracking-tight text-slate-950 sm:mb-4 sm:text-2xl">
                                Призи конкурсу
                            </h3>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">

                                {prizes.map((prize) => (
                                    <div
                                        key={prize.rank}
                                        className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition-shadow hover:shadow-sm sm:gap-4 sm:rounded-2xl sm:p-4 ${prize.cardClass}`}
                                    >

                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${prize.iconClass}`}
                                        >
                                            <Medal
                                                className="h-6 w-6 sm:h-7 sm:w-7"
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <h4
                                                className={`text-sm font-black sm:text-base ${prize.textClass}`}
                                            >
                                                {prize.title}
                                            </h4>

                                            <p className="mt-0.5 break-words text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                                                {prize.description}
                                            </p>

                                        </div>

                                    </div>
                                ))}

                            </div>

                            <p className="mx-auto mt-3 max-w-2xl text-center text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                                Призові місця визначаються після завершення
                                конкурсу та перевірки виконання всіх умов участі.
                            </p>

                        </div>
                    </>
                )}

                {/* Таблиця */}

                <div
                    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${adminView
                        ? "w-full"
                        : "mx-auto mt-8 max-w-4xl sm:mt-12 sm:rounded-3xl"
                        }`}
                >

                    {/* Шапка таблиці */}

                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-7">

                        <div className="flex items-center gap-3">

                            <Trophy className="h-5 w-5 shrink-0 text-blue-600" />

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                                    {adminView
                                        ? "Учасники конкурсу"
                                        : "Рейтинг учасників"}
                                </h3>

                                <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                                    {updatedAt
                                        ? `Оновлено: ${formatLastFound(
                                            Timestamp.fromMillis(updatedAt)
                                        )}`
                                        : "Знайдені чобітки"}
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading || loadingMore || refreshBlocked}
                            title={
                                refreshBlocked
                                    ? "Рейтинг можна оновлювати раз на хвилину"
                                    : "Оновити рейтинг"
                            }
                            aria-label="Оновити рейтинг"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""
                                    }`}
                            />
                        </button>

                    </div>

                    {/* Завантаження */}

                    {loading ? (

                        <div className="flex flex-col items-center justify-center gap-3 px-4 py-14">

                            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />

                            <p className="text-sm text-slate-500">
                                Завантаження рейтингу...
                            </p>

                        </div>

                    ) : error && !participants.length ? (

                        <div className="px-4 py-14 text-center">

                            <AlertCircle className="mx-auto h-9 w-9 text-red-400" />

                            <p className="mt-3 text-sm font-medium text-slate-600">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={loading || loadingMore || refreshBlocked}
                                className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {refreshBlocked
                                    ? "Повторіть спробу за хвилину"
                                    : "Спробувати ще раз"}
                            </button>

                        </div>

                    ) : !participants.length ? (

                        <div className="px-5 py-12 text-center sm:py-16">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 sm:h-16 sm:w-16">
                                <Users className="h-7 w-7 sm:h-8 sm:w-8" />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                                Поки немає учасників
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Знайдіть свій перший чобіток
                                та станьте учасником рейтингу!
                            </p>

                        </div>

                    ) : (

                        <div className="divide-y divide-slate-200/70">

                            {participants.map((participant, index) => {
                                const rank = index + 1;

                                const foundCount =
                                    participant.foundCount || 0;

                                const progress = totalBoots > 0
                                    ? Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            (foundCount / totalBoots) * 100
                                        )
                                    )
                                    : 0;

                                return (
                                    <div
                                        key={participant.uid}
                                        className={`flex min-w-0 items-center transition-colors ${getRankRowClass(rank)}`}
                                    >

                                        <Link
                                            to={`/user/${participant.uid}`}
                                            title="Переглянути профіль учасника"
                                            className="group flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3.5 sm:gap-5 sm:px-7 sm:py-5"
                                        >

                                            {/* Місце */}

                                            <div
                                                className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-black sm:h-12 sm:w-12 sm:rounded-xl sm:text-base ${getRankClass(rank)}`}
                                            >

                                                {rank <= 3 ? (
                                                    <>
                                                        <Medal className="h-4 w-4 sm:h-6 sm:w-6" />

                                                        <span className="text-[10px] leading-none sm:text-xs">
                                                            {rank}
                                                        </span>
                                                    </>
                                                ) : (
                                                    rank
                                                )}

                                            </div>

                                            {/* Аватар */}

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white sm:h-12 sm:w-12">

                                                {participant.avatarUrl ? (
                                                    <img
                                                        src={participant.avatarUrl}
                                                        alt=""
                                                        loading="lazy"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserRound className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
                                                )}

                                            </div>

                                            {/* Ім'я, дата та прогрес */}

                                            <div className="min-w-0 flex-1">

                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                                                    <p className="min-w-0 truncate text-sm font-bold text-slate-900 transition group-hover:text-blue-600 sm:text-base">
                                                        {participant.login || "Учасник RBoard"}
                                                    </p>

                                                    {rank <= 3 && (
                                                        <span
                                                            className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold sm:inline-flex sm:text-xs ${getRankClass(rank)}`}
                                                        >
                                                            {rank} місце
                                                        </span>
                                                    )}

                                                </div>

                                                <div
                                                    title="Дата і час останньої знахідки за Києвом"
                                                    className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500 sm:gap-1.5 sm:text-xs"
                                                >

                                                    <Clock3 className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />

                                                    <span className="hidden sm:inline">
                                                        Остання знахідка:
                                                    </span>

                                                    <span className="tabular-nums">
                                                        {formatLastFound(participant.lastFoundAt)}
                                                    </span>

                                                </div>

                                                <div
                                                    className="mt-2 h-1.5 max-w-[240px] overflow-hidden rounded-full bg-slate-200/70 sm:h-2"
                                                    role="progressbar"
                                                    aria-label="Прогрес пошуку"
                                                    aria-valuenow={Math.round(progress)}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >

                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${getProgressClass(rank)}`}
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                            {/* Кількість знахідок */}

                                            <div className="shrink-0 text-right">

                                                <div className="flex items-baseline justify-end gap-0.5">

                                                    <span className="text-lg font-black tabular-nums text-blue-600 sm:text-2xl">
                                                        {foundCount}
                                                    </span>

                                                    <span className="text-[10px] font-semibold text-slate-400 sm:text-sm">
                                                        /{totalBoots}
                                                    </span>

                                                </div>

                                                <p className="text-[10px] text-slate-500 sm:text-xs">
                                                    знайдено
                                                </p>

                                            </div>

                                            {/* Перехід до профілю */}
                                            {!adminView && (
                                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600 sm:h-5 sm:w-5" />
                                            )}

                                        </Link>

                                        {adminView && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteParticipant(participant)}
                                                disabled={Boolean(deletingUid) || loading || loadingMore}
                                                title="Видалити учасника конкурсу"
                                                aria-label={`Видалити учасника ${participant.login || ""}`}
                                                className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:mr-5 sm:h-10 sm:w-10"
                                            >

                                                {deletingUid === participant.uid ? (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                )}

                                            </button>
                                        )}

                                    </div>
                                );
                            })}

                        </div>

                    )}

                    {/* Помилка завантаження наступної сторінки */}

                    {error && participants.length > 0 && (
                        <p className="border-t border-slate-100 px-4 py-3 text-center text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {/* Завантажити більше */}

                    {!loading && hasMore && (

                        <div className="border-t border-slate-200 px-4 py-4 text-center sm:py-5">

                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                            >

                                {loadingMore ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}

                                {loadingMore
                                    ? "Завантаження..."
                                    : "Показати більше"}

                            </button>

                        </div>

                    )}

                </div>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400 sm:text-sm">
                    За однакової кількості знахідок вище місце
                    посідає учасник, який раніше досяг
                    відповідного результату.
                </p>

            </div>

        </section>
    );
};


export default ContestLeaderboard;