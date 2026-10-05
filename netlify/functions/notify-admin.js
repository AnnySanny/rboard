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
            process.env
                .TELEGRAM_ADMIN_BOT_TOKEN;

        const chatId =
            process.env
                .TELEGRAM_ADMIN_CHAT_ID;

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
        } = JSON.parse(
            event.body || "{}"
        );


        /*
         * Екрануємо текст користувача,
         * оскільки використовуємо HTML.
         */
        const escapeHtml = (
            value = ""
        ) => {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        };


        const safeTitle =
            escapeHtml(
                title || "Без назви"
            );

        const safeAuthor =
            escapeHtml(
                author || "Не вказано"
            );

        const safeCity =
            escapeHtml(
                city || "Не вказано"
            );

        const safeType =
            escapeHtml(
                type || "Не вказано"
            );


        const authorType =
            isAuthenticated
                ? "Авторизований"
                : "Гість";


        const shortDescription =
            description?.trim()
                ? escapeHtml(
                    description
                        .trim()
                        .slice(0, 400)
                )
                : "Опис відсутній";


        const isEdited =
            action === "edited";


        const actionTitle =
            isEdited
                ? "ОГОЛОШЕННЯ ВІДРЕДАГОВАНО"
                : "НОВЕ ОГОЛОШЕННЯ";


        const statusText =
            isEdited
                ? "Очікує на повторну перевірку"
                : "Очікує на перевірку";


        const message = [
            `<b>${actionTitle}</b>`,

            "",

            `<b>${safeTitle}</b>`,

            "",

            `<b>Категорія:</b> ${safeType}`,
            `<b>Населений пункт:</b> ${safeCity}`,
            `<b>Автор:</b> ${safeAuthor}`,
            `<b>Тип автора:</b> ${authorType}`,

            "",

            "<b>Опис</b>",
            shortDescription,

            "",

            `<i>${statusText}</i>`,
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
                        chat_id:
                            chatId,

                        text:
                            message,

                        parse_mode:
                            "HTML",

                        disable_web_page_preview:
                            true,
                    }),
                }
            );


        const telegramData =
            await telegramResponse.json();


        if (
            !telegramResponse.ok ||
            !telegramData.ok
        ) {
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