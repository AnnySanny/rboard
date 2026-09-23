import { useEffect, useMemo, useState } from "react";
import {
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import AdminNavbar from "./AdminNavbar";

const adminPages = {
    dashboard: {
        path: "/dashboard",
        title: "Панель керування",
    },

    listings: {
        path: "/dashboard/listings",
        title: "Оголошення",
    },

    notifications: {
        path: "/dashboard/notifications",
        title: "Повідомлення",
    },

    "create-listing": {
        path: "/dashboard/admin-create-listing",
        title: "Додати оголошення",
    },

    users: {
        path: "/dashboard/users",
        title: "Користувачі",
    },

    contacts: {
        path: "/dashboard/contacts",
        title: "Зв’язок",
    },

    news: {
        path: "/dashboard/news",
        title: "Новини",
    },

    touristPlaces: {
        path: "/dashboard/tourist-places",
        title: "Тур-місця",
    },

    statistics: {
        path: "/dashboard/statistics",
        title: "Статистика",
    },

    logs: {
        path: "/dashboard/logs",
        title: "Логи системи",
    },
};

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [openTabs, setOpenTabs] = useState([
        "dashboard",
    ]);

const activePageKey = useMemo(() => {
    /*
     * Сторінка редагування оголошення
     * належить до вкладки "Оголошення".
     */
    if (
        location.pathname.startsWith(
            "/dashboard/listings/"
        )
    ) {
        return "listings";
    }

    const currentPage = Object.entries(
        adminPages
    ).find(
        ([, page]) =>
            page.path === location.pathname
    );

    return (
        currentPage?.[0] ||
        "dashboard"
    );
}, [location.pathname]);

    /*
     * Якщо користувач потрапив на сторінку
     * напряму або через браузер — автоматично
     * додаємо її у відкриті вкладки.
     */
    useEffect(() => {
        setOpenTabs((currentTabs) => {
            if (
                currentTabs.includes(
                    activePageKey
                )
            ) {
                return currentTabs;
            }

            return [
                ...currentTabs,
                activePageKey,
            ];
        });
    }, [activePageKey]);

    /*
     * Відкрити вкладку
     */
    const openTab = (pageKey) => {
        const page =
            adminPages[pageKey];

        if (!page) {
            return;
        }

        setOpenTabs((currentTabs) => {
            if (
                currentTabs.includes(
                    pageKey
                )
            ) {
                return currentTabs;
            }

            return [
                ...currentTabs,
                pageKey,
            ];
        });

        navigate(page.path);
    };

    /*
     * Закрити вкладку
     */
    const closeTab = (pageKey) => {
        setOpenTabs((currentTabs) => {
            const tabIndex =
                currentTabs.indexOf(
                    pageKey
                );

            if (tabIndex === -1) {
                return currentTabs;
            }

            const newTabs =
                currentTabs.filter(
                    (tab) =>
                        tab !== pageKey
                );

            /*
             * Не дозволяємо закрити
             * останню вкладку
             */
            if (newTabs.length === 0) {
                navigate(
                    adminPages.dashboard.path
                );

                return ["dashboard"];
            }

            /*
             * Якщо закриваємо активну вкладку,
             * переходимо на сусідню.
             */
            if (
                pageKey ===
                activePageKey
            ) {
                const nextTab =
                    newTabs[tabIndex] ||
                    newTabs[
                    tabIndex - 1
                    ] ||
                    "dashboard";

                navigate(
                    adminPages[
                        nextTab
                    ].path
                );
            }

            return newTabs;
        });
    };

    /*
     * Просто активувати існуючу вкладку
     */
    const activateTab = (pageKey) => {
        const page =
            adminPages[pageKey];

        if (!page) {
            return;
        }

        navigate(page.path);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <AdminNavbar
                onOpenTab={openTab}
            />

            <main className="min-w-0 lg:ml-64">
                {/* ========================= */}
                {/* ВКЛАДКИ */}
                {/* ========================= */}

                <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                    <div className="flex h-12 items-end overflow-x-auto px-3 sm:px-5">
                        {openTabs.map(
                            (pageKey) => {
                                const page =
                                    adminPages[
                                    pageKey
                                    ];

                                if (!page) {
                                    return null;
                                }

                                const isActive =
                                    pageKey ===
                                    activePageKey;

                                return (
                                    <div
                                        key={pageKey}
                                        className={`group flex h-10 w-[160px] shrink-0 items-center border-r border-slate-200 ${isActive
                                                ? "border-t-2 border-t-blue-600 bg-slate-100"
                                                : "bg-white"
                                            }`}
                                    >
                                        {/* Назва вкладки */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                activateTab(
                                                    pageKey
                                                )
                                            }
                                            className={`flex min-w-0 flex-1 items-center px-4 text-left text-sm font-semibold transition ${isActive
                                                    ? "text-slate-950"
                                                    : "text-slate-500 hover:text-slate-900"
                                                }`}
                                        >
                                            <span className="truncate">
                                                {
                                                    page.title
                                                }
                                            </span>
                                        </button>

                                        {/* Закрити */}
                                        <button
                                            type="button"
                                            onClick={(
                                                event
                                            ) => {
                                                event.stopPropagation();

                                                closeTab(
                                                    pageKey
                                                );
                                            }}
                                            className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                                            aria-label={`Закрити ${page.title}`}
                                        >
                                            <span className="text-lg leading-none">
                                                ×
                                            </span>
                                        </button>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>

                {/* ========================= */}
                {/* КОНТЕНТ */}
                {/* ========================= */}

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;