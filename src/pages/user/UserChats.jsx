
import { useEffect, useMemo, useRef, useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
} from "firebase/firestore";
import {
    LoaderCircle,
    AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

import { auth, db } from "../../firebase";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import ChatSidebar from "../../components/chats/ChatSidebar";
import ChatWindow from "../../components/chats/ChatWindow";
import ListingDetailsModal from "../../components/listings/ListingDetailsModal";

import {
    getChatId,
    subscribeUserChats,
    subscribeChatMessages,
    sendChatMessage,
    isChatUnread,
    chatTimestampToMillis,
    markChatAsRead,
    deleteChatForEveryone,
} from "../../utils/chatService";

const normalizeListing = (id, data) => {
    const toDate = (value) => {
        if (typeof value?.toDate === "function") {
            return value.toDate();
        }

        return value || null;
    };

    const city =
        typeof data.city === "object"
            ? data.city?.name || ""
            : data.city || "";

    return {
        ...data,
        id,
        category: data.category || data.type || "Інше",
        description: data.description || data.comment || "",
        location: data.location || city,
        createdAt: toDate(data.createdAt),
        expiresAt: toDate(data.expiresAt),
    };
};


const showChatSafetyWarning = async () => {
    const result = await Swal.fire({
        width: 480,
        padding: "28px 24px 24px",
        showClass: {
            popup: "swal2-show",
        },
        hideClass: {
            popup: "swal2-hide",
        },
        customClass: {
            popup: "rounded-3xl",
            actions: "w-full gap-3 mt-5",
            confirmButton: "rounded-xl",
            cancelButton: "rounded-xl",
        },
        html: `
      <div style="font-family:inherit;text-align:left">

        <div style="
          display:flex;
          justify-content:center;
          margin-bottom:16px;
        ">
          <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:54px;
            height:54px;
            border-radius:17px;
            background:#eff6ff;
            color:#2563eb;
          ">
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
        </div>

        <h2 style="
          margin:0;
          color:#0f172a;
          font-size:21px;
          font-weight:750;
          letter-spacing:-0.5px;
          text-align:center;
        ">
          Безпечне спілкування
        </h2>

        <p style="
          margin:9px auto 22px;
          max-width:350px;
          text-align:center;
          font-size:13px;
          line-height:1.65;
          color:#64748b;
        ">
          Перед початком листування ознайомтеся
          з кількома простими правилами RBoard.
        </p>

        <div style="
          padding:5px 15px;
          border:1px solid #e2e8f0;
          border-radius:16px;
          background:#f8fafc;
        ">

          <div style="
            display:flex;
            align-items:flex-start;
            gap:12px;
            padding:14px 0;
          ">
            <span style="
              display:flex;
              align-items:center;
              justify-content:center;
              flex-shrink:0;
              width:25px;
              height:25px;
              border-radius:9px;
              background:#dbeafe;
              color:#2563eb;
              font-size:12px;
              font-weight:700;
            ">1</span>

            <div>
              <div style="
                font-size:13px;
                font-weight:700;
                color:#1e293b;
              ">
                Спілкуйтеся за темою
              </div>

              <p style="
                margin:4px 0 0;
                font-size:12px;
                line-height:1.6;
                color:#64748b;
              ">
                Використовуйте чат для обговорення
                оголошень та пов'язаних із ними питань.
              </p>
            </div>
          </div>

          <div style="
            height:1px;
            background:#e2e8f0;
          "></div>

          <div style="
            display:flex;
            align-items:flex-start;
            gap:12px;
            padding:14px 0;
          ">
            <span style="
              display:flex;
              align-items:center;
              justify-content:center;
              flex-shrink:0;
              width:25px;
              height:25px;
              border-radius:9px;
              background:#dbeafe;
              color:#2563eb;
              font-size:12px;
              font-weight:700;
            ">2</span>

            <div>
              <div style="
                font-size:13px;
                font-weight:700;
                color:#1e293b;
              ">
                Бережіть особисті дані
              </div>

              <p style="
                margin:4px 0 0;
                font-size:12px;
                line-height:1.6;
                color:#64748b;
              ">
                Не передавайте паролі, коди підтвердження
                та конфіденційні платіжні дані.
              </p>
            </div>
          </div>

          <div style="
            height:1px;
            background:#e2e8f0;
          "></div>

          <div style="
            display:flex;
            align-items:flex-start;
            gap:12px;
            padding:14px 0;
          ">
            <span style="
              display:flex;
              align-items:center;
              justify-content:center;
              flex-shrink:0;
              width:25px;
              height:25px;
              border-radius:9px;
              background:#dbeafe;
              color:#2563eb;
              font-size:12px;
              font-weight:700;
            ">3</span>

            <div>
              <div style="
                font-size:13px;
                font-weight:700;
                color:#1e293b;
              ">
                Поважайте співрозмовника
              </div>

              <p style="
                margin:4px 0 0;
                font-size:12px;
                line-height:1.6;
                color:#64748b;
              ">
                Дотримуйтеся ввічливості та
                <a
                  href="/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    color:#2563eb;
                    font-weight:600;
                    text-decoration:none;
                  "
                >правил RBoard</a>.
              </p>
            </div>
          </div>
        </div>

        <div style="margin-top:19px">

          <label style="
            display:flex;
            align-items:center;
            gap:12px;
            min-height:46px;
            padding:11px 13px;
            border:1px solid #bfdbfe;
            border-radius:12px;
            background:#eff6ff;
            cursor:pointer;
          ">
            <input
              type="checkbox"
              id="chatSafetyAccepted"
              style="
                width:17px;
                height:17px;
                flex-shrink:0;
                margin:0;
                accent-color:#2563eb;
                cursor:pointer;
              "
            />

            <span style="
              font-size:13px;
              font-weight:650;
              color:#1e40af;
            ">
              Я ознайомився з правилами
            </span>
          </label>

          <label style="
            display:flex;
            align-items:center;
            gap:12px;
            min-height:42px;
            padding:10px 13px;
            margin-top:7px;
            border-radius:12px;
            cursor:pointer;
          ">
            <input
              type="checkbox"
              id="chatSafetyRemember"
              style="
                width:17px;
                height:17px;
                flex-shrink:0;
                margin:0;
                accent-color:#2563eb;
                cursor:pointer;
              "
            />

            <span style="
              font-size:12px;
              color:#64748b;
            ">
              Більше не показувати це попередження
            </span>
          </label>

          <p
            id="chatSafetyError"
            style="
              display:none;
              margin:8px 0 0;
              padding-left:4px;
              font-size:12px;
              color:#dc2626;
            "
          >
            Спочатку підтвердьте ознайомлення з правилами.
          </p>
        </div>
      </div>
    `,
        showCancelButton: true,
        confirmButtonText: "Продовжити",
        cancelButtonText: "Скасувати",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#f1f5f9",
        reverseButtons: true,
        focusConfirm: false,
        buttonsStyling: true,
        didOpen: (popup) => {
            const confirmButton = popup.querySelector(
                ".swal2-confirm"
            );

            const cancelButton = popup.querySelector(
                ".swal2-cancel"
            );

            if (confirmButton) {
                Object.assign(confirmButton.style, {
                    borderRadius: "12px",
                    padding: "12px 24px",
                    fontSize: "13px",
                    fontWeight: "650",
                    boxShadow: "none",
                });
            }

            if (cancelButton) {
                Object.assign(cancelButton.style, {
                    borderRadius: "12px",
                    padding: "12px 24px",
                    fontSize: "13px",
                    fontWeight: "650",
                    color: "#475569",
                    boxShadow: "none",
                });
            }

            const accepted = popup.querySelector(
                "#chatSafetyAccepted"
            );

            const errorElement = popup.querySelector(
                "#chatSafetyError"
            );

            accepted?.addEventListener("change", () => {
                if (errorElement) {
                    errorElement.style.display = "none";
                }
            });
        },
        preConfirm: () => {
            const accepted = document.getElementById(
                "chatSafetyAccepted"
            )?.checked;

            const remember = document.getElementById(
                "chatSafetyRemember"
            )?.checked;

            if (!accepted) {
                const errorElement = document.getElementById(
                    "chatSafetyError"
                );

                if (errorElement) {
                    errorElement.style.display = "block";
                }

                return false;
            }

            return { remember: Boolean(remember) };
        },
    });

    return result.isConfirmed ? result.value : null;
};


const getErrorText = (error) => {
    if (error?.code === "permission-denied") {
        return "Немає дозволу на цю дію. Перевірте правила Firestore.";
    }

    return error?.message || "Сталася невідома помилка.";
};

export default function UserChats() {
    const [searchParams] = useSearchParams();
        useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, []);
    const [deletingChat, setDeletingChat] = useState(false);
    const navigate = useNavigate();
    const recipientUid = searchParams.get("to");
    const listingId = searchParams.get("listing");
    const directChatId = searchParams.get("chat");

    const openedDirectChatRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(undefined);

    const [savedChats, setSavedChats] = useState([]);
    const [draftChat, setDraftChat] = useState(null);

    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    const [search, setSearch] = useState("");
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [openingChat, setOpeningChat] = useState(false);
    const [sending, setSending] = useState(false);

    const [error, setError] = useState("");

    const [listingCache, setListingCache] = useState({});
    const [openedListing, setOpenedListing] = useState(null);
    const [loadingListing, setLoadingListing] = useState(false);

    // Firebase Authentication
    useEffect(() => {
        return onAuthStateChanged(auth, setCurrentUser);
    }, []);

    // Список збережених чатів
    useEffect(() => {
        if (!currentUser?.uid) {
            setSavedChats([]);
            setLoadingChats(false);
            return;
        }

        let active = true;

        setLoadingChats(true);
        setError("");

        const unsubscribe = subscribeUserChats(
            currentUser.uid,
            async (documents) => {
                try {
                    const prepared = await Promise.all(
                        documents.map(async (chat) => {
                            const otherUid = chat.participants?.find(
                                (uid) => uid !== currentUser.uid
                            );

                            let profile = {};
                            let listingTitle =
                                chat.listingTitle || "Оголошення";

                            try {
                                const requests = [];

                                if (otherUid) {
                                    requests.push(
                                        getDoc(doc(db, "publicProfiles", otherUid))
                                    );
                                } else {
                                    requests.push(Promise.resolve(null));
                                }

                                if (chat.listingId) {
                                    requests.push(
                                        getDoc(doc(db, "listings", chat.listingId))
                                    );
                                } else {
                                    requests.push(Promise.resolve(null));
                                }

                                const [profileSnapshot, listingSnapshot] =
                                    await Promise.all(requests);

                                if (profileSnapshot?.exists()) {
                                    profile = profileSnapshot.data();
                                }

                                if (listingSnapshot?.exists()) {
                                    listingTitle =
                                        listingSnapshot.data().title || listingTitle;
                                }
                            } catch (loadError) {
                                console.warn(
                                    "Не вдалося завантажити додаткові дані чату:",
                                    loadError
                                );
                            }

                            return {
                                ...chat,
                                otherUser: {
                                    uid: otherUid || null,
                                    name: profile.login || "Користувач RBoard",
                                    avatarUrl: profile.avatarUrl || null,
                                },
                                listing: {
                                    id: chat.listingId,
                                    title: listingTitle,
                                },
                                isUnread: isChatUnread(chat, currentUser.uid),
                                unreadCount: isChatUnread(chat, currentUser.uid) ? 1 : 0,
                            };
                        })
                    );

                    if (!active) return;

                    setSavedChats(prepared);
                    setLoadingChats(false);
                } catch (loadError) {
                    if (!active) return;

                    console.error(loadError);
                    setError(getErrorText(loadError));
                    setLoadingChats(false);
                }
            },
            (listenError) => {
                if (!active) return;

                console.error(
                    "Помилка отримання чатів:",
                    listenError
                );

                setError(getErrorText(listenError));
                setLoadingChats(false);
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [currentUser?.uid]);

    // Відкриття чату через кнопку "Написати автору"
    useEffect(() => {
        if (!recipientUid || !listingId || !currentUser?.uid) {
            return;
        }

        let active = true;

        const prepareConversation = async () => {
            setOpeningChat(true);
            setError("");

            try {
                if (currentUser.uid === recipientUid) {
                    throw new Error(
                        "Ви не можете написати самому собі."
                    );
                }

                const chatId = getChatId(
                    listingId,
                    currentUser.uid,
                    recipientUid
                );

                const listingSnapshot = await getDoc(
                    doc(db, "listings", listingId)
                );

                if (!active) return;

                if (!listingSnapshot.exists()) {
                    throw new Error("Оголошення не знайдено.");
                }

                const listing = listingSnapshot.data();

                if (listing.author?.uid !== recipientUid) {
                    throw new Error(
                        "Автор оголошення не збігається з отримувачем."
                    );
                }

                if (listing.status !== "approved") {
                    throw new Error(
                        "Оголошення недоступне для листування."
                    );
                }

                const expiresAt =
                    listing.expiresAt?.toDate?.() ||
                    (listing.expiresAt
                        ? new Date(listing.expiresAt)
                        : null);

                if (expiresAt && expiresAt <= new Date()) {
                    throw new Error(
                        "Термін дії оголошення завершився."
                    );
                }

                const profileSnapshot = await getDoc(
                    doc(db, "publicProfiles", recipientUid)
                );

                if (!active) return;

                const profile = profileSnapshot.exists()
                    ? profileSnapshot.data()
                    : {};

                const prepared = {
                    id: chatId,
                    participants: [currentUser.uid, recipientUid].sort(),
                    listingId,
                    listingTitle: listing.title || "Оголошення",
                    otherUser: {
                        uid: recipientUid,
                        name:
                            profile.login ||
                            listing.authorName ||
                            "Користувач RBoard",
                        avatarUrl: profile.avatarUrl || null,
                    },
                    listing: {
                        id: listingId,
                        title: listing.title || "Оголошення",
                    },
                    lastMessage: "",
                    lastMessageAt: null,
                    unreadCount: 0,
                };

                setDraftChat(prepared);
                setSelectedChatId(chatId);
                setMobileChatOpen(true);

                setListingCache((previous) => ({
                    ...previous,
                    [listingId]: normalizeListing(
                        listingSnapshot.id,
                        listing
                    ),
                }));
            } catch (prepareError) {
                if (!active) return;

                console.error(prepareError);
                setError(getErrorText(prepareError));
            } finally {
                if (active) setOpeningChat(false);
            }
        };

        prepareConversation();

        return () => {
            active = false;
        };
    }, [recipientUid, listingId, currentUser?.uid]);

    // Об'єднуємо збережені чати й одну підготовлену розмову.
    // Коли чат з'явиться у Firestore, його чернетка зникне.
    const chats = useMemo(() => {
        if (!draftChat) return savedChats;

        const alreadySaved = savedChats.some(
            (chat) => chat.id === draftChat.id
        );

        return alreadySaved
            ? savedChats
            : [draftChat, ...savedChats];
    }, [draftChat, savedChats]);

    const selectedChat =
        chats.find((chat) => chat.id === selectedChatId) ||
        null;

    const selectedLastMessageTime = chatTimestampToMillis(
        selectedChat?.lastMessageAt
    );

    const selectedLastReadTime = chatTimestampToMillis(
        selectedChat?.lastReadAt?.[currentUser?.uid]
    );

    const selectedLastSenderId = selectedChat?.lastSenderId;

    useEffect(() => {
        if (!currentUser?.uid || !selectedChatId) return;

        const checkAndMarkRead = async () => {
            if (document.visibilityState !== "visible") return;

            if (!mobileChatOpen && window.innerWidth < 768) {
                return;
            }

            if (selectedLastSenderId === currentUser.uid) {
                return;
            }

            if (
                !selectedLastMessageTime ||
                selectedLastMessageTime <= selectedLastReadTime
            ) {
                return;
            }

            try {
                await markChatAsRead(
                    selectedChatId,
                    currentUser.uid
                );
            } catch (error) {
                console.error(
                    "Не вдалося позначити чат прочитаним:",
                    error
                );
            }
        };

        checkAndMarkRead();

        document.addEventListener(
            "visibilitychange",
            checkAndMarkRead
        );

        window.addEventListener("focus", checkAndMarkRead);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                checkAndMarkRead
            );

            window.removeEventListener("focus", checkAndMarkRead);
        };
    }, [
        currentUser?.uid,
        selectedChatId,
        selectedLastMessageTime,
        selectedLastReadTime,
        selectedLastSenderId,
        mobileChatOpen,
    ]);

    const isSelectedChatSaved = savedChats.some(
        (chat) => chat.id === selectedChatId
    );

    const directChatExists = savedChats.some(
        (chat) => chat.id === directChatId
    );

    useEffect(() => {
        if (!directChatId || !directChatExists) return;

        if (openedDirectChatRef.current === directChatId) {
            return;
        }

        openedDirectChatRef.current = directChatId;

        setSelectedChatId(directChatId);
        setMobileChatOpen(true);
    }, [directChatId, directChatExists]);

    // Повідомлення вибраної розмови
    useEffect(() => {
        setMessages([]);

        if (!isSelectedChatSaved) {
            setLoadingMessages(false);
            return;
        }
        let active = true;
        setLoadingMessages(true);

        const unsubscribe = subscribeChatMessages(
            selectedChatId,
            (items) => {
                if (!active) return;

                setMessages(items);
                setLoadingMessages(false);
            },
            (listenError) => {
                if (!active) return;

                console.error(
                    "Помилка отримання повідомлень:",
                    listenError
                );

                setError(getErrorText(listenError));
                setLoadingMessages(false);
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [selectedChatId, isSelectedChatSaved, currentUser?.uid]);

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId);
        setMobileChatOpen(true);
        setError("");
    };

    const handleReportChat = async (chatId) => {
        if (!currentUser?.uid || !chatId) return;

        const chat = savedChats.find(
            (item) => item.id === chatId
        );

        if (!chat || !chat.participants?.includes(currentUser.uid)) {
            return;
        }

        const otherUid = chat.participants.find(
            (uid) => uid !== currentUser.uid
        );

        if (!otherUid) return;

        const otherName =
            chat.otherUser?.name || "Користувач RBoard";

        let reporterName =
            currentUser.displayName || "Користувач RBoard";

        let reporterPhone = "";

        try {
            const snapshot = await getDoc(
                doc(db, "users", currentUser.uid)
            );

            if (snapshot.exists()) {
                const profile = snapshot.data();

                reporterName = profile.login || reporterName;
                reporterPhone = profile.phone || "";
            }
        } catch (error) {
            console.error(
                "Помилка завантаження профілю:",
                error
            );
        }

        const complaintText = [
            "Скарга на листування в RBoard.",
            "",
            `Прошу адміністрацію перевірити чат між користувачами «${reporterName}» та «${otherName}» у зв'язку з можливим порушенням правил спілкування.`,
            "",
            `Заявник: ${reporterName}`,
            "",
            `Інший учасник: ${otherName}`,
            "",
            `Оголошення: ${chat.listing?.title || chat.listingTitle || "Без назви"}`,
            "",
            "Причина скарги:",
            "[Опишіть, які саме повідомлення або дії порушують правила RBoard]",
            "",
            "Прошу розглянути звернення та, у разі підтвердження порушення, вжити відповідних заходів.",
        ].join("\n");

        navigate("/contacts", {
            state: {
                chatComplaint: {
                    reporterUid: currentUser.uid,
                    name: reporterName,
                    phone: reporterPhone,
                    type: "Інше",
                    message: complaintText,
                    chatId,
                    reportedUid: otherUid,
                },
            },
        });
    };


    const handleDeleteChat = async (chatId) => {
        if (!chatId || deletingChat) return;

        const chat = savedChats.find(
            (item) => item.id === chatId
        );

        if (!chat) {
            await Swal.fire({
                icon: "info",
                title: "Розмову ще не створено",
                text: "Видаляти поки нічого. Чат створюється після першого повідомлення.",
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });

            return;
        }

        const result = await Swal.fire({
            icon: "warning",
            title: "Видалити чат?",
            text: `Уся історія листування з користувачем «${chat.otherUser?.name || "Користувач RBoard"
                }» буде назавжди видалена для вас обох. Відновити повідомлення буде неможливо.`,
            showCancelButton: true,
            confirmButtonText: "Видалити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        setDeletingChat(true);

        try {
            await deleteChatForEveryone(chatId);

            setSavedChats((previous) =>
                previous.filter((item) => item.id !== chatId)
            );

            setDraftChat((previous) =>
                previous?.id === chatId ? null : previous
            );

            setSelectedChatId((previous) =>
                previous === chatId ? null : previous
            );

            setMessages([]);
            setMobileChatOpen(false);
            setError("");

            navigate("/user/chats", { replace: true });

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Чат видалено",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error("Помилка видалення чату:", error);

            await Swal.fire({
                icon: "error",
                title: "Не вдалося видалити чат",
                text:
                    error?.code === "permission-denied"
                        ? "Немає дозволу на видалення. Перевірте правила Firestore."
                        : error?.message ||
                        "Спробуйте ще раз.",
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setDeletingChat(false);
        }
    };




    const handleSendMessage = async (chatId, text) => {
        if (sending || !currentUser?.uid) return false;

        const chat = chats.find((item) => item.id === chatId);

        if (!chat?.listing?.id || !chat?.otherUser?.uid) {
            setError("Недостатньо даних для надсилання.");
            return false;
        }

        setSending(true);
        setError("");

        try {
            const existingChat = savedChats.some(
                (item) => item.id === chatId
            );

            const safetyKey = `rboard_chat_safety_v1_${currentUser.uid}`;

            const warningDisabled =
                localStorage.getItem(safetyKey) === "true";

            let rememberChoice = false;

            if (!existingChat && !warningDisabled) {
                const confirmation = await showChatSafetyWarning();

                if (!confirmation) {
                    return false;
                }

                rememberChoice = confirmation.remember;
            }

            await sendChatMessage({
                listingId: chat.listing.id,
                recipientUid: chat.otherUser.uid,
                senderUid: currentUser.uid,
                text,
            });

            if (rememberChoice) {
                localStorage.setItem(safetyKey, "true");
            }

            return true;
        } catch (sendError) {
            console.error(
                "Помилка надсилання повідомлення:",
                sendError
            );

            await Swal.fire({
                icon: "error",
                title: "Повідомлення не надіслано",
                text: getErrorText(sendError),
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });

            return false;
        } finally {
            setSending(false);
        }
    };


    const handleOpenListing = async (id) => {
        if (!id || loadingListing) return;

        if (listingCache[id]) {
            setOpenedListing(listingCache[id]);
            return;
        }

        setLoadingListing(true);

        try {
            const snapshot = await getDoc(
                doc(db, "listings", id)
            );

            if (!snapshot.exists()) {
                throw new Error("Оголошення не знайдено.");
            }

            const normalized = normalizeListing(
                snapshot.id,
                snapshot.data()
            );

            setListingCache((previous) => ({
                ...previous,
                [id]: normalized,
            }));

            setOpenedListing(normalized);
        } catch (listingError) {
            setError(getErrorText(listingError));
        } finally {
            setLoadingListing(false);
        }
    };

    const handleSelectRelated = async (related) => {
        const id =
            typeof related === "string"
                ? related
                : related?.id;

        if (!id) return;

        setOpenedListing(null);
        await handleOpenListing(id);
    };
    const displayedMessages = useMemo(() => {
        if (!selectedChat || !currentUser?.uid) {
            return messages;
        }

        const otherUid = selectedChat.otherUser?.uid;

        const otherReadTime = chatTimestampToMillis(
            selectedChat.lastReadAt?.[otherUid]
        );

        return messages.map((message) => ({
            ...message,
            read:
                message.senderId === currentUser.uid &&
                otherReadTime > 0 &&
                chatTimestampToMillis(message.createdAt) <= otherReadTime,
        }));
    }, [messages, selectedChat, currentUser?.uid]);
    return (
        <div className="flex min-h-screen flex-col bg-[#f5f8ff]">
            <Navbar />

            <main className="flex w-full flex-1 flex-col px-3 py-5 text-slate-900 sm:px-5 lg:px-8">
                <div className="mx-auto flex w-full max-w-[1500px] flex-col">
                    <div className="mb-4 hidden items-center justify-between md:flex">
                    </div>



                    {currentUser === null && (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Для використання чатів потрібно увійти
                            до свого облікового запису RBoard.
                        </div>
                    )}

                    <div className="flex h-[min(750px,calc(100dvh-150px))] min-h-[450px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
                        <ChatSidebar
                            chats={chats}
                            selectedChatId={selectedChatId}
                            onSelectChat={handleSelectChat}
                            search={search}
                            onSearchChange={setSearch}
                            className={`w-full shrink-0 border-r border-slate-200 md:w-[340px] lg:w-[380px] ${mobileChatOpen
                                ? "hidden md:flex"
                                : "flex"
                                }`}
                        />
                        <div
                            className={`min-h-0 min-w-0 flex-1 ${mobileChatOpen
                                ? "block"
                                : "hidden md:block"
                                }`}
                        >
                            <ChatWindow
                                chat={selectedChat}
                                messages={loadingMessages ? [] : displayedMessages}
                                onDeleteChat={
                                    isSelectedChatSaved
                                        ? handleDeleteChat
                                        : undefined
                                }
                                onReportChat={
                                    isSelectedChatSaved
                                        ? handleReportChat
                                        : undefined
                                }
                                deletingChat={deletingChat}
                                currentUserId={currentUser?.uid || null}
                                onSendMessage={handleSendMessage}
                                onOpenListing={handleOpenListing}
                                onBack={() => setMobileChatOpen(false)}
                                showBackButton={mobileChatOpen}
                                sendingEnabled={
                                    Boolean(currentUser?.uid) &&
                                    Boolean(selectedChat) &&
                                    !sending &&
                                    !loadingMessages
                                }
                            />
                        </div>
                    </div>
                </div>

            </main>

            {(openingChat || loadingChats || error) && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[3px]">

                    {error ? (
                        <div
                            role="alert"
                            className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-2xl"
                        >
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                                <AlertCircle size={32} />
                            </div>

                            <h3 className="text-xl font-black text-slate-900">
                                Виникла помилка
                            </h3>

                            <p className="mt-3 break-words text-sm leading-7 text-slate-600">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                                Зрозуміло
                            </button>
                        </div>
                    ) : (
                        <div
                            role="status"
                            className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-2xl"
                        >
                            <LoaderCircle
                                size={42}
                                className="animate-spin text-blue-600"
                            />

                            <h3 className="mt-6 text-lg font-black text-slate-900">
                                {openingChat
                                    ? "Відкриваємо розмову"
                                    : "Завантажуємо чати"}
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Отримуємо необхідні дані...
                            </p>
                        </div>
                    )}

                </div>
            )}

            <Footer />


            {loadingListing && (
                <div
                    role="status"
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/30"
                >
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-xl">
                        <LoaderCircle
                            size={21}
                            className="animate-spin text-blue-600"
                        />
                        Завантажуємо оголошення...
                    </div>
                </div>
            )}

            {openedListing && (
                <ListingDetailsModal
                    listing={openedListing}
                    onClose={() => setOpenedListing(null)}
                    onSelectRelated={handleSelectRelated}
                />
            )}
        </div>
    );
}
