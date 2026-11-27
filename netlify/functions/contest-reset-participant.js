const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getFirestore,
    FieldValue,
} = require("firebase-admin/firestore");

const { getAuth } = require("firebase-admin/auth");

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

const CONTEST_ID = "christmas-2026";

const response = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
});

const fail = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return response(405, {
            success: false,
            message: "Method not allowed",
        });
    }

    const authorization =
        event.headers?.authorization ||
        event.headers?.Authorization ||
        "";

    if (!authorization.startsWith("Bearer ")) {
        return response(401, {
            success: false,
            message: "Необхідно авторизуватися.",
        });
    }

    let adminUid;

    try {
        const decodedToken = await getAuth().verifyIdToken(
            authorization.slice(7),
            true
        );

        adminUid = decodedToken.uid;

    } catch {
        return response(401, {
            success: false,
            message: "Необхідно повторно авторизуватися.",
        });
    }

    let uid;

    try {
        ({ uid } = JSON.parse(event.body || "{}"));
    } catch {
        return response(400, {
            success: false,
            message: "Некоректний запит.",
        });
    }

    if (
        typeof uid !== "string" ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)
    ) {
        return response(400, {
            success: false,
            message: "Некоректний ID користувача.",
        });
    }

    const adminRef = db
        .collection("users")
        .doc(adminUid);

    const contestRef = db
        .collection("contests")
        .doc(CONTEST_ID);

    const participantRef = contestRef
        .collection("participants")
        .doc(uid);

    const leaderboardRef = contestRef
        .collection("leaderboard")
        .doc(uid);

    try {
        const result = await db.runTransaction(
            async (transaction) => {
                const adminSnapshot =
                    await transaction.get(adminRef);

                if (
                    !adminSnapshot.exists ||
                    adminSnapshot.data().role !== "admin" ||
                    adminSnapshot.data().blocked === true
                ) {
                    fail(403, "Недостатньо прав доступу.");
                }

                const [
                    contestSnapshot,
                    participantSnapshot,
                    leaderboardSnapshot,
                ] = await transaction.getAll(
                    contestRef,
                    participantRef,
                    leaderboardRef
                );

                if (!contestSnapshot.exists) {
                    fail(404, "Конкурс не знайдено.");
                }

                const claimsSnapshot = await transaction.get(
                    participantRef
                        .collection("claims")
                        .limit(451)
                );

                if (claimsSnapshot.size > 450) {
                    fail(
                        409,
                        "Забагато знахідок для одноразового видалення."
                    );
                }

                if (
                    !participantSnapshot.exists &&
                    !leaderboardSnapshot.exists &&
                    claimsSnapshot.empty
                ) {
                    return {
                        reset: false,
                        deletedClaims: 0,
                    };
                }

                claimsSnapshot.docs.forEach((claim) => {
                    transaction.delete(claim.ref);
                });

                transaction.delete(participantRef);
                transaction.delete(leaderboardRef);

                transaction.update(contestRef, {
                    leaderboardRevision: FieldValue.increment(1),
                });

                return {
                    reset: true,
                    deletedClaims: claimsSnapshot.size,
                };
            }
        );

        return response(200, {
            success: true,
            ...result,
        });

    } catch (error) {
        console.error(
            "Помилка видалення учасника конкурсу:",
            error
        );

        return response(error.statusCode || 500, {
            success: false,
            message: error.statusCode
                ? error.message
                : "Не вдалося видалити учасника конкурсу.",
        });
    }
};