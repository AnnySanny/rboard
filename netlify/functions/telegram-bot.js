const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getFirestore,
    Timestamp,
} = require("firebase-admin/firestore");


/* =========================================================
   FIREBASE
========================================================= */

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


/* =========================================================
   TELEGRAM
========================================================= */

const BOT_TOKEN =
    process.env.TELEGRAM_USER_BOT_TOKEN;

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

const SITE_URL =
    "https://rboard.netlify.app";

/*
 * Стандартне фото для оголошень,
 * які не мають власних фотографій.
 */
const DEFAULT_IMAGE =
    `${SITE_URL}/telegram-listing-placeholder.jpg`;




/*
 * Короткі ID категорій для callback_data.
 *
 * Не передаємо українські назви напряму,
 * бо Telegram обмежує callback_data.
 */
const CATEGORY_CODES = {
    sale: "Продаж",
    buy: "Купівля",
    rent: "Оренда",
    service: "Послуга",
    work: "Робота",
    question: "Питання",
    exchange: "Обмін",
    free: "Віддам безкоштовно",
    lost: "Загублено / знайдено",
    event: "Подія",
    community: "Оголошення громади",
    other: "Інше",
};


const getCategoryCode = (category) => {
    const entry =
        Object.entries(
            CATEGORY_CODES
        ).find(
            ([, value]) =>
                value === category
        );

    return entry?.[0] || "all";
};


const getCategoryFromCode = (
    code
) => {
    if (
        !code ||
        code === "all"
    ) {
        return null;
    }

    return (
        CATEGORY_CODES[code] ||
        null
    );
};
/* =========================================================
   ДОПОМІЖНІ ФУНКЦІЇ
========================================================= */

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};


const getShortDescription = (
    description,
    maxLength = 260
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
 * Отримуємо назву міста/села.
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


/* =========================================================
   ФОТО
========================================================= */

/*
 * Повертаємо всі коректні URL
 * фотографій оголошення.
 */
const optimizeCloudinaryImage = (url) => {
    if (!url) {
        return null;
    }

    /*
     * Оптимізацію застосовуємо
     * тільки до Cloudinary.
     */
    if (
        !url.includes(
            "res.cloudinary.com"
        )
    ) {
        return url;
    }

    /*
     * Було:
     *
     * /image/upload/v123/...
     *
     * Стає:
     *
     * /image/upload/f_jpg,q_auto,w_1600/v123/...
     */
    return url.replace(
        "/image/upload/",
        "/image/upload/f_jpg,q_auto,w_1600/"
    );
};


const getListingImages = (listing) => {
    if (
        !Array.isArray(listing.images) ||
        listing.images.length === 0
    ) {
        return [];
    }

    return listing.images
        .map((image) => {
            let url = null;

            if (
                typeof image === "string"
            ) {
                url = image;
            } else {
                url =
                    image?.imageUrl ||
                    image?.url ||
                    null;
            }

            return optimizeCloudinaryImage(
                url
            );
        })
        .filter(Boolean)
        .slice(0, 10);
};


/*
 * Головне фото картки.
 *
 * Якщо фото немає —
 * використовуємо placeholder.
 */
const getMainImage = (listing) => {
    const images =
        getListingImages(listing);

    if (images.length > 0) {
        return images[0];
    }

    return DEFAULT_IMAGE;
};


/* =========================================================
   FIRESTORE
========================================================= */

const documentToListing = (
    document
) => {
    if (!document?.exists) {
        return null;
    }

    return {
        id: document.id,
        ...document.data(),
    };
};


/*
 * Перевіряємо, чи оголошення
 * досі активне.
 */
const isListingActive = (
    listing
) => {
    if (!listing) {
        return false;
    }

    if (
        listing.status !==
        "approved"
    ) {
        return false;
    }

    if (!listing.expiresAt) {
        return false;
    }

    return (
        listing.expiresAt.toMillis() >
        Date.now()
    );
};


/*
 * Отримуємо конкретне
 * оголошення за ID.
 *
 * 1 Firestore read.
 */
const getListingById =
    async (listingId) => {
        const document =
            await db
                .collection("listings")
                .doc(listingId)
                .get();

        return documentToListing(
            document
        );
    };


/*
 * Перше активне оголошення.
 *
 * 1 Firestore read.
 */
const getFirstListing = async (
    category = null
) => {
    const now =
        Timestamp.now();

    let query =
        db
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
            );

    if (category) {
        query =
            query.where(
                "type",
                "==",
                category
            );
    }

    const snapshot =
        await query
            .orderBy(
                "expiresAt",
                "asc"
            )
            .limit(1)
            .get();

    if (snapshot.empty) {
        return null;
    }

    return {
        id:
            snapshot.docs[0].id,

        ...snapshot.docs[0].data(),
    };
};



/*
 * Останнє активне оголошення.
 *
 * Використовується коли
 * користувач натискає "назад"
 * на першому оголошенні.
 */
const getLastListing = async (
    category = null
) => {
    const now =
        Timestamp.now();

    let query =
        db
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
            );

    if (category) {
        query =
            query.where(
                "type",
                "==",
                category
            );
    }

    const snapshot =
        await query
            .orderBy(
                "expiresAt",
                "desc"
            )
            .limit(1)
            .get();

    if (snapshot.empty) {
        return null;
    }

    return {
        id:
            snapshot.docs[0].id,

        ...snapshot.docs[0].data(),
    };
};


/*
 * Наступне активне оголошення.
 */
const getNextListing = async (
    currentListing,
    category = null
) => {
    const now =
        Timestamp.now();

    let query =
        db
            .collection("listings")
            .where(
                "status",
                "==",
                "approved"
            )
            .where(
                "expiresAt",
                ">",
                currentListing.expiresAt
            )
            .where(
                "expiresAt",
                ">",
                now
            );

    if (category) {
        query =
            query.where(
                "type",
                "==",
                category
            );
    }

    const snapshot =
        await query
            .orderBy(
                "expiresAt",
                "asc"
            )
            .limit(1)
            .get();

    if (!snapshot.empty) {
        return {
            id:
                snapshot.docs[0].id,

            ...snapshot.docs[0].data(),
        };
    }

    return getFirstListing(
        category
    );
};


/*
 * Попереднє активне оголошення.
 */
const getPreviousListing = async (
    currentListing,
    category = null
) => {
    const now =
        Timestamp.now();

    let query =
        db
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
            .where(
                "expiresAt",
                "<",
                currentListing.expiresAt
            );

    if (category) {
        query =
            query.where(
                "type",
                "==",
                category
            );
    }

    const snapshot =
        await query
            .orderBy(
                "expiresAt",
                "desc"
            )
            .limit(1)
            .get();

    if (!snapshot.empty) {
        return {
            id:
                snapshot.docs[0].id,

            ...snapshot.docs[0].data(),
        };
    }

    return getLastListing(
        category
    );
};

/* =========================================================
   ТЕКСТ КАРТКИ
========================================================= */

const createCaption = (
    listing
) => {
    const title =
        escapeHtml(
            listing.title ||
            "Без назви"
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
            listing.type ||
            "Інше"
        );

    return [
        `<b>${title}</b>`,
        "",
        description,
        "",
        `<i>${city}  •  ${type}</i>`,
    ].join("\n");
};


/* =========================================================
   КНОПКИ ОСНОВНОЇ КАРТКИ
========================================================= */

const createKeyboard = (
    listing,
    category = null
) => {
    const images =
        getListingImages(listing);

    const categoryCode =
        getCategoryCode(
            category
        );

    const keyboard = [
        [
            {
                text: "‹",
                callback_data:
                    `prev:${listing.id}:${categoryCode}`,
            },

            {
                text: "›",
                callback_data:
                    `next:${listing.id}:${categoryCode}`,
            },
        ],
    ];


    if (images.length > 1) {
        keyboard.push([
            {
                text:
                    `Всі фото (${images.length})`,

                callback_data:
                    `photos:${listing.id}`,
            },
        ]);
    }


    keyboard.push([
        {
            text:
                "Детальніше",

            url:
                `${SITE_URL}/listing/${listing.id}`,
        },
    ]);


    keyboard.push([
        {
            text:
                category
                    ? `Категорія: ${category}`
                    : "Обрати категорію",

            callback_data:
                "categories",
        },
    ]);


    keyboard.push([
        {
            text:
                "Оновити оголошення",

            callback_data:
                `refresh:${categoryCode}`,
        },
    ]);


    return {
        inline_keyboard:
            keyboard,
    };
};


/* =========================================================
   TELEGRAM API
========================================================= */

const telegramRequest = async (
    method,
    body
) => {
    const response =
        await fetch(
            `${TELEGRAM_API}/${method}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify(
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


/* =========================================================
   ОСНОВНА КАРТКА
========================================================= */

const sendListing = async (
    chatId,
    listing,
    category = null
) => {
    return telegramRequest(
        "sendPhoto",
        {
            chat_id:
                chatId,

            photo:
                getMainImage(
                    listing
                ),

            caption:
                createCaption(
                    listing
                ),

            parse_mode:
                "HTML",

            reply_markup:
                createKeyboard(
                    listing,
                    category
                ),
        }
    );
};

/*
 * Замінюємо вміст тієї самої
 * Telegram-картки.
 */
const editListing = async (
    callbackQuery,
    listing,
    category = null
) => {
    return telegramRequest(
        "editMessageMedia",
        {
            chat_id:
                callbackQuery
                    .message
                    .chat
                    .id,

            message_id:
                callbackQuery
                    .message
                    .message_id,

            media: {
                type:
                    "photo",

                media:
                    getMainImage(
                        listing
                    ),

                caption:
                    createCaption(
                        listing
                    ),

                parse_mode:
                    "HTML",
            },

            reply_markup:
                createKeyboard(
                    listing,
                    category
                ),
        }
    );
};


/* =========================================================
   ГАЛЕРЕЯ
========================================================= */

const sendListingPhotos = async (
    chatId,
    listing
) => {
    const images =
        getListingImages(listing);

    if (images.length <= 1) {
        return;
    }

    console.log(
        `Відправляємо ${images.length} фото оголошення ${listing.id}`
    );

    const media =
        images.map(
            (image, index) => ({
                type: "photo",

                media: image,

                ...(index === 0
                    ? {
                        caption:
                            `<b>${escapeHtml(
                                listing.title ||
                                "Фото оголошення"
                            )}</b>`,

                        parse_mode:
                            "HTML",
                    }
                    : {}),
            })
        );

    const albumResponse =
        await telegramRequest(
            "sendMediaGroup",
            {
                chat_id: chatId,
                media,
            }
        );

    const sentMessages =
        albumResponse.result || [];

    if (
        sentMessages.length === 0
    ) {
        return;
    }

    await telegramRequest(
        "sendMessage",
        {
            chat_id: chatId,

            text:
                `Фото оголошення «${escapeHtml(
                    listing.title ||
                    "Без назви"
                )}»`,

            parse_mode: "HTML",

            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text:
                                "✕ Закрити фото",

                            callback_data:
                                `closephotos:${sentMessages.length}`,
                        },
                    ],
                ],
            },
        }
    );
};


/* =========================================================
   ЗАКРИТТЯ ГАЛЕРЕЇ
========================================================= */

const closeListingPhotos =
    async (
        callbackQuery,
        photoCount
    ) => {
        const chatId =
            callbackQuery
                .message
                .chat
                .id;

        /*
         * message_id цього повідомлення —
         * це повідомлення
         * "✕ Закрити фото".
         */
        const closeMessageId =
            callbackQuery
                .message
                .message_id;


        /*
         * Фото альбому були
         * відправлені безпосередньо
         * перед повідомленням
         * із кнопкою.
         *
         * Тому їх ID:
         *
         * closeMessageId - 1
         * closeMessageId - 2
         * ...
         */
        for (
            let i = 1;
            i <= photoCount;
            i++
        ) {
            try {
                await telegramRequest(
                    "deleteMessage",
                    {
                        chat_id:
                            chatId,

                        message_id:
                            closeMessageId -
                            i,
                    }
                );
            } catch (error) {
                console.error(
                    "Помилка видалення фото:",
                    error
                );
            }
        }


        /*
         * Видаляємо саме повідомлення
         * з кнопкою "Закрити фото".
         */
        try {
            await telegramRequest(
                "deleteMessage",
                {
                    chat_id:
                        chatId,

                    message_id:
                        closeMessageId,
                }
            );
        } catch (error) {
            console.error(
                "Помилка видалення кнопки закриття:",
                error
            );
        }
    };

const createCategoriesKeyboard =
    () => {
        return {
            inline_keyboard: [
                [
                    {
                        text:
                            "Усі оголошення",
                        callback_data:
                            "category:all",
                    },
                ],

                [
                    {
                        text: "Продаж",
                        callback_data:
                            "category:sale",
                    },
                    {
                        text: "Купівля",
                        callback_data:
                            "category:buy",
                    },
                ],

                [
                    {
                        text: "Оренда",
                        callback_data:
                            "category:rent",
                    },
                    {
                        text: "Послуга",
                        callback_data:
                            "category:service",
                    },
                ],

                [
                    {
                        text: "Робота",
                        callback_data:
                            "category:work",
                    },
                    {
                        text: "Питання",
                        callback_data:
                            "category:question",
                    },
                ],

                [
                    {
                        text: "Обмін",
                        callback_data:
                            "category:exchange",
                    },
                    {
                        text:
                            "Віддам безкоштовно",
                        callback_data:
                            "category:free",
                    },
                ],

                [
                    {
                        text:
                            "Загублено / знайдено",
                        callback_data:
                            "category:lost",
                    },
                ],

                [
                    {
                        text: "Подія",
                        callback_data:
                            "category:event",
                    },
                    {
                        text:
                            "Оголошення громади",
                        callback_data:
                            "category:community",
                    },
                ],

                [
                    {
                        text: "Інше",
                        callback_data:
                            "category:other",
                    },
                ],
            ],
        };
    };

const showCategories = async (
    callbackQuery,
    message = "Оберіть категорію оголошень:"
) => {
    return telegramRequest(
        "editMessageCaption",
        {
            chat_id:
                callbackQuery
                    .message
                    .chat
                    .id,

            message_id:
                callbackQuery
                    .message
                    .message_id,

            caption:
                `<b>${escapeHtml(
                    message
                )}</b>`,

            parse_mode:
                "HTML",

            reply_markup:
                createCategoriesKeyboard(),
        }
    );
};
/* =========================================================
   CALLBACK
========================================================= */

const answerCallback =
    async (
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


/* =========================================================
   NETLIFY FUNCTION
========================================================= */

exports.handler = async (
    event
) => {
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


        /* =================================================
           /START
        ================================================= */

        if (
            update.message
                ?.text
                ?.startsWith(
                    "/start"
                )
        ) {
            const chatId =
                update.message
                    .chat
                    .id;

            /*
             * Зберігаємо користувача,
             * який запустив Telegram-бота.
             */
            await db
                .collection("telegramSubscribers")
                .doc(String(chatId))
                .set(
                    {
                        chatId: chatId,

                        username:
                            update.message
                                .from
                                ?.username ||
                            null,

                        firstName:
                            update.message
                                .from
                                ?.first_name ||
                            null,

                        active: true,

                        updatedAt:
                            Timestamp.now(),
                    },
                    {
                        merge: true,
                    }
                );
            const listing =
                await getFirstListing();


            if (!listing) {
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


            await sendListing(
                chatId,
                listing
            );


            return {
                statusCode: 200,
                body: "OK",
            };
        }


        /* =================================================
           CALLBACK QUERY
        ================================================= */

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

            if (
                data === "categories"
            ) {
                await showCategories(
                    callbackQuery
                );

                return {
                    statusCode: 200,
                    body: "OK",
                };
            }
            if (
                data.startsWith(
                    "category:"
                )
            ) {
                const categoryCode =
                    data.substring(9);

                const category =
                    getCategoryFromCode(
                        categoryCode
                    );


                const listing =
                    await getFirstListing(
                        category
                    );


                /*
                 * У категорії нічого немає.
                 */
                if (!listing) {
                    const categoryName =
                        category ||
                        "Усі оголошення";

                    await showCategories(
                        callbackQuery,
                        `У категорії «${categoryName}» наразі немає активних оголошень.\n\nОберіть іншу категорію:`
                    );

                    return {
                        statusCode: 200,
                        body: "OK",
                    };
                }


                /*
                 * Знайшли оголошення.
                 */
                await editListing(
                    callbackQuery,
                    listing,
                    category
                );


                return {
                    statusCode: 200,
                    body: "OK",
                };
            }
            if (
                data.startsWith(
                    "refresh:"
                )
            ) {
                const categoryCode =
                    data.substring(8);

                const category =
                    getCategoryFromCode(
                        categoryCode
                    );


                const listing =
                    await getFirstListing(
                        category
                    );


                if (!listing) {
                    await showCategories(
                        callbackQuery,
                        category
                            ? `У категорії «${category}» наразі немає активних оголошень.\n\nОберіть іншу категорію:`
                            : "Наразі немає активних оголошень.\n\nСпробуйте обрати категорію:"
                    );


                    return {
                        statusCode: 200,
                        body: "OK",
                    };
                }


                await editListing(
                    callbackQuery,
                    listing,
                    category
                );


                return {
                    statusCode: 200,
                    body: "OK",
                };
            }
            /* =============================================
               NOOP
            ============================================= */

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


            /* =============================================
               ВІДКРИТИ ВСІ ФОТО
            ============================================= */

            if (
                data.startsWith(
                    "photos:"
                )
            ) {
                const listingId =
                    data.substring(7);


                const listing =
                    await getListingById(
                        listingId
                    );


                if (
                    isListingActive(
                        listing
                    )
                ) {
                    await sendListingPhotos(
                        callbackQuery
                            .message
                            .chat
                            .id,

                        listing
                    );
                }


                return {
                    statusCode:
                        200,

                    body:
                        "OK",
                };
            }


            /* =============================================
               ЗАКРИТИ ФОТО
            ============================================= */

            if (
                data.startsWith(
                    "closephotos:"
                )
            ) {
                const photoCount =
                    Number(
                        data.substring(
                            12
                        )
                    );


                if (
                    Number.isInteger(
                        photoCount
                    ) &&
                    photoCount > 0 &&
                    photoCount <= 10
                ) {
                    await closeListingPhotos(
                        callbackQuery,
                        photoCount
                    );
                }


                return {
                    statusCode:
                        200,

                    body:
                        "OK",
                };
            }


            /* =============================================
               НАСТУПНЕ ОГОЛОШЕННЯ
            ============================================= */
            /* =============================================
               НАСТУПНЕ ОГОЛОШЕННЯ
            ============================================= */

            if (
                data.startsWith(
                    "next:"
                )
            ) {
                const parts =
                    data.split(":");

                const listingId =
                    parts[1];

                const categoryCode =
                    parts[2] ||
                    "all";

                const category =
                    getCategoryFromCode(
                        categoryCode
                    );


                const currentListing =
                    await getListingById(
                        listingId
                    );


                if (
                    !isListingActive(
                        currentListing
                    )
                ) {
                    const firstListing =
                        await getFirstListing(
                            category
                        );


                    if (firstListing) {
                        await editListing(
                            callbackQuery,
                            firstListing,
                            category
                        );
                    }


                    return {
                        statusCode: 200,
                        body: "OK",
                    };
                }


                const nextListing =
                    await getNextListing(
                        currentListing,
                        category
                    );


                if (nextListing) {
                    await editListing(
                        callbackQuery,
                        nextListing,
                        category
                    );
                }


                return {
                    statusCode: 200,
                    body: "OK",
                };
            }

            if (
                data.startsWith(
                    "prev:"
                )
            ) {
                const parts =
                    data.split(":");

                const listingId =
                    parts[1];

                const categoryCode =
                    parts[2] ||
                    "all";

                const category =
                    getCategoryFromCode(
                        categoryCode
                    );


                const currentListing =
                    await getListingById(
                        listingId
                    );


                if (
                    !isListingActive(
                        currentListing
                    )
                ) {
                    const firstListing =
                        await getFirstListing(
                            category
                        );


                    if (firstListing) {
                        await editListing(
                            callbackQuery,
                            firstListing,
                            category
                        );
                    }


                    return {
                        statusCode: 200,
                        body: "OK",
                    };
                }


                const previousListing =
                    await getPreviousListing(
                        currentListing,
                        category
                    );


                if (
                    previousListing
                ) {
                    await editListing(
                        callbackQuery,
                        previousListing,
                        category
                    );
                }


                return {
                    statusCode: 200,
                    body: "OK",
                };
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
         * Telegram повертаємо 200,
         * щоб він не повторював
         * webhook нескінченно.
         */
        return {
            statusCode: 200,
            body: "OK",
        };
    }
};