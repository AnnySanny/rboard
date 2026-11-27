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
            message: "Method not allowed",
        });
    }

    const authorization =
        event.headers?.authorization ||
        event.headers?.Authorization ||
        "";

    if (!authorization.startsWith("Bearer ")) {
        return response(401, {
            message: "Увійдіть у свій обліковий запис.",
        });
    }

    let uid;

    try {
        const decodedToken = await getAuth().verifyIdToken(
            authorization.slice(7),
            true
        );

        uid = decodedToken.uid;
    } catch {
        return response(401, {
            message: "Необхідно повторно авторизуватися.",
        });
    }

    let bootId;

    try {
        ({ bootId } = JSON.parse(event.body || "{}"));
    } catch {
        return response(400, {
            message: "Некоректний запит.",
        });
    }

    if (
        typeof bootId !== "string" ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(bootId)
    ) {
        return response(400, {
            message: "Некоректний ідентифікатор чобітка.",
        });
    }

    const contestRef = db
        .collection("contests")
        .doc(CONTEST_ID);

    const userRef = db
        .collection("users")
        .doc(uid);

    const bootRef = contestRef
        .collection("boots")
        .doc(bootId);

    const participantRef = contestRef
        .collection("participants")
        .doc(uid);

    const claimRef = participantRef
        .collection("claims")
        .doc(bootId);

    const leaderboardRef = contestRef
        .collection("leaderboard")
        .doc(uid);

    try {
        const result = await db.runTransaction(
            async (transaction) => {
                const [
                    contestSnapshot,
                    userSnapshot,
                    bootSnapshot,
                    participantSnapshot,
                    claimSnapshot,
                ] = await Promise.all([
                    transaction.get(contestRef),
                    transaction.get(userRef),
                    transaction.get(bootRef),
                    transaction.get(participantRef),
                    transaction.get(claimRef),
                ]);

                if (!contestSnapshot.exists) {
                    fail(404, "Конкурс не знайдено.");
                }

                const contest = contestSnapshot.data();

                if (contest.enabled !== true) {
                    fail(403, "Конкурс наразі вимкнено.");
                }

                const now = Date.now();

                const startsAt =
                    contest.startsAt?.toMillis?.();

                const endsAt =
                    contest.endsAt?.toMillis?.();

                if (
                    !Number.isFinite(startsAt) ||
                    !Number.isFinite(endsAt) ||
                    endsAt <= startsAt
                ) {
                    fail(403, "Дати конкурсу не налаштовано.");
                }

                if (now < startsAt) {
                    fail(403, "Конкурс ще не розпочався.");
                }

                if (now >= endsAt) {
                    fail(403, "Конкурс вже завершено.");
                }

                if (!userSnapshot.exists) {
                    fail(403, "Обліковий запис не знайдено.");
                }

                const user = userSnapshot.data();

                if (
                    user.blocked === true ||
                    !["user", "admin"].includes(user.role)
                ) {
                    fail(403, "Участь у конкурсі недоступна.");
                }

                if (
                    !bootSnapshot.exists ||
                    bootSnapshot.data().enabled !== true
                ) {
                    fail(404, "Чобіток недоступний.");
                }

                const totalBoots = contest.totalBoots;

                if (
                    !Number.isInteger(totalBoots) ||
                    totalBoots < 1 ||
                    totalBoots > 1000
                ) {
                    fail(409, "Некоректні налаштування конкурсу.");
                }

                const participant =
                    participantSnapshot.data() || {};

                if (participant.disqualified === true) {
                    fail(403, "Вас дискваліфіковано з конкурсу.");
                }

                const foundBootIds = Array.isArray(
                    participant.foundBootIds
                )
                    ? participant.foundBootIds
                    : [];

                if (foundBootIds.includes(bootId)) {
                    return {
                        alreadyFound: true,
                        foundCount: foundBootIds.length,
                        totalBoots,
                    };
                }

                if (claimSnapshot.exists) {
                    fail(
                        409,
                        "Знахідка вже існує. Зверніться до адміністрації."
                    );
                }

                if (foundBootIds.length >= totalBoots) {
                    fail(409, "Ви вже зібрали всі чобітки.");
                }

                const nextFoundBootIds = [
                    ...foundBootIds,
                    bootId,
                ];

                const foundCount = nextFoundBootIds.length;

                const timestamp =
                    FieldValue.serverTimestamp();

                const joinedAt =
                    participant.joinedAt || timestamp;

                const completedAt =
                    foundCount === totalBoots
                        ? timestamp
                        : null;

                transaction.create(claimRef, {
                    bootId,
                    foundAt: timestamp,
                });

                transaction.set(
                    participantRef,
                    {
                        uid,
                        foundBootIds: nextFoundBootIds,
                        foundCount,
                        joinedAt,
                        lastFoundAt: timestamp,
                        completedAt,
                        disqualified: false,
                    },
                    { merge: true }
                );

                transaction.set(leaderboardRef, {
                    login: user.login || "Учасник RBoard",
                    avatarUrl: user.avatarUrl || "",
                    foundCount,
                    joinedAt,
                    lastFoundAt: timestamp,
                    completedAt,
                });

                return {
                    alreadyFound: false,
                    foundCount,
                    totalBoots,
                };
            }
        );

        return response(200, {
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Помилка зарахування чобітка:", error);

        return response(error.statusCode || 500, {
            success: false,
            message: error.statusCode
                ? error.message
                : "Не вдалося зарахувати чобіток. Спробуйте ще раз.",
        });
    }
};