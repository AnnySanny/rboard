import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
    Search,
    MessageCircle,
    UserRound,
    X,
    Send,
    ChevronRight,
    CheckCheck,
    CircleCheck,
    LoaderCircle,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

const formatTime = (value) => {
    if (!value) return "";

    const date =
        typeof value?.toDate === "function"
            ? value.toDate()
            : new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
    });
};

export default function ChatSidebar({
    chats = [],
    selectedChatId,
    onSelectChat,
    search = "",
    onSearchChange,
    className = "",
}) {
    // Telegram
    const [telegramStatus, setTelegramStatus] = useState(null);
    const [telegramLoading, setTelegramLoading] = useState(true);
    const [telegramConnecting, setTelegramConnecting] = useState(false);
    const [telegramError, setTelegramError] = useState("");
    const [telegramDisconnecting, setTelegramDisconnecting] = useState(false);
    // Перевірка прив'язки Telegram
    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribeProfile?.();
                unsubscribeProfile = null;

                setTelegramStatus(null);
                setTelegramLoading(true);

                if (!user) {
                    setTelegramLoading(false);
                    return;
                }

                unsubscribeProfile = onSnapshot(
                    doc(db, "users", user.uid),
                    (snapshot) => {
                        const data = snapshot.data();

                        setTelegramStatus({
                            connected: Boolean(data?.telegramChatId),
                            notifications: Boolean(data?.telegramChatId),
                        });

                        setTelegramLoading(false);
                    },
                    (error) => {
                        console.error(
                            "Помилка перевірки Telegram:",
                            error
                        );

                        setTelegramStatus(null);
                        setTelegramLoading(false);
                        setTelegramError(
                            "Не вдалося перевірити підключення Telegram."
                        );
                    }
                );
            }
        );

        return () => {
            unsubscribeAuth();
            unsubscribeProfile?.();
        };
    }, []);

    // Підключення Telegram
    const handleConnectTelegram = async () => {
        if (telegramConnecting) return;

        const user = auth.currentUser;

        if (!user) {
            setTelegramError(
                "Для підключення Telegram потрібно увійти в акаунт."
            );
            return;
        }

        setTelegramConnecting(true);
        setTelegramError("");

        try {
            const idToken = await user.getIdToken();

            const response = await fetch(
                "/.netlify/functions/create-telegram-link",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success || !result.telegramUrl) {
                throw new Error(
                    result.error || "Не вдалося створити посилання."
                );
            }

            // Перехід до Telegram із персональним токеном
            window.location.assign(result.telegramUrl);
        } catch (error) {
            console.error(
                "Помилка підключення Telegram:",
                error
            );

            setTelegramError(
                error.message || "Спробуйте ще раз."
            );

            setTelegramConnecting(false);
        }
    };



    
const handleDisconnectTelegram = async () => {
    if (telegramDisconnecting) return;

    const result = await Swal.fire({
        icon: "warning",
        title: "Відв'язати Telegram?",
        html: `
            <div style="margin-top:8px">
                Ви більше не отримуватимете сповіщення
                про нові повідомлення в чатах RBoard.
                <br><br>
                <span style="color:#64748b;font-size:13px">
                    Ви зможете повторно підключити Telegram у будь-який момент.
                </span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Відв'язати",
        cancelButtonText: "Скасувати",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
        focusCancel: true,
    });

    if (!result.isConfirmed) return;

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        showClass: {
            popup: "swal2-noanimation",
        },
        hideClass: {
            popup: "",
        },
    });

    const user = auth.currentUser;

    if (!user) {
        Toast.fire({
            icon: "error",
            title: "Потрібно увійти в акаунт",
        });
        return;
    }

    setTelegramDisconnecting(true);
    setTelegramError("");

    try {
        const idToken = await user.getIdToken();

        const response = await fetch(
            "/.netlify/functions/unlink-telegram",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Не вдалося відв'язати Telegram."
            );
        }

        // onSnapshot автоматично оновить статус Telegram
        await Toast.fire({
            icon: "success",
            title: "Telegram успішно відв'язано",
        });

    } catch (error) {
        console.error("Помилка відв'язки Telegram:", error);

        Toast.fire({
            icon: "error",
            title: "Не вдалося відв'язати Telegram",
            text: error.message || "Спробуйте ще раз.",
        });
    } finally {
        setTelegramDisconnecting(false);
    }
};


    const normalizedSearch = search
        .trim()
        .toLocaleLowerCase("uk-UA");

    const filteredChats = chats.filter((chat) => {
        const content = [
            chat.otherUser?.name,
            chat.listing?.title,
            chat.lastMessage,
        ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("uk-UA");

        return content.includes(normalizedSearch);
    });

    return (
        <aside
            className={`flex h-full min-h-0 flex-col bg-white ${className}`}
        >
            <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-5 sm:px-5">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">
                            Повідомлення
                        </h1>

                        <p className="mt-1 text-xs text-slate-500">
                            Ваші розмови на RBoard
                        </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <MessageCircle size={21} />
                    </div>
                </div>

                <div className="relative">
                    <Search
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        placeholder="Знайти розмову..."
                        aria-label="Пошук діалогів"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            aria-label="Очистити пошук"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            {/* Telegram-сповіщення */}
            <div className="shrink-0 px-4 py-2.5 sm:px-5">

                {telegramLoading ? (
                    // Завантаження статусу
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                        <LoaderCircle
                            size={19}
                            className="animate-spin text-slate-400"
                        />

                        <p className="text-xs text-slate-500">
                            Перевіряємо Telegram...
                        </p>
                    </div>

                ) : telegramStatus?.connected ? (
                    // Telegram підключено
                    <div className="space-y-1.5">

                        {/* Зелений блок */}
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3">

                            {/* Іконка */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <CheckCheck size={20} strokeWidth={2} />
                            </div>

                            {/* Текст */}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-emerald-900">
                                    Telegram підключено
                                </p>

                                <p className="mt-0.5 text-[11px] leading-4 text-emerald-700">
                                    Сповіщення активовані
                                </p>
                            </div>

                            {/* Статус */}
                            <CircleCheck
                                size={19}
                                className="shrink-0 text-emerald-500"
                            />

                        </div>

                        {/* Кнопка відв'язки */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleDisconnectTelegram}
                                disabled={telegramDisconnecting}
                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {telegramDisconnecting ? (
                                    <LoaderCircle
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <X size={12} />
                                )}

                                {telegramDisconnecting
                                    ? "Відв'язуємо..."
                                    : "Відв'язати Telegram"}
                            </button>
                        </div>

                    </div>
                ) : (

                    // Telegram не підключено
                    <button
                        type="button"
                        onClick={handleConnectTelegram}
                        disabled={telegramConnecting || Boolean(telegramError && !auth.currentUser)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-100/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {/* Іконка */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-200">
                            {telegramConnecting ? (
                                <LoaderCircle
                                    size={19}
                                    className="animate-spin"
                                />
                            ) : (
                                <Send size={19} strokeWidth={1.8} />
                            )}
                        </div>

                        {/* Текст */}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900">
                                {telegramConnecting
                                    ? "Підключаємо Telegram..."
                                    : "Сповіщення в Telegram"}
                            </p>

                            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                                Отримуйте повідомлення прямо в боті
                            </p>
                        </div>

                        {/* Стрілка */}
                        {!telegramConnecting && (
                            <ChevronRight
                                size={18}
                                className="shrink-0 text-blue-500 transition-transform group-hover:translate-x-1"
                            />
                        )}

                    </button>
                )}

                {/* Помилка */}
                {telegramError && (
                    <p
                        role="alert"
                        className="mt-2 text-xs text-red-500"
                    >
                        {telegramError}
                    </p>
                )}

            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {filteredChats.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <MessageCircle
                                size={30}
                                strokeWidth={1.5}
                            />
                        </div>

                        <h3 className="text-sm font-bold text-slate-800">
                            {search
                                ? "Нічого не знайдено"
                                : "Поки немає розмов"}
                        </h3>

                        <p className="mt-2 max-w-[240px] text-xs leading-6 text-slate-500">
                            {search
                                ? "Спробуйте інший пошуковий запит."
                                : "Коли ви почнете листування з автором оголошення, розмова з'явиться тут."}
                        </p>
                    </div>
                ) : (
                    <div className="py-2">
                        {filteredChats.map((chat) => {
                            const selected =
                                chat.id === selectedChatId;

                            const unread = chat.unreadCount || 0;

                            return (
                                <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() => onSelectChat(chat.id)}
                                    className={`group relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition sm:px-5 ${selected
                                        ? "bg-blue-50"
                                        : unread > 0
                                            ? "bg-blue-50/70 hover:bg-blue-100/60"
                                            : "bg-white hover:bg-slate-50"
                                        }`}
                                >
                                    {selected && (
                                        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-blue-600" />
                                    )}

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-50">
                                        {chat.otherUser?.avatarUrl ? (
                                            <img
                                                src={chat.otherUser.avatarUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <UserRound
                                                size={23}
                                                className="text-blue-500"
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-sm font-bold text-slate-900">
                                                {chat.otherUser?.name ||
                                                    "Користувач RBoard"}
                                            </span>

                                            <span
                                                className={`shrink-0 text-[10px] ${unread > 0
                                                    ? "font-semibold text-blue-600"
                                                    : "text-slate-400"
                                                    }`}
                                            >
                                                {formatTime(chat.lastMessageAt)}
                                            </span>
                                        </div>

                                        <p className="mt-0.5 truncate text-[11px] font-medium text-blue-600">
                                            {chat.listing?.title ||
                                                "Оголошення"}
                                        </p>

                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <p
                                                className={`min-w-0 flex-1 truncate text-xs ${unread > 0
                                                    ? "font-semibold text-slate-800"
                                                    : "text-slate-500"
                                                    }`}
                                            >
                                                {chat.lastMessage || "Нова розмова"}
                                            </p>

                                            {unread > 0 && (
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"
                                                    title="Є непрочитані повідомлення"
                                                    aria-label="Непрочитані повідомлення"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}
