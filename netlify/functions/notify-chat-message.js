
const { randomUUID } = require("node:crypto");

const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const {
    getFirestore,
    FieldValue,
    Timestamp,
} = require("firebase-admin/firestore");

// Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:
                process.env.FIREBASE_PRIVATE_KEY?.replace(
                    /\\n/g,
                    "\n"
                ),
        }),
    });
}

const db = getFirestore();

const SITE_URL = "https://rboard.netlify.app";
const BOT_TOKEN = process.env.TELEGRAM_USER_BOT_TOKEN;

// Максимальний вік повідомлення для сповіщення
const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
// Захист від одночасного повторного надсилання
const CLAIM_DURATION_MS = 90 * 1000;

const json = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
});

// Захист HTML-форматування Telegram
const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return json(405, {
            success: false,
            error: "Method not allowed",
        });
    }

    // 1. Перевірка Firebase ID Token
    let uid;

    try {
        const authorization =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";

        const match = authorization.match(/^Bearer (.+)$/i);

        if (!match) {
            return json(401, {
                success: false,
                error: "Необхідна авторизація.",
            });
        }

        const decoded = await getAuth().verifyIdToken(
            match[1],
            true
        );

        uid = decoded.uid;
    } catch (error) {
        console.error("Auth error:", error.code || error.message);

        return json(401, {
            success: false,
            error: "Недійсна авторизація.",
        });
    }

    try {
        if (!BOT_TOKEN) {
            throw new Error("TELEGRAM_USER_BOT_TOKEN is missing");
        }

        // 2. Отримуємо ідентифікатори
        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return json(400, {
                success: false,
                error: "Некоректний JSON.",
            });
        }

        const { chatId, messageId } = body;

        if (
            typeof chatId !== "string" ||
            typeof messageId !== "string" ||
            !chatId ||
            !messageId ||
            chatId.includes("/") ||
            messageId.includes("/") ||
            chatId.length > 300 ||
            messageId.length > 200
        ) {
            return json(400, {
                success: false,
                error: "Некоректні дані повідомлення.",
            });
        }

        const chatRef = db.collection("chats").doc(chatId);

        const messageRef = chatRef
            .collection("messages")
            .doc(messageId);

        // 3. Завантажуємо чат і повідомлення
        const [chatSnap, messageSnap] = await Promise.all([
            chatRef.get(),
            messageRef.get(),
        ]);

        if (!chatSnap.exists || !messageSnap.exists) {
            return json(404, {
                success: false,
                error: "Чат або повідомлення не знайдено.",
            });
        }

        const chat = chatSnap.data();
        const message = messageSnap.data();

        // 4. Перевіряємо, що повідомлення дійсно
        // належить авторизованому користувачу
        if (
            message.senderId !== uid ||
            !Array.isArray(chat.participants) ||
            chat.participants.length !== 2 ||
            !chat.participants.includes(uid)
        ) {
            return json(403, {
                success: false,
                error: "Немає доступу до повідомлення.",
            });
        }

        if (
            message.type !== "text" ||
            typeof message.text !== "string" ||
            !message.text.trim()
        ) {
            return json(200, {
                success: true,
                skipped: "unsupported-message",
            });
        }

        // 5. Не надсилаємо повторно старі повідомлення
        const createdAt = message.createdAt?.toMillis?.();

        if (
            !createdAt ||
            Date.now() - createdAt > MAX_MESSAGE_AGE_MS ||
            createdAt > Date.now() + 60000
        ) {
            return json(200, {
                success: true,
                skipped: "old-message",
            });
        }

        // 6. Визначаємо отримувача
        const recipientUid = chat.participants.find(
            (participant) => participant !== uid
        );

        if (!recipientUid) {
            return json(400, {
                success: false,
                error: "Отримувача не знайдено.",
            });
        }

        // Перевіряємо, чи отримувач зараз у мережі
        const presenceSnapshot = await db
            .collection("userPresence")
            .doc(recipientUid)
            .get();

        if (presenceSnapshot.exists) {
            const presenceData = presenceSnapshot.data();

            const lastSeenAt =
                presenceData.lastSeenAt?.toMillis?.() || 0;

            const timeSinceActivity = Date.now() - lastSeenAt;

            const isOnline =
                lastSeenAt > 0 &&
                timeSinceActivity >= 0 &&
                timeSinceActivity < ONLINE_THRESHOLD_MS;

            if (isOnline) {
                return json(200, {
                    success: true,
                    delivered: false,
                    skipped: "recipient-online",
                });
            }
        }

        const recipientRef = db
            .collection("users")
            .doc(recipientUid);

        const senderProfileRef = db
            .collection("publicProfiles")
            .doc(uid);

        const [recipientSnap, senderSnap] = await Promise.all([
            recipientRef.get(),
            senderProfileRef.get(),
        ]);

        if (!recipientSnap.exists) {
            return json(200, {
                success: true,
                skipped: "recipient-not-found",
            });
        }

        const recipient = recipientSnap.data();

        // 7. Перевірка прив'язки Telegram
        const telegramChatId = recipient.telegramChatId;

        if (
            recipient.blocked === true ||
            telegramChatId === undefined ||
            telegramChatId === null ||
            telegramChatId === ""
        ) {
            return json(200, {
                success: true,
                skipped: "telegram-not-connected",
            });
        }

        const subscriberSnap = await db
            .collection("telegramSubscribers")
            .doc(String(telegramChatId))
            .get();

        if (!subscriberSnap.exists) {
            return json(200, {
                success: true,
                skipped: "subscriber-not-found",
            });
        }

        const subscriber = subscriberSnap.data();

        if (
            subscriber.linkedUid !== recipientUid ||
            subscriber.active === false ||
            subscriber.chatNotifications === false
        ) {
            return json(200, {
                success: true,
                skipped: "notifications-disabled",
            });
        }

        // 8. Отримуємо ім'я та назву оголошення
        const senderProfile = senderSnap.exists
            ? senderSnap.data()
            : {};

        const senderName =
            senderProfile.login ||
            "Користувач RBoard";

        const listingTitle =
            chat.listingTitle || "Оголошення";

        // 9. Формуємо текст
        const showPreview =
            subscriber.showMessagePreview !== false;

        const messagePreview = showPreview
            ? escapeHtml(message.text.slice(0, 1000))
            : "Перейдіть на сайт, щоб прочитати повідомлення.";

        const text = [
            "💬 <b>Нове повідомлення на RBoard!</b>",
            "",
            `📦 <b>Оголошення:</b> ${escapeHtml(listingTitle)}`,
            `👤 <b>Від:</b> ${escapeHtml(senderName)}`,
            "",
            "<b>Повідомлення:</b>",
            messagePreview,
        ].join("\n");

        // У UserChats.jsx використовується параметр "chat"
        const chatUrl = new URL("/user/chats", SITE_URL);
        chatUrl.searchParams.set("chat", chatId);

        // 10. Атомарний захист від повторних запитів
        const claimId = randomUUID();

        const claimResult = await db.runTransaction(
            async (transaction) => {
                const freshMessage = await transaction.get(messageRef);

                if (!freshMessage.exists) {
                    return "missing";
                }

                const data = freshMessage.data();

                if (data.senderId !== uid) {
                    return "forbidden";
                }

                if (data.telegramNotifyStatus === "sent") {
                    return "already-sent";
                }

                const claimExpiresAt =
                    data.telegramNotifyClaimExpiresAt?.toMillis?.() || 0;

                if (
                    data.telegramNotifyStatus === "processing" &&
                    claimExpiresAt > Date.now()
                ) {
                    return "processing";
                }

                transaction.update(messageRef, {
                    telegramNotifyStatus: "processing",
                    telegramNotifyClaimId: claimId,
                    telegramNotifyClaimExpiresAt: Timestamp.fromMillis(
                        Date.now() + CLAIM_DURATION_MS
                    ),
                });

                return "claimed";
            }
        );

        if (claimResult !== "claimed") {
            return json(200, {
                success: true,
                skipped: claimResult,
            });
        }

        try {
            // 11. Надсилаємо повідомлення через Telegram API
            const response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        chat_id: telegramChatId,
                        text,
                        parse_mode: "HTML",
                        link_preview_options: {
                            is_disabled: true,
                        },
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "💬 Відповісти на RBoard",
                                        url: chatUrl.toString(),
                                    },
                                ],
                            ],
                        },
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.description ||
                    `Telegram API error: ${response.status}`
                );
            }

            // 12. Позначаємо сповіщення надісланим
            await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(messageRef);

                if (
                    snapshot.exists &&
                    snapshot.data().telegramNotifyClaimId === claimId
                ) {
                    transaction.update(messageRef, {
                        telegramNotifyStatus: "sent",
                        telegramNotifiedAt: FieldValue.serverTimestamp(),
                        telegramNotifyClaimId: FieldValue.delete(),
                        telegramNotifyClaimExpiresAt: FieldValue.delete(),
                    });
                }
            });

            console.log(
                "Telegram chat notification sent:",
                chatId,
                messageId
            );

            return json(200, {
                success: true,
                delivered: true,
            });

        } catch (sendError) {
            // Знімаємо блокування, щоб можна було повторити
            await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(messageRef);

                if (
                    snapshot.exists &&
                    snapshot.data().telegramNotifyClaimId === claimId
                ) {
                    transaction.update(messageRef, {
                        telegramNotifyStatus: FieldValue.delete(),
                        telegramNotifyClaimId: FieldValue.delete(),
                        telegramNotifyClaimExpiresAt: FieldValue.delete(),
                    });
                }
            });

            throw sendError;
        }

    } catch (error) {
        console.error(
            "Telegram chat notification error:",
            error
        );

        return json(500, {
            success: false,
            error: "Не вдалося надіслати Telegram-сповіщення.",
        });
    }
};
