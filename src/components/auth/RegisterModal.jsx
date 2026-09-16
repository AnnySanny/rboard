import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import {
    User,
    Phone,
    Lock,
} from "lucide-react";

import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";

export default function RegisterModal() {
    const navigate = useNavigate();

    const [login, setLogin] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!login.trim() || !phone.trim() || !password.trim()) {
            setError("Заповніть усі поля");
            return;
        }

        if (password.length < 6) {
            setError(
                "Пароль повинен містити щонайменше 6 символів"
            );
            return;
        }

        try {
            setLoading(true);

            const normalizedLogin = login.trim();
            const normalizedPhone = phone.trim();
            const loginQuery = query(
                collection(db, "users"),
                where("login", "==", normalizedLogin)
            );

            const loginSnapshot = await getDocs(loginQuery);

            if (!loginSnapshot.empty) {
                setError(
                    "Користувач із таким логіном вже зареєстрований"
                );
                return;
            }
            const phoneQuery = query(
                collection(db, "users"),
                where("phone", "==", normalizedPhone)
            );

            const phoneSnapshot = await getDocs(phoneQuery);

            if (!phoneSnapshot.empty) {
                setError(
                    "Користувач із таким номером телефону вже зареєстрований"
                );
                return;
            }
            const userDoc = await addDoc(
                collection(db, "users"),
                {
                    login: normalizedLogin,
                    phone: normalizedPhone,
                    password,
                    createdAt: serverTimestamp(),
                }
            );
            localStorage.setItem(
                "rboardUser",
                JSON.stringify({
                    id: userDoc.id,
                    login: normalizedLogin,
                    phone: normalizedPhone,
                })
            );

            setSuccess("Реєстрація успішна!");

            setLogin("");
            setPhone("");
            setPassword("");
            navigate("/user");
        } catch (err) {
            console.error(
                "Помилка реєстрації:",
                err
            );

            setError(
                "Не вдалося зареєструватися. Спробуйте ще раз."
            );
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

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Мінімум 6 символів"
                        autoComplete="new-password"
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