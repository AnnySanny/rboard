import { Link, Navigate } from "react-router-dom";

import {
    Trophy,
    Users,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";

import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";
import ContestFirstBoot from "../../components/contest/ContestFirstBoot";
import { useContest } from "../../context/ContestContext";

import backgroundImage from "../../image/contest-background.png";


const Contest = () => {
    const {
        contest,
        loading,
        error,
        isSynced,
        isContestEnabled,
    } = useContest();

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f8ff] px-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

                    <h1 className="mt-4 text-xl font-black text-slate-950">
                        Не вдалося завантажити конкурс
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
                    >
                        На головну
                    </Link>
                </div>
            </div>
        );
    }

    if (loading || !isSynced) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f8ff]">
                <LoaderCircle className="h-9 w-9 animate-spin text-blue-600" />

                <p className="text-sm font-medium text-slate-500">
                    Завантаження конкурсу...
                </p>
            </div>
        );
    }

    if (!contest || !isContestEnabled) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1">

                {/* Головний банер */}

                <section
                    className="relative flex min-h-[360px] items-center justify-center bg-cover bg-center bg-no-repeat sm:min-h-[430px] md:min-h-[500px] md:bg-fixed"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                    }}
                >
                    <div className="absolute inset-0 bg-slate-950/50" />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/40" />

                    <div className="relative z-10 mx-auto max-w-5xl px-5 py-12 text-center sm:px-6">

                        <span className="text-xs font-bold uppercase tracking-widest text-blue-200 sm:text-sm">
                            Святковий конкурс
                        </span>

                        <h1 className="mt-4 break-words text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                            Конкурс RBoard
                        </h1>
                    </div>
                </section>

                {/* Правила конкурсу */}

                <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">

                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
                            Умови участі
                        </span>

                        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Правила конкурсу
                        </h2>

                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                            Ознайомтеся з правилами перед початком пошуків.
                        </p>
                    </div>
                    <div className="mx-auto mt-8 max-w-4xl space-y-4 sm:mt-12">

                        {/* Правило 1 */}
                        {/* Правило 1 */}
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-7">

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                                1
                            </span>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-950 sm:text-xl">
                                    Поширте конкурс
                                </h3>

                                <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:mt-2 sm:text-lg sm:leading-7">
                                    Поширте конкурсну сторіс з нашої офіційної
                                    сторінки в Instagram у своїх історіях.
                                </p>

                                <a
                                    href="https://www.instagram.com/rakhivboard/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex text-xs font-bold text-blue-600 transition hover:text-blue-800 hover:underline sm:mt-3 sm:text-base"
                                >
                                    Перейти до Instagram →
                                </a>
                            </div>

                        </div>

                        {/* Правило 2 */}
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-7">

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                                2
                            </span>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-950 sm:text-xl">
                                    Позначте друга
                                </h3>

                                <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:mt-2 sm:text-lg sm:leading-7">
                                    Позначте щонайменше одного друга в коментарях
                                    під конкурсним дописом на нашій офіційній
                                    сторінці в Instagram.
                                </p>

                                {/* Тут пізніше додамо посилання на конкурсний допис */}
                            </div>

                        </div>

                        {/* Правило 3 */}
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-7">

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                                3
                            </span>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-950 sm:text-xl">
                                    Знаходьте святкові чобітки
                                </h3>

                                <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:mt-2 sm:text-lg sm:leading-7">
                                    Авторизуйтеся або зареєструйтеся на RBoard
                                    та користуйтеся платформою. На сайті приховано
                                    {" "}{contest.totalBoots} святкових чобітків,
                                    які можуть бути будь-де!
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:text-lg sm:leading-7">
                                    Ось так виглядає святковий чобіток:
                                </p>

                                <ContestFirstBoot />
                            </div>

                        </div>

                        {/* Заборонені дії */}
                        <details className="group rounded-xl border border-red-200 bg-red-50 sm:rounded-3xl">

                            <summary className="flex cursor-pointer select-none list-none items-center gap-3 p-4 sm:p-7 [&::-webkit-details-marker]:hidden">

                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-black text-red-600 sm:h-12 sm:w-12 sm:text-2xl">
                                    !
                                </span>

                                <h3 className="min-w-0 flex-1 text-sm font-black leading-5 text-red-700 sm:text-xl sm:leading-7">
                                    Під час конкурсу заборонено
                                </h3>

                                <svg
                                    className="h-4 w-4 shrink-0 text-red-600 transition-transform duration-300 group-open:rotate-180 sm:h-5 sm:w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>

                            </summary>

                            <div className="px-4 pb-4 sm:px-7 sm:pb-7">

                                <div className="border-t border-red-200 pt-4 sm:pt-5">

                                    <ul className="list-disc space-y-2 pl-4 text-sm leading-6 text-slate-700 marker:text-red-500 sm:space-y-3 sm:pl-5 sm:text-base sm:leading-7">

                                        <li>
                                            Використовувати ботів, скрипти, сторонні програми
                                            та інші автоматизовані засоби пошуку чобітків.
                                        </li>

                                        <li>
                                            Використовувати інструменти розробника, вихідний
                                            код сайту або прямі серверні запити для пошуку
                                            чобітків чи зарахування знахідок.
                                        </li>

                                        <li>
                                            Створювати або використовувати декілька облікових
                                            записів для участі в конкурсі однією особою.
                                        </li>

                                        <li>
                                            Використовувати помилки та вразливості сайту
                                            для отримання переваги над іншими учасниками.
                                        </li>

                                        <li>
                                            Публічно поширювати місця розташування прихованих
                                            чобітків або передавати їх іншим учасникам.
                                        </li>

                                        <li>
                                            Накручувати результати, підробляти виконання
                                            умов конкурсу або іншим способом порушувати
                                            принципи чесної участі.
                                        </li>

                                    </ul>

                                    <div className="mt-4 border-t border-red-200 pt-4 sm:mt-5 sm:pt-5">
                                        <p className="text-xs font-semibold leading-5 text-red-700 sm:text-base sm:leading-7">
                                            Адміністрація RBoard залишає за собою право
                                            перевіряти результати учасників та виконання
                                            всіх умов конкурсу. У разі виявлення порушень
                                            учасник може бути дискваліфікований, а його
                                            результати — анульовані.
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </details>

                    </div>
                </section>

                {/* Таблиця лідерів */}

                <section className="border-y border-slate-200 bg-white">

                    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">

                        <div className="text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-16 sm:w-16">
                                <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
                            </div>

                            <span className="mt-5 block text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
                                Результати конкурсу
                            </span>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                Таблиця лідерів
                            </h2>

                            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                                Слідкуйте за результатами учасників
                                та їхніми успіхами у пошуку святкових
                                чобітків.
                            </p>

                        </div>

                        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-12 sm:rounded-3xl">

                            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">

                                <Trophy className="h-5 w-5 text-blue-600" />

                                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                                    Рейтинг учасників
                                </h3>

                            </div>

                            <div className="px-5 py-14 text-center sm:py-20">

                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <Users className="h-8 w-8" />
                                </div>

                                <h3 className="mt-5 text-lg font-bold text-slate-900">
                                    Рейтинг ще недоступний
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Тут відображатимуться користувачі,
                                    які знайшли хоча б один святковий
                                    чобіток.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </div>
    );
};

export default Contest;