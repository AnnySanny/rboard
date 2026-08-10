import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import {
    LayoutDashboard,
    List,
    PlusCircle,
    Users,
    MessageSquare,
    Newspaper,
    ScrollText,
    LogOut,
    Menu,
    X,
} from "lucide-react";

import Swal from "sweetalert2";

import { auth } from "../../firebase";

const menuItems = [
    {
        key: "dashboard",
        to: "/dashboard",
        title: "Головна",
        icon: LayoutDashboard,
    },
    {
        key: "listings",
        to: "/dashboard/listings",
        title: "Оголошення",
        icon: List,
    },
    {
        key: "create-listing",
        to: "/dashboard/admin-create-listing",
        title: "Додати оголошення",
        icon: PlusCircle,
    },
    {
        key: "users",
        to: "/dashboard/users",
        title: "Користувачі",
        icon: Users,
    },
    {
        key: "contacts",
        to: "/dashboard/contacts",
        title: "Зв’язок",
        icon: MessageSquare,
    },
    {
        key: "news",
        to: "/dashboard/news",
        title: "Новини",
        icon: Newspaper,
    },
    {
        key: "logs",
        to: "/dashboard/logs",
        title: "Логи системи",
        icon: ScrollText,
    },
];

const AdminNavbar = ({ onOpenTab }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const handleNavigation = (pageKey) => {
        if (onOpenTab) {
            onOpenTab(pageKey);
        }

        setMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);

            navigate("/", {
                replace: true,
            });
        } catch (error) {
            console.error(
                "Помилка виходу:",
                error
            );

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title:
                    "Не вдалося вийти із системи",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }
    };

const isActive = (pageKey) => {
    const item = menuItems.find(
        (menuItem) => menuItem.key === pageKey
    );

    if (!item) {
        return false;
    }

    return location.pathname === item.to;
};

    return (
        <>


            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
                    <div>
                        <div className="text-xl font-black tracking-tight text-slate-950">
                            RBoard
                        </div>

                        <div className="text-xs font-medium text-slate-400">
                            Адміністративна панель
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(
                                item.key
                            );

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() =>
                                        handleNavigation(
                                            item.key
                                        )
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                        active
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                    }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />

                                    <span>
                                        {item.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout */}
                <div className="border-t border-slate-200 p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />

                        Вийти
                    </button>
                </div>
            </aside>

            {/* ============================= */}
            {/* MOBILE HEADER */}
            {/* ============================= */}

            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
                <div>
                    <div className="text-lg font-black tracking-tight text-slate-950">
                        RBoard
                    </div>

                    <div className="text-[10px] font-medium text-slate-400">
                        Адмін-панель
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setMobileMenuOpen(
                            (value) => !value
                        )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                    aria-label={
                        mobileMenuOpen
                            ? "Закрити меню"
                            : "Відкрити меню"
                    }
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </header>

            {/* ============================= */}
            {/* MOBILE MENU */}
            {/* ============================= */}

            {mobileMenuOpen && (
                <div className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden">
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(
                                item.key
                            );

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() =>
                                        handleNavigation(
                                            item.key
                                        )
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                        active
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                                    }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />

                                    <span>
                                        {item.title}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Mobile logout */}
                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-100"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />

                            Вийти
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminNavbar;