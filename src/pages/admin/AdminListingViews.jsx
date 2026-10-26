
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Eye,
    Users,
    UserRound,
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    FileText,
    Trash2,
    LoaderCircle,
    ChevronRight,
} from "lucide-react";
import {
    collection,
    doc,
    documentId,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
    writeBatch,
} from "firebase/firestore";
import Swal from "sweetalert2";

import { db } from "../../firebase";

const PAGE_SIZE = 25;

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("uk-UA");

const formatDate = (value) => {
    if (!value) return "Дата невідома";

    const date = value.toDate
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "Дата невідома";

    return date.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getText = (value, fallback = "") => {
    if (typeof value === "string") return value;

    if (value && typeof value.name === "string") {
        return value.name;
    }

    return fallback;
};

const getUserId = (viewerId) =>
    String(viewerId || "").replace(/^user_/, "");

const getUnusedViews = (listings, views, users) => {
    const listingIds = new Set(listings.map((item) => item.id));
    const userIds = new Set(users.map((item) => item.id));

    return views.filter((view) => {
        if (!listingIds.has(view.listingId)) return true;

        if (view.viewerType === "user") {
            return !userIds.has(getUserId(view.viewerId));
        }

        return false;
    });
};

export default function AdminListingViews() {
    const [listings, setListings] = useState([]);
    const [visitors, setVisitors] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [expanded, setExpanded] = useState([]);

    const [hasMore, setHasMore] = useState(true);
    const [unusedCount, setUnusedCount] = useState(null);

    const lastDocRef = useRef(null);
    const profileCacheRef = useRef(new Map());
    const loadingRef = useRef(false);
    const visitorLoadingRef = useRef(new Set());
    const visitorCursorsRef = useRef(new Map());
    const requestVersionRef = useRef(0);

    const fetchPage = useCallback(async (reset = false) => {
        if (loadingRef.current) return;

        loadingRef.current = true;

        if (reset) {
            setRefreshing(true);
        } else {
            setLoadingMore(true);
        }

        setError("");

        const version = requestVersionRef.current;

        try {
            const constraints = [orderBy(documentId())];

            if (!reset && lastDocRef.current) {
                constraints.push(startAfter(lastDocRef.current));
            }

            constraints.push(limit(PAGE_SIZE));

            const snapshot = await getDocs(
                query(collection(db, "listings"), ...constraints)
            );

            if (version !== requestVersionRef.current) return;

            const newListings = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            if (reset) {
                setListings(newListings);
                setVisitors({});
                setExpanded([]);
                visitorCursorsRef.current.clear();
            } else {
                setListings((previous) => {
                    const existingIds = new Set(
                        previous.map((item) => item.id)
                    );

                    return [
                        ...previous,
                        ...newListings.filter(
                            (item) => !existingIds.has(item.id)
                        ),
                    ];
                });
            }

            if (snapshot.docs.length > 0) {
                lastDocRef.current =
                    snapshot.docs[snapshot.docs.length - 1];
            } else if (reset) {
                lastDocRef.current = null;
            }

            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (err) {
            console.error("Помилка завантаження оголошень:", err);
            setError("Не вдалося завантажити оголошення.");
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, []);

    const resetData = useCallback(async () => {
        requestVersionRef.current += 1;
        lastDocRef.current = null;
        profileCacheRef.current.clear();

        await fetchPage(true);
    }, [fetchPage]);

    useEffect(() => {
        fetchPage(true);
    }, [fetchPage]);

    const loadProfile = useCallback(async (uid) => {
        if (profileCacheRef.current.has(uid)) {
            return profileCacheRef.current.get(uid);
        }

        const publicSnapshot = await getDoc(
            doc(db, "publicProfiles", uid)
        );

        if (publicSnapshot.exists()) {
            const profile = publicSnapshot.data();
            profileCacheRef.current.set(uid, profile);
            return profile;
        }

        const privateSnapshot = await getDoc(
            doc(db, "users", uid)
        );

        const profile = privateSnapshot.exists()
            ? privateSnapshot.data()
            : null;

        profileCacheRef.current.set(uid, profile);

        return profile;
    }, []);

    const loadVisitors = useCallback(async (listingId, more = false) => {
        if (visitorLoadingRef.current.has(listingId)) return;

        visitorLoadingRef.current.add(listingId);

        setVisitors((previous) => ({
            ...previous,
            [listingId]: {
                ...previous[listingId],
                records: more
                    ? previous[listingId]?.records || []
                    : [],
                loading: true,
                loaded: more
                    ? previous[listingId]?.loaded || false
                    : false,
            },
        }));

        try {
            const baseQuery = collection(db, "listingViews");

            const constraints = [
                where("listingId", "==", listingId),
                orderBy(documentId()),
            ];

            const cursor = visitorCursorsRef.current.get(listingId);

            if (more && cursor) {
                constraints.push(startAfter(cursor));
            }

            constraints.push(limit(PAGE_SIZE));

            const snapshot = await getDocs(
                query(baseQuery, ...constraints)
            );

            const records = await Promise.all(
                snapshot.docs.map(async (item) => {
                    const data = item.data();

                    if (data.viewerType !== "user") {
                        return {
                            id: item.id,
                            ...data,
                            profile: null,
                        };
                    }

                    const uid = getUserId(data.viewerId);

                    return {
                        id: item.id,
                        ...data,
                        uid,
                        profile: await loadProfile(uid),
                    };
                })
            );

            const previousData = visitors[listingId];

            let counts = previousData?.counts || null;

            if (!counts || !more) {
                const [userCount, guestCount] = await Promise.all([
                    getCountFromServer(
                        query(
                            baseQuery,
                            where("listingId", "==", listingId),
                            where("viewerType", "==", "user")
                        )
                    ),
                    getCountFromServer(
                        query(
                            baseQuery,
                            where("listingId", "==", listingId),
                            where("viewerType", "==", "guest")
                        )
                    ),
                ]);

                counts = {
                    users: userCount.data().count,
                    guests: guestCount.data().count,
                };
            }

            if (snapshot.docs.length > 0) {
                visitorCursorsRef.current.set(
                    listingId,
                    snapshot.docs[snapshot.docs.length - 1]
                );
            }

            setVisitors((previous) => ({
                ...previous,
                [listingId]: {
                    records: more
                        ? [...(previous[listingId]?.records || []), ...records]
                        : records,
                    counts,
                    hasMore: snapshot.docs.length === PAGE_SIZE,
                    loading: false,
                    loaded: true,
                    error: "",
                },
            }));
        } catch (err) {
            console.error("Помилка завантаження відвідувачів:", err);

            setVisitors((previous) => ({
                ...previous,
                [listingId]: {
                    ...previous[listingId],
                    loading: false,
                    error: "Не вдалося завантажити перегляди.",
                },
            }));
        } finally {
            visitorLoadingRef.current.delete(listingId);
        }
    }, [loadProfile, visitors]);

    const toggleExpanded = async (listingId) => {
        if (expanded.includes(listingId)) {
            setExpanded((previous) =>
                previous.filter((id) => id !== listingId)
            );
            return;
        }

        setExpanded((previous) => [...previous, listingId]);

        if (!visitors[listingId]?.loaded) {
            await loadVisitors(listingId);
        }
    };

    const handleCleanUnusedViews = async () => {
        if (cleaning || loading || loadingMore || refreshing) return;

        const confirmation = await Swal.fire({
            width: 440,
            icon: "warning",
            title: "Очистити зайві перегляди?",
            html: `
        <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#64748b">
          Система перевірить усі записи переглядів
          та видалить ті, які належать видаленим
          оголошенням або користувачам.
          <p style="margin:12px 0 0">
            Для перевірки буде тимчасово прочитано
            відповідні колекції Firestore.
          </p>
        </div>
      `,
            showCancelButton: true,
            confirmButtonText: "Перевірити й очистити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: "rounded-3xl",
                confirmButton: "rounded-xl",
                cancelButton: "rounded-xl",
            },
        });

        if (!confirmation.isConfirmed) return;

        setCleaning(true);

        Swal.fire({
            title: "Перевіряємо записи",
            text: "Зачекайте, поки завершиться очищення.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const [listingSnapshot, viewSnapshot, userSnapshot] =
                await Promise.all([
                    getDocs(collection(db, "listings")),
                    getDocs(collection(db, "listingViews")),
                    getDocs(collection(db, "users")),
                ]);

            const currentListings = listingSnapshot.docs.map(
                (item) => ({ id: item.id })
            );

            const currentViews = viewSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data(),
                })
            );

            const currentUsers = userSnapshot.docs.map(
                (item) => ({ id: item.id })
            );

            const unused = getUnusedViews(
                currentListings,
                currentViews,
                currentUsers
            );

            for (let index = 0; index < unused.length; index += 400) {
                const batch = writeBatch(db);

                unused.slice(index, index + 400).forEach((item) => {
                    batch.delete(doc(db, "listingViews", item.id));
                });

                await batch.commit();
            }

            setUnusedCount(0);
            await resetData();

            Swal.close();

            await Swal.fire({
                width: 400,
                icon: "success",
                title: "Очищення завершено",
                text: `Видалено ${formatNumber(unused.length)} зайвих записів.`,
                timer: 2500,
                timerProgressBar: true,
                showConfirmButton: false,
                customClass: {
                    popup: "rounded-3xl",
                },
            });
        } catch (err) {
            Swal.close();

            console.error("Помилка очищення переглядів:", err);

            await Swal.fire({
                icon: "error",
                title: "Не вдалося завершити очищення",
                text: "Перевірте права доступу та спробуйте ще раз.",
                confirmButtonColor: "#2563eb",
                customClass: {
                    popup: "rounded-3xl",
                },
            });
        } finally {
            setCleaning(false);
        }
    };

    const filteredListings = listings.filter((listing) => {
        const normalized = search.trim().toLowerCase();

        const title = getText(listing.title, "Без назви");
        const city = getText(listing.city);

        const matchesSearch =
            title.toLowerCase().includes(normalized) ||
            city.toLowerCase().includes(normalized) ||
            listing.id.toLowerCase().includes(normalized);

        if (!matchesSearch) return false;

        if (filter === "viewed") {
            return Number(listing.views || 0) > 0;
        }

        if (filter === "empty") {
            return Number(listing.views || 0) === 0;
        }

        return true;
    });

    const totalDisplayedViews = listings.reduce(
        (sum, item) => sum + Number(item.views || 0),
        0
    );

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        Перегляди оголошень
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Статистика відвідувачів та переглядів RBoard.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleCleanUnusedViews}
                        disabled={cleaning || loading || loadingMore || refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                        {cleaning ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                            <Trash2 size={16} />
                        )}

                        {cleaning ? "Очищення..." : "Очистити зайві"}
                    </button>

                    <button
                        type="button"
                        onClick={resetData}
                        disabled={loading || loadingMore || refreshing || cleaning}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Оновити
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {[
                    {
                        label: "Завантажено оголошень",
                        value: listings.length,
                        icon: FileText,
                        color: "text-blue-600",
                        background: "bg-blue-50",
                    },
                    {
                        label: "Лічильники переглядів",
                        value: totalDisplayedViews,
                        icon: Eye,
                        color: "text-indigo-600",
                        background: "bg-indigo-50",
                    },
                    {
                        label: "Зайві записи",
                        value: unusedCount === null ? "—" : unusedCount,
                        icon: Trash2,
                        color: "text-red-600",
                        background: "bg-red-50",
                    },
                ].map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.background} ${item.color}`}>
                                <Icon size={19} />
                            </div>

                            <div className="text-2xl font-black tracking-tight text-slate-900">
                                {typeof item.value === "number"
                                    ? formatNumber(item.value)
                                    : item.value}
                            </div>

                            <div className="mt-1 text-xs font-medium text-slate-500">
                                {item.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Пошук серед завантажених оголошень..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 outline-none"
                    >
                        <option value="all">Усі оголошення</option>
                        <option value="viewed">З переглядами</option>
                        <option value="empty">Без переглядів</option>
                    </select>
                </div>

                <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-sm font-bold text-slate-800">
                        Список оголошень
                    </h2>

                    <span className="text-xs font-medium text-slate-400">
                        {formatNumber(filteredListings.length)} завантажено
                    </span>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500">
                        <LoaderCircle
                            size={20}
                            className="animate-spin text-blue-600"
                        />
                        Завантажуємо оголошення...
                    </div>
                ) : (
                    <>
                        <div className="mt-4 space-y-3">
                            {filteredListings.map((listing) => {
                                const isExpanded = expanded.includes(listing.id);
                                const data = visitors[listing.id];
                                const records = data?.records || [];

                                const registeredRecords = records.filter(
                                    (item) => item.viewerType === "user"
                                );

                                return (
                                    <div
                                        key={listing.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-slate-300"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(listing.id)}
                                            className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
                                        >
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <FileText size={20} />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-bold text-slate-900">
                                                    {getText(listing.title, "Без назви")}
                                                </span>

                                                <span className="mt-1 block truncate text-xs text-slate-500">
                                                    {getText(listing.category, "Інше")}
                                                    {getText(listing.city)
                                                        ? ` • ${getText(listing.city)}`
                                                        : ""}
                                                </span>
                                            </span>

                                            <span className="shrink-0 text-right">
                                                <span className="flex items-center justify-end gap-1.5 text-sm font-bold text-slate-900">
                                                    <Eye size={15} className="text-blue-500" />
                                                    {formatNumber(
                                                        data?.counts
                                                            ? data.counts.users + data.counts.guests
                                                            : listing.views
                                                    )}
                                                </span>
                                                <span className="mt-1 block text-[11px] text-slate-400">
                                                    переглядів
                                                </span>
                                            </span>

                                            {isExpanded ? (
                                                <ChevronUp size={18} className="shrink-0 text-slate-400" />
                                            ) : (
                                                <ChevronDown size={18} className="shrink-0 text-slate-400" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                                                <div className="mb-4 flex flex-wrap gap-2">
                                                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                                        {formatNumber(data?.counts?.users || 0)} користувачів
                                                    </span>
                                                    <span className="rounded-lg bg-slate-200/70 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                        {formatNumber(data?.counts?.guests || 0)} гостей
                                                    </span>
                                                </div>

                                                {data?.error && (
                                                    <p className="mb-3 text-xs text-red-600">
                                                        {data.error}
                                                    </p>
                                                )}

                                                <div className="space-y-2">

                                                    {registeredRecords.map((visitor) => (
                                                        <Link
                                                            key={visitor.id}
                                                            to={`/dashboard/users/${encodeURIComponent(visitor.uid)}`}
                                                            title={`Переглянути профіль: ${visitor.profile?.login || "Користувач RBoard"}`}
                                                            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
                                                        >
                                                            {visitor.profile?.avatarUrl ? (
                                                                <img
                                                                    src={visitor.profile.avatarUrl}
                                                                    alt=""
                                                                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                                    <UserRound size={20} />
                                                                </span>
                                                            )}

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-600">
                                                                    {visitor.profile?.login || "Користувач RBoard"}
                                                                </p>

                                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                                    Зареєстрований користувач
                                                                </p>
                                                            </div>

                                                            <span className="shrink-0 text-right text-[11px] text-slate-400">
                                                                {formatDate(visitor.viewedAt)}
                                                            </span>

                                                            <ChevronRight
                                                                size={17}
                                                                className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                                                            />
                                                        </Link>
                                                    ))}


                                                    {(data?.counts?.guests || 0) > 0 && (
                                                        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                                                <Users size={19} />
                                                            </span>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold text-slate-800">
                                                                    +{formatNumber(data.counts.guests)} гостей
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                                    Анонімні відвідувачі
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {data?.loading && (
                                                    <div className="flex justify-center py-5">
                                                        <LoaderCircle size={19} className="animate-spin text-blue-600" />
                                                    </div>
                                                )}

                                                {data?.hasMore && !data.loading && (
                                                    <div className="mt-4 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => loadVisitors(listing.id, true)}
                                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                                                        >
                                                            Завантажити ще відвідувачів
                                                        </button>
                                                    </div>
                                                )}

                                                <p className="mt-4 break-all text-[11px] text-slate-400">
                                                    ID оголошення: {listing.id}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {filteredListings.length === 0 && (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Оголошень не знайдено.
                            </div>
                        )}

                        {hasMore && (
                            <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-6">
                                <button
                                    type="button"
                                    onClick={() => fetchPage(false)}
                                    disabled={loadingMore || refreshing || cleaning}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {loadingMore ? (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    ) : (
                                        <ChevronDown size={17} />
                                    )}

                                    {loadingMore
                                        ? "Завантаження..."
                                        : "Завантажити ще 25"}
                                </button>

                                <span className="text-xs text-slate-400">
                                    Завантажено {formatNumber(listings.length)} оголошень
                                </span>
                            </div>
                        )}

                        {!hasMore && listings.length > 0 && (
                            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
                                Усі оголошення завантажено
                            </p>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
