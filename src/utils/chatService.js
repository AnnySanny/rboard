
import {
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    where,
    deleteDoc,
    getDocs,
    writeBatch,
    updateDoc,
    FieldPath,
} from "firebase/firestore";

import { db } from "../firebase";

export const MAX_CHAT_MESSAGE_LENGTH = 1000;

export const getChatId = (listingId, userA, userB) => {
    if (!listingId || !userA || !userB) {
        throw new Error("Не вказано оголошення або учасників.");
    }

    if (userA === userB) {
        throw new Error("Неможливо створити чат із самим собою.");
    }

    const participants = [userA, userB].sort();

    return `${listingId}_${participants[0]}_${participants[1]}`;
};

export const chatTimestampToMillis = (value) => {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

export const isChatUnread = (chat, userId) => {
  if (!chat || !userId) return false;

  if (!chat.lastMessageAt || !chat.lastSenderId) {
    return false;
  }

  if (chat.lastSenderId === userId) {
    return false;
  }

  const messageTime = chatTimestampToMillis(
    chat.lastMessageAt
  );

  const readTime = chatTimestampToMillis(
    chat.lastReadAt?.[userId]
  );

  return messageTime > readTime;
};

export const markChatAsRead = async (chatId, userId) => {
  if (!chatId || !userId) {
    throw new Error("Не вказано чат або користувача.");
  }

  const chatRef = doc(db, "chats", chatId);

  await updateDoc(
    chatRef,
    new FieldPath("lastReadAt", userId),
    serverTimestamp()
  );
};

export const subscribeUserChats = (userId, onData, onError) => {
    if (!userId) return () => { };

    const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc"),
        limit(50)
    );

    return onSnapshot(
        chatsQuery,
        (snapshot) => {
            const chats = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            onData(chats);
        },
        onError
    );
};

export const subscribeChatMessages = (
    chatId,
    onData,
    onError
) => {
    if (!chatId) return () => { };

    const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "desc"),
        limit(50)
    );

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            const messages = snapshot.docs
                .map((item) => ({
                    id: item.id,
                    ...item.data(),
                }))
                .reverse();

            onData(messages);
        },
        onError
    );
};

export const sendChatMessage = async ({
    listingId,
    recipientUid,
    senderUid,
    text,
}) => {
    const messageText = String(text || "").trim();

    if (
        !messageText ||
        messageText.length > MAX_CHAT_MESSAGE_LENGTH
    ) {
        throw new Error("Повідомлення має містити від 1 до 1000 символів.");
    }

    if (!senderUid || !recipientUid || !listingId) {
        throw new Error("Недостатньо даних для надсилання.");
    }

    if (senderUid === recipientUid) {
        throw new Error("Неможливо написати самому собі.");
    }

    const chatId = getChatId(
        listingId,
        senderUid,
        recipientUid
    );

    const chatRef = doc(db, "chats", chatId);
    const listingRef = doc(db, "listings", listingId);

    const messageRef = doc(
        collection(db, "chats", chatId, "messages")
    );

    await runTransaction(db, async (transaction) => {
        const chatSnapshot = await transaction.get(chatRef);

        if (!chatSnapshot.exists()) {
            const listingSnapshot = await transaction.get(listingRef);

            if (!listingSnapshot.exists()) {
                throw new Error("Оголошення не знайдено.");
            }

            const listing = listingSnapshot.data();

            if (
                listing.status !== "approved" ||
                listing.author?.uid !== recipientUid
            ) {
                throw new Error(
                    "Неможливо розпочати листування щодо цього оголошення."
                );
            }

            const expiresAt = listing.expiresAt?.toDate?.();

            if (expiresAt && expiresAt <= new Date()) {
                throw new Error("Термін дії оголошення завершився.");
            }

            transaction.set(chatRef, {
                participants: [senderUid, recipientUid].sort(),
                listingId,
                listingTitle: listing.title || "Оголошення",
                lastMessage: messageText,
                lastMessageAt: serverTimestamp(),
                lastSenderId: senderUid,
                createdAt: serverTimestamp(),
            });
        } else {
            const chat = chatSnapshot.data();

            if (
                !Array.isArray(chat.participants) ||
                !chat.participants.includes(senderUid) ||
                !chat.participants.includes(recipientUid) ||
                chat.listingId !== listingId
            ) {
                throw new Error("Немає доступу до цієї розмови.");
            }

            transaction.update(chatRef, {
                lastMessage: messageText,
                lastMessageAt: serverTimestamp(),
                lastSenderId: senderUid,
            });
        }

        transaction.set(messageRef, {
            senderId: senderUid,
            text: messageText,
            createdAt: serverTimestamp(),
            type: "text",
        });
    });

    return chatId;
};

export const deleteChatForEveryone = async (chatId) => {
  if (!chatId) {
    throw new Error("Не вказано чат для видалення.");
  }

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(
    db,
    "chats",
    chatId,
    "messages"
  );

  const chatSnapshot = await getDoc(chatRef);

  if (!chatSnapshot.exists()) {
    throw new Error("Чат не знайдено.");
  }

  while (true) {
    const snapshot = await getDocs(
      query(messagesRef, limit(100))
    );

    if (snapshot.empty) break;

    const batch = writeBatch(db);

    snapshot.docs.forEach((message) => {
      batch.delete(message.ref);
    });

    await batch.commit();
  }

  await deleteDoc(chatRef);

  return true;
};
