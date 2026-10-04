exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "Method Not Allowed",
            }),
        };
    }

    try {
        const botToken =
            process.env.TELEGRAM_ADMIN_BOT_TOKEN;

        const chatId =
            process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!botToken || !chatId) {
            throw new Error(
                "Telegram environment variables are missing"
            );
        }

        const body =
            JSON.parse(event.body || "{}");

        const {
            title,
            type,
            author,
            city,
        } = body;

        const message = [
            "🔔 Нове оголошення",
            "",
            `📌 ${title || "Без назви"}`,
            `Категорія: ${type || "Не вказано"}`,
            `Автор: ${author || "Не вказано"}`,
            `Місто: ${city || "Не вказано"}`,
            "",
            "Очікує перевірки адміністратором.",
        ].join("\n");

        const telegramResponse =
            await fetch(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                    }),
                }
            );

        const telegramData =
            await telegramResponse.json();

        if (!telegramResponse.ok) {
            console.error(
                "Telegram error:",
                telegramData
            );

            throw new Error(
                "Telegram request failed"
            );
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
            }),
        };
    } catch (error) {
        console.error(
            "notify-admin error:",
            error
        );

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: "Не вдалося надіслати повідомлення",
            }),
        };
    }
};