
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { v2: cloudinary } = require("cloudinary");

const BATCH_SIZE = 100;

const respond = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

// Використовуємо наявні змінні Netlify.
function getAdminServices() {
  let app = getApps()[0];

  if (!app) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n")
      .replace(/\r\n/g, "\n");

    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !privateKey
    ) {
      throw new Error("Firebase Admin не налаштований.");
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  return {
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
  };
}

// Пакетне видалення документів за запитом.
// Повторний запуск безпечний: видалені документи
// більше не повертаються із запиту.
async function deleteByQuery(makeQuery) {
  let deleted = 0;

  while (true) {
    const snapshot = await makeQuery()
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = snapshot.docs[0].ref.firestore.batch();

    snapshot.docs.forEach((item) => {
      batch.delete(item.ref);
    });

    await batch.commit();
    deleted += snapshot.size;
  }

  return deleted;
}

// Видалення файлів Cloudinary за public_id.
async function deleteCloudinaryImages(publicIds) {
  const ids = [...new Set(
    publicIds.filter(
      (id) => typeof id === "string" && id.trim()
    ).map((id) => id.trim())
  )];

  if (!ids.length) return;

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary не налаштований.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);

    const result = await cloudinary.api.delete_resources(
      chunk,
      {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      }
    );

    const failed = chunk.filter((id) => {
      const status = result?.deleted?.[id];
      return status !== "deleted" && status !== "not_found";
    });

    if (failed.length) {
      throw new Error(
        `Cloudinary: не вдалося видалити ${failed.length} фото.`
      );
    }
  }
}

// Видаляємо оголошення користувача разом із фото.
async function deleteUserListings(db, uid) {
  let count = 0;

  while (true) {
    const snapshot = await db.collection("listings")
      .where("author.uid", "==", uid)
      .limit(25)
      .get();

    if (snapshot.empty) break;

    for (const listingDoc of snapshot.docs) {
      const listing = listingDoc.data();
      const images = Array.isArray(listing.images)
        ? listing.images
        : [];

      // Не втрачаємо посилання на фото,
      // якщо для нього немає public_id.
      const missingIds = images.filter(
        (image) =>
          image?.imageUrl &&
          !image?.imagePublicId
      );

      if (missingIds.length) {
        throw new Error(
          `Оголошення ${listingDoc.id} містить фото без imagePublicId.`
        );
      }

      await deleteCloudinaryImages(
        images.map((image) => image?.imagePublicId)
      );

      await deleteByQuery(() =>
        db.collection("listingViews")
          .where("listingId", "==", listingDoc.id)
      );

      // Прибираємо документ і його підколекції.
      await db.recursiveDelete(listingDoc.ref);
      count++;
    }
  }

  return count;
}

// Видаляємо чати разом із повідомленнями.
async function deleteUserChats(db, uid) {
  let count = 0;

  while (true) {
    const snapshot = await db.collection("chats")
      .where("participants", "array-contains", uid)
      .limit(25)
      .get();

    if (snapshot.empty) break;

    for (const chat of snapshot.docs) {
      await db.recursiveDelete(chat.ref);
      count++;
    }
  }

  return count;
}

// Прибираємо перегляди, які залишив користувач
// на чужих оголошеннях, і коригуємо лічильники.
async function deleteUserViews(db, uid) {
  let count = 0;

  while (true) {
    const snapshot = await db.collection("listingViews")
      .where("viewerType", "==", "user")
      .where("viewerId", "==", `user_${uid}`)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    for (const view of snapshot.docs) {
      const listingId = view.data().listingId;

      const deleted = await db.runTransaction(async (tx) => {
        const currentView = await tx.get(view.ref);

        if (!currentView.exists) return false;

        if (!listingId) {
          tx.delete(view.ref);
          return true;
        }

        const listingRef = db.collection("listings").doc(listingId);
        const currentListing = await tx.get(listingRef);

        tx.delete(view.ref);

        if (currentListing.exists) {
          const currentViews = Number(
            currentListing.data().views ?? 0
          );

          tx.update(listingRef, {
            views: Math.max(0, currentViews - 1),
          });
        }

        return true;
      });

      if (deleted) count++;
    }
  }

  return count;
}

// Видаляємо UID користувача з чужих обраних.
async function removeUserFavorites(db, uid) {
  let count = 0;

  while (true) {
    const snapshot = await db.collection("listings")
      .where("favoriteUserIds", "array-contains", uid)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();

    snapshot.docs.forEach((listing) => {
      batch.update(listing.ref, {
        favoriteUserIds: FieldValue.arrayRemove(uid),
      });
    });

    await batch.commit();
    count += snapshot.size;
  }

  return count;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, {
      success: false,
      message: "Метод не підтримується.",
    });
  }

  let deletionStarted = false;

  try {
    const { adminAuth, adminDb } = getAdminServices();

    const authorization =
      event.headers.authorization ||
      event.headers.Authorization ||
      "";

    if (!authorization.startsWith("Bearer ")) {
      return respond(401, {
        success: false,
        message: "Необхідна авторизація.",
      });
    }

    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(
        authorization.slice(7),
        true
      );
    } catch {
      return respond(401, {
        success: false,
        message: "Недійсна сесія адміністратора.",
      });
    }

    // Роль перевіряємо на сервері, не в React.
    const adminDoc = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (
      !adminDoc.exists ||
      adminDoc.data().role !== "admin" ||
      adminDoc.data().blocked === true
    ) {
      return respond(403, {
        success: false,
        message: "Недостатньо прав.",
      });
    }

    let body;

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return respond(400, {
        success: false,
        message: "Некоректний JSON.",
      });
    }

    const uid = typeof body.uid === "string"
      ? body.uid.trim()
      : "";

    if (!uid || uid.includes("/")) {
      return respond(400, {
        success: false,
        message: "Некоректний UID.",
      });
    }

    if (uid === decoded.uid) {
      return respond(403, {
        success: false,
        message: "Не можна видалити власний акаунт адміністратора.",
      });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return respond(404, {
        success: false,
        message: "Профіль користувача не знайдено.",
      });
    }

    if (userDoc.data().role === "admin") {
      return respond(403, {
        success: false,
        message: "Видалення адміністратора заборонено.",
      });
    }

    // 1. Закриваємо користувачу доступ.
    await userRef.update({ blocked: true });
    deletionStarted = true;

    try {
      await adminAuth.updateUser(uid, { disabled: true });
      await adminAuth.revokeRefreshTokens(uid);
    } catch (error) {
      // Можлива повторна спроба після часткового
      // видалення: акаунта Auth вже може не бути.
      if (error.code !== "auth/user-not-found") throw error;
    }

    // 2. Видаляємо відгуки, написані користувачем.
    const writtenReviews = await deleteByQuery(() =>
      adminDb.collectionGroup("reviews")
        .where("reviewerUid", "==", uid)
    );

    // 3. Видаляємо чати та повідомлення.
    const chats = await deleteUserChats(adminDb, uid);

    // 4. Видаляємо оголошення та їхні фото.
    const listings = await deleteUserListings(adminDb, uid);

    // 5. Прибираємо перегляди на чужих оголошеннях.
    const views = await deleteUserViews(adminDb, uid);

    // 6. Прибираємо користувача з обраного.
    const favorites = await removeUserFavorites(adminDb, uid);

    // 7. Прибираємо онлайн-сесії.
    await adminDb.recursiveDelete(
      adminDb.collection("userPresence").doc(uid)
    );

    // 8. Видаляємо аватар.
    const publicProfileRef = adminDb
      .collection("publicProfiles")
      .doc(uid);

    const publicProfileDoc = await publicProfileRef.get();
    const profileData = publicProfileDoc.data() || {};
    const userData = userDoc.data() || {};

    await deleteCloudinaryImages([
      userData.avatarPublicId,
      userData.avatarCleanupPublicId,
      profileData.avatarPublicId,
    ]);

    // 9. Видаляємо публічний профіль та відгуки.
    await adminDb.recursiveDelete(publicProfileRef);

    // 10. ВИДАЛЯЄМО FIREBASE AUTH.
    try {
      await adminAuth.deleteUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }

    // 11. Видаляємо приватний профіль останнім.
    // Це дозволяє повторити операцію, якщо
    // попередній крок завершився помилкою.
    await adminDb.recursiveDelete(userRef);

    console.log("USER DELETED:", {
      uid,
      listings,
      chats,
      views,
      favorites,
      writtenReviews,
    });

    return respond(200, {
      success: true,
      message: "Користувача та його акаунт видалено.",
      deleted: {
        listings,
        chats,
        views,
        favorites,
        writtenReviews,
      },
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return respond(500, {
      success: false,
      message: deletionStarted
        ? "Не вдалося завершити видалення. Користувача заблоковано. Перевірте логи Netlify та повторіть операцію."
        : "Не вдалося розпочати видалення користувача.",
    });
  }
};
