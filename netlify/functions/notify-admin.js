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

        const {
            action,
            title,
            author,
            isAuthenticated,
            description,
            city,
            type,
        } = JSON.parse(event.body || "{}");

        const actionTitle =
            action === "edited"
                ? "✏️ Відредаговано оголошення"
                : "🆕 Додано оголошення";

        const authorType =
            isAuthenticated
                ? "Авторизований"
                : "Гість";

        const shortDescription =
            description?.trim()
                ? description.trim().slice(0, 300)
                : "Опис відсутній";

        const message = [
            actionTitle,
            "",
            `📌 ${title || "Без назви"}`,
            "",
            `👤 Автор: ${author || "Не вказано"}`,
            `🔐 Тип автора: ${authorType}`,
            "",
            "📝 Опис:",
            shortDescription,
            "",
            `📍 Місто: ${city || "Не вказано"}`,
            `🏷 Категорія: ${type || "Не вказано"}`,
        ].join("\n");

        const telegramResponse = await fetch(
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
                error:
                    "Не вдалося надіслати повідомлення",
            }),
        };
    }
};