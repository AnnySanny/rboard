
import {
    Search,
    MessageCircle,
    UserRound,
    X,
} from "lucide-react";

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
