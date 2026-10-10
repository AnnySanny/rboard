
import { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import {
    ArrowUpRight,
    HeartHandshake,
    Wallet,
    ExternalLink,
    AlertCircle,
} from "lucide-react";

import { db } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import fundraisersBackground from "../image/fundraisers-background.webp";
// Форматування суми
const formatMoney = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: 0,
    }).format(value);
};

// Перевірка зовнішнього посилання
const getSafeBankUrl = (value) => {
    try {
        const url = new URL(value);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
};

// Окремий блок благодійного збору
const FundraiserCard = ({ fundraiser }) => {
    const bankUrl = getSafeBankUrl(fundraiser.bankUrl);

    return (
        <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.05)]">
            <div className="grid lg:grid-cols-[1fr_1.05fr]">
                {/* Ліва частина — інформація */}
                <div className="flex flex-col bg-slate-50/80 p-6 sm:p-9 lg:p-10">
                    <h2 className="break-words text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                        {fundraiser.purpose}
                    </h2>

                    <div className="mt-7">
                        <p className="text-sm font-semibold text-slate-500">
                            Для кого:
                        </p>

                        <p className="mt-2 break-words text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                            {fundraiser.recipient}
                        </p>
                    </div>

                    <div className="mt-7 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <Wallet size={18} />
                            Необхідна сума
                        </div>

                        <p className="mt-3 break-words text-3xl font-black tracking-tight text-blue-600 sm:text-4xl">
                            {formatMoney(fundraiser.amount)}
                        </p>
                    </div>

                    {fundraiser.description && (
                        <div className="mt-7">
                            <h3 className="text-base font-bold text-slate-900">
                                Про збір
                            </h3>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 sm:text-base">
                                {fundraiser.description}
                            </p>
                        </div>
                    )}

                    <p className="mt-auto pt-8 text-xs leading-5 text-slate-400">
                        Пожертва здійснюється безпосередньо
                        через платіжну сторінку за посиланням
                        організатора збору.
                    </p>
                </div>

                {/* Права частина — перехід до банки */}
                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
                    <div className="mb-7 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <HeartHandshake size={28} />
                        </div>

                        <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                            Підтримати збір
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Ви можете перейти до офіційної
                            платіжної сторінки та зробити внесок.
                        </p>
                    </div>

                    {/* Блок, стилізований під платіжну форму */}
                    <div className="rounded-[20px] border border-blue-200 bg-blue-50/40 p-5 sm:p-7">
                        <p className="text-center text-sm leading-6 text-slate-600">
                            Натисніть кнопку нижче, щоб
                            відкрити банку та обрати суму внеску.
                        </p>

                        {bankUrl ? (
                            <a
                                href={bankUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                            >
                                Перейти до банки
                                <ArrowUpRight size={20} />
                            </a>
                        ) : (
                            <div className="mt-6 rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-500">
                                Посилання на банку недоступне
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                        <ExternalLink size={14} />
                        Оплата відкриється на зовнішньому сайті
                    </div>
                </div>
            </div>
        </article>
    );
};

const Fundraisers = () => {
    const [fundraisers, setFundraisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const q = query(
            collection(db, "fundraisers"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setFundraisers(data);
                setError("");
                setLoading(false);
            },
            (err) => {
                console.error(
                    "Помилка завантаження зборів:",
                    err
                );

                setError(
                    "Не вдалося завантажити благодійні збори."
                );
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            {/* Навбар */}
            <Navbar />

            <main className="flex-1">
                {/* Заголовок */}
                {/* Заголовок із фоновим зображенням */}
                <section
                    className="
        relative flex min-h-[360px]
        items-center justify-center
        bg-cover bg-center bg-no-repeat
        sm:min-h-[430px]
        md:min-h-[500px] md:bg-fixed
    "
                    style={{
                        backgroundImage: `url(${fundraisersBackground})`,
                    }}
                >
                    {/* Затемнення фонового фото */}
                    <div className="absolute inset-0 bg-slate-950/50" />

                    {/* Плавне затемнення знизу */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/40" />

                    {/* Заголовок і опис */}
                    <div className="relative z-10 mx-auto max-w-5xl px-5 text-center sm:px-6">
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                            Благодійні збори
                        </h1>

                        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-8 text-white sm:mt-7 sm:text-2xl sm:leading-10">
                            Підтримуйте важливі ініціативи Рахова та району.
                            Кожен внесок має значення.
                        </p>
                    </div>
                </section>

                {/* Збори */}
                <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                    {loading && (
                        <div className="space-y-6">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-96 animate-pulse rounded-3xl bg-slate-200/60"
                                />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center">
                            <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />

                            <p className="font-semibold text-slate-800">
                                {error}
                            </p>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        fundraisers.length === 0 && (
                            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
                                <HeartHandshake
                                    size={42}
                                    className="mx-auto mb-4 text-blue-600"
                                />

                                <h2 className="text-xl font-bold text-slate-900">
                                    Наразі зборів немає
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Нові благодійні збори
                                    з'являться тут.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        fundraisers.length > 0 && (
                            <div className="space-y-8">
                                {fundraisers.map((fundraiser) => (
                                    <FundraiserCard
                                        key={fundraiser.id}
                                        fundraiser={fundraiser}
                                    />
                                ))}
                            </div>
                        )}
                </section>
            </main>

            {/* Футер */}
            <Footer />
        </div>
    );
};

export default Fundraisers;
