
import { useCallback, useEffect, useRef, useState } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    writeBatch,
    deleteDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    Trash2,
    LoaderCircle,
    MessageCircle,
    MessagesSquare,
    Users,
    RefreshCw,
    ChevronDown,
    UserRound,
    Eye,
    ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

import { db } from "../../firebase";

const CHAT_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 50;
const DELETE_BATCH_SIZE = 200;

const formatDate = (value) => {
    const date =
        value?.toDate?.() ||
        (value instanceof Date ? value : null);

    if (!date) return "";

    return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatTime = (value) => {
    const date =
        value?.toDate?.() ||
        (value instanceof Date ? value : null);

    if (!date) return "";

    return date.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDateTime = (value) => {
    const date = formatDate(value);
    const time = formatTime(value);

    return [date, time].filter(Boolean).join(" · ");
};

const getParticipantName = (participant) => {
    return participant?.profile?.login || "Видалений користувач";
};

const ParticipantAvatar = ({ participant, size = "md" }) => {
    const sizeClass =
        size === "sm"
            ? "h-9 w-9"
            : "h-11 w-11";

    return (
        <div
            className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50`}
        >
            {participant?.profile?.avatarUrl ? (
                <img
                    src={participant.profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                />
            ) : (
                <UserRound
                    size={size === "sm" ? 17 : 21}
                    className="text-blue-500"
                />
            )}
        </div>
    );
};

const ChatListItem = ({ chat, active, onClick }) => {
    const first = chat.users?.[0];
    const second = chat.users?.[1];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-2xl border p-3 text-left transition ${active
                ? "border-blue-200 bg-blue-50 shadow-sm"
                : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative h-11 w-[58px] shrink-0">
                    <div className="absolute left-0 top-0">
                        <ParticipantAvatar
                            participant={first}
                            size="sm"
                        />
                    </div>

                    <div className="absolute bottom-0 right-0 rounded-full border-2 border-white">
                        <ParticipantAvatar
                            participant={second}
                            size="sm"
                        />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className={`min-w-0 truncate text-sm font-bold ${active ? "text-blue-700" : "text-slate-900"
                                }`}
                        >
                            {getParticipantName(first)}
                            <span className="mx-1 text-slate-400">↔</span>
                            {getParticipantName(second)}
                        </p>

                        <span className="shrink-0 text-[10px] text-slate-400">
                            {formatDate(chat.lastMessageAt || chat.createdAt)}
                        </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {chat.listingTitle || "Без назви оголошення"}
                    </p>

                    <p className="mt-1.5 truncate text-xs text-slate-400">
                        {chat.lastMessage || "Немає повідомлень"}
                    </p>
                </div>
            </div>
        </button>
    );
};

const MessageBubble = ({ message, chat }) => {
    const firstUid = chat.participants?.[0];
    const isFirst = message.senderId === firstUid;

    const participant = chat.users?.find(
        (user) => user.uid === message.senderId
    );

    return (
        <div
            className={`flex ${isFirst ? "justify-start" : "justify-end"
                }`}
        >
            <div className="max-w-[85%] sm:max-w-[75%]">
                <div
                    className={`rounded-2xl px-4 py-3 ${isFirst
                        ? "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                        : "rounded-br-md bg-blue-600 text-white"
                        }`}
                >
                    <p
                        className={`mb-1.5 text-[11px] font-bold ${isFirst ? "text-blue-600" : "text-blue-100"
                            }`}
                    >
                        {getParticipantName(participant)}
                    </p>

                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.text || "Повідомлення без тексту"}
                    </p>

                    <p
                        className={`mt-2 text-right text-[10px] ${isFirst ? "text-slate-400" : "text-blue-100"
                            }`}
                    >
                        {formatDateTime(message.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function AdminChats() {
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);

    const [messages, setMessages] = useState([]);
    const [chatCursor, setChatCursor] = useState(null);


    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);

    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMoreChats, setLoadingMoreChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [deletingChat, setDeletingChat] = useState(false);

    const [search, setSearch] = useState("");
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [error, setError] = useState("");

    const profilesCache = useRef(new Map());
    const messagesRequestId = useRef(0);
    const messageCursorRef = useRef(null);
    const messagesBottomRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const initializedRef = useRef(false);

    const selectedChat =
        chats.find((chat) => chat.id === selectedChatId) || null;

    const resolveUser = useCallback(async (uid) => {
        if (profilesCache.current.has(uid)) {
            return profilesCache.current.get(uid);
        }

        let profile = null;

        try {
            const snapshot = await getDoc(
                doc(db, "publicProfiles", uid)
            );

            if (snapshot.exists()) {
                profile = snapshot.data();
            }
        } catch (err) {
            console.error("Помилка профілю:", err);
        }

        const user = {
            uid,
            profile,
        };

        profilesCache.current.set(uid, user);

        return user;
    }, []);

    const resolveChats = useCallback(
        async (documents) => {
            return Promise.all(
                documents.map(async (chatDocument) => {
                    const data = chatDocument.data();
                    const participants = Array.isArray(data.participants)
                        ? data.participants
                        : [];

                    const users = await Promise.all(
                        participants.map((uid) => resolveUser(uid))
                    );

                    return {
                        id: chatDocument.id,
                        ...data,
                        participants,
                        users,
                    };
                })
            );
        },
        [resolveUser]
    );

    const loadChats = useCallback(
        async (loadMore = false) => {
            if (loadMore) {
                setLoadingMoreChats(true);
            } else {
                setLoadingChats(true);
                setError("");
                profilesCache.current.clear();
            }

            try {
                const chatsRef = collection(db, "chats");

                const constraints = [
                    orderBy("lastMessageAt", "desc"),
                ];

                if (loadMore && chatCursor) {
                    constraints.push(startAfter(chatCursor));
                }

                constraints.push(limit(CHAT_PAGE_SIZE));

                const snapshot = await getDocs(
                    query(chatsRef, ...constraints)
                );

                const resolved = await resolveChats(snapshot.docs);

                setChats((previous) => {
                    if (!loadMore) return resolved;

                    const knownIds = new Set(
                        previous.map((chat) => chat.id)
                    );

                    return [
                        ...previous,
                        ...resolved.filter(
                            (chat) => !knownIds.has(chat.id)
                        ),
                    ];
                });

                setChatCursor(
                    snapshot.docs[snapshot.docs.length - 1] || null
                );

                setHasMoreChats(snapshot.size === CHAT_PAGE_SIZE);

                if (!loadMore) {
                    setSelectedChatId((previous) => {
                        if (resolved.some((chat) => chat.id === previous)) {
                            return previous;
                        }

                        return resolved[0]?.id || null;
                    });
                }
            } catch (err) {
                console.error("Помилка завантаження чатів:", err);
                setError("Не вдалося завантажити чати.");
            } finally {
                setLoadingChats(false);
                setLoadingMoreChats(false);
            }
        },
        [chatCursor, resolveChats]
    );

    useEffect(() => {
        if (initializedRef.current) return;

        initializedRef.current = true;
        loadChats(false);
    }, [loadChats]);

    const loadMessages = useCallback(
        async (chatId, loadMore = false) => {
            if (!chatId) return;


            if (loadMore) {
                if (!messageCursorRef.current) return;
                setLoadingMoreMessages(true);
            } else {
                setLoadingMessages(true);
                setMessages([]);
                messageCursorRef.current = null;
                setHasMoreMessages(false);
            }


            const requestId = messagesRequestId.current;

            try {
                const messagesRef = collection(
                    db,
                    "chats",
                    chatId,
                    "messages"
                );

                const constraints = [
                    orderBy("createdAt", "desc"),
                ];

                if (loadMore && messageCursorRef.current) {
                    constraints.push(startAfter(messageCursorRef.current));
                }

                constraints.push(limit(MESSAGE_PAGE_SIZE));

                const snapshot = await getDocs(
                    query(messagesRef, ...constraints)
                );

                if (requestId !== messagesRequestId.current) {
                    return;
                }

                const items = snapshot.docs
                    .map((item) => ({
                        id: item.id,
                        ...item.data(),
                    }))
                    .reverse();

                if (loadMore) {
                    setMessages((previous) => {
                        const knownIds = new Set(
                            previous.map((item) => item.id)
                        );

                        return [
                            ...items.filter(
                                (item) => !knownIds.has(item.id)
                            ),
                            ...previous,
                        ];
                    });
                } else {
                    setMessages(items);
                }
                const nextCursor =
                    snapshot.docs[snapshot.docs.length - 1] || null;

                messageCursorRef.current = nextCursor;

                setHasMoreMessages(
                    snapshot.size === MESSAGE_PAGE_SIZE
                );
            } catch (err) {
                console.error("Помилка повідомлень:", err);

                if (requestId === messagesRequestId.current) {
                    Swal.fire({
                        icon: "error",
                        title: "Не вдалося завантажити повідомлення",
                        confirmButtonColor: "#2563eb",
                    });
                }
            } finally {
                if (requestId === messagesRequestId.current) {
                    setLoadingMessages(false);
                    setLoadingMoreMessages(false);
                }
            }
        },
        []
    );
useEffect(() => {
  messagesRequestId.current += 1;

  if (!selectedChatId) {
    setMessages([]);
    messageCursorRef.current = null;
    setHasMoreMessages(false);
    return;
  }

  loadMessages(selectedChatId, false);
}, [selectedChatId, loadMessages]);

    useEffect(() => {
        if (!loadingMessages && selectedChatId) {
            messagesBottomRef.current?.scrollIntoView({
                behavior: "instant",
                block: "end",
            });
        }
    }, [selectedChatId, loadingMessages]);

    const handleSelectChat = (chatId) => {
        if (deletingChat) return;

        if (selectedChatId === chatId) {
            setMobileChatOpen(true);
            return;
        }

        setSelectedChatId(chatId);
        setMobileChatOpen(true);
    };

    const handleDeleteChat = async () => {
        if (!selectedChat || deletingChat) return;

        const chatId = selectedChat.id;

        const first = getParticipantName(
            selectedChat.users?.[0]
        );

        const second = getParticipantName(
            selectedChat.users?.[1]
        );

        const confirmation = await Swal.fire({
            icon: "warning",
            title: "Видалити чат?",
            html: `
        <div style="font-size:14px;line-height:1.7;color:#64748b">
          Ви збираєтеся видалити розмову
          <strong style="color:#0f172a">${first.replace(/</g, "&lt;").replace(/>/g, "&gt;")} — ${second.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>.
          <p style="margin-top:12px;color:#dc2626;font-weight:600">
            Усі повідомлення будуть видалені назавжди для обох користувачів.
          </p>
        </div>
      `,
            showCancelButton: true,
            confirmButtonText: "Видалити чат",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        setDeletingChat(true);

        try {
            const messagesRef = collection(
                db,
                "chats",
                chatId,
                "messages"
            );

            while (true) {
                const snapshot = await getDocs(
                    query(
                        messagesRef,
                        limit(DELETE_BATCH_SIZE)
                    )
                );

                if (snapshot.empty) break;

                const batch = writeBatch(db);

                snapshot.docs.forEach((documentSnapshot) => {
                    batch.delete(documentSnapshot.ref);
                });

                await batch.commit();
            }

            await deleteDoc(
                doc(db, "chats", chatId)
            );

            const remainingChats = chats.filter(
                (chat) => chat.id !== chatId
            );

            setChats(remainingChats);

            messagesRequestId.current += 1;

            setSelectedChatId(
                remainingChats[0]?.id || null
            );

            setMessages([]);
            setMobileChatOpen(false);

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Чат і повідомлення видалено",
                timer: 2300,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Помилка видалення чату:", err);

            await Swal.fire({
                icon: "error",
                title: "Не вдалося видалити чат",
                text: "Частину повідомлень уже могло бути видалено. Перевірте правила Firestore та повторіть операцію.",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setDeletingChat(false);
        }
    };

    const filteredChats = chats.filter((chat) => {
        const value = search.trim().toLowerCase();

        if (!value) return true;

        const names = (chat.users || [])
            .map((user) => getParticipantName(user))
            .join(" ");

        return [
            names,
            chat.listingTitle,
            chat.lastMessage,
            chat.id,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value);
    });

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                        Адміністрування
                    </p>

                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Чати користувачів
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Перегляд розмов та керування листуванням RBoard.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => loadChats(false)}
                    disabled={loadingChats || deletingChat}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loadingChats ? "animate-spin" : ""}
                    />
                    Оновити
                </button>
            </div>

            <div className="grid h-[min(780px,calc(100vh-210px))] min-h-[530px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[350px_minmax(0,1fr)]">
                <aside
                    className={`flex min-h-0 flex-col border-r border-slate-200 ${mobileChatOpen ? "hidden lg:flex" : "flex"
                        }`}
                >
                    <div className="border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessagesSquare
                                    size={19}
                                    className="text-blue-600"
                                />

                                <h2 className="text-base font-black text-slate-900">
                                    Усі розмови
                                </h2>
                            </div>

                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                                {chats.length}
                            </span>
                        </div>

                        <div className="relative mt-4">
                            <Search
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Пошук за учасниками..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
                        {loadingChats ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                                <LoaderCircle
                                    size={18}
                                    className="animate-spin text-blue-600"
                                />
                                Завантаження чатів...
                            </div>
                        ) : error ? (
                            <p className="px-3 py-8 text-center text-sm text-red-500">
                                {error}
                            </p>
                        ) : filteredChats.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <MessageCircle
                                    size={30}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-3 text-sm font-medium text-slate-400">
                                    {search
                                        ? "Нічого не знайдено серед завантажених чатів"
                                        : "Чатів поки немає"}
                                </p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <ChatListItem
                                    key={chat.id}
                                    chat={chat}
                                    active={selectedChatId === chat.id}
                                    onClick={() => handleSelectChat(chat.id)}
                                />
                            ))
                        )}

                        {hasMoreChats && !loadingChats && (
                            <button
                                type="button"
                                onClick={() => loadChats(true)}
                                disabled={loadingMoreChats}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                            >
                                {loadingMoreChats ? (
                                    <LoaderCircle
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <ChevronDown size={15} />
                                )}

                                Завантажити ще
                            </button>
                        )}
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3">
                        <p className="text-[11px] text-slate-400">
                            Показано {chats.length} чатів
                            {hasMoreChats ? " · Є ще розмови" : ""}
                        </p>
                    </div>
                </aside>

                <div
                    className={`min-h-0 flex-col ${mobileChatOpen ? "flex" : "hidden lg:flex"
                        }`}
                >
                    {selectedChat ? (
                        <>
                            <div className="border-b border-slate-200 bg-white p-4 sm:px-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMobileChatOpen(false)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
                                            aria-label="Повернутися до списку чатів"
                                        >
                                            <ArrowLeft size={19} />
                                        </button>

                                        <div className="hidden shrink-0 sm:block">
                                            <Users
                                                size={22}
                                                className="text-blue-600"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="truncate text-sm font-black text-slate-900 sm:text-base">
                                                {getParticipantName(selectedChat.users?.[0])}
                                                {" ↔ "}
                                                {getParticipantName(selectedChat.users?.[1])}
                                            </h2>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {selectedChat.listingTitle ||
                                                    "Оголошення без назви"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                loadMessages(selectedChat.id, false)
                                            }
                                            disabled={loadingMessages || deletingChat}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                                            title="Оновити повідомлення"
                                        >
                                            <RefreshCw
                                                size={17}
                                                className={
                                                    loadingMessages ? "animate-spin" : ""
                                                }
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDeleteChat}
                                            disabled={deletingChat}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                                            title="Видалити чат"
                                        >
                                            {deletingChat ? (
                                                <LoaderCircle
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Trash2 size={17} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {selectedChat.users?.map((user) => (
                                        <Link
                                            key={user.uid}
                                            to={`/dashboard/users/${encodeURIComponent(user.uid)}`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <ParticipantAvatar
                                                participant={user}
                                                size="sm"
                                            />

                                            <span className="max-w-32 truncate">
                                                {getParticipantName(user)}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div
                                ref={messagesContainerRef}
                                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6"
                            >
                                {loadingMessages ? (
                                    <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                                        <LoaderCircle
                                            size={19}
                                            className="animate-spin text-blue-600"
                                        />
                                        Завантаження повідомлень...
                                    </div>
                                ) : (
                                    <>
                                        {hasMoreMessages && (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        loadMessages(selectedChat.id, true)
                                                    }
                                                    disabled={loadingMoreMessages}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:opacity-50"
                                                >
                                                    {loadingMoreMessages ? (
                                                        <LoaderCircle
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <ChevronDown size={15} />
                                                    )}

                                                    Старіші повідомлення
                                                </button>
                                            </div>
                                        )}

                                        {messages.length === 0 ? (
                                            <div className="flex h-full flex-col items-center justify-center text-center">
                                                <MessageCircle
                                                    size={36}
                                                    className="text-slate-300"
                                                />

                                                <p className="mt-4 text-sm font-medium text-slate-400">
                                                    У цьому чаті немає повідомлень
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <MessageBubble
                                                    key={message.id}
                                                    message={message}
                                                    chat={selectedChat}
                                                />
                                            ))
                                        )}

                                        <div ref={messagesBottomRef} />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white px-5 py-4">
                                <ShieldCheck
                                    size={17}
                                    className="text-blue-600"
                                />

                                <span className="text-xs font-medium text-slate-500">
                                    Режим перегляду · Адміністратор не може надсилати повідомлення
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                                <Eye
                                    size={28}
                                    className="text-blue-600"
                                />
                            </div>

                            <h3 className="mt-5 text-lg font-black text-slate-900">
                                Оберіть розмову
                            </h3>

                            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                Виберіть чат зі списку, щоб переглянути
                                його повідомлення та учасників.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
