const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getFirestore,
    Timestamp,
} = require("firebase-admin/firestore");

/*
 * Firebase Admin
 */
if (getApps().length === 0) {
    initializeApp({
        credential: cert({
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

const db = getFirestore();

/*
 * Telegram
 */
const BOT_TOKEN =
    process.env.TELEGRAM_USER_BOT_TOKEN;

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

const SITE_URL =
    "https://rboard.netlify.app";

/*
 * Захист HTML для Telegram.
 */
const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

/*
 * Скорочуємо опис оголошення.
 */
const getShortDescription = (
    description,
    maxLength = 220
) => {
    const text = String(
        description || ""
    )
        .trim()
        .replace(/\s+/g, " ");

    if (!text) {
        return "Без додаткового опису.";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text
        .slice(0, maxLength)
        .trim()}…`;
};

/*
 * Отримуємо активні оголошення.
 */
const getListings = async () => {
    const now = Timestamp.now();

    const snapshot = await db
        .collection("listings")
        .where(
            "status",
            "==",
            "approved"
        )
        .where(
            "expiresAt",
            ">",
            now
        )
        .orderBy(
            "expiresAt",
            "asc"
        )
        .limit(50)
        .get();

    return snapshot.docs.map(
        (document) => ({
            id: document.id,
            ...document.data(),
        })
    );
};

/*
 * Назва населеного пункту.
 */
const getCityName = (listing) => {
    if (
        listing.city &&
        typeof listing.city === "object"
    ) {
        return listing.city.name || "";
    }

    return listing.city || "";
};

/*
 * Перше фото оголошення.
 */
const getFirstImage = (listing) => {
    if (
        !Array.isArray(
            listing.images
        ) ||
        listing.images.length === 0
    ) {
        return null;
    }

    return (
        listing.images[0]
            ?.imageUrl ||
        listing.images[0]?.url ||
        null
    );
};

/*
 * Текст картки.
 */
const createCaption = (
    listing,
    index,
    total
) => {
    const title = escapeHtml(
        listing.title ||
            "Без назви"
    );

    const description =
        escapeHtml(
            getShortDescription(
                listing.comment
            )
        );

    const city = escapeHtml(
        getCityName(listing) ||
            "Населений пункт не вказано"
    );

    const type = escapeHtml(
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

/*
 * Кнопки картки.
 */
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
                    callback_data:
                        "noop",
                },
                {
                    text: "›",
                    callback_data:
                        `listing:${nextIndex}`,
                },
            ],
            [
                {
                    text:
                        "Детальніше",
                    url:
                        `${SITE_URL}/listing/${listing.id}`,
                },
            ],
        ],
    };
};

/*
 * Запит до Telegram API.
 */
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

            body: JSON.stringify(
                body
            ),
        }
    );

    const data =
        await response.json();

    if (
        !response.ok ||
        !data.ok
    ) {
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

/*
 * Надсилаємо картку.
 */
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

    /*
     * Є фотографія.
     */
    if (image) {
        return telegramRequest(
            "sendPhoto",
            {
                chat_id:
                    chatId,

                photo:
                    image,

                caption,

                parse_mode:
                    "HTML",

                reply_markup:
                    replyMarkup,
            }
        );
    }

    /*
     * Немає фотографії.
     */
    return telegramRequest(
        "sendMessage",
        {
            chat_id:
                chatId,

            text:
                caption,

            parse_mode:
                "HTML",

            reply_markup:
                replyMarkup,
        }
    );
};

/*
 * Редагуємо існуючу картку
 * при натисканні вперед/назад.
 */
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
     * Поточне повідомлення має фото
     * і наступне оголошення теж має фото.
     *
     * Просто замінюємо фото,
     * текст і кнопки.
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
                    type:
                        "photo",

                    media:
                        image,

                    caption,

                    parse_mode:
                        "HTML",
                },

                reply_markup:
                    replyMarkup,
            }
        );
    }

    /*
     * Поточне повідомлення текстове
     * і наступне оголошення теж
     * не має фотографії.
     */
    if (
        !message.photo &&
        !image
    ) {
        return telegramRequest(
            "editMessageText",
            {
                chat_id:
                    message.chat.id,

                message_id:
                    message.message_id,

                text:
                    caption,

                parse_mode:
                    "HTML",

                reply_markup:
                    replyMarkup,
            }
        );
    }

    /*
     * Якщо переходимо:
     *
     * фото -> без фото
     * або
     * без фото -> фото
     *
     * Telegram не дозволяє просто
     * змінити тип повідомлення.
     *
     * Видаляємо стару картку
     * і створюємо нову.
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

/*
 * Прибираємо "завантаження"
 * після натискання inline-кнопки.
 */
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

/*
 * Netlify Function
 */
exports.handler = async (
    event
) => {
    /*
     * Telegram надсилає POST.
     */
    if (
        event.httpMethod !==
        "POST"
    ) {
        return {
            statusCode: 405,
            body:
                "Method Not Allowed",
        };
    }

    try {
        const update =
            JSON.parse(
                event.body || "{}"
            );

        /*
         * Команда /start
         */
        if (
            update.message
                ?.text ===
            "/start"
        ) {
            const chatId =
                update.message
                    .chat.id;

            const listings =
                await getListings();

            /*
             * Немає активних
             * оголошень.
             */
            if (
                listings.length ===
                0
            ) {
                await telegramRequest(
                    "sendMessage",
                    {
                        chat_id:
                            chatId,

                        text:
                            "Наразі немає активних оголошень.",
                    }
                );

                return {
                    statusCode:
                        200,

                    body:
                        "OK",
                };
            }

            /*
             * Показуємо перше.
             */
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
         * Натискання inline-кнопок.
         */
        if (
            update.callback_query
        ) {
            const callbackQuery =
                update.callback_query;

            const data =
                callbackQuery.data ||
                "";

            await answerCallback(
                callbackQuery.id
            );

            /*
             * Кнопка з номером
             * сторінки нічого
             * не робить.
             */
            if (
                data === "noop"
            ) {
                return {
                    statusCode:
                        200,

                    body:
                        "OK",
                };
            }

            /*
             * Перехід між
             * оголошеннями.
             */
            if (
                data.startsWith(
                    "listing:"
                )
            ) {
                const requestedIndex =
                    Number(
                        data.split(
                            ":"
                        )[1]
                    );

                const listings =
                    await getListings();

                if (
                    listings.length ===
                    0
                ) {
                    return {
                        statusCode:
                            200,

                        body:
                            "OK",
                    };
                }

                /*
                 * Захист від
                 * некоректного індексу.
                 */
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
                    listings[
                        safeIndex
                    ],
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
         * Повертаємо Telegram 200,
         * щоб одна помилка не
         * спричинила нескінченні
         * повторні webhook-запити.
         */
        return {
            statusCode: 200,
            body: "OK",
        };
    }
};