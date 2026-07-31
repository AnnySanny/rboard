import { useState } from "react";
import { NavLink } from "react-router-dom";

import Modal from "./Modal";
import LoginModal from "./auth/LoginModal";
import RegisterModal from "./auth/RegisterModal";

const Navbar = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const navLinkClass = ({ isActive }) =>
        `text-sm font-medium transition ${isActive
            ? "text-blue-600"
            : "text-slate-600 hover:text-blue-600"
        }`;

    const mobileNavLinkClass = ({ isActive }) =>
        `block rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive
            ? "bg-blue-50 text-blue-600"
            : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
        }`;

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    const openLoginModal = () => {
        setShowMobileMenu(false);
        setShowRegister(false);
        setShowLogin(true);
    };

    const openRegisterModal = () => {
        setShowMobileMenu(false);
        setShowLogin(false);
        setShowRegister(true);
    };

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <NavLink
                        to="/"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3"
                    >
                        <img
                            src="/logo.png"
                            alt="RBoard"
                            className="h-10 w-10 object-contain"
                        />

                        <span className="text-xl font-black tracking-tight text-slate-950">
                            RBoard
                        </span>
                    </NavLink>

                    {/* Навігація для комп’ютерів */}
                    <nav className="hidden items-center gap-7 md:flex">
                        <NavLink
                            to="/"
                            end
                            className={navLinkClass}
                        >
                            Оголошення
                        </NavLink>

                        <NavLink
                            to="/about"
                            className={navLinkClass}
                        >
                            Про сервіс
                        </NavLink>

                        <NavLink
                            to="/contacts"
                            className={navLinkClass}
                        >
                            Контакти
                        </NavLink>
                    </nav>

                    {/* Кнопки для комп’ютерів */}
                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            type="button"
                            onClick={openLoginModal}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                            Вхід
                        </button>

                        <button
                            type="button"
                            onClick={openRegisterModal}
                            className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Реєстрація
                        </button>
                    </div>

                    {/* Бургер для мобільних */}
                    <button
                        type="button"
                        onClick={() =>
                            setShowMobileMenu((previousValue) => !previousValue)
                        }
                        aria-label={
                            showMobileMenu
                                ? "Закрити меню"
                                : "Відкрити меню"
                        }
                        aria-expanded={showMobileMenu}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                    >
                        {showMobileMenu ? (
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        ) : (
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 6h16" />
                                <path d="M4 12h16" />
                                <path d="M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Мобільне меню */}
                <div
                    className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 md:hidden ${showMobileMenu
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 border-t-transparent opacity-0"
                        }`}
                >
                    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                        <nav className="space-y-2">
                            <NavLink
                                to="/"
                                end
                                onClick={closeMobileMenu}
                                className={mobileNavLinkClass}
                            >
                                Оголошення
                            </NavLink>

                            <NavLink
                                to="/about"
                                onClick={closeMobileMenu}
                                className={mobileNavLinkClass}
                            >
                                Про сервіс
                            </NavLink>

                            <NavLink
                                to="/contacts"
                                onClick={closeMobileMenu}
                                className={mobileNavLinkClass}
                            >
                                Контакти
                            </NavLink>
                        </nav>

                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={openLoginModal}
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                                Вхід
                            </button>

                            <button
                                type="button"
                                onClick={openRegisterModal}
                                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Реєстрація
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <Modal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            >
                <LoginModal />
            </Modal>

            <Modal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
            >
                <RegisterModal />
            </Modal>
        </>
    );
};

export default Navbar;