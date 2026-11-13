
import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Activity,
    AlertCircle,
    Eye,
    Loader2,
    RefreshCw,
    Users,
} from "lucide-react";

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { auth } from "../../firebase";

const CACHE_DURATION = 10 * 60 * 1000;

const analyticsCache = new Map();
const pendingRequest = new Map();

const getCachedData = (days) => {
    const uid = auth.currentUser?.uid;

    if (!uid) return null;

    const cached = analyticsCache.get(`${uid}:${days}`);

    if (
        cached &&
        Date.now() - cached.savedAt < CACHE_DURATION
    ) {
        return cached;
    }

    return null;
};

const requestAnalytics = async (days, force = false) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Потрібна авторизація адміністратора.");
    }

    const key = `${user.uid}:${days}`;

    if (!force) {
        const cached = getCachedData(days);

        if (cached) {
            return cached.data;
        }
    }

    if (pendingRequest.has(key)) {
        return pendingRequest.get(key);
    }

    const promise = (async () => {
        const token = await user.getIdToken();

        const response = await fetch(
            `/.netlify/functions/google-analytics?days=${days}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                result?.error ||
                `Помилка сервера: ${response.status}`
            );
        }

        if (!result?.success) {
            throw new Error("Некоректна відповідь сервера.");
        }

        analyticsCache.set(key, {
            data: result,
            savedAt: Date.now(),
        });

        return result;
    })();

    pendingRequest.set(key, promise);

    try {
        return await promise;
    } finally {
        if (pendingRequest.get(key) === promise) {
            pendingRequest.delete(key);
        }
    }
};

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("uk-UA");

const formatDay = (value) => {
    if (!value || value.length !== 8) return value;

    return `${value.slice(6, 8)}.${value.slice(4, 6)}`;
};

const formatDuration = (value) => {
    const seconds = Math.max(0, Math.round(Number(value) || 0));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

const GoogleAnalyticsStats = () => {
    const [days, setDays] = useState(7);

    const [data, setData] = useState(
        () => getCachedData(7)?.data || null
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [updatedAt, setUpdatedAt] = useState(
        () => getCachedData(7)?.savedAt || null
    );

    const requestIdRef = useRef(0);

    const loadData = useCallback(async (force = false) => {
        const requestId = ++requestIdRef.current;
        const uid = auth.currentUser?.uid;

        setLoading(true);
        setError("");

        if (!force) {
            const cached = getCachedData(days);

            if (cached) {
                setData(cached.data);
                setUpdatedAt(cached.savedAt);
                setLoading(false);
                return;
            }

            setData(null);
            setUpdatedAt(null);
        }

        try {
            const result = await requestAnalytics(days, force);

            if (
                requestId !== requestIdRef.current ||
                uid !== auth.currentUser?.uid
            ) {
                return;
            }

            setData(result);

            const cached = getCachedData(days);
            setUpdatedAt(cached?.savedAt || Date.now());
        } catch (err) {
            if (requestId !== requestIdRef.current) return;

            console.error("Помилка Google Analytics:", err);

            setError(
                err.message || "Не вдалося завантажити аналітику."
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [days]);

    useEffect(() => {
        loadData();

        return () => {
            requestIdRef.current += 1;
        };
    }, [loadData]);

    const visibleData = data?.period === days ? data : null;

    const cards = visibleData
        ? [
            {
                title: "Активні користувачі",
                value: visibleData.activeUsers,
                Icon: Users,
                background: "bg-blue-50",
                color: "text-blue-600",
            },
            {
                title: "Сеанси",
                value: visibleData.sessions,
                Icon: Activity,
                background: "bg-emerald-50",
                color: "text-emerald-600",
            },
            {
                title: "Перегляди сторінок",
                value: visibleData.views,
                Icon: Eye,
                background: "bg-violet-50",
                color: "text-violet-600",
            },
        ]
        : [];

    return (
        <div className="mt-5 space-y-5">
            {/* ЗАГОЛОВОК ТА ПЕРІОД */}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-900">
                        Аналітика відвідуваності
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Google Analytics 4 · Останні {days} днів
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl bg-slate-100 p-1">
                        {[7, 30, 90].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setDays(value)}
                                aria-pressed={days === value}
                                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                    days === value
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {value} дн.
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => loadData(true)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Оновити
                    </button>
                </div>
            </div>

            {/* ПОМИЛКА */}

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ЗАВАНТАЖЕННЯ */}

            {loading && !visibleData ? (
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
                    <Loader2
                        size={23}
                        className="animate-spin text-blue-600"
                    />
                    Завантаження статистики за {days} днів...
                </div>
            ) : visibleData ? (
                <>
                    {/* ОСНОВНІ КАРТКИ */}

                    <div className="grid gap-3 sm:grid-cols-3">
                        {cards.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold text-slate-500">
                                        {item.title}
                                    </span>

                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.background} ${item.color}`}
                                    >
                                        <item.Icon size={18} />
                                    </div>
                                </div>

                                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 tabular-nums">
                                    {formatNumber(item.value)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ГРАФІК ЗА ДНЯМИ */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <h3 className="text-base font-black text-slate-900">
                            Динаміка відвідуваності
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Активність користувачів за кожен день
                        </p>

                        {visibleData.daily?.length > 0 ? (
                            <div className="mt-5 h-[310px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={visibleData.daily}
                                        margin={{
                                            top: 10,
                                            right: 15,
                                            left: -20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="4 4"
                                            vertical={false}
                                            stroke="#e2e8f0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDay}
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={11}
                                            stroke="#94a3b8"
                                            minTickGap={20}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={11}
                                            stroke="#94a3b8"
                                        />

                                        <Tooltip
                                            labelFormatter={formatDay}
                                            formatter={(value, name) => [
                                                formatNumber(value),
                                                name,
                                            ]}
                                        />

                                        <Legend />

                                        <Line
                                            type="monotone"
                                            dataKey="activeUsers"
                                            name="Користувачі"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5 }}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="sessions"
                                            name="Сеанси"
                                            stroke="#16a34a"
                                            strokeWidth={2}
                                            dot={false}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="views"
                                            name="Перегляди"
                                            stroke="#9333ea"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="py-12 text-center text-sm text-slate-400">
                                Немає даних за вибраний період.
                            </p>
                        )}
                    </div>

                    {/* ДЖЕРЕЛА ТА СТОРІНКИ */}

                    <div className="grid gap-4 xl:grid-cols-2">
                        {/* ДЖЕРЕЛА ТРАФІКУ */}

                        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <h3 className="text-base font-black text-slate-900">
                                Джерела трафіку
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Звідки приходять відвідувачі
                            </p>

                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[380px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                                            <th className="pb-3 font-semibold">
                                                Джерело
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Сеанси
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Сер. час
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(visibleData.sources || []).map(
                                            (item) => (
                                                <tr
                                                    key={item.name}
                                                    className="border-b border-slate-100 last:border-0"
                                                >
                                                    <td className="py-3 pr-3 text-sm font-semibold text-slate-700">
                                                        {item.name}
                                                    </td>

                                                    <td className="py-3 text-right text-sm font-bold text-slate-900 tabular-nums">
                                                        {formatNumber(item.sessions)}
                                                    </td>

                                                    <td className="py-3 text-right text-sm text-slate-500 tabular-nums">
                                                        {formatDuration(item.averageDuration)}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-400">
                                Джерела визначаються за даними GA4.
                                Частина переходів із застосунків може
                                відображатися як пряма або невизначена.
                            </p>
                        </div>

                        {/* ПОПУЛЯРНІ СТОРІНКИ */}

                        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <h3 className="text-base font-black text-slate-900">
                                Популярні сторінки
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                10 сторінок із найбільшою кількістю переглядів
                            </p>

                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[440px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                                            <th className="pb-3 font-semibold">
                                                Сторінка
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Перегляди
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Люди
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(visibleData.pages || []).map(
                                            (page, index) => (
                                                <tr
                                                    key={`${page.path}-${index}`}
                                                    className="border-b border-slate-100 last:border-0"
                                                >
                                                    <td className="max-w-[220px] py-3 pr-3">
                                                        <p
                                                            className="truncate text-sm font-semibold text-slate-700"
                                                            title={page.title}
                                                        >
                                                            {page.title}
                                                        </p>

                                                        <p
                                                            className="mt-1 truncate text-xs text-slate-400"
                                                            title={page.path}
                                                        >
                                                            {page.path}
                                                        </p>
                                                    </td>

                                                    <td className="py-3 text-right text-sm font-bold text-slate-900 tabular-nums">
                                                        {formatNumber(page.views)}
                                                    </td>

                                                    <td className="py-3 text-right text-sm text-slate-500 tabular-nums">
                                                        {formatNumber(page.users)}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {!visibleData.pages?.length && (
                                <p className="py-8 text-center text-sm text-slate-400">
                                    Дані про сторінки відсутні.
                                </p>
                            )}
                        </div>
                    </div>
                </>
            ) : null}

            {/* ІНФОРМАЦІЯ ПРО КЕШ */}

            {visibleData && updatedAt && (
                <p className="text-xs text-slate-400">
                    Оновлено:{" "}
                    {new Date(updatedAt).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                    {" · "}Кеш 10 хвилин
                    {" · "}Період: {days} днів
                </p>
            )}
        </div>
    );
};

export default memo(GoogleAnalyticsStats);
