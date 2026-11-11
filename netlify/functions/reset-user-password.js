
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ?.replace(/\\n/g, "\n"),
        }),
    });
}

const auth = admin.auth();
const db = admin.firestore();

const jsonResponse = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
});

exports.handler = async (event) => {
    // Дозволяємо лише POST
    if (event.httpMethod !== "POST") {
        return jsonResponse(405, {
            success: false,
            message: "Метод не підтримується.",
        });
    }

    try {
        // Отримуємо Firebase ID Token адміністратора
        const authorization =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";

        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : null;

        if (!token) {
            return jsonResponse(401, {
                success: false,
                message: "Необхідна авторизація.",
            });
        }

        // Перевіряємо токен і чи не відкликана сесія
        let decodedToken;

        try {
            decodedToken = await auth.verifyIdToken(
                token,
                true
            );
        } catch {
            return jsonResponse(401, {
                success: false,
                message: "Сесія недійсна. Увійдіть повторно.",
            });
        }

        // Перевіряємо права адміністратора
        const adminSnapshot = await db
            .collection("users")
            .doc(decodedToken.uid)
            .get();

        if (
            !adminSnapshot.exists ||
            adminSnapshot.data().role !== "admin" ||
            adminSnapshot.data().blocked === true
        ) {
            return jsonResponse(403, {
                success: false,
                message: "Недостатньо прав доступу.",
            });
        }

        // Отримуємо UID та пароль
        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return jsonResponse(400, {
                success: false,
                message: "Некоректний формат запиту.",
            });
        }

        const { uid, newPassword } = body;

        if (
            typeof uid !== "string" ||
            !uid.trim() ||
            typeof newPassword !== "string"
        ) {
            return jsonResponse(400, {
                success: false,
                message: "Необхідно вказати UID та новий пароль.",
            });
        }

        // Мінімальні вимоги до пароля
        if (
            newPassword.length < 8 ||
            Buffer.byteLength(newPassword, "utf8") > 4096
        ) {
            return jsonResponse(400, {
                success: false,
                message: "Пароль має містити щонайменше 8 символів.",
            });
        }

        // Заборона змінювати власний пароль цим способом
        if (uid === decodedToken.uid) {
            return jsonResponse(403, {
                success: false,
                message: "Неможливо змінити власний пароль через цю функцію.",
            });
        }

        // Перевіряємо користувача у Firestore
        const userSnapshot = await db
            .collection("users")
            .doc(uid)
            .get();

        if (!userSnapshot.exists) {
            return jsonResponse(404, {
                success: false,
                message: "Користувача не знайдено.",
            });
        }

        const userData = userSnapshot.data();

        if (userData.role !== "user") {
            return jsonResponse(403, {
                success: false,
                message: "Можна змінювати паролі лише звичайних користувачів.",
            });
        }

        // Перевіряємо існування акаунта в Firebase Auth
        try {
            await auth.getUser(uid);
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                return jsonResponse(404, {
                    success: false,
                    message: "Акаунт Firebase Authentication не знайдено.",
                });
            }

            throw error;
        }

        // Змінюємо пароль у Firebase Authentication
        await auth.updateUser(uid, {
            password: newPassword,
        });

        // Відкликаємо refresh-токени користувача
        try {
            await auth.revokeRefreshTokens(uid);
        } catch (revokeError) {
            console.error(
                "Не вдалося відкликати сесії:",
                revokeError.code || "unknown"
            );

            return jsonResponse(200, {
                success: true,
                sessionsRevoked: false,
                message:
                    "Пароль змінено, але відкликати всі сесії не вдалося.",
            });
        }

        return jsonResponse(200, {
            success: true,
            sessionsRevoked: true,
            message: "Пароль користувача успішно змінено.",
        });

    } catch (error) {
        console.error(
            "Помилка скидання пароля:",
            error.code || "unknown"
        );

        return jsonResponse(500, {
            success: false,
            message: "Не вдалося змінити пароль. Спробуйте пізніше.",
        });
    }
};
