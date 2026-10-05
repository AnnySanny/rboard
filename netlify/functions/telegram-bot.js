const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env.FIREBASE_PRIVATE_KEY?.replace(
                    /\\n/g,
                    "\n"
                ),
        }),
    });
}

const db = admin.firestore();

const BOT_TOKEN =
    process.env.TELEGRAM_USER_BOT_TOKEN;

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

const SITE_URL =
    "https://rboard.netlify.app";

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

const getShortDescription = (
    description,
    maxLength = 220
) => {
    const text =
        String(description || "")
            .trim()
            .replace(/\s+/g, " ");

    if (!text) {
        return "Без додаткового опису.";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}…`;
};

const getListings = async () => {
    const now =
        admin.firestore.Timestamp.now();

    const snapshot = await db
        .collection("listings")
        .where("status", "==", "approved")
        .where("expiresAt", ">", now)
        .orderBy("expiresAt", "asc")
        .limit(50)
        .get();

    return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
    }));
};

const getCityName = (listing) => {
    if (
        listing.city &&
        typeof listing.city === "object"
    ) {
        return listing.city.name || "";
    }

    return listing.city || "";
};

const getFirstImage = (listing) => {
    if (
        !Array.isArray(listing.images) ||
        listing.images.length === 0
    ) {
        return null;
    }

    return (
        listing.images[0]?.imageUrl ||
        listing.images[0]?.url ||
        null
    );
};

const createCaption = (
    listing,
    index,
    total
) => {
    const title =
        escapeHtml(
            listing.title || "Без назви"
        );

    const description =
        escapeHtml(
            getShortDescription(
                listing.comment
            )
        );

    const city =
        escapeHtml(
            getCityName(listing) ||
                "Населений пункт не вказано"
        );

    const type =
        escapeHtml(
            listing.type || "Інше"
        );

    return [
        `<b>${title}</b>`,
        "",
        description,
        "",
        `<i>${city}  •  ${type}</i>`,
        "",
        `${index + 1} з ${total}`,
    ].join("\n");
};

const createKeyboard = (
    listing,
    index,
    total
) => {
    const previousIndex =
        index <= 0
            ? total - 1
            : index - 1;

    const nextIndex =
        index >= total - 1
            ? 0
            : index + 1;

    return {
        inline_keyboard: [
            [
                {
                    text: "‹",
                    callback_data:
                        `listing:${previousIndex}`,
                },
                {
                    text:
                        `${index + 1} / ${total}`,
                    callback_data: "noop",
                },
                {
                    text: "›",
                    callback_data:
                        `listing:${nextIndex}`,
                },
            ],
            [
                {
                    text: "Детальніше",
                    url:
                        `${SITE_URL}/listing/${listing.id}`,
                },
            ],
        ],
    };
};

const telegramRequest = async (
    method,
    body
) => {
    const response = await fetch(
        `${TELEGRAM_API}/${method}`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        console.error(
            `Telegram ${method} error:`,
            data
        );

        throw new Error(
            `Telegram ${method} failed`
        );
    }

    return data;
};

const sendListing = async (
    chatId,
    listing,
    index,
    total
) => {
    const image =
        getFirstImage(listing);

    const caption =
        createCaption(
            listing,
            index,
            total
        );

    const replyMarkup =
        createKeyboard(
            listing,
            index,
            total
        );

    if (image) {
        return telegramRequest(
            "sendPhoto",
            {
                chat_id: chatId,
                photo: image,
                caption,
                parse_mode: "HTML",
                reply_markup:
                    replyMarkup,
            }
        );
    }

    return telegramRequest(
        "sendMessage",
        {
            chat_id: chatId,
            text: caption,
            parse_mode: "HTML",
            reply_markup:
                replyMarkup,
        }
    );
};

const editListing = async (
    callbackQuery,
    listing,
    index,
    total
) => {
    const message =
        callbackQuery.message;

    const image =
        getFirstImage(listing);

    const caption =
        createCaption(
            listing,
            index,
            total
        );

    const replyMarkup =
        createKeyboard(
            listing,
            index,
            total
        );

    /*
     * Якщо поточне повідомлення вже
     * містить фотографію і наступне
     * оголошення також має фото.
     */
    if (
        message.photo &&
        image
    ) {
        return telegramRequest(
            "editMessageMedia",
            {
                chat_id:
                    message.chat.id,

                message_id:
                    message.message_id,

                media: {
                    type: "photo",
                    media: image,
                    caption,
                    parse_mode: "HTML",
                },

                reply_markup:
                    replyMarkup,
            }
        );
    }

    /*
     * Telegram не дозволяє нормально
     * перетворити photo-message у
     * звичайний text-message і навпаки.
     *
     * Тому в такому випадку видаляємо
     * стару картку і надсилаємо нову.
     */
    await telegramRequest(
        "deleteMessage",
        {
            chat_id:
                message.chat.id,

            message_id:
                message.message_id,
        }
    );

    return sendListing(
        message.chat.id,
        listing,
        index,
        total
    );
};

const answerCallback = async (
    callbackQueryId
) => {
    try {
        await telegramRequest(
            "answerCallbackQuery",
            {
                callback_query_id:
                    callbackQueryId,
            }
        );
    } catch (error) {
        console.error(
            "Callback answer error:",
            error
        );
    }
};

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed",
        };
    }

    try {
        const update =
            JSON.parse(
                event.body || "{}"
            );

        /*
         * /start
         */
        if (
            update.message?.text ===
            "/start"
        ) {
            const chatId =
                update.message.chat.id;

            const listings =
                await getListings();

            if (
                listings.length === 0
            ) {
                await telegramRequest(
                    "sendMessage",
                    {
                        chat_id: chatId,
                        text:
                            "Наразі немає активних оголошень.",
                    }
                );

                return {
                    statusCode: 200,
                    body: "OK",
                };
            }

            await sendListing(
                chatId,
                listings[0],
                0,
                listings.length
            );

            return {
                statusCode: 200,
                body: "OK",
            };
        }

        /*
         * Inline-кнопки.
         */
        if (update.callback_query) {
            const callbackQuery =
                update.callback_query;

            const data =
                callbackQuery.data || "";

            await answerCallback(
                callbackQuery.id
            );

            if (data === "noop") {
                return {
                    statusCode: 200,
                    body: "OK",
                };
            }

            if (
                data.startsWith(
                    "listing:"
                )
            ) {
                const requestedIndex =
                    Number(
                        data.split(":")[1]
                    );

                const listings =
                    await getListings();

                if (
                    listings.length === 0
                ) {
                    return {
                        statusCode: 200,
                        body: "OK",
                    };
                }

                const safeIndex =
                    Number.isInteger(
                        requestedIndex
                    )
                        ? Math.max(
                              0,
                              Math.min(
                                  requestedIndex,
                                  listings.length -
                                      1
                              )
                          )
                        : 0;

                await editListing(
                    callbackQuery,
                    listings[safeIndex],
                    safeIndex,
                    listings.length
                );
            }
        }

        return {
            statusCode: 200,
            body: "OK",
        };
    } catch (error) {
        console.error(
            "Telegram bot error:",
            error
        );

        /*
         * Telegram краще повернути 200,
         * щоб він не повторював одну
         * й ту саму подію багато разів.
         */
        return {
            statusCode: 200,
            body: "OK",
        };
    }
};