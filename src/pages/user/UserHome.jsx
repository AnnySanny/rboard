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
} from "lucide-react";

import {
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
        let unsubscribeListings = null;

        const unsubscribeAuth =
            onAuthStateChanged(
                auth,
                (currentUser) => {
                    if (
                        unsubscribeListings
                    ) {
                        unsubscribeListings();
                        unsubscribeListings =
                            null;
                    }

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

                    unsubscribeListings =
                        onSnapshot(
                            listingsQuery,
                            (
                                snapshot
                            ) => {
                                const listings =
                                    snapshot.docs.map(
                                        (
                                            document
                                        ) => ({
                                            id:
                                                document.id,

                                            ...document.data(),
                                        })
                                    );

                                const approved =
                                    listings.filter(
                                        (
                                            listing
                                        ) =>
                                            listing.status ===
                                            "approved"
                                    ).length;

                                const pending =
                                    listings.filter(
                                        (
                                            listing
                                        ) =>
                                            listing.status ===
                                            "pending"
                                    ).length;

                                const views =
                                    listings.reduce(
                                        (
                                            total,
                                            listing
                                        ) =>
                                            total +
                                            Number(
                                                listing.views ??
                                                    0
                                            ),
                                        0
                                    );

                                setStatistics({
                                    total:
                                        listings.length,

                                    approved,

                                    pending,

                                    views,
                                });

                                setLoading(false);
                            },
                            (error) => {
                                console.error(
                                    "Помилка завантаження статистики:",
                                    error
                                );

                                setLoading(false);
                            }
                        );
                }
            );

        return () => {
            unsubscribeAuth();

            if (
                unsubscribeListings
            ) {
                unsubscribeListings();
            }
        };
    }, []);


    /*
     * =========================================
     * ШВИДКІ ДІЇ
     * =========================================
     */

    const quickActions = [
        {
            title:
                "Додати оголошення",

            description:
                "Створіть нове оголошення та надішліть його на публікацію.",

            path:
                "/user/create-listing",

            action:
                "Створити",

            icon:
                Plus,
        },

        {
            title:
                "Мої оголошення",

            description:
                "Переглядайте, редагуйте та керуйте власними оголошеннями.",

            path:
                "/user/listings",

            action:
                "Переглянути",

            icon:
                List,
        },

        {
            title:
                "Мій профіль",

            description:
                "Переглядайте та змінюйте інформацію свого профілю.",

            path:
                "/user/profile",

            action:
                "Відкрити",

            icon:
                User,
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

                    <section className="mt-10">
                        <div>
                            <h2 className="
                                text-xl
                                font-black
                                text-slate-950
                                sm:text-2xl
                            ">
                                Швидкі дії
                            </h2>

                            <p className="
                                mt-1
                                text-sm
                                text-slate-500
                            ">
                                Основні можливості
                                особистого кабінету.
                            </p>
                        </div>


                        <div className="
                            mt-5
                            grid
                            gap-4
                            md:grid-cols-3
                        ">
                            {quickActions.map(
                                ({
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
                                            group
                                            rounded-2xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-6
                                            shadow-sm
                                            transition
                                            duration-200
                                            hover:-translate-y-0.5
                                            hover:border-blue-200
                                            hover:shadow-md
                                        "
                                    >
                                        <div className="
                                            flex
                                            h-11 w-11
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-blue-50
                                            text-blue-600
                                            transition
                                            group-hover:bg-blue-600
                                            group-hover:text-white
                                        ">
                                            <Icon
                                                size={22}
                                            />
                                        </div>

                                        <h3 className="
                                            mt-4
                                            text-lg
                                            font-bold
                                            text-slate-950
                                        ">
                                            {title}
                                        </h3>

                                        <p className="
                                            mt-2
                                            text-sm
                                            leading-6
                                            text-slate-500
                                        ">
                                            {description}
                                        </p>

                                        <div className="
                                            mt-5
                                            flex
                                            items-center
                                            gap-2
                                            text-sm
                                            font-semibold
                                            text-blue-600
                                        ">
                                            {action}

                                            <ArrowRight
                                                size={16}
                                                className="
                                                    transition
                                                    group-hover:translate-x-1
                                                "
                                            />
                                        </div>
                                    </Link>
                                )
                            )}
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserHome;