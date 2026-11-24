
import { useEffect, useRef, useState } from "react";
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
    House,
    LoaderCircle,
} from "lucide-react";

import { db } from "../../../firebase";
import RealEstateCard from "../../partners/realEstate/RealEstateCard";
import RealEstateDetailsModal from "../../partners/realEstate/RealEstateDetailsModal";
const PAGE_SIZE = 8;

const buildQuery = (profileUid, cursor = null) => {
    const constraints = [
        where("partnerUid", "==", profileUid),
        where("partnerType", "==", "real_estate"),
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
};

export default function RealEstateProfileListings({
    profileUid,
}) {
    const [listings, setListings] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [selectedListing, setSelectedListing] = useState(null);
    const requestVersionRef = useRef(0);
    const loadingMoreRef = useRef(false);

    useEffect(() => {
        const requestVersion = requestVersionRef;
        const version = ++requestVersionRef.current;

        setListings([]);
        setLastDoc(null);
        setHasMore(false);
        setError("");
        setLoadingMore(false);
        loadingMoreRef.current = false;

        if (!profileUid) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const loadInitial = async () => {
            try {
                const snapshot = await getDocs(
                    buildQuery(profileUid)
                );

                if (version !== requestVersionRef.current) {
                    return;
                }

                const items = snapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data(),
                    })
                );

                setListings(items);

                setLastDoc(
                    snapshot.docs[snapshot.docs.length - 1] || null
                );

                setHasMore(snapshot.size === PAGE_SIZE);
            } catch (err) {
                if (version !== requestVersionRef.current) {
                    return;
                }

                console.error(
                    "Помилка завантаження нерухомості:",
                    err
                );

                setError(
                    "Не вдалося завантажити об'єкти нерухомості."
                );
            } finally {
                if (version === requestVersionRef.current) {
                    setLoading(false);
                }
            }
        };

        loadInitial();

        return () => {
            requestVersion.current++;
        };
    }, [profileUid]);

    const loadMore = async () => {
        if (
            loading ||
            loadingMoreRef.current ||
            !hasMore ||
            !lastDoc ||
            !profileUid
        ) {
            return;
        }

        const version = requestVersionRef.current;

        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError("");

        try {
            const snapshot = await getDocs(
                buildQuery(profileUid, lastDoc)
            );

            if (version !== requestVersionRef.current) {
                return;
            }

            const nextItems = snapshot.docs.map(
                (document) => ({
                    id: document.id,
                    ...document.data(),
                })
            );

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
            if (version !== requestVersionRef.current) {
                return;
            }

            console.error(
                "Помилка завантаження наступних об'єктів:",
                err
            );

            setError(
                "Не вдалося завантажити наступні об'єкти."
            );
        } finally {
            loadingMoreRef.current = false;

            if (version === requestVersionRef.current) {
                setLoadingMore(false);
            }
        }
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <House
                        size={21}
                        className="shrink-0 text-blue-600"
                    />

                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                        Об'єкти нерухомості
                    </h2>
                </div>

                {!loading && !error && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {listings.length}
                        {hasMore ? "+" : ""} об'єктів
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <LoaderCircle
                        size={20}
                        className="animate-spin text-blue-600"
                    />

                    Завантаження нерухомості...
                </div>
            ) : (
                <>
                    {listings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                            {listings.map((listing) => (
                                <RealEstateCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={setSelectedListing}
                                />
                            ))}
                        </div>
                    ) : !error ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                            <House
                                size={34}
                                className="text-blue-400"
                            />

                            <p className="mt-3 text-sm font-bold text-slate-800">
                                Поки немає об'єктів нерухомості
                            </p>

                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                                Після публікації нові об'єкти
                                партнера з'являться тут.
                            </p>
                        </div>
                    ) : null}

                    {error && (
                        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    {hasMore && (
                        <div className="mt-7 flex justify-center">
                            <button
                                type="button"
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
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
            <RealEstateDetailsModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
                onSelectRelated={setSelectedListing}
            />
        </section>
    );
}
