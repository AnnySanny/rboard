import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    doc,
    getDoc,
} from "firebase/firestore";
import {
    onAuthStateChanged,
} from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import EditListingForm from "../../components/listings/EditListingForm";
import {
    auth,
    db,
} from "../../firebase";



const EditListing = () => {
    const navigate = useNavigate();
    const { listingId } = useParams();

    const [listing, setListing] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
    let isActive = true;

    const unsubscribe =
        onAuthStateChanged(
            auth,
            async (currentUser) => {
                if (!isActive) {
                    return;
                }

                if (!currentUser) {
                    setListing(null);
                    setError(
                        "Не вдалося визначити користувача."
                    );
                    setLoading(false);
                    return;
                }

                try {
                    setLoading(true);
                    setError("");

                    const listingRef = doc(
                        db,
                        "listings",
                        listingId
                    );

                    const snapshot =
                        await getDoc(
                            listingRef
                        );

                    if (!isActive) {
                        return;
                    }

                    if (!snapshot.exists()) {
                        setError(
                            "Оголошення не знайдено."
                        );
                        return;
                    }

                    const data =
                        snapshot.data();

                    if (
                        data.author?.uid !==
                        currentUser.uid
                    ) {
                        setError(
                            "У вас немає доступу до редагування цього оголошення."
                        );
                        return;
                    }

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

                    if (isActive) {
                        setError(
                            "Не вдалося завантажити оголошення."
                        );
                    }
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            }
        );

    return () => {
        isActive = false;
        unsubscribe();
    };
}, [listingId]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-3xl">
                    {loading && (
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm font-semibold text-slate-500">
                                Завантаження оголошення...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                            <p className="font-semibold text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/user/listings"
                                    )
                                }
                                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                                Повернутися
                            </button>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        listing && (
                            <>
                                <div className="mb-7">
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                                        Редагування
                                    </p>

                                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                        Редагувати оголошення
                                    </h1>

                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                        Внесіть необхідні зміни.
                                        Після збереження оголошення
                                        буде повторно надіслане на
                                        перевірку адміністратору.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                                    <EditListingForm
                                        listing={
                                            listing
                                        }
                                        onSuccess={() =>
                                            navigate(
                                                "/user/listings"
                                            )
                                        }
                                    />
                                </div>
                            </>
                        )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EditListing;