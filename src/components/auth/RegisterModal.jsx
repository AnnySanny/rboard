import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import {
    User,
    Phone,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";

import {
    doc,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";

import {
    createUserWithEmailAndPassword,
    deleteUser,
} from "firebase/auth";

import {
    auth,
    db,
} from "../../firebase";

const createAuthEmail = (phone) => {
    const normalizedPhone =
        phone.replace(/\D/g, "");

    return `${normalizedPhone}@rboard.local`;
};

const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("380")) {
        digits = digits.slice(3);
    } else if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    digits = digits.slice(0, 9);

    let result = "+380";

    if (digits.length > 0) {
        result += " " + digits.slice(0, 2);
    }
    if (digits.length > 2) {
        result += " " + digits.slice(2, 5);
    }
    if (digits.length > 5) {
        result += " " + digits.slice(5, 7);
    }
    if (digits.length > 7) {
        result += " " + digits.slice(7, 9);
    }

    return result;
};

const validatePhone = (value) => {
    const digits = value.replace(/\D/g, "");

    if (!value || digits === "380") {
        return "Введіть номер телефону";
    }

    if (!/^380\d{9}$/.test(digits)) {
        return "Введіть 9 цифр після +380";
    }

    return "";
};

const validateLogin = (value) => {
    const name = value.trim();

    if (!name) {
        return "Введіть ваше ім'я";
    }

    if (name.length < 2) {
        return "Ім'я має містити щонайменше 2 символи";
    }

    if (name.length > 40) {
        return "Ім'я не може перевищувати 40 символів";
    }

    if (!/^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u.test(name)) {
        return "Використовуйте лише літери, пробіли, дефіс або апостроф";
    }

    return "";
};

const validatePassword = (value) => {
    if (!value) {
        return "Введіть пароль";
    }

    if (value.length < 8) {
        return "Пароль має містити щонайменше 8 символів";
    }

    if (!/\p{L}/u.test(value)) {
        return "Додайте хоча б одну літеру";
    }

    if (!/[0-9]/.test(value)) {
        return "Додайте хоча б одну цифру";
    }

    return "";
};

export default function RegisterModal() {
    const navigate = useNavigate();

    const [login, setLogin] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});


    const validators = {
        login: validateLogin,
        phone: validatePhone,
        password: validatePassword,
    };

    const handleFieldBlur = (field, value) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));

        setFieldErrors((prev) => ({
            ...prev,
            [field]: validators[field](value),
        }));
    };

    const handleFieldChange = (field, value, setter) => {
        setter(value);

        setFieldErrors((prev) => ({
            ...prev,
            [field]: touched[field]
                ? validators[field](value)
                : "",
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setError("");
        setSuccess("");

        const normalizedLogin = login.trim();
        const normalizedPhone = phone.trim();

        // Пароль не обрізаємо: пробіли можуть бути його частиною.
        const normalizedPassword = password;

        const errors = {
            login: validateLogin(normalizedLogin),
            phone: validatePhone(normalizedPhone),
            password: validatePassword(normalizedPassword),
        };

        setFieldErrors(errors);

        setTouched({
            login: true,
            phone: true,
            password: true,
        });

        if (Object.values(errors).some(Boolean)) {
            return;
        }

        let createdAuthUser = null;

        try {
            setLoading(true);

            const authEmail = createAuthEmail(normalizedPhone);

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    authEmail,
                    normalizedPassword
                );

            createdAuthUser = userCredential.user;

            const batch = writeBatch(db);

            const userRef = doc(
                db,
                "users",
                createdAuthUser.uid
            );

            const publicProfileRef = doc(
                db,
                "publicProfiles",
                createdAuthUser.uid
            );

            batch.set(userRef, {
                login: normalizedLogin,
                phone: normalizedPhone,
                role: "user",
                blocked: false,
                bio: "",
                city: "",
                avatarUrl: "",
                avatarPublicId: "",
                additionalContacts: {
                    telegram: "",
                    viber: "",
                    whatsapp: "",
                    instagram: "",
                    facebook: "",
                    tiktok: "",
                },
                privacy: {
                    hidePhone: true,
                    hideCity: false,
                    hideContacts: false,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            batch.set(publicProfileRef, {
                login: normalizedLogin,
                avatarUrl: "",
                bio: "",
                city: "",
                additionalContacts: {
                    telegram: "",
                    viber: "",
                    whatsapp: "",
                    instagram: "",
                    facebook: "",
                    tiktok: "",
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await batch.commit();

            setSuccess("Реєстрація успішна!");

            setLogin("");
            setPhone("");
            setPassword("");
            setFieldErrors({});
            setTouched({});

            navigate("/user");

        } catch (err) {
            console.error("Помилка реєстрації:", err);

            // Очищення незавершеної реєстрації
            if (
                createdAuthUser &&
                auth.currentUser?.uid === createdAuthUser.uid
            ) {
                try {
                    await deleteUser(createdAuthUser);
                } catch (deleteError) {
                    console.error(
                        "Не вдалося видалити незавершений обліковий запис:",
                        deleteError
                    );
                }
            }

            switch (err.code) {
                case "auth/email-already-in-use":
                    setFieldErrors((prev) => ({
                        ...prev,
                        phone: "Цей номер телефону вже зареєстрований",
                    }));
                    break;

                case "auth/weak-password":
                    setFieldErrors((prev) => ({
                        ...prev,
                        password: "Пароль занадто слабкий",
                    }));
                    break;

                case "auth/invalid-email":
                    setFieldErrors((prev) => ({
                        ...prev,
                        phone: "Некоректний номер телефону",
                    }));
                    break;

                case "auth/too-many-requests":
                    setError(
                        "Забагато спроб. Спробуйте пізніше."
                    );
                    break;

                case "auth/network-request-failed":
                    setError(
                        "Перевірте підключення до інтернету."
                    );
                    break;

                default:
                    setError(
                        "Не вдалося зареєструватися. Перевірте дані або спробуйте пізніше."
                    );
                    break;
            }

        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-full">
            <div className="mb-7">
                <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
                    Реєстрація
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Створіть обліковий запис, щоб публікувати
                    та керувати своїми оголошеннями.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >
                <div>
                    <label
                        htmlFor="login"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <User
                            size={17}
                            strokeWidth={2}
                            className="text-indigo-600"
                        />

                        Ім’я
                    </label>


                    <input
                        id="login"
                        type="text"
                        value={login}
                        onChange={(e) =>
                            handleFieldChange(
                                "login",
                                e.target.value.slice(0, 40),
                                setLogin
                            )
                        }
                        onBlur={() => handleFieldBlur("login", login)}
                        placeholder="Як до вас звертатись?"
                        autoComplete="nickname"
                        maxLength={40}
                        aria-invalid={!!fieldErrors.login}
                        aria-describedby="register-login-help"
                        className={`
        w-full rounded-xl border
        bg-slate-50 px-4 py-3.5
        text-sm text-slate-900
        outline-none transition
        placeholder:text-slate-400
        focus:bg-white focus:ring-4
        ${fieldErrors.login
                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                            }
    `}
                    />

                    <p
                        id="register-login-help"
                        className={`mt-2 text-xs ${fieldErrors.login
                            ? "font-medium text-red-600"
                            : "text-slate-400"
                            }`}
                    >
                        {fieldErrors.login ||
                            "Від 2 до 40 символів. Наприклад: Назар, Анна-Марія"}
                    </p>

                </div>

                <div>
                    <label
                        htmlFor="phone"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <Phone
                            size={17}
                            strokeWidth={2}
                            className="text-indigo-600"
                        />

                        Номер телефону
                    </label>


                    <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) =>
                            handleFieldChange(
                                "phone",
                                formatPhone(e.target.value),
                                setPhone
                            )
                        }
                        onFocus={() => {
                            if (!phone) setPhone("+380");
                        }}
                        onBlur={() => handleFieldBlur("phone", phone)}
                        placeholder="+380 XX XXX XX XX"
                        autoComplete="tel"
                        maxLength={17}
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby="register-phone-help"
                        className={`
        w-full rounded-xl border
        bg-slate-50 px-4 py-3.5
        text-sm text-slate-900
        outline-none transition
        placeholder:text-slate-400
        focus:bg-white focus:ring-4
        ${fieldErrors.phone
                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                            }
    `}
                    />

                    <p
                        id="register-phone-help"
                        className={`mt-2 text-xs ${fieldErrors.phone
                            ? "font-medium text-red-600"
                            : "text-slate-400"
                            }`}
                    >
                        {fieldErrors.phone ||
                            "Український номер у форматі +380 XX XXX XX XX"}
                    </p>

                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <Lock
                            size={17}
                            strokeWidth={2}
                            className="text-indigo-600"
                        />

                        Пароль
                    </label>

                    <div className="relative">

                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) =>
                                handleFieldChange(
                                    "password",
                                    e.target.value,
                                    setPassword
                                )
                            }
                            onBlur={() =>
                                handleFieldBlur("password", password)
                            }
                            placeholder="Придумайте пароль"
                            autoComplete="new-password"
                            minLength={8}
                            aria-invalid={!!fieldErrors.password}
                            aria-describedby="register-password-help"
                            className={`
        w-full rounded-xl border
        bg-slate-50 py-3.5 pl-4 pr-12
        text-sm text-slate-900
        outline-none transition
        placeholder:text-slate-400
        focus:bg-white focus:ring-4
        ${fieldErrors.password
                                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                    : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                                }
    `}
                        />


                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    (previous) => !previous
                                )
                            }
                            className="
            absolute right-3 top-1/2
            flex h-8 w-8
            -translate-y-1/2
            items-center justify-center
            rounded-lg
            text-slate-400
            transition
            hover:bg-blue-50
            hover:text-blue-600
        "
                            aria-label={
                                showPassword
                                    ? "Приховати пароль"
                                    : "Показати пароль"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={19} />
                            ) : (
                                <Eye size={19} />
                            )}
                        </button>
                    </div>
                    <p
                        id="register-password-help"
                        className={`mt-2 text-xs ${fieldErrors.password
                                ? "font-medium text-red-600"
                                : "text-slate-400"
                            }`}
                    >
                        {fieldErrors.password ||
                            "Мінімум 8 символів, одна літера та одна цифра"}
                    </p>
                </div>
                {/* Порада щодо збереження пароля */}
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3">
                    <Lock
                        size={16}
                        className="mt-0.5 shrink-0 text-blue-500"
                    />

                    <p className="text-xs leading-5 text-slate-600">
                        Радимо зберігати пароль у{" "}
                        <span className="font-semibold text-slate-700">
                            менеджері паролів
                        </span>{" "}
                        або іншому надійному сховищі, щоб не втратити
                        доступ до акаунта.
                    </p>
                </div>
                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="
                        mt-2 w-full
                        rounded-xl
                        bg-blue-600
                        px-5 py-3.5
                        text-sm font-bold
                        text-white
                        transition
                        hover:bg-blue-700
                        focus:outline-none
                        focus:ring-4
                        focus:ring-indigo-100
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                >
                    {loading
                        ? "Реєстрація..."
                        : "Зареєструватися"}
                </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                Реєструючись, ви погоджуєтесь з{" "}
                <Link
                    to="/rules"
                    className="font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-indigo-600"
                >
                    правилами використання сервісу
                </Link>
                .
            </p>
        </div>
    );
}