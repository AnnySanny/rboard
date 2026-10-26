
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { MessageCircle, X } from "lucide-react";

import { auth } from "../firebase";
import {
  subscribeUserChats,
  isChatUnread,
  chatTimestampToMillis,
} from "../utils/chatService";

const ChatNotificationsContext = createContext(null);

export const useChatNotifications = () => {
  const context = useContext(ChatNotificationsContext);

  if (!context) {
    throw new Error("ChatNotificationsProvider не підключено.");
  }

  return context;
};

export function ChatNotificationsProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [toast, setToast] = useState(null);

  const initializedRef = useRef(false);
  const previousRef = useRef(new Map());
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    initializedRef.current = false;
    previousRef.current = new Map();

    setChats([]);
    setToast(null);

    if (!currentUser?.uid) return;

    let active = true;

    const unsubscribe = subscribeUserChats(
      currentUser.uid,
      (items) => {
        if (!active) return;

        const next = new Map();

        items.forEach((chat) => {
          next.set(
            chat.id,
            chatTimestampToMillis(chat.lastMessageAt)
          );
        });

        if (initializedRef.current) {
          const incoming = items
            .filter((chat) => {
              if (chat.lastSenderId === currentUser.uid) {
                return false;
              }

              if (!isChatUnread(chat, currentUser.uid)) {
                return false;
              }

              const previousTime =
                previousRef.current.get(chat.id) || 0;

              const nextTime =
                chatTimestampToMillis(chat.lastMessageAt);

              return nextTime > previousTime;
            })
            .sort(
              (a, b) =>
                chatTimestampToMillis(b.lastMessageAt) -
                chatTimestampToMillis(a.lastMessageAt)
            );

          if (
            incoming.length > 0 &&
            !locationRef.current.startsWith("/user/chats")
          ) {
            const newest = incoming[0];

            setToast({
              id: `${newest.id}_${chatTimestampToMillis(
                newest.lastMessageAt
              )}`,
              chatId: newest.id,
              text: newest.lastMessage || "Нове повідомлення",
              listingTitle: newest.listingTitle || "Оголошення",
            });
          }
        }

        previousRef.current = next;
        initializedRef.current = true;

        setChats(items);
      },
      (error) => {
        if (!active) return;
        console.error("Помилка сповіщень чатів:", error);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 5500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const unreadChatIds = chats
    .filter((chat) => isChatUnread(chat, currentUser?.uid))
    .map((chat) => chat.id);

  const unreadCount = unreadChatIds.length;

  const openToast = () => {
    if (!toast) return;

    const chatId = toast.chatId;

    setToast(null);

    navigate(`/user/chats?chat=${encodeURIComponent(chatId)}`);
  };

  return (
    <ChatNotificationsContext.Provider
      value={{
        unreadCount,
        unreadChatIds,
        chats,
      }}
    >
      {children}

      {toast && (
        <div className="pointer-events-none fixed right-4 top-20 z-[200] w-[calc(100%-2rem)] max-w-sm">
          <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-slate-900/15">
            <button
              type="button"
              onClick={openToast}
              className="flex w-full items-start gap-3 p-4 pr-11 text-left transition hover:bg-blue-50/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  Нове повідомлення
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {toast.listingTitle}
                </p>

                <p className="mt-2 line-clamp-2 break-words text-sm text-slate-600">
                  {toast.text}
                </p>

                <p className="mt-2 text-xs font-semibold text-blue-600">
                  Відкрити розмову
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Закрити сповіщення"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>

            <div className="h-1 bg-blue-500" />
          </div>
        </div>
      )}
    </ChatNotificationsContext.Provider>
  );
}
