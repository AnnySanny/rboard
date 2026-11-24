
import { useEffect, useState } from "react";
import {useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { PencilLine } from "lucide-react";

import { db } from "../../firebase";
import AdminRealEstateEditForm from "../../components/partners/realEstate/AdminRealEstateEditForm";

export default function AdminRealEstateEdit() {
    const { listingId } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadListing = async () => {
            setLoading(true);
            setError("");
            setListing(null);

            try {
                const snapshot = await getDoc(
                    doc(db, "listings", listingId)
                );

                if (!active) return;

                if (!snapshot.exists()) {
                    throw new Error("Оголошення не знайдено.");
                }

                const data = snapshot.data();

                if (
                    data.listingKind !== "partner" ||
                    data.partnerType !== "real_estate"
                ) {
                    throw new Error(
                        "Це не партнерське оголошення нерухомості."
                    );
                }

                setListing({
                    id: snapshot.id,
                    ...data,
                });
            } catch (error) {
                if (!active) return;

                console.error(
                    "Помилка завантаження нерухомості:",
                    error
                );

                setError(
                    error.message ||
                    "Не вдалося завантажити оголошення."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadListing();

        return () => {
            active = false;
        };
    }, [listingId]);

    return (
        <section className="mx-auto max-w-5xl">

            {/* Заголовок */}
            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
                    <PencilLine
                        size={27}
                        strokeWidth={1.8}
                    />
                </div>

                <div className="min-w-0">
                    <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                        Редагувати нерухомість
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Адміністративне редагування партнерського оголошення RBoard
                    </p>
                </div>
            </div>

            {/* Завантаження */}
            {loading && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                    <span className="text-sm text-slate-500">
                        Завантаження оголошення...
                    </span>
                </div>
            )}

            {/* Помилка */}
            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="font-semibold text-red-700">
                        {error}
                    </p>
                </div>
            )}

            {/* Форма редагування */}
            {!loading && !error && listing && (
                <AdminRealEstateEditForm
                    key={listing.id}
                    listing={listing}
                />
            )}

        </section>
    );
}
