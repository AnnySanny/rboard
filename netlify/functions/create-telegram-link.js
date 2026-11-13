
const { randomBytes } = require("node:crypto");

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
  Timestamp,
} = require("firebase-admin/firestore");

// Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

const db = getFirestore();
const adminAuth = getAuth();

const BOT_USERNAME = "RBoard_Rakhiv_Bot";
const TOKEN_LIFETIME_MS = 10 * 60 * 1000;

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
    // Отримуємо Firebase ID token
    const authorization =
      event.headers.authorization ||
      event.headers.Authorization ||
      "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(401, {
        success: false,
        error: "Необхідна авторизація.",
      });
    }

    const idToken = authorization.slice(7).trim();

    // Перевіряємо справжність токена Firebase
    const decoded = await adminAuth.verifyIdToken(
      idToken,
      true
    );

    const uid = decoded.uid;

    // Перевіряємо користувача RBoard
    const userSnapshot = await db
      .collection("users")
      .doc(uid)
      .get();

    if (!userSnapshot.exists) {
      return jsonResponse(404, {
        success: false,
        error: "Профіль користувача не знайдено.",
      });
    }

    if (userSnapshot.data().blocked === true) {
      return jsonResponse(403, {
        success: false,
        error: "Акаунт заблоковано.",
      });
    }

    // Генеруємо криптографічно випадковий токен
    const token = randomBytes(24).toString("base64url");

    const now = Date.now();

    // Тимчасовий запис у наявній колекції
    await db
      .collection("telegramSubscribers")
      .doc(`link_${token}`)
      .set({
        type: "linkRequest",
        uid,
        active: false,
        createdAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(
          now + TOKEN_LIFETIME_MS
        ),
      });

    const telegramUrl =
      `https://t.me/${BOT_USERNAME}?start=link_${token}`;

    return jsonResponse(200, {
      success: true,
      telegramUrl,
    });
  } catch (error) {
    console.error(
      "Telegram link generation error:",
      error
    );

    if (
      error.code?.startsWith("auth/") ||
      error.code === "auth/id-token-revoked"
    ) {
      return jsonResponse(401, {
        success: false,
        error: "Сесія завершилася. Увійдіть повторно.",
      });
    }

    return jsonResponse(500, {
      success: false,
      error: "Не вдалося створити посилання.",
    });
  }
};
