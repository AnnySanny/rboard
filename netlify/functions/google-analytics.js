
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
const getSourceName = (source, medium) => {
    const name = String(source || "").toLowerCase();

    if (name.includes("instagram") || name.includes("instagr.am")) {
        return "Instagram";
    }

    if (name.includes("facebook") || /^fb([./]|$)/.test(name)) {
        return "Facebook";
    }

    if (
        name.includes("telegram") ||
        name === "t.me" ||
        name.endsWith(".t.me")
    ) {
        return "Telegram";
    }

    if (name === "google" || name.startsWith("google.")) {
        return "Google";
    }

    if (name === "(direct)") {
        return "Прямі переходи";
    }

    return `${source || "Невідомо"} / ${medium || "(not set)"}`;
};
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
    const days = Number(event.queryStringParameters?.days || 7);

    if (![7, 30, 90].includes(days)) {
        return jsonResponse(400, {
            error: "Неправильний період статистики.",
        });
    }
    const requiredVariables = [
        "GA4_PROPERTY_ID",
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
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(
                    /\\n/g,
                    "\n"
                ),
            },
        });


        const dateRanges = [
            {
                startDate: `${days - 1}daysAgo`,
                endDate: "today",
            },
        ];

        const property = `properties/${PROPERTY_ID}`;

        const [
            [summaryResponse],
            [dailyResponse],
            [sourcesResponse],
            [pagesResponse],
        ] = await Promise.all([
            // Загальні показники
            analyticsClient.runReport({
                property,
                dateRanges,
                metrics: [
                    { name: "activeUsers" },
                    { name: "sessions" },
                    { name: "screenPageViews" },
                ],
            }),

            // Динаміка за днями
            analyticsClient.runReport({
                property,
                dateRanges,
                dimensions: [
                    { name: "date" },
                ],
                metrics: [
                    { name: "activeUsers" },
                    { name: "sessions" },
                    { name: "screenPageViews" },
                ],
                orderBys: [
                    {
                        dimension: {
                            dimensionName: "date",
                        },
                        desc: false,
                    },
                ],
                limit: 90,
            }),

            // Джерела переходів
            analyticsClient.runReport({
                property,
                dateRanges,
                dimensions: [
                    { name: "sessionSource" },
                    { name: "sessionMedium" },
                ],
                metrics: [
                    { name: "sessions" },
                    { name: "averageSessionDuration" },
                ],
                orderBys: [
                    {
                        metric: {
                            metricName: "sessions",
                        },
                        desc: true,
                    },
                ],
                limit: 200,
            }),

            // Найпопулярніші сторінки
            analyticsClient.runReport({
                property,
                dateRanges,
                dimensions: [
                    { name: "pagePath" },
                    { name: "pageTitle" },
                ],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                ],
                orderBys: [
                    {
                        metric: {
                            metricName: "screenPageViews",
                        },
                        desc: true,
                    },
                ],
                limit: 10,
            }),
        ]);

        // Основні показники
        const values = summaryResponse.rows?.[0]?.metricValues || [];

        // Графік за днями
        const daily = (dailyResponse.rows || []).map((row) => ({
            date: row.dimensionValues?.[0]?.value || "",
            activeUsers: Number(row.metricValues?.[0]?.value || 0),
            sessions: Number(row.metricValues?.[1]?.value || 0),
            views: Number(row.metricValues?.[2]?.value || 0),
        }));

        // Об'єднання джерел трафіку
        const groupedSources = new Map();

        (sourcesResponse.rows || []).forEach((row) => {
            const source = row.dimensionValues?.[0]?.value || "";
            const medium = row.dimensionValues?.[1]?.value || "";
            const name = getSourceName(source, medium);

            const sessions = Number(row.metricValues?.[0]?.value || 0);
            const duration = Number(row.metricValues?.[1]?.value || 0);

            const previous = groupedSources.get(name) || {
                name,
                sessions: 0,
                totalDuration: 0,
            };

            previous.sessions += sessions;
            previous.totalDuration += sessions * duration;

            groupedSources.set(name, previous);
        });

        const preferredSources = [
            "Instagram",
            "Facebook",
            "Telegram",
            "Google",
            "Прямі переходи",
        ];

        const allSources = Array.from(groupedSources.values());

        const sources = [
            ...preferredSources.map(
                (name) =>
                    groupedSources.get(name) || {
                        name,
                        sessions: 0,
                        totalDuration: 0,
                    }
            ),

            ...allSources
                .filter((item) => !preferredSources.includes(item.name))
                .sort((a, b) => b.sessions - a.sessions)
                .slice(0, 8),
        ].map((item) => ({
            name: item.name,
            sessions: item.sessions,
            averageDuration:
                item.sessions > 0
                    ? item.totalDuration / item.sessions
                    : 0,
        }));

        // Популярні сторінки
        const pages = (pagesResponse.rows || []).map((row) => ({
            path: row.dimensionValues?.[0]?.value || "/",
            title: row.dimensionValues?.[1]?.value || "Без назви",
            views: Number(row.metricValues?.[0]?.value || 0),
            users: Number(row.metricValues?.[1]?.value || 0),
        }));

        return jsonResponse(200, {
            success: true,
            period: days,
            activeUsers: Number(values[0]?.value || 0),
            sessions: Number(values[1]?.value || 0),
            views: Number(values[2]?.value || 0),
            daily,
            sources,
            pages,
        });

    } catch (error) {
        console.error("Google Analytics API:", error);

        return jsonResponse(500, {
            error: "Не вдалося отримати статистику Google Analytics.",
        });
    }
};
