
const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getFirestore,
    FieldValue,
} = require("firebase-admin/firestore");

const {
    getAuth,
} = require("firebase-admin/auth");

// ==============================
// FIREBASE ADMIN
// ==============================

if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env.FIREBASE_PRIVATE_KEY
                    ?.replace(/\\n/g, "\n"),
        }),
    });
}

const db = getFirestore();
const auth = getAuth();

// ==============================
// НАЛАШТУВАННЯ
// ==============================

const BOT_TOKEN =
    process.env.TELEGRAM_USER_BOT_TOKEN;

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

const COLLECTION_NAME = "siteNews";
const SUBSCRIBERS_COLLECTION = "telegramSubscribers";

const TEST_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

const BATCH_SIZE = 20;
const BATCH_DELAY = 1100;
const MAX_RETRIES = 3;

// ==============================
// ДОПОМІЖНІ ФУНКЦІЇ
// ==============================

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

const isValidUrl = (value) => {
    try {
        const url = new URL(value);

        return url.protocol === "https:";
    } catch {
        return false;
    }
};

const responseJson = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
});

// ==============================
// ПЕРЕВІРКА АДМІНІСТРАТОРА
// ==============================

const verifyAdmin = async (event) => {
    const authorization =
        event.headers.authorization ||
        event.headers.Authorization ||
        "";

    if (!authorization.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }

    const token = authorization.slice(7);

    const decoded = await auth.verifyIdToken(
        token,
        true
    );

    // Варіант 1: роль через Firebase custom claims.
    if (decoded.admin === true) {
        return decoded.uid;
    }

    // Варіант 2: роль у Firestore users.
    const userDoc = await db
        .collection("users")
        .doc(decoded.uid)
        .get();

    const user = userDoc.data();

    if (
        userDoc.exists &&
        (
            user.role === "admin" ||
            user.isAdmin === true
        )
    ) {
        return decoded.uid;
    }

    throw new Error("Forbidden");
};

// ==============================
// ФОРМУВАННЯ ПОВІДОМЛЕННЯ
// ==============================

const buildMessage = (news) => {
    const title = escapeHtml(
        news.title || "Новина RBoard"
    );

    const description = escapeHtml(
        news.description || ""
    );

    return [
        `📰 <b>${title}</b>`,
        "",
        description,
    ].join("\n");
};

// ==============================
// TELEGRAM API
// ==============================

const telegramRequest = async (
    method,
    payload
) => {
    for (
        let attempt = 0;
        attempt <= MAX_RETRIES;
        attempt++
    ) {
        try {
            const response = await fetch(
                `${TELEGRAM_API}/${method}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),

                    signal: AbortSignal.timeout(20000),
                }
            );

            const result = await response.json();

            if (result.ok) {
                return result;
            }

            // Telegram rate limit
            if (
                result.error_code === 429 &&
                attempt < MAX_RETRIES
            ) {
                const retryAfter =
                    Number(
                        result.parameters
                            ?.retry_after
                    ) || 2;

                await sleep(
                    Math.max(
                        retryAfter * 1000,
                        1000
                    )
                );

                continue;
            }

            // Тимчасові серверні помилки Telegram
            if (
                response.status >= 500 &&
                attempt < MAX_RETRIES
            ) {
                await sleep(
                    1000 * 2 ** attempt
                );

                continue;
            }

            return result;
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                throw error;
            }

            await sleep(
                1000 * 2 ** attempt
            );
        }
    }
};

// ==============================
// НАДСИЛАННЯ ОДНОМУ КОРИСТУВАЧУ
// ==============================

const sendTelegramNews = async (
    chatId,
    news
) => {
    const text = buildMessage(news);

    const replyMarkup = {
        inline_keyboard: [
            [
                {
                    text:
                        news.buttonText ||
                        "Переглянути",

                    url: news.buttonUrl,
                },
            ],
        ],
    };

    if (news.imageUrl) {
        return telegramRequest(
            "sendPhoto",
            {
                chat_id: chatId,

                photo: news.imageUrl,

                caption: text,

                parse_mode: "HTML",

                reply_markup: replyMarkup,
            }
        );
    }

    return telegramRequest(
        "sendMessage",
        {
            chat_id: chatId,

            text,

            parse_mode: "HTML",

            disable_web_page_preview: true,

            reply_markup: replyMarkup,
        }
    );
};

// ==============================
// ТЕСТОВА РОЗСИЛКА
// ==============================

const sendTestNews = async (
    newsRef,
    news
) => {
    console.log(
        `Testing news ${newsRef.id}`
    );

    let success = false;

    try {
        const result = await sendTelegramNews(
            TEST_CHAT_ID,
            news
        );

        success = result.ok === true;

        if (!success) {
            console.error(
                "Telegram test error:",
                result
            );
        }
    } catch (error) {
        console.error(
            "Telegram test exception:",
            error
        );
    }

    // Тест не змінює статус новини.
    await newsRef.update({
        testAt: FieldValue.serverTimestamp(),
        testSuccess: success,
    });

    console.log(
        `News test ${newsRef.id}: ${success}`
    );

    return success;
};

// ==============================
// ОБРОБКА ПІДПИСНИКА
// ==============================

const processSubscriber = async (
    document,
    news
) => {
    const subscriber = document.data();

    try {
        if (!subscriber.chatId) {
            return false;
        }

        const result = await sendTelegramNews(
            subscriber.chatId,
            news
        );

        if (result.ok) {
            return true;
        }

        // Користувач заблокував бота.
        if (result.error_code === 403) {
            await document.ref.update({
                active: false,
                updatedAt:
                    FieldValue.serverTimestamp(),
            });
        }

        console.error(
            `Telegram error ${subscriber.chatId}:`,
            result
        );

        return false;
    } catch (error) {
        console.error(
            `Telegram exception ${subscriber.chatId}:`,
            error
        );

        return false;
    }
};

// ==============================
// МАСОВА РОЗСИЛКА
// ==============================

const sendAllNews = async (
    newsRef,
    news
) => {
    const snapshot = await db
        .collection(SUBSCRIBERS_COLLECTION)
        .where("active", "==", true)
        .get();

    const subscribers = snapshot.docs;

    const totalRecipients =
        subscribers.length;

    let sent = 0;
    let failed = 0;

    await newsRef.update({
        totalRecipients,
        sent: 0,
        failed: 0,
    });

    console.log(
        `Starting news ${newsRef.id}: ${totalRecipients} subscribers`
    );

    for (
        let i = 0;
        i < subscribers.length;
        i += BATCH_SIZE
    ) {
        const batch = subscribers.slice(
            i,
            i + BATCH_SIZE
        );

        const results = await Promise.allSettled(
            batch.map((document) =>
                processSubscriber(
                    document,
                    news
                )
            )
        );

        results.forEach((result) => {
            if (
                result.status === "fulfilled" &&
                result.value === true
            ) {
                sent++;
            } else {
                failed++;
            }
        });

        // Зберігаємо поточний прогрес.
        await newsRef.update({
            sent,
            failed,
            lastProgressAt:
                FieldValue.serverTimestamp(),
        });

        console.log(
            `News ${newsRef.id}: ${Math.min(
                i + BATCH_SIZE,
                totalRecipients
            )}/${totalRecipients}, sent=${sent}, failed=${failed}`
        );

        // Пауза між групами.
        if (
            i + BATCH_SIZE <
            subscribers.length
        ) {
            await sleep(BATCH_DELAY);
        }
    }

    const finalStatus =
        failed === 0 ? "sent" : "partial";

    await newsRef.update({
        status: finalStatus,

        sent,
        failed,
        totalRecipients,

        sentAt: FieldValue.serverTimestamp(),
    });

    console.log(
        `News ${newsRef.id} completed: ${sent} sent, ${failed} failed`
    );
};

// ==============================
// NETLIFY HANDLER
// ==============================

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return responseJson(405, {
            success: false,
            message: "Method Not Allowed",
        });
    }

    if (!BOT_TOKEN) {
        return responseJson(500, {
            success: false,
            message:
                "Telegram bot token is missing",
        });
    }

    // Перевіряємо адміністратора.
    let adminUid;

    try {
        adminUid = await verifyAdmin(event);
    } catch (error) {
        console.error(
            "Admin verification error:",
            error
        );

        return responseJson(
            error.message === "Forbidden"
                ? 403
                : 401,
            {
                success: false,
                message:
                    "Access denied",
            }
        );
    }

    let newsId;
    let mode;

    try {
        const body = JSON.parse(
            event.body || "{}"
        );

        newsId = body.newsId;
        mode = body.mode;
    } catch {
        return responseJson(400, {
            success: false,
            message: "Invalid JSON",
        });
    }

    if (
        typeof newsId !== "string" ||
        !newsId.trim() ||
        !["test", "all"].includes(mode)
    ) {
        return responseJson(400, {
            success: false,
            message:
                "Valid newsId and mode required",
        });
    }

    const newsRef = db
        .collection(COLLECTION_NAME)
        .doc(newsId);

    let news;

    try {
        const newsDocument =
            await newsRef.get();

        if (!newsDocument.exists) {
            return responseJson(404, {
                success: false,
                message: "News not found",
            });
        }

        news = newsDocument.data();

        if (
            !news.title ||
            !news.description ||
            !news.buttonText ||
            !isValidUrl(news.buttonUrl)
        ) {
            return responseJson(400, {
                success: false,
                message:
                    "Invalid news data",
            });
        }

        if (
            news.imageUrl &&
            !isValidUrl(news.imageUrl)
        ) {
            return responseJson(400, {
                success: false,
                message:
                    "Invalid image URL",
            });
        }

        const message = buildMessage(news);

        // Telegram sendPhoto має ліміт
        // 1024 символи підпису після обробки.
        if (
            news.imageUrl &&
            [...message.replace(
                /<[^>]+>/g,
                ""
            )].length > 1024
        ) {
            return responseJson(400, {
                success: false,
                message:
                    "Photo caption is too long",
            });
        }

        if (
            !news.imageUrl &&
            [...message].length > 4096
        ) {
            return responseJson(400, {
                success: false,
                message:
                    "Message is too long",
            });
        }

        if (mode === "test") {
            if (news.status !== "draft") {
                return responseJson(409, {
                    success: false,
                    message:
                        "Only drafts can be tested",
                });
            }

            const success = await sendTestNews(
                newsRef,
                news
            );

            return responseJson(
                success ? 200 : 502,
                {
                    success,
                    mode: "test",
                    chatId: TEST_CHAT_ID,
                }
            );
        }

        // ==============================
        // БЛОКУВАННЯ ПОВТОРНОЇ РОЗСИЛКИ
        // ==============================

        const acquired = await db.runTransaction(
            async (transaction) => {
                const snapshot =
                    await transaction.get(newsRef);

                if (
                    !snapshot.exists ||
                    snapshot.data().status !==
                        "draft"
                ) {
                    return false;
                }

                transaction.update(newsRef, {
                    status: "sending",

                    sent: 0,
                    failed: 0,

                    startedAt:
                        FieldValue.serverTimestamp(),

                    sentBy: adminUid,
                });

                return true;
            }
        );

        if (!acquired) {
            return responseJson(409, {
                success: false,
                message:
                    "News already sent or sending",
            });
        }

        // ==============================
        // ЗАПУСК МАСОВОЇ РОЗСИЛКИ
        // ==============================

        try {
            await sendAllNews(
                newsRef,
                news
            );
        } catch (error) {
            console.error(
                "Mass sending error:",
                error
            );

            await newsRef.update({
                status: "failed",

                error:
                    error.message ||
                    "Unknown error",
            });

            throw error;
        }

        return responseJson(200, {
            success: true,
            mode: "all",
            newsId,
        });
    } catch (error) {
        console.error(
            "send-news-background error:",
            error
        );

        return responseJson(500, {
            success: false,
            message:
                "Internal server error",
        });
    }
};
