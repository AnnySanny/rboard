
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import {
    Eye,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";

import { db } from "../../firebase";

const isActiveListing = (listing) => {
    if (listing.status !== "approved") {
        return false;
    }

    const expiresAt =
        listing.expiresAt?.toDate?.() ||
        (listing.expiresAt instanceof Date
            ? listing.expiresAt
            : listing.expiresAt
                ? new Date(listing.expiresAt)
                : null);

    return (
        expiresAt instanceof Date &&
        !Number.isNaN(expiresAt.getTime()) &&
        expiresAt.getTime() > Date.now()
    );
};

export default function ProfileListingStats({
    profileUid,
    isOwner = false,
}) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!profileUid) {
            setStats(null);
            setLoading(false);
            return;
        }

        let active = true;

        const loadStats = async () => {
            setLoading(true);
            setError(false);
            setStats(null);

            try {
                const constraints = [
                    where("author.uid", "==", profileUid),
                ];

                // Відвідувачі читають тільки схвалені.
                if (!isOwner) {
                    constraints.push(
                        where("status", "==", "approved")
                    );
                }

                const snapshot = await getDocs(
                    query(
                        collection(db, "listings"),
                        ...constraints
                    )
                );

                if (!active) return;

                const listings = snapshot.docs.map(
                    (item) => item.data()
                );

                const activeCount = listings.filter(
                    isActiveListing
                ).length;

                const rejectedCount = isOwner
                    ? listings.filter(
                        (item) => item.status === "rejected"
                    ).length
                    : null;

                const totalViews = listings.reduce(
                    (sum, item) => {
                        const views = Number(item.views);

                        return (
                            sum +
                            (Number.isFinite(views)
                                ? Math.max(0, views)
                                : 0)
                        );
                    },
                    0
                );

                setStats({
                    total: listings.length,
                    active: activeCount,
                    rejected: rejectedCount,
                    views: totalViews,
                });
            } catch (err) {
                if (!active) return;

                console.error(
                    "Помилка завантаження статистики:",
                    err
                );

                setError(true);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadStats();

        return () => {
            active = false;
        };
    }, [profileUid, isOwner]);

    if (loading) {
        return (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <LoaderCircle
                    size={15}
                    className="animate-spin text-blue-600"
                />
                Завантаження статистики...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <AlertCircle size={15} />
                Статистика тимчасово недоступна
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="mt-4 border-t border-slate-100 pt-4">



            {/* Статистика оголошень і переглядів */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:justify-start">

                {/* Кількість оголошень */}

                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-start">
                    <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                        Оголошення:
                    </span>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                            Всього: {stats.total}
                        </span>

                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600">
                            Активні: {stats.active}
                        </span>

                        {isOwner && (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                                Неактивні: {stats.rejected}
                            </span>
                        )}
                    </div>
                </div>
                {/* Перегляди */}
                <div className="flex shrink-0 items-center gap-2">
                    <Eye size={17} className="text-blue-600" />

                    <span className="text-xs font-medium text-slate-600 sm:text-sm">
                        Всього переглядів:
                    </span>

                    <span className="text-sm font-medium text-blue-600">
                        {stats.views.toLocaleString("uk-UA")}
                    </span>
                </div>

            </div>

        </div>
    );
}
