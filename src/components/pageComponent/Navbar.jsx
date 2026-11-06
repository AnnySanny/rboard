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

import { auth } from "../../firebase";
import { stopAndRemoveUserPresence } from "../../utils/userPresence";
import {
    LogOut,
    User,
    Plus,
    Info,
    Instagram,
    Ellipsis,
} from "lucide-react";

import {
    FaTelegramPlane,
    FaFacebookF,
} from "react-icons/fa";

import Modal from "../ui/Modal";
import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegisterModal";
import OnboardingModal from "../onboarding/OnboardingModal";
import { useChatNotifications } from "../../context/ChatNotificationsContext";
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
    useState(() => auth.currentUser);

const [authLoading, setAuthLoading] =
    useState(() => !auth.currentUser);

    const [loginChecking, setLoginChecking] = useState(false);
    const userMode = Boolean(currentUser);
    const { unreadCount } = useChatNotifications();

    const unreadLabel =
        unreadCount > 99 ? "99+" : unreadCount;



        
useEffect(() => {
    let active = true;
    let generation = 0;

    const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
            const currentGeneration = ++generation;

            if (!user) {
                if (active) {
                    setCurrentUser(null);
                    setAuthLoading(false);
                    setLoginChecking(false);
                }
                return;
            }

            if (active) {
                setLoginChecking(true);
            }

            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const { db } = await import("../../firebase");

                const userSnapshot = await getDoc(
                    doc(db, "users", user.uid)
                );

                if (!active || currentGeneration !== generation) {
                    return;
                }

                if (
                    !userSnapshot.exists() ||
                    userSnapshot.data().blocked === true
                ) {
                    setCurrentUser(null);
                    return;
                }

                setCurrentUser(user);
            } catch (error) {
                console.error(
                    "Помилка перевірки користувача:",
                    error
                );

                if (active && currentGeneration === generation) {
                    setCurrentUser(null);
                }
            } finally {
                if (active && currentGeneration === generation) {
                    setLoginChecking(false);
                    setAuthLoading(false);
                }
            }
        }
    );

    return () => {
        active = false;
        generation++;
        unsubscribe();
    };
}, []);

useEffect(() => {
    if (currentUser && !loginChecking) {
        setShowLogin(false);
        setShowRegister(false);
    }
}, [currentUser, loginChecking]);
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

    // Збори — десктопне меню
    const fundraiserNavClass = ({ isActive }) =>
        `fundraiser-link ${isActive ? "fundraiser-link--active" : ""}`;

    // Збори — мобільне меню
    const fundraiserMobileClass = ({ isActive }) =>
        `fundraiser-link fundraiser-link--mobile ${isActive ? "fundraiser-link--active" : ""
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
            const user = auth.currentUser;

            if (user) {
                try {
                    await stopAndRemoveUserPresence(user.uid);
                } catch (error) {
                    console.error(
                        "Помилка очищення статусу користувача:",
                        error
                    );
                }
            }

            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Помилка виходу:", error);
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

                <div
                    className={`
        mx-auto flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6
        ${userMode ? "max-w-[1600px]" : "max-w-6xl"}
    `}
                >


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




                        {/* Посилання та онбординг */}
                        <div className="relative shrink-0">

                            {/* Великі екрани: всі іконки окремо */}
                            <div className="flex items-center gap-2 lg:hidden xl:flex">

                                {/* Онбординг */}
                                <button
                                    type="button"
                                    onClick={openOnboarding}
                                    title="Що таке RBoard?"
                                    aria-label="Що таке RBoard?"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <Info size={16} strokeWidth={2.2} />
                                </button>

                                {/* Instagram */}
                                <a
                                    href="https://www.instagram.com/rakhivboard?stkn=MWZxdmY5bDYzejBnag%3D%3D"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Instagram RBoard"
                                    aria-label="Instagram RBoard"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                                >
                                    <Instagram size={16} />
                                </a>

                                {/* Telegram */}
                                <a
                                    href="https://t.me/RBoard_Rakhiv_Bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Telegram-бот RBoard"
                                    aria-label="Telegram-бот RBoard"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-500"
                                >
                                    <FaTelegramPlane size={15} />
                                </a>

                                {/* Facebook */}
                                <a
                                    href="https://www.facebook.com/profile.php?id=61595151419973"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Facebook RBoard"
                                    aria-label="Facebook RBoard"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <FaFacebookF size={15} />
                                </a>
                            </div>

                            {/* Вузькі екрани: одна кнопка з випадним меню */}
                            <div className="group relative hidden lg:block xl:hidden">

                                <button
                                    type="button"
                                    aria-label="Додаткові посилання RBoard"
                                    title="Додаткові посилання"
                                    aria-haspopup="true"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 group-focus-within:border-blue-300 group-focus-within:text-blue-600"
                                >
                                    <Ellipsis size={19} strokeWidth={2.2} />
                                </button>

                                {/* Меню вниз */}
                                <div
                                    className="pointer-events-none absolute left-1/2 top-full z-[70] w-12 -translate-x-1/2 translate-y-1 rounded-2xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100"
                                >
                                    <div className="flex flex-col items-center gap-1.5">

                                        <button
                                            type="button"
                                            onClick={openOnboarding}
                                            title="Що таке RBoard?"
                                            aria-label="Що таке RBoard?"
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <Info size={17} />
                                        </button>

                                        <a
                                            href="https://www.instagram.com/rakhivboard?stkn=MWZxdmY5bDYzejBnag%3D%3D"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Instagram RBoard"
                                            aria-label="Instagram RBoard"
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
                                        >
                                            <Instagram size={17} />
                                        </a>

                                        <a
                                            href="https://t.me/RBoard_Rakhiv_Bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Telegram-бот RBoard"
                                            aria-label="Telegram-бот RBoard"
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-sky-50 hover:text-sky-500"
                                        >
                                            <FaTelegramPlane size={16} />
                                        </a>

                                        <a
                                            href="https://www.facebook.com/profile.php?id=61595151419973"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Facebook RBoard"
                                            aria-label="Facebook RBoard"
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <FaFacebookF size={16} />
                                        </a>

                                    </div>
                                </div>
                            </div>

                        </div>



                    </div>


                    <nav
                        className={`
        hidden items-center lg:flex
        ${userMode ? "gap-4 xl:gap-5" : "gap-7"}
    `}
                    >
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
                                    to="/user/chats"
                                    className={({ isActive }) =>
                                        `inline-flex items-center gap-1.5 text-sm font-medium transition ${isActive
                                            ? "text-blue-600"
                                            : "text-slate-600 hover:text-blue-600"
                                        }`
                                    }
                                >
                                    Чати

                                    {unreadCount > 0 && (
                                        <span className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white">
                                            {unreadLabel}
                                        </span>
                                    )}
                                </NavLink>

                                <NavLink
                                    to="/help"
                                    className={navLinkClass}
                                >
                                    Допомога
                                </NavLink>
                                <NavLink
                                    to="/fundraisers"
                                    className={fundraiserNavClass}
                                >
                                    Збір для ЗСУ
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
                                <NavLink
                                    to="/fundraisers"
                                    className={fundraiserNavClass}
                                >
                                    Збір для ЗСУ
                                </NavLink>
                            </>
                        )}

                    </nav>

                    <div className="hidden items-center gap-3 lg:flex">

                        {userMode ? (
                            <>


                                {/* Профіль */}
                                <NavLink
                                    to="/user/profile"
                                    aria-label="Мій профіль"
                                    title="Мій профіль"
                                    className={({ isActive }) =>
                                        `flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition active:scale-95
        xl:h-auto xl:w-auto xl:gap-2 xl:rounded-xl xl:px-4 xl:py-2 xl:text-sm xl:font-semibold
        ${isActive
                                            ? "border-blue-200 bg-blue-50 text-blue-600"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                        }`
                                    }
                                >
                                    <User
                                        size={17}
                                        strokeWidth={2.2}
                                    />

                                    <span className="hidden xl:inline">
                                        Профіль
                                    </span>
                                </NavLink>



                                {/* Вихід з акаунта */}
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    aria-label="Вийти з акаунта"
                                    title="Вийти з акаунта"
                                    className="
        flex h-8 w-8 shrink-0 items-center justify-center
        rounded-full border border-slate-200 bg-white
        text-slate-500 transition active:scale-95
        hover:border-red-200 hover:bg-red-50 hover:text-red-600

        xl:h-auto xl:w-auto xl:gap-2
        xl:rounded-xl xl:px-4 xl:py-2
        xl:text-sm xl:font-semibold
    "
                                >
                                    <LogOut
                                        size={17}
                                        strokeWidth={2.2}
                                    />

                                    <span className="hidden xl:inline">
                                        Вийти
                                    </span>
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
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
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
                    className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 lg:hidden ${showMobileMenu
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
                                        to="/user/chats"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        <span className="flex items-center justify-between gap-3">
                                            <span>Чати</span>

                                            {unreadCount > 0 && (
                                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                                                    {unreadLabel}
                                                </span>
                                            )}
                                        </span>
                                    </NavLink>

                                    <NavLink
                                        to="/help"
                                        onClick={closeMobileMenu}
                                        className={mobileNavLinkClass}
                                    >
                                        Допомога
                                    </NavLink>
                                    <NavLink
                                        to="/fundraisers"
                                        className={fundraiserNavClass}
                                    >
                                        Збір для ЗСУ
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
                                    <NavLink
                                        to="/fundraisers"
                                        onClick={closeMobileMenu}
                                        className={fundraiserMobileClass}
                                    >
                                        Збір для ЗСУ
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

            </header >

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
            )
            }
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={closeOnboarding}
                onRegister={openRegisterFromOnboarding}
            />
        </>
    );
};

export default Navbar;