
import { memo, useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    Eye,
    Loader2,
    RefreshCw,
    Users,
} from "lucide-react";

import { auth } from "../../firebase";

const CACHE_DURATION = 10 * 60 * 1000;

let analyticsCache = null;
let pendingRequest = null;

const getCachedData = () => {
    if (
        analyticsCache &&
        analyticsCache.uid === auth.currentUser?.uid &&
        Date.now() - analyticsCache.savedAt < CACHE_DURATION
    ) {
        return analyticsCache;
    }

    return null;
};

const requestAnalytics = async (force = false) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Потрібна авторизація адміністратора.");
    }

    const cached = getCachedData();

    if (!force && cached) {
        return cached.data;
    }

    if (pendingRequest?.uid === user.uid) {
        return pendingRequest.promise;
    }

    const promise = (async () => {
        const token = await user.getIdToken();

        const response = await fetch(
            "/.netlify/functions/google-analytics",
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

        analyticsCache = {
            uid: user.uid,
            savedAt: Date.now(),
            data: result,
        };

        return result;
    })();

    pendingRequest = {
        uid: user.uid,
        promise,
    };

    try {
        return await promise;
    } finally {
        if (pendingRequest?.promise === promise) {
            pendingRequest = null;
        }
    }
};

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("uk-UA");

const GoogleAnalyticsStats = () => {
    const [data, setData] = useState(
        () => getCachedData()?.data || null
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [updatedAt, setUpdatedAt] = useState(
        () => getCachedData()?.savedAt || null
    );

    const loadData = useCallback(async (force = false) => {
        setLoading(true);
        setError("");

        try {
            const result = await requestAnalytics(force);

            setData(result);
            setUpdatedAt(analyticsCache?.savedAt || Date.now());
        } catch (err) {
            console.error("Помилка Google Analytics:", err);

            setError(
                err.message || "Не вдалося завантажити аналітику."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const cards = data
        ? [
            {
                title: "Активні користувачі",
                value: data.activeUsers,
                Icon: Users,
                background: "bg-blue-50",
                color: "text-blue-600",
            },
            {
                title: "Сеанси",
                value: data.sessions,
                Icon: Activity,
                background: "bg-emerald-50",
                color: "text-emerald-600",
            },
            {
                title: "Перегляди сторінок",
                value: data.views,
                Icon: Eye,
                background: "bg-violet-50",
                color: "text-violet-600",
            },
        ]
        : [];

    return (
        <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-bold text-slate-900">
                        Аналітика відвідуваності
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Google Analytics 4 · Останні 7 днів
                    </p>
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

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading && !data ? (
                <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
                    <Loader2
                        size={22}
                        className="animate-spin text-blue-600"
                    />
                    Завантаження Google Analytics...
                </div>
            ) : data ? (
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
            ) : null}

            {updatedAt && data && (
                <p className="text-xs text-slate-400">
                    Оновлено:{" "}
                    {new Date(updatedAt).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                    {" · "}Кеш 10 хвилин
                </p>
            )}
        </div>
    );
};

export default memo(GoogleAnalyticsStats);
