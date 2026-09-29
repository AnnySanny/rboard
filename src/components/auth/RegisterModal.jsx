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
    setDoc,
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

    const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedLogin =
        login.trim();

    const normalizedPhone =
        phone.trim();

    const normalizedPassword =
        password.trim();

    if (
        !normalizedLogin ||
        !normalizedPhone ||
        !normalizedPassword
    ) {
        setError("Заповніть усі поля");
        return;
    }

    if (normalizedPassword.length < 6) {
        setError(
            "Пароль повинен містити щонайменше 6 символів"
        );

        return;
    }

    let createdAuthUser = null;

    try {
        setLoading(true);

        const authEmail =
            createAuthEmail(
                normalizedPhone
            );

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                authEmail,
                normalizedPassword
            );

        createdAuthUser =
            userCredential.user;

        await setDoc(
            doc(
                db,
                "users",
                createdAuthUser.uid
            ),
            {
                login:
                    normalizedLogin,

                phone:
                    normalizedPhone,

                role:
                    "user",

                blocked:
                    false,

                createdAt:
                    serverTimestamp(),
            }
        );

        setSuccess(
            "Реєстрація успішна!"
        );

        setLogin("");
        setPhone("");
        setPassword("");

        navigate("/user");
    } catch (err) {
        console.error(
            "Помилка реєстрації:",
            err
        );

        if (
            createdAuthUser &&
            auth.currentUser?.uid ===
                createdAuthUser.uid
        ) {
            try {
                await deleteUser(
                    createdAuthUser
                );
            } catch (deleteError) {
                console.error(
                    "Не вдалося видалити незавершений обліковий запис:",
                    deleteError
                );
            }
        }

        if (
            err.code ===
            "auth/email-already-in-use"
        ) {
            setError(
                "Користувач із таким номером телефону вже зареєстрований"
            );
        } else if (
            err.code ===
            "auth/weak-password"
        ) {
            setError(
                "Пароль занадто слабкий"
            );
        } else if (
            err.code ===
            "auth/invalid-email"
        ) {
            setError(
                "Некоректний номер телефону"
            );
        } else {
            setError(
                "Не вдалося зареєструватися. Спробуйте ще раз."
            );
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
                            setLogin(e.target.value)
                        }
                        placeholder="Як до вас звертатись?"
                        autoComplete="username"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            bg-slate-50
                            px-4 py-3.5
                            text-sm text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            hover:border-slate-300
                            focus:border-indigo-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-indigo-100
                        "
                    />
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
                        value={phone}
                        onChange={(e) =>
                            setPhone(e.target.value)
                        }
                        placeholder="+380 XX XXX XX XX"
                        autoComplete="tel"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            bg-slate-50
                            px-4 py-3.5
                            text-sm text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            hover:border-slate-300
                            focus:border-indigo-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-indigo-100
                        "
                    />
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
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Введіть пароль"
                            autoComplete="current-password"
                            className="
            w-full rounded-xl
            border border-slate-200
            bg-slate-50
            py-3.5 pl-4 pr-12
            text-sm text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-blue-500
            focus:bg-white
            focus:ring-4
            focus:ring-blue-100
        "
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