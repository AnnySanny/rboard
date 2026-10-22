
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const authorization =
      event.headers.authorization ||
      event.headers.Authorization ||
      "";

    if (!authorization.startsWith("Bearer ")) {
      return response(401, {
        success: false,
        message: "Необхідна авторизація.",
      });
    }

    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(
        authorization.slice(7)
      );
    } catch {
      return response(401, {
        success: false,
        message: "Недійсний токен.",
      });
    }

    const userRef = adminDb
      .collection("users")
      .doc(decoded.uid);

    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return response(404, {
        success: false,
        message: "Профіль не знайдено.",
      });
    }

    const user = snapshot.data();

    const publicId =
      user.avatarCleanupPublicId || "";

    if (!publicId) {
      return response(200, {
        success: true,
        message: "Немає фотографій для очищення.",
      });
    }

    if (
      publicId === user.avatarPublicId
    ) {
      return response(409, {
        success: false,
        message: "Не можна видалити поточний аватар.",
      });
    }

    // ВАЖЛИВО: public_id має розміщуватися
    // саме у просторі ідентифікаторів user_photo.
    if (!publicId.startsWith("user_photo/")) {
      return response(403, {
        success: false,
        message: "Недозволений ідентифікатор аватара.",
      });
    }

    const result = await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );

    if (
      result.result !== "ok" &&
      result.result !== "not found"
    ) {
      throw new Error(
        "Cloudinary не підтвердив видалення."
      );
    }

    // Поле очищаємо тільки якщо воно
    // досі відповідає видаленому фото.
    await adminDb.runTransaction(
      async (transaction) => {
        const current = await transaction.get(userRef);

        if (
          current.exists &&
          current.data().avatarCleanupPublicId ===
            publicId
        ) {
          transaction.update(userRef, {
            avatarCleanupPublicId:
              admin.firestore.FieldValue.delete(),
          });
        }
      }
    );

    return response(200, {
      success: true,
      message: "Старий аватар видалено.",
    });
  } catch (error) {
    console.error(
      "Помилка видалення аватара:",
      error
    );

    return response(500, {
      success: false,
      message: "Не вдалося видалити аватар.",
    });
  }
};
