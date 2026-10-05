import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
} from "react-router-dom";

import {
    collection,
    getCountFromServer,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import {
    FaTelegramPlane,
} from "react-icons/fa";
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    FileText,
    Users,
    MessageSquare,
    ShieldCheck,
    PlusCircle,
    Bell,
    Newspaper,
    MapPinned,
    BarChart3,
    Loader2,
    ScrollText,
} from "lucide-react";

import {
    db,
} from "../../firebase";


const getStartOfToday = () => {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
    );
};


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
    const weekday =
        new Intl.DateTimeFormat(
            "uk-UA",
            {
                weekday: "short",
            }
        )
            .format(date)
            .replace(".", "");

    return weekday;
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


const Dashboard = () => {
    const [currentDate, setCurrentDate] =
        useState(new Date());

    const [statistics, setStatistics] =
        useState({
            listings: 0,
            newListings: 0,

            users: 0,
            newUsers: 0,

            telegramUsers: 0,
            newTelegramUsers: 0,

            feedback: 0,
            pendingListings: 0,
        });

    const [statisticsLoading, setStatisticsLoading] =
        useState(true);

    const [statisticsError, setStatisticsError] =
        useState(false);


    /*
     * =========================================
     * ПОТОЧНИЙ ЧАС
     * =========================================
     */

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);


    /*
     * =========================================
     * СТАТИСТИКА
     * =========================================
     */

    useEffect(() => {
        const loadStatistics = async () => {
            try {
                setStatisticsLoading(true);
                setStatisticsError(false);

                const startOfToday =
                    Timestamp.fromDate(
                        getStartOfToday()
                    );

                const listingsRef =
                    collection(
                        db,
                        "listings"
                    );

                const usersRef =
                    collection(
                        db,
                        "users"
                    );
                const telegramUsersRef =
                    collection(
                        db,
                        "telegramSubscribers"
                    );
                const feedbackRef =
                    collection(
                        db,
                        "feedback"
                    );


                /*
                 * Усі запити виконуємо
                 * паралельно.
                 */

                const [
                    listingsSnapshot,
                    newListingsSnapshot,

                    telegramUsersSnapshot,
                    newTelegramUsersSnapshot,

                    usersSnapshot,
                    newUsersSnapshot,

                    feedbackSnapshot,
                    pendingSnapshot,
                ] = await Promise.all([
                    /*
                     * Всього оголошень
                     */
                    getCountFromServer(
                        listingsRef
                    ),

                    /*
                     * Нові оголошення сьогодні
                     */
                    getCountFromServer(
                        query(
                            listingsRef,
                            where(
                                "createdAt",
                                ">=",
                                startOfToday
                            )
                        )
                    ),
                    /*
                     * Всього користувачів,
                     * які запустили Telegram-бота
                     */
                    getCountFromServer(
                        telegramUsersRef
                    ),

                    /*
                     * Нові користувачі
                     * Telegram сьогодні
                     */
                    getCountFromServer(
                        query(
                            telegramUsersRef,
                            where(
                                "createdAt",
                                ">=",
                                startOfToday
                            )
                        )
                    ),
                    /*
                     * Всього користувачів
                     */
                    getCountFromServer(
                        usersRef
                    ),

                    /*
                     * Нові користувачі сьогодні
                     */
                    getCountFromServer(
                        query(
                            usersRef,
                            where(
                                "createdAt",
                                ">=",
                                startOfToday
                            )
                        )
                    ),

                    /*
                     * Нові звернення
                     */
                    getCountFromServer(
                        query(
                            feedbackRef,
                            where(
                                "status",
                                "==",
                                "new"
                            )
                        )
                    ),

                    /*
                     * Оголошення на модерації
                     */
                    getCountFromServer(
                        query(
                            listingsRef,
                            where(
                                "status",
                                "==",
                                "pending"
                            )
                        )
                    ),
                ]);


                setStatistics({
                    listings:
                        listingsSnapshot
                            .data()
                            .count,

                    newListings:
                        newListingsSnapshot
                            .data()
                            .count,

                    users:
                        usersSnapshot
                            .data()
                            .count,

                    newUsers:
                        newUsersSnapshot
                            .data()
                            .count,
                    telegramUsers:
                        telegramUsersSnapshot
                            .data()
                            .count,

                    newTelegramUsers:
                        newTelegramUsersSnapshot
                            .data()
                            .count,
                    feedback:
                        feedbackSnapshot
                            .data()
                            .count,

                    pendingListings:
                        pendingSnapshot
                            .data()
                            .count,
                });
            } catch (error) {
                console.error(
                    "Помилка завантаження статистики:",
                    error
                );

                setStatisticsError(true);
            } finally {
                setStatisticsLoading(false);
            }
        };

        loadStatistics();
    }, []);


    /*
     * =========================================
     * ОСНОВНІ РОЗДІЛИ
     * =========================================
     */

    const navigationItems = [
        {
            title: "Оголошення",
            description:
                "Перегляд, модерація та керування оголошеннями сервісу.",
            path: "/dashboard/listings",
            icon: FileText,
        },
        {
            title: "Користувачі",
            description:
                "Перегляд користувачів, блокування та керування профілями.",
            path: "/dashboard/users",
            icon: Users,
        },
        {
            title: "Зв’язок",
            description:
                "Повідомлення, пропозиції та звернення від користувачів.",
            path: "/dashboard/contacts",
            icon: MessageSquare,
        },
        {
            title: "Створити оголошення",
            description:
                "Швидке створення нового оголошення від адміністратора.",
            path: "/dashboard/create-listing",
            icon: PlusCircle,
        },
        {
            title: "Новини",
            description:
                "Створення та керування новинами сервісу.",
            path: "/dashboard/news",
            icon: Newspaper,
        },
        {
            title: "Сповіщення",
            description:
                "Керування системними повідомленнями для користувачів.",
            path: "/dashboard/notifications",
            icon: Bell,
        },
        {
            title: "Туристичні місця",
            description:
                "Керування туристичними місцями та цікавими локаціями.",
            path: "/dashboard/tourist-places",
            icon: MapPinned,
        },
        {
            title: "Статистика",
            description:
                "Детальні показники використання та активності RBoard.",
            path: "/dashboard/statistics",
            icon: BarChart3,
        },
        {
            title: "Логи системи",
            description:
                "Показ дій адміністрасторів в систем RBoard.",
            path: "/dashboard/logs",
            icon: ScrollText,
        },
    ];


    return (
        <section className="space-y-8">

            {/* =====================================
                HEADER
            ====================================== */}

            <div className="
                overflow-hidden
                rounded-3xl
                border border-slate-200
                bg-white
                shadow-sm
            ">
                <div className="
                    flex flex-col
                    gap-7
                    p-6
                    sm:p-8
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                ">
                    <div>
                        <div className="
                            flex items-center
                            gap-2
                            text-sm
                            font-bold
                            uppercase
                            tracking-wider
                            text-blue-600
                        ">
                            <ShieldCheck
                                size={18}
                            />

                            Панель керування
                        </div>

                        <h1 className="
                            mt-3
                            text-3xl
                            font-black
                            tracking-tight
                            text-slate-950
                            sm:text-4xl
                        ">
                            Вітаємо в адміністративній панелі
                        </h1>

                        <p className="
                            mt-4
                            max-w-2xl
                            text-base
                            leading-7
                            text-slate-600
                            sm:text-lg
                        ">
                            Керуйте оголошеннями,
                            користувачами та іншими
                            розділами сервісу RBoard.
                        </p>
                    </div>


                    {/* Дата і час */}

                    <div className="
                        shrink-0
                        rounded-2xl
                        border border-blue-100
                        bg-blue-50/70
                        p-5
                        sm:min-w-[285px]
                    ">
                        <div className="
                            flex
                            items-center
                            gap-3
                        ">
                            <div className="
                                flex h-11 w-11
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
                                        uppercase
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
            </div>


            {/* =====================================
                СТАТИСТИКА
            ====================================== */}

            <div>
                <div className="
                    mb-4
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
                        ">
                            Коротка статистика
                        </h2>

                        <p className="
                            mt-1
                            text-sm
                            text-slate-500
                        ">
                            Поточний стан сервісу RBoard.
                        </p>
                    </div>

                    {statisticsLoading && (
                        <Loader2
                            size={20}
                            className="
                                animate-spin
                                text-blue-600
                            "
                        />
                    )}
                </div>


                {statisticsError ? (
                    <div className="
                        rounded-2xl
                        border border-red-100
                        bg-red-50
                        px-5 py-4
                        text-sm
                        font-medium
                        text-red-600
                    ">
                        Не вдалося завантажити
                        статистику.
                    </div>
                ) : (
                    <div className="
                        grid
                        gap-4
                        sm:grid-cols-2
                        xl:grid-cols-4
                    ">

                        {/* Оголошення */}

                        <div className="
                            rounded-2xl
                            border border-slate-200
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
                                        Оголошення
                                    </p>

                                    <p className="
                                        mt-2
                                        text-3xl
                                        font-black
                                        text-slate-950
                                    ">
                                        {statisticsLoading
                                            ? "—"
                                            : statistics.listings}
                                    </p>
                                </div>

                                <div className="
                                    flex h-11 w-11
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

                            <div className="
                                mt-4
                                flex
                                items-center
                                gap-2
                                text-sm
                            ">
                                <span className="
                                    rounded-lg
                                    bg-emerald-50
                                    px-2 py-1
                                    font-bold
                                    text-emerald-600
                                ">
                                    +
                                    {statistics.newListings}
                                </span>

                                <span className="
                                    text-slate-500
                                ">
                                    сьогодні
                                </span>
                            </div>
                        </div>


                        {/* Користувачі */}

                        <div className="
    rounded-2xl
    border border-slate-200
    bg-white
    p-5
    shadow-sm
">
                            <p className="
        text-sm
        font-semibold
        text-slate-500
    ">
                                Користувачі
                            </p>


                            <div className="
        mt-4
        grid
        grid-cols-2
        divide-x
        divide-slate-100
    ">

                                {/* Сайт */}

                                <div className="pr-4">

                                    <div className="
                flex
                items-center
                justify-between
                gap-3
            ">
                                        <div>
                                            <p className="
                        text-xs
                        font-semibold
                        text-slate-400
                    ">
                                                Сайт
                                            </p>

                                            <p className="
                        mt-1
                        text-3xl
                        font-black
                        text-slate-950
                    ">
                                                {statisticsLoading
                                                    ? "—"
                                                    : statistics.users}
                                            </p>
                                        </div>


                                        <div className="
                    flex h-10 w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                ">
                                            <Users size={20} />
                                        </div>
                                    </div>


                                    <div className="
                mt-3
                flex
                items-center
                gap-1.5
                text-xs
            ">
                                        <span className="
                    rounded-md
                    bg-emerald-50
                    px-1.5 py-0.5
                    font-bold
                    text-emerald-600
                ">
                                            +{statistics.newUsers}
                                        </span>

                                        <span className="
                    text-slate-400
                ">
                                            сьогодні
                                        </span>
                                    </div>

                                </div>


                                {/* Telegram */}

                                <div className="pl-4">

                                    <div className="
                flex
                items-center
                justify-between
                gap-3
            ">
                                        <div>
                                            <p className="
                        text-xs
                        font-semibold
                        text-slate-400
                    ">
                                                Telegram
                                            </p>

                                            <p className="
                        mt-1
                        text-3xl
                        font-black
                        text-slate-950
                    ">
                                                {statisticsLoading
                                                    ? "—"
                                                    : statistics.telegramUsers}
                                            </p>
                                        </div>


                                        <div className="
                    flex h-10 w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-sky-50
                    text-sky-500
                ">
                                            <FaTelegramPlane
                                                size={19}
                                            />
                                        </div>
                                    </div>


                                    <div className="
                mt-3
                flex
                items-center
                gap-1.5
                text-xs
            ">
                                        <span className="
                    rounded-md
                    bg-emerald-50
                    px-1.5 py-0.5
                    font-bold
                    text-emerald-600
                ">
                                            +{statistics.newTelegramUsers}
                                        </span>

                                        <span className="
                    text-slate-400
                ">
                                            сьогодні
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>


                        {/* Модерація */}

                        <NavLink
                            to="/dashboard/listings"
                            className="
                                group
                                rounded-2xl
                                border border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition
                                hover:border-blue-200
                                hover:shadow-md
                            "
                        >
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
                                        {statisticsLoading
                                            ? "—"
                                            : statistics.pendingListings}
                                    </p>
                                </div>

                                <div className="
                                    flex h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-amber-50
                                    text-amber-600
                                ">
                                    <ShieldCheck
                                        size={21}
                                    />
                                </div>
                            </div>

                            <p className="
                                mt-4
                                text-sm
                                font-semibold
                                text-blue-600
                            ">
                                Переглянути
                                <ArrowRight
                                    size={15}
                                    className="
                                        ml-1
                                        inline
                                        transition
                                        group-hover:translate-x-1
                                    "
                                />
                            </p>
                        </NavLink>


                        {/* Звернення */}

                        <NavLink
                            to="/dashboard/contacts"
                            className="
                                group
                                rounded-2xl
                                border border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition
                                hover:border-blue-200
                                hover:shadow-md
                            "
                        >
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
                                        Нові звернення
                                    </p>

                                    <p className="
                                        mt-2
                                        text-3xl
                                        font-black
                                        text-slate-950
                                    ">
                                        {statisticsLoading
                                            ? "—"
                                            : statistics.feedback}
                                    </p>
                                </div>

                                <div className="
                                    flex h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-50
                                    text-violet-600
                                ">
                                    <MessageSquare
                                        size={21}
                                    />
                                </div>
                            </div>

                            <p className="
                                mt-4
                                text-sm
                                font-semibold
                                text-blue-600
                            ">
                                Переглянути
                                <ArrowRight
                                    size={15}
                                    className="
                                        ml-1
                                        inline
                                        transition
                                        group-hover:translate-x-1
                                    "
                                />
                            </p>
                        </NavLink>
                    </div>
                )}
            </div>


            {/* =====================================
                НАВІГАЦІЯ
            ====================================== */}

            <div>
                <div className="mb-5">
                    <h2 className="
                        text-xl
                        font-black
                        text-slate-950
                    ">
                        Керування сервісом
                    </h2>

                    <p className="
                        mt-1
                        text-sm
                        leading-6
                        text-slate-500
                    ">
                        Швидкий перехід до основних
                        розділів адміністративної панелі.
                    </p>
                </div>

                <div className="
                    grid
                    gap-4
                    sm:grid-cols-2
                    xl:grid-cols-3
                ">
                    {navigationItems.map(
                        ({
                            title,
                            description,
                            path,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className="
                                    group
                                    relative
                                    overflow-hidden
                                    rounded-2xl
                                    border border-slate-200
                                    bg-white
                                    p-5
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
                                    items-start
                                    gap-4
                                ">
                                    <div className="
                                        flex h-11 w-11
                                        shrink-0
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
                                            size={21}
                                        />
                                    </div>

                                    <div className="
                                        min-w-0
                                        flex-1
                                    ">
                                        <div className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                        ">
                                            <h3 className="
                                                font-bold
                                                text-slate-950
                                            ">
                                                {title}
                                            </h3>

                                            <ArrowRight
                                                size={17}
                                                className="
                                                    shrink-0
                                                    text-slate-300
                                                    transition
                                                    group-hover:translate-x-1
                                                    group-hover:text-blue-600
                                                "
                                            />
                                        </div>

                                        <p className="
                                            mt-1.5
                                            text-sm
                                            leading-6
                                            text-slate-500
                                        ">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </NavLink>
                        )
                    )}
                </div>
            </div>
        </section>
    );
};

export default Dashboard;