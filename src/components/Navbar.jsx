import { useState, useEffect } from "react";
import {
    NavLink,
    useNavigate,
    useLocation,
    Link,
} from "react-router-dom";
import {
    onAuthStateChanged,
    signOut,
} from "firebase/auth";

import { auth } from "../firebase";
import {
    LogOut,
    User,
    Plus,
    Info,
    Instagram,
} from "lucide-react";

import {
    FaTelegramPlane,
} from "react-icons/fa";

import Modal from "./Modal";
import LoginModal from "./auth/LoginModal";
import RegisterModal from "./auth/RegisterModal";
import OnboardingModal from "./onboarding/OnboardingModal";
const getOnboardingImages = () => {
    const isMobile = window.matchMedia(
        "(max-width: 767px)"
    ).matches;

    const folder = isMobile
        ? "/images/mobile"
        : "/images";

    return [
        `${folder}/slide-1.png`,
        `${folder}/slide-2.png`,
        `${folder}/slide-3.png`,
        `${folder}/slide-4.png`,
        `${folder}/slide-5.png`,
    ];
};
const Navbar = () => {
    const [
        isOnboardingOpen,
        setIsOnboardingOpen,
    ] = useState(false);

    const [
        hasSeenOnboarding,
        setHasSeenOnboarding,
    ] = useState(
        () =>
            localStorage.getItem(
                "rboard_onboarding_seen"
            ) === "true"
    );
    const [showLogin, setShowLogin] =
        useState(false);

    const [showRegister, setShowRegister] =
        useState(false);

    const [showMobileMenu, setShowMobileMenu] =
        useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const [currentUser, setCurrentUser] =
        useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);

    const userMode = Boolean(currentUser);
    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                (user) => {
                    setCurrentUser(user);
                    setAuthLoading(false);
                }
            );

        return unsubscribe;
    }, []);
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (location.pathname !== "/") {
            return;
        }

        if (hasSeenOnboarding) {
            return;
        }

        getOnboardingImages().forEach((src) => {
            const image = new Image();
            image.src = src;
        });

        let timerId;

        const startTimer = () => {
            clearTimeout(timerId);

            timerId = setTimeout(() => {
                setIsOnboardingOpen(true);
            }, 5000);
        };

        const handleActivity = () => {
            if (isOnboardingOpen) {
                return;
            }

            startTimer();
        };

        startTimer();

        window.addEventListener(
            "click",
            handleActivity
        );

        window.addEventListener(
            "keydown",
            handleActivity
        );

        window.addEventListener(
            "touchstart",
            handleActivity
        );

        return () => {
            clearTimeout(timerId);

            window.removeEventListener(
                "click",
                handleActivity
            );

            window.removeEventListener(
                "keydown",
                handleActivity
            );

            window.removeEventListener(
                "touchstart",
                handleActivity
            );
        };
    }, [
        authLoading,
        location.pathname,
        hasSeenOnboarding,
        isOnboardingOpen,
    ]);



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
    const openOnboarding = () => {
        getOnboardingImages().forEach((src) => {
            const image = new Image();
            image.src = src;
        });

        setIsOnboardingOpen(true);
    };
    const closeOnboarding = () => {
        localStorage.setItem(
            "rboard_onboarding_seen",
            "true"
        );

        setHasSeenOnboarding(true);
        setIsOnboardingOpen(false);
    };
    const openRegisterFromOnboarding = () => {
        localStorage.setItem(
            "rboard_onboarding_seen",
            "true"
        );

        setHasSeenOnboarding(true);
        setIsOnboardingOpen(false);
        setShowLogin(false);

        setTimeout(() => {
            setShowRegister(true);
        }, 150);
    };

    useEffect(() => {
        const handleOpenRegister = () => {
            setShowMobileMenu(false);
            setShowLogin(false);
            setShowRegister(true);
        };

        window.addEventListener(
            "rboard:open-register",
            handleOpenRegister
        );

        return () => {
            window.removeEventListener(
                "rboard:open-register",
                handleOpenRegister
            );
        };
    }, []);
    const handleLogout = async () => {
        setShowMobileMenu(false);

        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error(
                "Помилка виходу:",
                error
            );
        }
    };

    if (authLoading) {
        return (
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto min-h-16 max-w-6xl px-4 sm:px-6" />
            </header>
        );
    }
    return (

        <>
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">

                <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">


                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="flex shrink-0 items-center"
                        >
                            <img
                                src="/logo.webp"
                                alt="RBoard"
                                className="h-16 w-auto object-contain"
                            />
                        </Link>

                        {/* Інформація про RBoard */}
                        <button
                            type="button"
                            onClick={openOnboarding}
                            aria-label="Що таке RBoard?"
                            title="Що таке RBoard?"
                            className="
            flex h-8 w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            border border-slate-200
            bg-white
            text-slate-500
            transition
            hover:border-blue-200
            hover:bg-blue-50
            hover:text-blue-600
            active:scale-95
        "
                        >
                            <Info
                                size={16}
                                strokeWidth={2.2}
                            />
                        </button>

                        {/* Instagram */}
                        <a
                            href="https://www.instagram.com/rakhivboard?stkn=MWZxdmY5bDYzejBnag%3D%3D"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="RBoard в Instagram"
                            title="Instagram RBoard"
                            className="
            flex h-8 w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            border border-slate-200
            bg-white
            text-slate-500
            transition
            hover:border-pink-200
            hover:bg-pink-50
            hover:text-pink-600
            hover:ring-1
            hover:ring-pink-200
            active:scale-95
        "
                        >
                            <Instagram
                                size={16}
                                strokeWidth={2.2}
                            />
                        </a>

                        {/* Telegram */}
                        <a
                            href="https://t.me/RBoard_Rakhiv_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="RBoard у Telegram"
                            title="Telegram-бот RBoard"
                            className="
            flex h-8 w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            border border-slate-200
            bg-white
            text-slate-500
            transition
            hover:border-sky-200
            hover:bg-sky-50
            hover:text-sky-500
            hover:ring-1
            hover:ring-sky-200
            active:scale-95
        "
                        >
                            <FaTelegramPlane
                                size={15}
                            />
                        </a>
                    </div>


                    <nav className="hidden items-center gap-7 md:flex">

                        {userMode ? (
                            <>

                                <NavLink
                                    to="/"
                                    end
                                    className={navLinkClass}
                                >
                                    Головна
                                </NavLink>
                                <NavLink
                                    to="/user"
                                    end
                                    className={navLinkClass}
                                >
                                    Особистий кабінет
                                </NavLink>


                                <NavLink
                                    to="/create-listing"
                                    className={navLinkClass}
                                >
                                    Додати оголошення
                                </NavLink>



                                <NavLink
                                    to="/user/listings"
                                    className={navLinkClass}
                                >
                                    Мої оголошення
                                </NavLink>
                                <NavLink
                                    to="/help"
                                    className={navLinkClass}
                                >
                                    Допомога
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/"
                                    end
                                    className={navLinkClass}
                                >
                                    Головна
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
                                <NavLink
                                    to="/help"
                                    className={navLinkClass}
                                >
                                    Допомога
                                </NavLink>
                            </>
                        )}

                    </nav>


                    <div className="hidden items-center gap-3 md:flex">

                        {userMode ? (
                            <>
                                <NavLink
                                    to="/user/profile"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${isActive
                                            ? "border-blue-200 bg-blue-50 text-blue-600"
                                            : "border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                        }`
                                    }
                                >
                                    <User
                                        size={17}
                                        strokeWidth={2}
                                    />

                                    Профіль
                                </NavLink>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut
                                        size={17}
                                        strokeWidth={2}
                                    />

                                    Вийти
                                </button>
                            </>
                        ) : (
                            <>

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
                            </>
                        )}

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowMobileMenu(
                                (previousValue) =>
                                    !previousValue
                            )
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

                <div
                    className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 md:hidden ${showMobileMenu
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 border-t-transparent opacity-0"
                        }`}
                >
                    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">

                        {userMode ? (
                            <>
                                <nav className="space-y-2">

                                    <NavLink
                                        to="/"
                                        end
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Головна
                                    </NavLink>
                                    <NavLink
                                        to="/user"
                                        end
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Особистий кабінет
                                    </NavLink>
                                    <NavLink
                                        to="/create-listing"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Plus size={17} />

                                            Додати оголошення
                                        </span>
                                    </NavLink>

                                    <NavLink
                                        to="/user/listings"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Мої оголошення
                                    </NavLink>
                                    <NavLink
                                        to="/help"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Допомога
                                    </NavLink>
                                    <NavLink
                                        to="/user/profile"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        <span className="flex items-center gap-2">
                                            <User size={17} />

                                            Профіль
                                        </span>
                                    </NavLink>

                                </nav>

                                <div className="mt-4 border-t border-slate-100 pt-4">

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        <LogOut
                                            size={17}
                                            strokeWidth={2}
                                        />

                                        Вийти
                                    </button>

                                </div>
                            </>
                        ) : (
                            <>

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
                                    <NavLink
                                        to="/help"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Допомога
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
                            </>
                        )}

                    </div>
                </div>

            </header>

            {!userMode && (
                <>
                    <Modal
                        isOpen={showLogin}
                        onClose={() =>
                            setShowLogin(false)
                        }
                    >
                        <LoginModal />
                    </Modal>

                    <Modal
                        isOpen={showRegister}
                        onClose={() =>
                            setShowRegister(false)
                        }
                    >
                        <RegisterModal />
                    </Modal>
                </>
            )}
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={closeOnboarding}
                onRegister={openRegisterFromOnboarding}
            />
        </>
    );
};

export default Navbar;
