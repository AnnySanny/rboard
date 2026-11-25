import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Rocket,
    Palette,
    Store,
    Megaphone,
    UserRound,
    Handshake,
} from "lucide-react";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import { db } from "../../firebase";
import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";

import backgroundImage from "../../image/background.webp";
import backgroundAutumn from "../../image/background-autumn.webp";
import backgroundWinter from "../../image/background-winter.webp";

const getSeasonBackground = () => {
    const month = new Date().getMonth();

    if (month >= 8 && month <= 10) {
        return backgroundAutumn;
    }

    if (month === 11 || month <= 1) {
        return backgroundWinter;
    }

    return backgroundImage;
};

const benefits = [
    {
        icon: Rocket,
        title: "Пріоритетний показ",
        description:
            "Ваші оголошення отримують пріоритет під час показу на RBoard та привертають більше уваги користувачів.",
        color: "border-blue-100 bg-blue-50",
        iconColor: "bg-blue-600 text-white",
    },
    {
        icon: Palette,
        title: "Унікальний дизайн",
        description:
            "Особливе оформлення карток та сторінок деталей оголошень, яке виділяє ваші пропозиції серед інших.",
        color: "border-violet-100 bg-violet-50",
        iconColor: "bg-violet-100 text-violet-600",
    },
    {
        icon: Store,
        title: "Власна сторінка",
        description:
            "Окремий розділ ваших оголошень у профілі зі зручним переглядом, пошуком та фільтрацією.",
        color: "border-emerald-100 bg-emerald-50",
        iconColor: "bg-emerald-100 text-emerald-600",
    },
    {
        icon: Megaphone,
        title: "Просування бізнесу",
        description:
            "Можливість поширення інформації про ваш бізнес, товари та послуги в соціальних мережах RBoard.",
        color: "border-orange-100 bg-orange-50",
        iconColor: "bg-orange-100 text-orange-600",
    },
];

const Partners = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const seasonBackground = getSeasonBackground();

    useEffect(() => {
        let active = true;

        const loadPartners = async () => {
            try {
                const snapshot = await getDocs(
                    query(
                        collection(db, "publicProfiles"),
                        where("partner", "==", true)
                    )
                );

                if (!active) return;

                const items = snapshot.docs
                    .map((document) => ({
                        ...document.data(),
                        uid: document.id,
                    }))
                    .sort((a, b) =>
                        (a.login || "").localeCompare(
                            b.login || "",
                            "uk"
                        )
                    );

                setPartners(items);
            } catch (err) {
                if (!active) return;

                console.error(
                    "Помилка завантаження партнерів:",
                    err
                );

                setError(
                    "Не вдалося завантажити список партнерів."
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        loadPartners();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1">

                {/* Паралакс та партнери */}
                <section
                    className="relative flex min-h-[440px] items-center justify-center bg-cover bg-center bg-no-repeat py-10 sm:min-h-[500px] sm:py-14 md:bg-fixed"
                    style={{
                        backgroundImage: `url(${seasonBackground})`,
                    }}
                >
                    <div className="absolute inset-0 bg-slate-950/50" />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/30" />

                    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">

                        {/* Заголовок */}
                        {/* Заголовок */}
                        <div className="text-center">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-sm">
                                Партнерська програма RBoard
                            </span>

                            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                                Наші партнери
                            </h1>

                            <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-7 text-white/90 sm:mt-5 sm:text-xl sm:leading-8">
                                Підтримуємо локальний бізнес. Розвиваємося разом.
                            </p>
                        </div>

                        {/* Список партнерів */}
                        <div className="mt-8 sm:mt-12">
                            {loading ? (
                                <div className="flex min-h-[240px] items-center justify-center">
                                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                                </div>
                            ) : error ? (
                                <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center text-sm text-red-600">
                                    {error}
                                </div>
                            ) : partners.length === 0 ? (
                                <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl bg-white p-8 text-center">
                                    <Handshake
                                        size={36}
                                        strokeWidth={1.5}
                                        className="text-slate-400"
                                    />

                                    <p className="mt-3 text-sm font-medium text-slate-500">
                                        Інформація про партнерів поки відсутня.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">

                                    {partners.map((partner) => (
                                        <Link
                                            key={partner.uid}
                                            to={`/user/${partner.uid}`}
                                            className="group relative flex w-full max-w-[290px] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-blue-400"
                                        >

                                            {/* Статус партнера */}
                                            <div className="flex items-center justify-center gap-1.5 bg-slate-50 px-4 py-3">
                                                <BadgeCheck
                                                    size={15}
                                                    strokeWidth={2}
                                                    className="text-amber-600"
                                                />

                                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                                    Партнер RBoard
                                                </span>
                                            </div>

                                            {/* Логотип партнера */}
                                            <div className="flex items-center justify-center px-6 pb-2 pt-5">
                                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:border-blue-300 sm:h-36 sm:w-36">
                                                    {partner.avatarUrl ? (
                                                        <img
                                                            src={partner.avatarUrl}
                                                            alt={partner.login || "Партнер"}
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                            className="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <UserRound
                                                            size={64}
                                                            strokeWidth={1.2}
                                                            className="text-slate-300"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Назва та опис */}
                                            <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-2 text-center">

                                                <h2 className="break-words text-xl font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-blue-700 sm:text-2xl">
                                                    {partner.login || "Без імені"}
                                                </h2>

                                                {partner.bio?.trim() && (
                                                    <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-500">
                                                        {partner.bio}
                                                    </p>
                                                )}

                                            </div>

                                            {/* Перехід до профілю */}
                                            <div className="mx-5 mt-auto border-t border-slate-100">
                                                <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-slate-600 transition-colors group-hover:text-blue-600">

                                                    Переглянути профіль

                                                    <ArrowUpRight
                                                        size={17}
                                                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                                    />

                                                </div>
                                            </div>

                                        </Link>
                                    ))}

                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Переваги партнерства */}
                <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">

                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
                            Можливості для бізнесу
                        </span>

                        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Що дає партнерство?
                        </h2>

                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
                            Додаткові можливості для представлення,
                            просування та розвитку вашого бізнесу на RBoard.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5">

                        {benefits.map((benefit) => {
                            const Icon = benefit.icon;

                            return (
                                <div
                                    key={benefit.title}
                                    className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:rounded-3xl sm:p-7 ${benefit.color}`}
                                >
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${benefit.iconColor}`}
                                    >
                                        <Icon
                                            size={23}
                                            strokeWidth={1.8}
                                        />
                                    </div>

                                    <h3 className="mt-4 text-base font-bold leading-tight text-slate-950 sm:mt-5 sm:text-xl">
                                        {benefit.title}
                                    </h3>

                                    <p className="mt-2 text-xs leading-5 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                                        {benefit.description}
                                    </p>
                                </div>
                            );
                        })}

                    </div>
                </section>

                {/* Блок співпраці */}
                <section className="border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:rounded-3xl sm:p-10">

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">

                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white sm:h-20 sm:w-20 sm:rounded-3xl">
                                        <Handshake
                                            size={32}
                                            strokeWidth={1.7}
                                        />
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                                            Співпраця з RBoard
                                        </span>

                                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                            Станьте частиною RBoard
                                        </h2>

                                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                                            Маєте власний бізнес або надаєте послуги?
                                            Зв'яжіться з нами, щоб обговорити
                                            можливості партнерства.
                                        </p>
                                    </div>

                                </div>

                                <Link
                                    to="/contacts"
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:px-8 sm:py-4"
                                >
                                    Стати партнером
                                    <ArrowRight size={18} />
                                </Link>

                            </div>
                        </div>

                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default Partners;