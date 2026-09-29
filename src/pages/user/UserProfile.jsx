import {
    useEffect,
    useState,
} from "react";

import {
    arrayRemove,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import {
    deleteUser,
    EmailAuthProvider,
    onAuthStateChanged,
    reauthenticateWithCredential,
    updatePassword,
} from "firebase/auth";

import {
    useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
    auth,
    db,
} from "../../firebase";


const UserProfile = () => {
    const navigate =
        useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [form, setForm] =
        useState({
            login: "",
            phone: "",
            password: "",
        });


    useEffect(() => {
        let isActive = true;

        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (currentUser) => {
                    if (!currentUser) {
                        if (isActive) {
                            navigate(
                                "/",
                                {
                                    replace: true,
                                }
                            );
                        }

                        return;
                    }

                    try {
                        const userRef = doc(
                            db,
                            "users",
                            currentUser.uid
                        );

                        const userSnapshot =
                            await getDoc(
                                userRef
                            );

                        if (!isActive) {
                            return;
                        }

                        if (
                            !userSnapshot.exists()
                        ) {
                            navigate(
                                "/",
                                {
                                    replace: true,
                                }
                            );

                            return;
                        }

                        const userData =
                            userSnapshot.data();

                        setForm({
                            login:
                                userData.login ||
                                "",

                            phone:
                                userData.phone ||
                                "",

                            password: "",
                        });
                    } catch (error) {
                        console.error(
                            "Помилка завантаження профілю:",
                            error
                        );

                        if (isActive) {
                            await Swal.fire({
                                icon: "error",
                                title: "Помилка",
                                text:
                                    "Не вдалося завантажити дані профілю.",
                                confirmButtonColor:
                                    "#2563eb",
                            });
                        }
                    } finally {
                        if (isActive) {
                            setLoading(false);
                        }
                    }
                }
            );

        return () => {
            isActive = false;
            unsubscribe();
        };
    }, [navigate]);


    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (currentForm) => ({
                ...currentForm,
                [name]: value,
            })
        );
    };


    const requestCurrentPassword =
        async ({
            title,
            text,
            confirmButtonText,
            confirmButtonColor =
                "#2563eb",
        }) => {
            const result =
                await Swal.fire({
                    title,
                    text,
                    input: "password",
                    inputLabel:
                        "Поточний пароль",
                    inputPlaceholder:
                        "Введіть поточний пароль",
                    inputAttributes: {
                        autocomplete:
                            "current-password",
                        autocapitalize:
                            "off",
                    },
                    showCancelButton:
                        true,
                    confirmButtonText,
                    cancelButtonText:
                        "Скасувати",
                    confirmButtonColor,
                    cancelButtonColor:
                        "#64748b",
                    reverseButtons:
                        true,
                    inputValidator:
                        (value) => {
                            if (!value) {
                                return "Введіть поточний пароль.";
                            }

                            return undefined;
                        },
                });

            if (
                !result.isConfirmed ||
                !result.value
            ) {
                return null;
            }

            return result.value;
        };


    const reauthenticateUser =
        async (
            currentUser,
            password
        ) => {
            if (!currentUser.email) {
                throw new Error(
                    "Firebase email користувача відсутній."
                );
            }

            const credential =
                EmailAuthProvider.credential(
                    currentUser.email,
                    password
                );

            await reauthenticateWithCredential(
                currentUser,
                credential
            );
        };


    const updateUserListings =
        async (
            userId,
            login
        ) => {
            const listingsQuery =
                query(
                    collection(
                        db,
                        "listings"
                    ),
                    where(
                        "author.uid",
                        "==",
                        userId
                    )
                );

            const snapshot =
                await getDocs(
                    listingsQuery
                );

            if (snapshot.empty) {
                return;
            }

            const batch =
                writeBatch(db);

            snapshot.docs.forEach(
                (listingDocument) => {
                    batch.update(
                        listingDocument.ref,
                        {
                            authorName:
                                login,

                            "author.login":
                                login,
                        }
                    );
                }
            );

            await batch.commit();
        };


    const handleSave =
        async (event) => {
            event.preventDefault();

            const currentUser =
                auth.currentUser;

            if (!currentUser) {
                await Swal.fire({
                    icon: "error",
                    title: "Сесію завершено",
                    text:
                        "Увійдіть у свій обліковий запис повторно.",
                    confirmButtonColor:
                        "#2563eb",
                });

                navigate(
                    "/",
                    {
                        replace: true,
                    }
                );

                return;
            }

            const login =
                form.login.trim();

            const newPassword =
                form.password;

            if (!login) {
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Вкажіть ім’я",
                    text:
                        "Поле імені не може бути порожнім.",
                    confirmButtonColor:
                        "#2563eb",
                });

                return;
            }

            if (
                newPassword &&
                newPassword.length < 6
            ) {
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Короткий пароль",
                    text:
                        "Новий пароль повинен містити щонайменше 6 символів.",
                    confirmButtonColor:
                        "#2563eb",
                });

                return;
            }

            setSaving(true);

            try {
                if (newPassword) {
                    const currentPassword =
                        await requestCurrentPassword({
                            title:
                                "Підтвердження зміни пароля",
                            text:
                                "Для зміни пароля введіть поточний пароль.",
                            confirmButtonText:
                                "Підтвердити",
                        });

                    if (
                        !currentPassword
                    ) {
                        return;
                    }

                    try {
                        await reauthenticateUser(
                            currentUser,
                            currentPassword
                        );
                    } catch (error) {
                        console.error(
                            "Помилка повторної авторизації:",
                            error
                        );

                        await Swal.fire({
                            icon: "error",
                            title:
                                "Невірний пароль",
                            text:
                                "Поточний пароль введено неправильно.",
                            confirmButtonColor:
                                "#2563eb",
                        });

                        return;
                    }

                    await updatePassword(
                        currentUser,
                        newPassword
                    );
                }

                const userRef = doc(
                    db,
                    "users",
                    currentUser.uid
                );

                await updateDoc(
                    userRef,
                    {
                        login,
                    }
                );

                await updateUserListings(
                    currentUser.uid,
                    login
                );

                setForm(
                    (currentForm) => ({
                        ...currentForm,
                        login,
                        password: "",
                    })
                );

                await Swal.fire({
                    toast: true,
                    position:
                        "top-end",
                    icon: "success",
                    title:
                        newPassword
                            ? "Профіль і пароль оновлено"
                            : "Дані профілю оновлено",
                    showConfirmButton:
                        false,
                    timer: 1800,
                    timerProgressBar:
                        true,
                });
            } catch (error) {
                console.error(
                    "Помилка оновлення профілю:",
                    error
                );

                let message =
                    "Не вдалося зберегти зміни.";

                if (
                    error?.code ===
                    "auth/weak-password"
                ) {
                    message =
                        "Новий пароль занадто слабкий.";
                }

                if (
                    error?.code ===
                    "auth/requires-recent-login"
                ) {
                    message =
                        "Для зміни пароля потрібно повторно підтвердити вхід.";
                }

                await Swal.fire({
                    icon: "error",
                    title: "Помилка",
                    text: message,
                    confirmButtonColor:
                        "#2563eb",
                });
            } finally {
                setSaving(false);
            }
        };


    const removeUserFromFavorites =
        async (userId) => {
            const favoritesQuery =
                query(
                    collection(
                        db,
                        "listings"
                    ),
                    where(
                        "favoriteUserIds",
                        "array-contains",
                        userId
                    )
                );

            const snapshot =
                await getDocs(
                    favoritesQuery
                );

            if (snapshot.empty) {
                return;
            }

            const batch =
                writeBatch(db);

            snapshot.docs.forEach(
                (listingDocument) => {
                    batch.update(
                        listingDocument.ref,
                        {
                            favoriteUserIds:
                                arrayRemove(
                                    userId
                                ),
                        }
                    );
                }
            );

            await batch.commit();
        };


    const deleteUserViews =
        async (userId) => {
            const viewerId =
                `user_${userId}`;

            const viewsQuery =
                query(
                    collection(
                        db,
                        "listingViews"
                    ),
                    where(
                        "viewerId",
                        "==",
                        viewerId
                    )
                );

            const snapshot =
                await getDocs(
                    viewsQuery
                );

            if (snapshot.empty) {
                return;
            }

            const batch =
                writeBatch(db);

            snapshot.docs.forEach(
                (viewDocument) => {
                    batch.delete(
                        viewDocument.ref
                    );
                }
            );

            await batch.commit();
        };


    const deleteUserListings =
        async (userId) => {
            const listingsQuery =
                query(
                    collection(
                        db,
                        "listings"
                    ),
                    where(
                        "author.uid",
                        "==",
                        userId
                    )
                );

            const snapshot =
                await getDocs(
                    listingsQuery
                );

            if (snapshot.empty) {
                return;
            }

            const batch =
                writeBatch(db);

            snapshot.docs.forEach(
                (listingDocument) => {
                    batch.delete(
                        listingDocument.ref
                    );
                }
            );

            await batch.commit();
        };


    const deleteUserDocument =
        async (userId) => {
            await deleteDoc(
                doc(
                    db,
                    "users",
                    userId
                )
            );
        };


    const handleDeleteProfile =
        async () => {
            const currentUser =
                auth.currentUser;

            if (!currentUser) {
                await Swal.fire({
                    icon: "error",
                    title: "Сесію завершено",
                    text:
                        "Увійдіть у свій обліковий запис повторно.",
                    confirmButtonColor:
                        "#2563eb",
                });

                navigate(
                    "/",
                    {
                        replace: true,
                    }
                );

                return;
            }

            const confirmation =
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Видалити профіль?",
                    html: `
                        <div style="text-align:center;">
                            Цю дію неможливо скасувати.
                            <br><br>
                            Буде видалено ваш профіль,
                            усі ваші оголошення,
                            перегляди, обране та
                            пов'язані з профілем дані.
                        </div>
                    `,
                    showCancelButton:
                        true,
                    confirmButtonText:
                        "Продовжити",
                    cancelButtonText:
                        "Скасувати",
                    confirmButtonColor:
                        "#dc2626",
                    cancelButtonColor:
                        "#64748b",
                    reverseButtons:
                        true,
                });

            if (
                !confirmation.isConfirmed
            ) {
                return;
            }

            const currentPassword =
                await requestCurrentPassword({
                    title:
                        "Підтвердження видалення",
                    text:
                        "Для остаточного видалення профілю введіть поточний пароль.",
                    confirmButtonText:
                        "Підтвердити видалення",
                    confirmButtonColor:
                        "#dc2626",
                });

            if (!currentPassword) {
                return;
            }

            setDeleting(true);

            try {
                /*
                 * ВАЖЛИВО:
                 * повторну авторизацію робимо ДО
                 * видалення будь-яких даних.
                 *
                 * Якщо пароль неправильний,
                 * нічого не буде видалено.
                 */
                try {
                    await reauthenticateUser(
                        currentUser,
                        currentPassword
                    );
                } catch (error) {
                    console.error(
                        "Помилка повторної авторизації:",
                        error
                    );

                    await Swal.fire({
                        icon: "error",
                        title:
                            "Невірний пароль",
                        text:
                            "Профіль не видалено. Поточний пароль введено неправильно.",
                        confirmButtonColor:
                            "#2563eb",
                    });

                    return;
                }

                const userId =
                    currentUser.uid;

                /*
                 * 1. Видаляємо UID користувача
                 *    з усіх списків обраного.
                 */
                await removeUserFromFavorites(
                    userId
                );

                /*
                 * 2. Видаляємо всі перегляди
                 *    користувача.
                 */
                await deleteUserViews(
                    userId
                );

                /*
                 * 3. Видаляємо всі оголошення
                 *    користувача.
                 */
                await deleteUserListings(
                    userId
                );

                /*
                 * 4. Видаляємо документ профілю
                 *    users/{uid}.
                 */
                await deleteUserDocument(
                    userId
                );

                /*
                 * 5. В останню чергу видаляємо
                 *    Firebase Authentication.
                 *
                 * Після цього Firebase автоматично
                 * завершує сесію користувача.
                 */
                await deleteUser(
                    currentUser
                );

                await Swal.fire({
                    icon: "success",
                    title:
                        "Профіль видалено",
                    text:
                        "Ваш профіль та пов'язані з ним дані успішно видалено.",
                    confirmButtonColor:
                        "#2563eb",
                });

                navigate(
                    "/",
                    {
                        replace: true,
                    }
                );
            } catch (error) {
                console.error(
                    "Помилка видалення профілю:",
                    error
                );

                let message =
                    "Не вдалося повністю видалити профіль. Спробуйте ще раз.";

                if (
                    error?.code ===
                    "auth/requires-recent-login"
                ) {
                    message =
                        "Для видалення профілю потрібно повторно підтвердити вхід.";
                }

                await Swal.fire({
                    icon: "error",
                    title:
                        "Не вдалося видалити профіль",
                    text: message,
                    confirmButtonColor:
                        "#2563eb",
                });
            } finally {
                setDeleting(false);
            }
        };


    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-100">
                <Navbar />

                <main className="flex flex-1 items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                        Завантаження профілю...
                    </div>
                </main>

                <Footer />
            </div>
        );
    }


    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                            Особистий кабінет
                        </span>

                        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Мій профіль
                        </h1>

                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            Керуйте своїми особистими даними
                            та налаштуваннями облікового запису.
                        </p>
                    </section>


                    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21a8 8 0 0 0-16 0" />

                                    <circle
                                        cx="12"
                                        cy="7"
                                        r="4"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Особисті дані
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Інформація, яка використовується
                                    у вашому профілі RBoard.
                                </p>
                            </div>
                        </div>


                        <form
                            onSubmit={
                                handleSave
                            }
                            className="mt-8"
                        >
                            <div className="grid gap-6 md:grid-cols-2">

                                <div>
                                    <label
                                        htmlFor="login"
                                        className="mb-2 block text-sm font-bold text-slate-700"
                                    >
                                        Ім’я / логін
                                    </label>

                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M20 21a8 8 0 0 0-16 0" />

                                            <circle
                                                cx="12"
                                                cy="7"
                                                r="4"
                                            />
                                        </svg>

                                        <input
                                            id="login"
                                            name="login"
                                            type="text"
                                            value={
                                                form.login
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            autoComplete="name"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                    </div>
                                </div>


                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="mb-2 block text-sm font-bold text-slate-700"
                                    >
                                        Номер телефону
                                    </label>

                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                                        </svg>

                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={
                                                form.phone
                                            }
                                            readOnly
                                            className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 pl-12 pr-4 text-sm font-medium text-slate-500 outline-none"
                                        />
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Номер телефону використовується
                                        для входу в обліковий запис
                                        і не може бути змінений.
                                    </p>
                                </div>


                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-bold text-slate-700"
                                    >
                                        Новий пароль
                                    </label>

                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                width="18"
                                                height="11"
                                                x="3"
                                                y="11"
                                                rx="2"
                                                ry="2"
                                            />

                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>

                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                form.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            autoComplete="new-password"
                                            placeholder="Залиште порожнім, якщо не хочете змінювати"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) =>
                                                        !current
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            title={
                                                showPassword
                                                    ? "Приховати пароль"
                                                    : "Показати пароль"
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Приховати пароль"
                                                    : "Показати пароль"
                                            }
                                        >
                                            {showPassword ? (
                                                <svg
                                                    className="h-5 w-5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="m3 3 18 18" />
                                                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                                                    <path d="M9.88 4.24A10.43 10.43 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.08 3.19" />
                                                    <path d="M6.61 6.61C3.84 8.5 2 12 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="h-5 w-5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />

                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="3"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Залиште поле порожнім,
                                        якщо не хочете змінювати пароль.
                                        Новий пароль повинен містити
                                        щонайменше 6 символів.
                                    </p>
                                </div>
                            </div>


                            <div className="mt-8 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                                            Збереження...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                                                <path d="M17 21v-8H7v8" />
                                                <path d="M7 3v5h8" />
                                            </svg>

                                            Зберегти зміни
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>


                    <section className="mt-6 rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black text-red-700">
                                    Видалення профілю
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    Профіль, усі ваші оголошення,
                                    перегляди, обране та пов’язані
                                    з обліковим записом дані будуть
                                    видалені без можливості відновлення.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleDeleteProfile
                                }
                                disabled={
                                    deleting ||
                                    saving
                                }
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />

                                        Видалення...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 6h18" />
                                            <path d="M8 6V4h8v2" />
                                            <path d="M19 6l-1 14H6L5 6" />
                                            <path d="M10 11v5" />
                                            <path d="M14 11v5" />
                                        </svg>

                                        Видалити профіль
                                    </>
                                )}
                            </button>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserProfile;