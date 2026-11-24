
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { PencilLine } from "lucide-react";

import { auth, db } from "../../firebase";
import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";
import RealEstateEditForm from "../../components/partners/realEstate/RealEstateEditForm";

export default function EditRealEstateListing() {
    const { listingId } = useParams();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    if (active) {
                        setListing(null);
                        setError("Необхідна авторизація.");
                        setLoading(false);
                    }
                    return;
                }

                if (active) {
                    setLoading(true);
                    setError("");
                    setListing(null);
                }

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

                    if (
                        data.author?.uid !== user.uid ||
                        data.partnerUid !== user.uid
                    ) {
                        throw new Error(
                            "Ви не можете редагувати це оголошення."
                        );
                    }

                    setListing({
                        id: snapshot.id,
                        ...data,
                    });

                    setError("");
                } catch (error) {
                    if (!active) return;

                    console.error(
                        "Помилка завантаження оголошення:",
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
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [listingId]);

    return (
        <div className="flex min-h-screen flex-col bg-[#f5f8ff]">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

                    {/* Заголовок */}
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
                            <PencilLine
                                size={27}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                                Редагувати нерухомість
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Редагування партнерського оголошення RBoard
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
                        <RealEstateEditForm
                            listing={listing}
                        />
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
