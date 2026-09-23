import { useEffect, useState } from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import AdminEditListingForm from "../../components/admin/AdminEditListingForm";
import { db } from "../../firebase";

const AdminEditListing = () => {
    const navigate = useNavigate();
    const { listingId } = useParams();

    const [listing, setListing] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadListing = async () => {
            try {
                setLoading(true);
                setError("");

                if (!listingId) {
                    setError(
                        "Не вдалося визначити оголошення."
                    );

                    return;
                }

                const listingRef = doc(
                    db,
                    "listings",
                    listingId
                );

                const snapshot =
                    await getDoc(listingRef);

                if (!snapshot.exists()) {
                    setError(
                        "Оголошення не знайдено."
                    );

                    return;
                }

                const data =
                    snapshot.data();

                setListing({
                    id: snapshot.id,
                    ...data,

                    images:
                        Array.isArray(
                            data.images
                        )
                            ? data.images
                            : [],
                });
            } catch (error) {
                console.error(
                    "Помилка завантаження оголошення:",
                    error
                );

                setError(
                    "Не вдалося завантажити оголошення."
                );
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [listingId]);

    return (
        <section>
            {/* Завантаження */}
            {loading && (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-semibold text-slate-500">
                        Завантаження оголошення...
                    </p>
                </div>
            )}

            {/* Помилка */}
            {!loading && error && (
                <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <p className="font-bold text-red-700">
                            Не вдалося відкрити
                            оголошення
                        </p>

                        <p className="mt-2 text-sm leading-6 text-red-600">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/dashboard/listings"
                            )
                        }
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        Повернутися
                    </button>
                </div>
            )}

            {/* Сторінка редагування */}
            {!loading &&
                !error &&
                listing && (
                    <>
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard/listings"
                                )
                            }
                            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>

                            Повернутися до оголошень
                        </button>

                        <div className="mb-7">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                                Панель адміністратора
                            </p>

                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                Редагувати оголошення
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Змініть необхідні дані
                                оголошення та збережіть
                                зміни.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                            <AdminEditListingForm
                                listing={listing}
                                onSuccess={() =>
                                    navigate(
                                        "/dashboard/listings"
                                    )
                                }
                            />
                        </div>
                    </>
                )}
        </section>
    );
};

export default AdminEditListing;