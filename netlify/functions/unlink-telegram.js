
const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const {
    getFirestore,
    FieldValue,
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

const jsonResponse = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
});

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return jsonResponse(405, {
            success: false,
            error: "Method not allowed",
        });
    }

    try {
        // 1. Перевіряємо авторизацію
        const authorization =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";

        const match = authorization.match(/^Bearer (.+)$/i);

        if (!match) {
            return jsonResponse(401, {
                success: false,
                error: "Потрібна авторизація.",
            });
        }

        const decodedToken = await getAuth().verifyIdToken(
            match[1],
            true
        );

        const uid = decodedToken.uid;

        const userRef = db.collection("users").doc(uid);

        // 2. Атомарно відв'язуємо Telegram
        const result = await db.runTransaction(async (transaction) => {
            const userSnapshot = await transaction.get(userRef);

            if (!userSnapshot.exists) {
                return { status: "user-not-found" };
            }

            const userData = userSnapshot.data();

            if (userData.blocked === true) {
                return { status: "blocked" };
            }

            const chatId = userData.telegramChatId;

            if (chatId === undefined || chatId === null || chatId === "") {
                return { status: "already-unlinked" };
            }

            const subscriberRef = db
                .collection("telegramSubscribers")
                .doc(String(chatId));

            const subscriberSnapshot =
                await transaction.get(subscriberRef);

            // 3. Видаляємо прив'язку з користувача
            transaction.update(userRef, {
                telegramChatId: FieldValue.delete(),
                telegramLinkedAt: FieldValue.delete(),
            });

            // 4. Видаляємо прив'язку з підписника,
            // але не видаляємо самого підписника
            if (
                subscriberSnapshot.exists &&
                subscriberSnapshot.data().linkedUid === uid
            ) {
                transaction.update(subscriberRef, {
                    linkedUid: FieldValue.delete(),
                    linkedAt: FieldValue.delete(),
                    chatNotifications: FieldValue.delete(),
                    showMessagePreview: FieldValue.delete(),
                });
            }

            return { status: "unlinked" };
        });

        if (result.status === "user-not-found") {
            return jsonResponse(404, {
                success: false,
                error: "Користувача не знайдено.",
            });
        }

        if (result.status === "blocked") {
            return jsonResponse(403, {
                success: false,
                error: "Акаунт заблоковано.",
            });
        }

        return jsonResponse(200, {
            success: true,
            message:
                result.status === "already-unlinked"
                    ? "Telegram уже відв'язано."
                    : "Telegram успішно відв'язано.",
        });

    } catch (error) {
        console.error(
            "Telegram unlink error:",
            error
        );

        return jsonResponse(500, {
            success: false,
            error: "Не вдалося відв'язати Telegram.",
        });
    }
};
