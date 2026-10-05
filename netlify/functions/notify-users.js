const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getFirestore,
} = require("firebase-admin/firestore");


if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId:
                process.env
                    .FIREBASE_PROJECT_ID,

            clientEmail:
                process.env
                    .FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env
                    .FIREBASE_PRIVATE_KEY
                    ?.replace(
                        /\\n/g,
                        "\n"
                    ),
        }),
    });
}


const db = getFirestore();


const BOT_TOKEN =
    process.env
        .TELEGRAM_USER_BOT_TOKEN;


const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;


const SITE_URL =
    "https://rboard.netlify.app";


const escapeHtml = (
    value = ""
) => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};


const getCityName = (
    listing
) => {
    if (
        listing.city &&
        typeof listing.city ===
            "object"
    ) {
        return (
            listing.city.name ||
            ""
        );
    }

    return listing.city || "";
};


const sendTelegramMessage =
    async (
        chatId,
        listing
    ) => {
        const title =
            escapeHtml(
                listing.title ||
                    "Нове оголошення"
            );

        const city =
            escapeHtml(
                getCityName(
                    listing
                )
            );

        const type =
            escapeHtml(
                listing.type ||
                    "Інше"
            );


        const text = [
            "<b>Нове оголошення на RBoard!</b>",
            "",
            `<b>${title}</b>`,
            "",
            `<i>${city} • ${type}</i>`,
        ].join("\n");


        const response =
            await fetch(
                `${TELEGRAM_API}/sendMessage`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            chat_id:
                                chatId,

                            text,

                            parse_mode:
                                "HTML",

                            reply_markup: {
                                inline_keyboard:
                                    [
                                        [
                                            {
                                                text:
                                                    "Переглянути оголошення",

                                                url:
                                                    `${SITE_URL}/listing/${listing.id}`,
                                            },
                                        ],
                                    ],
                            },
                        }),
                }
            );


        return response.json();
    };


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
        const body =
            JSON.parse(
                event.body || "{}"
            );


        const listingId =
            body.listingId;


        if (!listingId) {
            return {
                statusCode: 400,
                body:
                    "listingId required",
            };
        }


        /*
         * Беремо оголошення
         * безпосередньо з Firestore.
         */
        const listingDocument =
            await db
                .collection(
                    "listings"
                )
                .doc(listingId)
                .get();


        if (
            !listingDocument.exists
        ) {
            return {
                statusCode: 404,
                body:
                    "Listing not found",
            };
        }


        const listing = {
            id:
                listingDocument.id,

            ...listingDocument.data(),
        };


        /*
         * Розсилаємо тільки
         * схвалені оголошення.
         */
        if (
            listing.status !==
            "approved"
        ) {
            return {
                statusCode: 400,
                body:
                    "Listing is not approved",
            };
        }


        /*
         * Отримуємо активних
         * Telegram-підписників.
         */
        const subscribersSnapshot =
            await db
                .collection(
                    "telegramSubscribers"
                )
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        let sent = 0;
let failed = 0;


/*
 * Надсилаємо повідомлення
 * невеликими паралельними групами.
 *
 * Це значно швидше за послідовну
 * відправку, але не створює сотні
 * запитів до Telegram одночасно.
 */
const BATCH_SIZE = 20;

const subscribers =
    subscribersSnapshot.docs;


for (
    let i = 0;
    i < subscribers.length;
    i += BATCH_SIZE
) {
    const batch =
        subscribers.slice(
            i,
            i + BATCH_SIZE
        );


    const results =
        await Promise.allSettled(
            batch.map(
                async (document) => {
                    const subscriber =
                        document.data();

                    const result =
                        await sendTelegramMessage(
                            subscriber.chatId,
                            listing
                        );


                    if (result.ok) {
                        return {
                            success: true,
                        };
                    }


                    /*
                     * Користувач заблокував
                     * Telegram-бота.
                     */
                    if (
                        result.error_code ===
                        403
                    ) {
                        await document.ref.update({
                            active: false,
                        });
                    }


                    console.error(
                        "Telegram notification error:",
                        result
                    );


                    return {
                        success: false,
                    };
                }
            )
        );


    /*
     * Підраховуємо результат
     * поточної групи.
     */
    results.forEach(
        (result) => {
            if (
                result.status ===
                    "fulfilled" &&
                result.value?.success
            ) {
                sent++;
            } else {
                failed++;

                if (
                    result.status ===
                    "rejected"
                ) {
                    console.error(
                        "Notification error:",
                        result.reason
                    );
                }
            }
        }
    );


    console.log(
        `Telegram batch: ${Math.min(
            i + BATCH_SIZE,
            subscribers.length
        )}/${subscribers.length}`
    );
}


        console.log(
            `Telegram notification ${listingId}: ${sent} sent, ${failed} failed`
        );


        return {
            statusCode: 200,

            body:
                JSON.stringify({
                    success: true,
                    sent,
                    failed,
                }),
        };
    } catch (error) {
        console.error(
            "notify-users error:",
            error
        );


        return {
            statusCode: 500,

            body:
                JSON.stringify({
                    success: false,
                }),
        };
    }
};