
import { useCallback, useEffect, useState } from "react";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    Timestamp,
    where,
} from "firebase/firestore";

import {
    LayoutGrid,
    LoaderCircle,
    Megaphone,
} from "lucide-react";

import { db } from "../../firebase";
import { mapListingDocument } from "../../utils/listingMapper";

import ListingsSection from "../listings/ListingsSection";
import ListingDetailsModal from "../listings/ListingDetailsModal";

const PAGE_SIZE = 8;

const isActive = (expiresAt) => {
    if (!expiresAt) return false;

    const value =
        expiresAt?.toDate?.() ||
        (expiresAt instanceof Date
            ? expiresAt
            : new Date(expiresAt));

    return (
        !Number.isNaN(value.getTime()) &&
        value.getTime() > Date.now()
    );
};

export default function ProfileListings({ profileUid }) {
    const [listings, setListings] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [selectedListing, setSelectedListing] =
        useState(null);

    const buildQuery = useCallback(
        (cursor = null) => {
            const constraints = [
                where("author.uid", "==", profileUid),
                where("status", "==", "approved"),
                where("expiresAt", ">", Timestamp.now()),
                orderBy("expiresAt", "asc"),
            ];

            if (cursor) {
                constraints.push(startAfter(cursor));
            }

            constraints.push(limit(PAGE_SIZE));

            return query(
                collection(db, "listings"),
                ...constraints
            );
        },
        [profileUid]
    );

    useEffect(() => {
        if (!profileUid) {
            setListings([]);
            setLastDoc(null);
            setHasMore(false);
            setLoading(false);
            return;
        }

        let active = true;

        setLoading(true);
        setListings([]);
        setLastDoc(null);
        setHasMore(false);
        setSelectedListing(null);
        setError("");

        const loadInitial = async () => {
            try {
                const snapshot = await getDocs(buildQuery());

                if (!active) return;

                const items = snapshot.docs
                    .filter((item) => isActive(item.data().expiresAt))
                    .map(mapListingDocument);

                setListings(items);
                setLastDoc(
                    snapshot.docs[snapshot.docs.length - 1] || null
                );
                setHasMore(snapshot.size === PAGE_SIZE);
            } catch (err) {
                if (!active) return;

                console.error(
                    "Помилка завантаження оголошень профілю:",
                    err
                );

                setError("Не вдалося завантажити оголошення.");
            } finally {
                if (active) setLoading(false);
            }
        };

        loadInitial();

        return () => {
            active = false;
        };
    }, [profileUid, buildQuery]);

    const loadMore = async () => {
        if (
            loading ||
            loadingMore ||
            !hasMore ||
            !lastDoc
        ) {
            return;
        }

        try {
            setLoadingMore(true);
            setError("");

            const snapshot = await getDocs(
                buildQuery(lastDoc)
            );

            const nextItems = snapshot.docs
                .filter((item) => isActive(item.data().expiresAt))
                .map(mapListingDocument);

            setListings((current) => {
                const existingIds = new Set(
                    current.map((item) => item.id)
                );

                return [
                    ...current,
                    ...nextItems.filter(
                        (item) => !existingIds.has(item.id)
                    ),
                ];
            });

            setLastDoc(
                snapshot.docs[snapshot.docs.length - 1] || null
            );

            setHasMore(snapshot.size === PAGE_SIZE);
        } catch (err) {
            console.error(
                "Помилка завантаження наступних оголошень:",
                err
            );

            setError(
                "Не вдалося завантажити наступні оголошення."
            );
        } finally {
            setLoadingMore(false);
        }
    };

    // Новіші оголошення показуємо вище.
    const sortedListings = [...listings].sort((a, b) => {
        const getTime = (value) => {
            const date =
                value?.toDate?.() ||
                (value instanceof Date
                    ? value
                    : new Date(value || 0));

            const time = date.getTime();
            return Number.isNaN(time) ? 0 : time;
        };

        return (
            getTime(b.createdAt) - getTime(a.createdAt)
        );
    });

    return (
        <>
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                    <div className="flex items-center gap-2">
                        <LayoutGrid
                            className="h-[18px] w-[18px] shrink-0 text-blue-600 sm:h-[21px] sm:w-[21px]"
                        />

                        <h2 className="text-base font-medium text-slate-900 sm:text-lg">
                            Оголошення користувача
                        </h2>
                    </div>


                    {!loading && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {listings.length}
                            {hasMore ? "+" : ""}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                        <LoaderCircle
                            size={19}
                            className="animate-spin text-blue-600"
                        />
                        Завантаження оголошень...
                    </div>
                ) : (
                    <>
                        {sortedListings.length > 0 ? (
                            <ListingsSection
                                listings={sortedListings}
                                viewMode="grid"
                                compact
                                onListingClick={setSelectedListing}
                            />
                        ) : !error ? (
                            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                                <Megaphone
                                    size={30}
                                    className="text-blue-400"
                                />

                                <p className="mt-3 text-sm font-bold text-slate-800">
                                    Поки немає активних оголошень
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Нові оголошення користувача
                                    з'являться тут.
                                </p>
                            </div>
                        ) : null}

                        {error && (
                            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {hasMore && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {loadingMore && (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    )}

                                    {loadingMore
                                        ? "Завантаження..."
                                        : "Завантажити ще"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            <ListingDetailsModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
                onSelectRelated={(listing) =>
                    setSelectedListing(listing)
                }
            />
        </>
    );
}
