import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
    Phone,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import {
    signInWithEmailAndPassword,
    signOut,
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
export default function LoginModal() {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const normalizedPhone =
        phone.trim();

    const normalizedPassword =
        password.trim();

    if (
        !normalizedPhone &&
        !normalizedPassword
    ) {
        setError(
            "Введіть номер телефону та пароль"
        );
        return;
    }

    if (!normalizedPhone) {
        setError(
            "Введіть номер телефону"
        );
        return;
    }

    if (!normalizedPassword) {
        setError("Введіть пароль");
        return;
    }

    try {
        setLoading(true);

        const authEmail =
            createAuthEmail(
                normalizedPhone
            );

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                authEmail,
                normalizedPassword
            );

        const firebaseUser =
            userCredential.user;

        const userReference = doc(
            db,
            "users",
            firebaseUser.uid
        );

        const userSnapshot =
            await getDoc(userReference);

        if (!userSnapshot.exists()) {
            await signOut(auth);

            setError(
                "Дані користувача не знайдено"
            );

            return;
        }

        const userData =
            userSnapshot.data();

        if (userData.blocked === true) {
            await signOut(auth);

            setError("blocked");

            return;
        }
        setPhone("");
        setPassword("");

        navigate("/user");
    } catch (err) {
        console.error(
            "Помилка входу:",
            err
        );

        if (
            err.code ===
                "auth/invalid-credential" ||
            err.code ===
                "auth/wrong-password" ||
            err.code ===
                "auth/user-not-found"
        ) {
            setError(
                "Неправильний номер телефону або пароль"
            );
        } else if (
            err.code ===
            "auth/too-many-requests"
        ) {
            setError(
                "Забагато спроб входу. Спробуйте пізніше."
            );
        } else {
            setError(
                "Не вдалося увійти. Спробуйте ще раз."
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
                    Вхід
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Увійдіть у свій обліковий запис, щоб керувати
                    оголошеннями та користуватися всіма можливостями
                    сервісу.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                <div>
                    <label
                        htmlFor="login-phone"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <Phone
                            size={17}
                            strokeWidth={2}
                            className="text-blue-600"
                        />

                        Номер телефону
                    </label>

                    <input
                        id="login-phone"
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
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                        "
                    />
                </div>
                <div>
                    <label
                        htmlFor="login-password"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <Lock
                            size={17}
                            strokeWidth={2}
                            className="text-blue-600"
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
                    <>
                        {error === "blocked" ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                                <div className="flex gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                        <Lock
                                            size={18}
                                            strokeWidth={2.2}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-red-700">
                                            Йой, вас заблокувала адміністрація.
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-red-600">
                                            Зв'яжіться з нами для вияснення причини.
                                        </p>

                                        <Link
                                            to="/contacts"
                                            className="mt-2 inline-flex text-sm font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                                        >
                                            Зв'язатися з нами →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                {error}
                            </div>
                        )}
                    </>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="
                        mt-2 flex w-full
                        items-center justify-center gap-2
                        rounded-xl
                        bg-blue-600
                        px-5 py-3.5
                        text-sm font-bold
                        text-white
                        transition
                        hover:bg-blue-700
                        focus:outline-none
                        focus:ring-4
                        focus:ring-blue-100
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                >
                    {loading
                        ? "Вхід..."
                        : "Увійти"}
                </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                Використовуйте номер телефону, який ви вказали
                під час реєстрації.
            </p>
        </div>
    );
}