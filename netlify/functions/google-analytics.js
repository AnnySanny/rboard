
const {
    initializeApp,
    cert,
    getApps,
    getApp,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

const jsonResponse = (statusCode, data) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
    },
    body: JSON.stringify(data),
});

const initializeFirebaseAdmin = () => {
    if (getApps().length > 0) {
        return getApp();
    }

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                /\\n/g,
                "\n"
            ),
        }),
    });
};

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return jsonResponse(405, {
            error: "Метод не підтримується.",
        });
    }

    const token = event.headers.authorization?.replace(
        /^Bearer\s+/i,
        ""
    );

    if (!token) {
        return jsonResponse(401, {
            error: "Потрібна авторизація.",
        });
    }

    const requiredVariables = [
        "GA4_PROPERTY_ID",
        "GA4_CLIENT_EMAIL",
        "GA4_PRIVATE_KEY",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY",
    ];

    const missingVariables = requiredVariables.filter(
        (name) => !process.env[name]
    );

    if (missingVariables.length > 0) {
        console.error("Відсутні змінні:", missingVariables);

        return jsonResponse(500, {
            error: "Сервер не налаштовано.",
        });
    }

    try {
        const app = initializeFirebaseAdmin();

        let decodedToken;

        try {
            decodedToken = await getAuth(app).verifyIdToken(token);
        } catch {
            return jsonResponse(401, {
                error: "Недійсна авторизація.",
            });
        }

        const userSnapshot = await getFirestore(app)
            .collection("users")
            .doc(decodedToken.uid)
            .get();

        const user = userSnapshot.data();

        if (
            !userSnapshot.exists ||
            user?.role !== "admin" ||
            user?.blocked === true
        ) {
            return jsonResponse(403, {
                error: "Доступ заборонено.",
            });
        }

        const analyticsClient = new BetaAnalyticsDataClient({
            credentials: {
                client_email: process.env.GA4_CLIENT_EMAIL,
                private_key: process.env.GA4_PRIVATE_KEY.replace(
                    /\\n/g,
                    "\n"
                ),
            },
        });

        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [
                {
                    startDate: "6daysAgo",
                    endDate: "today",
                },
            ],
            metrics: [
                { name: "activeUsers" },
                { name: "sessions" },
                { name: "screenPageViews" },
            ],
        });

        const values = response.rows?.[0]?.metricValues || [];

        return jsonResponse(200, {
            success: true,
            period: "7days",
            activeUsers: Number(values[0]?.value || 0),
            sessions: Number(values[1]?.value || 0),
            views: Number(values[2]?.value || 0),
        });
    } catch (error) {
        console.error("Google Analytics API:", error);

        return jsonResponse(500, {
            error: "Не вдалося отримати статистику Google Analytics.",
        });
    }
};
