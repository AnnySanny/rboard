
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    UserRound,
    MessageCircle,
    ExternalLink,
    FileText,
    ChevronRight,
    Flag,
    Trash2,
    LoaderCircle,
} from "lucide-react";

import ChatMessage from "./ChatMessage";
import ChatComposer from "./ChatComposer";
import useUserPresence from "../../hooks/useUserPresence";
export default function ChatWindow({
    chat,
    messages = [],
    currentUserId,
    onSendMessage,
    onDeleteChat,
    onReportChat,
    deletingChat = false,
    onOpenListing,
    onBack,
    showBackButton = false,
    sendingEnabled = false,
}) {
    const scrollRef = useRef(null);
    const presence = useUserPresence(chat?.otherUser?.uid);
    const chatId = chat?.id;

    useEffect(() => {
        if (!chatId) return;

        const container = scrollRef.current;

        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [chatId, messages.length]);

    if (!chat) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-[#f8faff] px-6 text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 text-blue-600">
                    <MessageCircle
                        size={43}
                        strokeWidth={1.5}
                    />
                </div>

                <h2 className="text-xl font-black text-slate-900">
                    Ваші повідомлення
                </h2>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
                    Оберіть розмову зі списку, щоб переглянути повідомлення.
                </p>
            </div>
        );
    }

    const otherUserName =
        chat.otherUser?.name || "Користувач RBoard";

    const profileUrl = chat.otherUser?.uid
        ? `/user/${encodeURIComponent(chat.otherUser.uid)}`
        : null;

    const hasListing = Boolean(chat.listing?.id);

    return (
        <section className="flex h-full min-h-0 flex-col bg-white">
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
                {showBackButton && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Повернутися до діалогів"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
                    >
                        <ArrowLeft size={21} />
                    </button>
                )}

                {profileUrl ? (
                    <Link
                        to={profileUrl}
                        title={`Переглянути профіль: ${otherUserName}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 transition hover:border-blue-400 hover:ring-2 hover:ring-blue-100"
                    >
                        {chat.otherUser?.avatarUrl ? (
                            <img
                                src={chat.otherUser.avatarUrl}
                                alt={otherUserName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <UserRound
                                size={23}
                                className="text-blue-500"
                            />
                        )}
                    </Link>
                ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                        <UserRound
                            size={23}
                            className="text-blue-500"
                        />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    {profileUrl ? (
                        <Link
                            to={profileUrl}
                            className="block w-fit max-w-full truncate text-sm font-bold text-slate-900 transition hover:text-blue-600"
                        >
                            {otherUserName}
                        </Link>
                    ) : (
                        <p className="truncate text-sm font-bold text-slate-900">
                            {otherUserName}
                        </p>
                    )}

                    <p
                        className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${presence.online
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 shrink-0 rounded-full ${presence.online
                                    ? "bg-emerald-500"
                                    : "bg-red-400"
                                }`}
                        />

                        <span>{presence.text}</span>
                    </p>
                </div>


                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {profileUrl && (
                        <Link
                            to={profileUrl}
                            title="Переглянути профіль"
                            aria-label="Переглянути профіль"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                            <ExternalLink size={17} />
                        </Link>
                    )}

                    {typeof onReportChat === "function" && (
                        <button
                            type="button"
                            onClick={() => onReportChat(chat.id)}
                            disabled={deletingChat}
                            title="Поскаржитися на чат"
                            aria-label="Поскаржитися на чат"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Flag size={17} strokeWidth={1.8} />
                        </button>
                    )}

                    {typeof onDeleteChat === "function" && (
                        <button
                            type="button"
                            onClick={() => onDeleteChat(chat.id)}
                            disabled={deletingChat}
                            title="Видалити чат для обох учасників"
                            aria-label="Видалити чат"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deletingChat ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Trash2 size={17} strokeWidth={1.8} />
                            )}
                        </button>
                    )}
                </div>


            </header>
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faff] px-3 py-5 sm:px-6"
            >
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                    {hasListing && (
                        <button
                            type="button"
                            onClick={() =>
                                onOpenListing?.(chat.listing.id)
                            }
                            className="group mx-auto mb-4 w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md active:scale-[0.99]"
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <FileText
                                    size={16}
                                    className="text-blue-600"
                                />

                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Розмова про оголошення
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="break-words text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                                        {chat.listing.title ||
                                            "Переглянути оголошення"}
                                    </p>

                                    <p className="mt-2 text-xs font-semibold text-blue-600">
                                        Переглянути деталі
                                    </p>
                                </div>

                                <ChevronRight
                                    size={19}
                                    className="shrink-0 text-blue-500 transition group-hover:translate-x-1"
                                />
                            </div>
                        </button>
                    )}

                    {messages.length === 0 ? (
                        <div className="py-10 text-center">
                            <MessageCircle
                                size={32}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                Розмову ще не розпочато
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Історії повідомлень поки немає.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                isOwn={
                                    message.senderId === currentUserId
                                }
                            />
                        ))
                    )}
                </div>
            </div>

            <ChatComposer
                key={chat.id}
                onSend={
                    sendingEnabled && onSendMessage
                        ? (text) => onSendMessage(chat.id, text)
                        : undefined
                }
                deleting={deletingChat}
                disabled={!sendingEnabled || deletingChat}
            />
        </section>
    );
}
