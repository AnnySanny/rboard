import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    Plus,
    List,
    User,
    ArrowRight,
    CalendarDays,
    Clock3,
    Eye,
    FileText,
    CircleCheck,
    Clock,
    Loader2,
    LayoutDashboard,
    MessageCircle,
    CircleHelp,
} from "lucide-react";

import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";

import {
    auth,
    db,
} from "../../firebase";


const formatDate = (date) => {
    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(date);
};


const formatWeekday = (date) => {
    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            weekday: "short",
        }
    )
        .format(date)
        .replace(".", "")
        .toUpperCase();
};


const formatTime = (date) => {
    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    ).format(date);
};


const UserHome = () => {
    const [currentDate, setCurrentDate] =
        useState(new Date());
    const [statistics, setStatistics] =
        useState({
            total: 0,
            approved: 0,
            pending: 0,
            views: 0,
        });

    const [loading, setLoading] =
        useState(true);


    /*
     * =========================================
     * ЖИВИЙ ЧАС
     * =========================================
     */

    useEffect(() => {
        const interval =
            setInterval(() => {
                setCurrentDate(
                    new Date()
                );
            }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);


    /*
     * =========================================
     * FIREBASE AUTH + ОГОЛОШЕННЯ
     * =========================================
     */


    useEffect(() => {
        let active = true;

        const unsubscribeAuth =
            onAuthStateChanged(
                auth,
                async (currentUser) => {
                    if (!currentUser) {
                        setStatistics({
                            total: 0,
                            approved: 0,
                            pending: 0,
                            views: 0,
                        });

                        setLoading(false);
                        return;
                    }

                    setLoading(true);

                    const listingsQuery =
                        query(
                            collection(
                                db,
                                "listings"
                            ),
                            where(
                                "author.uid",
                                "==",
                                currentUser.uid
                            )
                        );

                    try {
                        const snapshot =
                            await getDocs(listingsQuery);

                        if (
                            !active ||
                            auth.currentUser?.uid !== currentUser.uid
                        ) {
                            return;
                        }

                        const listings =
                            snapshot.docs.map(
                                (document) => ({
                                    id: document.id,
                                    ...document.data(),
                                })
                            );

                        const approved =
                            listings.filter(
                                (listing) =>
                                    listing.status ===
                                    "approved"
                            ).length;

                        const pending =
                            listings.filter(
                                (listing) =>
                                    listing.status ===
                                    "pending"
                            ).length;

                        const views =
                            listings.reduce(
                                (total, listing) =>
                                    total +
                                    Number(
                                        listing.views ?? 0
                                    ),
                                0
                            );

                        setStatistics({
                            total: listings.length,
                            approved,
                            pending,
                            views,
                        });

                    } catch (error) {
                        if (
                            !active ||
                            auth.currentUser?.uid !== currentUser.uid
                        ) {
                            return;
                        }

                        console.error(
                            "Помилка завантаження статистики:",
                            error
                        );

                    } finally {
                        if (
                            active &&
                            auth.currentUser?.uid === currentUser.uid
                        ) {
                            setLoading(false);
                        }
                    }
                }
            );

        return () => {
            active = false;
            unsubscribeAuth();
        };
    }, []);



    /*
     * =========================================
     * ШВИДКІ ДІЇ
     * =========================================
     */


    const quickActions = [
        {
            title: "Додати оголошення",
            description: "Маєте що продати, запропонувати або шукаєте щось? Розмістіть оголошення на RBoard.",
            path: "/create-listing",
            action: "Створити оголошення",
            icon: Plus,
        },
        {
            title: "Мої оголошення",
            description: "Керування публікаціями",
            path: "/user/listings",
            action: "Переглянути",
            icon: List,
        },
        {
            title: "Мої чати",
            description: "Повідомлення користувачів",
            path: "/user/chats",
            action: "Відкрити",
            icon: MessageCircle,
        },
        {
            title: "Мій профіль",
            description: "Особисті дані",
            path: "/user/profile",
            action: "Переглянути",
            icon: User,
        },
        {
            title: "Допомога",
            description: "Питання та відповіді",
            path: "/help",
            action: "Переглянути",
            icon: CircleHelp,
        },
    ];



    return (
        <div className="
            flex min-h-screen
            flex-col
            bg-slate-100
        ">
            <Navbar />

            <main className="flex-1">
                <div className="
                    mx-auto
                    max-w-6xl
                    px-4
                    py-8
                    sm:px-6
                    sm:py-12
                ">

                    {/* =================================
                        ПРИВІТАННЯ
                    ================================== */}

                    <section className="
                        overflow-hidden
                        rounded-3xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm
                    ">
                        <div className="
                            flex
                            flex-col
                            gap-7
                            p-6
                            sm:p-8
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        ">
                            <div>
                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-bold
                                    uppercase
                                    tracking-widest
                                    text-blue-600
                                ">
                                    <LayoutDashboard
                                        size={18}
                                    />

                                    Особистий кабінет
                                </div>

                                <h1 className="
                                    mt-3
                                    text-3xl
                                    font-black
                                    tracking-tight
                                    text-slate-950
                                    sm:text-4xl
                                ">
                                    Вітаємо в RBoard!
                                </h1>

                                <p className="
                                    mt-3
                                    max-w-2xl
                                    text-base
                                    leading-7
                                    text-slate-600
                                ">
                                    Керуйте своїми
                                    оголошеннями,
                                    переглядайте їхню
                                    активність та
                                    створюйте нові
                                    публікації.
                                </p>
                            </div>


                            {/* ДАТА І ЧАС */}

                            <div className="
                                shrink-0
                                rounded-2xl
                                border
                                border-blue-100
                                bg-blue-50/70
                                p-5
                                sm:min-w-[280px]
                            ">
                                <div className="
                                    flex
                                    items-center
                                    gap-3
                                ">
                                    <div className="
                                        flex
                                        h-11 w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-blue-600
                                        shadow-sm
                                    ">
                                        <CalendarDays
                                            size={21}
                                        />
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            font-bold
                                            uppercase
                                            tracking-wider
                                            text-slate-400
                                        ">
                                            Сьогодні
                                        </p>

                                        <p className="
                                            mt-0.5
                                            text-lg
                                            font-black
                                            text-slate-950
                                        ">
                                            {formatDate(
                                                currentDate
                                            )}

                                            <span className="
                                                ml-2
                                                text-blue-600
                                            ">
                                                {formatWeekday(
                                                    currentDate
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="
                                    my-4
                                    h-px
                                    bg-blue-100
                                " />

                                <div className="
                                    flex
                                    items-center
                                    gap-3
                                ">
                                    <Clock3
                                        size={20}
                                        className="
                                            text-blue-600
                                        "
                                    />

                                    <span className="
                                        font-mono
                                        text-2xl
                                        font-black
                                        tracking-tight
                                        text-slate-950
                                    ">
                                        {formatTime(
                                            currentDate
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* =================================
                        СТАТИСТИКА
                    ================================== */}

                    <section className="mt-8">
                        <div className="
                            flex
                            items-end
                            justify-between
                            gap-4
                        ">
                            <div>
                                <h2 className="
                                    text-xl
                                    font-black
                                    text-slate-950
                                    sm:text-2xl
                                ">
                                    Моя статистика
                                </h2>

                                <p className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                ">
                                    Коротка інформація
                                    про ваші оголошення.
                                </p>
                            </div>

                            {loading && (
                                <Loader2
                                    size={20}
                                    className="
                                        animate-spin
                                        text-blue-600
                                    "
                                />
                            )}
                        </div>


                        <div className="
                            mt-5
                            grid
                            gap-4
                            sm:grid-cols-2
                            lg:grid-cols-4
                        ">

                            {/* ВСЬОГО */}

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                            ">
                                <div className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                ">
                                    <div>
                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-500
                                        ">
                                            Всього оголошень
                                        </p>

                                        <p className="
                                            mt-2
                                            text-3xl
                                            font-black
                                            text-slate-950
                                        ">
                                            {loading
                                                ? "—"
                                                : statistics.total}
                                        </p>
                                    </div>

                                    <div className="
                                        flex
                                        h-11 w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-50
                                        text-blue-600
                                    ">
                                        <FileText
                                            size={21}
                                        />
                                    </div>
                                </div>

                                <Link
                                    to="/user/listings"
                                    className="
                                        group
                                        mt-4
                                        flex
                                        items-center
                                        gap-1.5
                                        text-sm
                                        font-semibold
                                        text-blue-600
                                    "
                                >
                                    Переглянути

                                    <ArrowRight
                                        size={15}
                                        className="
                                            transition
                                            group-hover:translate-x-1
                                        "
                                    />
                                </Link>
                            </div>


                            {/* АКТИВНІ */}

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                            ">
                                <div className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                ">
                                    <div>
                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-500
                                        ">
                                            Активні
                                        </p>

                                        <p className="
                                            mt-2
                                            text-3xl
                                            font-black
                                            text-slate-950
                                        ">
                                            {loading
                                                ? "—"
                                                : statistics.approved}
                                        </p>
                                    </div>

                                    <div className="
                                        flex
                                        h-11 w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-emerald-50
                                        text-emerald-600
                                    ">
                                        <CircleCheck
                                            size={21}
                                        />
                                    </div>
                                </div>

                                <p className="
                                    mt-4
                                    text-sm
                                    text-slate-500
                                ">
                                    Опубліковано на RBoard
                                </p>
                            </div>


                            {/* МОДЕРАЦІЯ */}

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                            ">
                                <div className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                ">
                                    <div>
                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-500
                                        ">
                                            На модерації
                                        </p>

                                        <p className="
                                            mt-2
                                            text-3xl
                                            font-black
                                            text-slate-950
                                        ">
                                            {loading
                                                ? "—"
                                                : statistics.pending}
                                        </p>
                                    </div>

                                    <div className="
                                        flex
                                        h-11 w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-amber-50
                                        text-amber-600
                                    ">
                                        <Clock
                                            size={21}
                                        />
                                    </div>
                                </div>

                                <p className="
                                    mt-4
                                    text-sm
                                    text-slate-500
                                ">
                                    Очікують перевірки
                                </p>
                            </div>


                            {/* ПЕРЕГЛЯДИ */}

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                            ">
                                <div className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                ">
                                    <div>
                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-500
                                        ">
                                            Перегляди
                                        </p>

                                        <p className="
                                            mt-2
                                            text-3xl
                                            font-black
                                            text-slate-950
                                        ">
                                            {loading
                                                ? "—"
                                                : statistics.views}
                                        </p>
                                    </div>

                                    <div className="
                                        flex
                                        h-11 w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-violet-50
                                        text-violet-600
                                    ">
                                        <Eye
                                            size={21}
                                        />
                                    </div>
                                </div>

                                <p className="
                                    mt-4
                                    text-sm
                                    text-slate-500
                                ">
                                    На всіх оголошеннях
                                </p>
                            </div>
                        </div>
                    </section>


                    {/* =================================
                        ШВИДКІ ДІЇ
                    ================================== */}


                    {/* =================================
    ШВИДКІ ДІЇ
================================== */}

                    <section className="mt-10">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                                Швидкі дії
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Усе необхідне для керування акаунтом.
                            </p>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">

                            {/* ГОЛОВНА ДІЯ */}
                            {quickActions.slice(0, 1).map(({
                                title,
                                description,
                                path,
                                action,
                                icon: Icon,
                            }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    className="
                    group relative flex flex-col
                    justify-between overflow-hidden
                    rounded-2xl border border-blue-200
                    bg-gradient-to-br
                    from-blue-50 via-white to-indigo-50
                    p-5 shadow-sm
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-blue-400
                    hover:shadow-md
                    sm:p-6
                "
                                >
                                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-100/60 blur-2xl" />

                                    <div className="relative">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                            <Icon size={23} />
                                        </div>

                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            {title}
                                        </h3>

                                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                            {description}
                                        </p>
                                    </div>

                                    <div className="relative mt-5 flex items-center gap-2 text-sm font-bold text-blue-600">
                                        <span>{action}</span>

                                        <ArrowRight
                                            size={17}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </div>
                                </Link>
                            ))}

                            {/* ІНШІ ШВИДКІ ДІЇ */}
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.slice(1).map(({
                                    title,
                                    description,
                                    path,
                                    icon: Icon,
                                }) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        className="
                        group flex min-w-0 flex-col
                        rounded-2xl border border-slate-200
                        bg-white p-3.5 shadow-sm
                        transition-all duration-200
                        hover:-translate-y-0.5
                        hover:border-blue-300
                        hover:shadow-md
                        sm:p-4
                    "
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="
                            flex h-10 w-10 shrink-0
                            items-center justify-center
                            rounded-xl bg-blue-50
                            text-blue-600
                            transition-colors
                            group-hover:bg-blue-600
                            group-hover:text-white
                        ">
                                                <Icon size={20} />
                                            </div>

                                            <ArrowRight
                                                size={16}
                                                className="
                                mt-1 shrink-0 text-slate-300
                                transition-all
                                group-hover:translate-x-1
                                group-hover:text-blue-600
                            "
                                            />
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <h3 className="text-sm font-bold leading-5 text-slate-900 transition-colors group-hover:text-blue-600 sm:text-base">
                                                {title}
                                            </h3>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>


                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserHome;