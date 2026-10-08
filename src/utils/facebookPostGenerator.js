
const SITE_URL = "https://rboard.netlify.app";

const CATEGORY_CONFIG = {
    "Продаж": {
        emoji: "🛍️",
        question: "Зацікавила пропозиція?",
        details: "Фотографії, контакти продавця та більше інформації доступні на RBoard:",
        hashtags: ["Продаж", "Продам", "Купити", "Барахолка"],
    },
    "Купівля": {
        emoji: "🔎",
        question: "Маєш те, що шукає автор?",
        details: "Деталі та контакти покупця доступні на RBoard:",
        hashtags: ["Купівля", "Куплю", "Шукаю", "Оголошення"],
    },
    "Оренда": {
        emoji: "🏠",
        question: "Зацікавила пропозиція оренди?",
        details: "Умови оренди, фотографії та контакти автора доступні на RBoard:",
        hashtags: ["Оренда", "Нерухомість", "Житло", "ОрендаЖитла"],
    },
    "Послуга": {
        emoji: "🛠️",
        question: "Потрібна така послуга?",
        details: "Детальніше про послугу та контакти виконавця можна переглянути на RBoard:",
        hashtags: ["Послуги", "МісцевіПослуги", "Майстри", "РахівПослуги"],
    },
    "Робота": {
        emoji: "💼",
        question: "Зацікавила пропозиція?",
        details: "Умови та контакти автора доступні в оголошенні на RBoard:",
        hashtags: ["Робота", "Вакансії", "ПошукРоботи", "РоботаРахів"],
    },
    "Питання": {
        emoji: "❓",
        question: "Можеш допомогти відповіддю?",
        details: "Переглянь питання та зв'яжися з автором через RBoard:",
        hashtags: ["Питання", "Допомога", "Поради", "Рахів"],
    },
    "Обмін": {
        emoji: "🔄",
        question: "Маєш пропозицію для обміну?",
        details: "Деталі обміну та контакти автора доступні на RBoard:",
        hashtags: ["Обмін", "Обміняю", "Барахолка", "Оголошення"],
    },
    "Віддам безкоштовно": {
        emoji: "🎁",
        question: "Зацікавила пропозиція?",
        details: "Більше інформації та контакти автора доступні на RBoard:",
        hashtags: ["ВіддамБезкоштовно", "Безкоштовно", "ДобріСправи", "Віддам"],
    },
    "Загублено / знайдено": {
        emoji: "📢",
        question: "Можеш допомогти знайти власника або загублену річ?",
        details: "Усі подробиці та контакти автора доступні на RBoard:",
        hashtags: ["Загублено", "Знайдено", "Пошук", "Допомога"],
    },
    "Подія": {
        emoji: "📅",
        question: "Хочеш дізнатися більше про подію?",
        details: "Повна інформація про подію доступна на RBoard:",
        hashtags: ["Події", "Афіша", "Заходи", "РахівПодії"],
    },
    "Оголошення громади": {
        emoji: "📣",
        question: "Ця інформація може бути корисною мешканцям громади.",
        details: "Повний текст оголошення доступний на RBoard:",
        hashtags: ["Громада", "НовиниГромади", "РахівськаГромада", "Інформація"],
    },
    "Інше": {
        emoji: "📌",
        question: "Хочеш дізнатися більше?",
        details: "Повна інформація доступна на RBoard:",
        hashtags: ["Оголошення", "Інформація", "Рахів"],
    },
};

const getText = (value) => {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    return "";
};

const getDescription = (listing) => {
    return (
        getText(listing.comment)

    );
};

const getLocation = (listing) => {
    const city =
        typeof listing.city === "string"
            ? listing.city
            : listing.city?.name || "";

    return [city, listing.street]
        .map(getText)
        .filter(Boolean)
        .join(", ");
};

const getAuthor = (listing) => {
    return (
        getText(listing.authorName) ||
        getText(listing.author?.name) ||
        getText(listing.author?.login)
    );
};

const getPrice = (listing) => {
    const price = listing.price;

    if (price === null || price === undefined || price === "") {
        return "";
    }

    if (typeof price === "object") {
        return getText(price.amount);
    }

    return getText(price);
};

const getEmoji = (listing, category) => {
    const title = getText(listing.title).toLowerCase();

    if (["Продаж", "Купівля"].includes(category)) {
        if (/авто|автомоб|volkswagen|golf|bmw|audi|skoda|toyota|машин/i.test(title)) {
            return "🚗";
        }

        if (/квартир|будин|земл|ділянк/i.test(title)) {
            return "🏡";
        }

        if (/телефон|iphone|samsung|смартфон/i.test(title)) {
            return "📱";
        }

        if (/велосипед/i.test(title)) {
            return "🚲";
        }

        if (/котик|кошен|собак|цуцен/i.test(title)) {
            return "🐾";
        }
    }

    if (category === "Послуга" && /масаж/i.test(title)) {
        return "💆‍♀️";
    }

    return CATEGORY_CONFIG[category]?.emoji || "📌";
};

const getHashtags = (listing, category) => {
    const baseTags = [
        "RBoard",
        "Рахів",
        "РахівськийРайон",
        "ОголошенняРахів",
        "Закарпаття",
        "ОголошенняЗакарпаття",
    ];

    const categoryTags =
        CATEGORY_CONFIG[category]?.hashtags || [];

    const city =
        typeof listing.city === "string"
            ? listing.city
            : listing.city?.name || "";

    const cityTag = city
        .replace(/[^\p{L}\p{N}_]/gu, "");

    const allTags = [
        ...baseTags,
        ...categoryTags,
        ...(cityTag ? [cityTag] : []),
    ];

    return [...new Set(allTags)]
        .map((tag) => `#${tag}`)
        .join(" ");
};

export const generateFacebookPost = (listing) => {
    if (!listing) return "";

    const category = getText(listing.type) || "Інше";

    const config =
        CATEGORY_CONFIG[category] ||
        CATEGORY_CONFIG["Інше"];

    const title = getText(listing.title) || "Без назви";
    const description = getDescription(listing);
    const location = getLocation(listing);
    const author = getAuthor(listing);
    const price = getPrice(listing);
    const emoji = getEmoji(listing, category);

    const listingUrl = listing.id
        ? `${SITE_URL}/listing/${encodeURIComponent(listing.id)}`
        : SITE_URL;

    const lines = [];

    // Заголовок
    lines.push(`${emoji} ${title}`);

    // Повний опис автора
    if (description) {
        lines.push("");
        lines.push("Опис від автора:");
        lines.push(description);
    }

    // Місце
    if (location) {
        lines.push("");
        lines.push(`📍 ${location}`);
    }

    // Ціна
    if (price) {
        const currency =
            getText(listing.currency) ||
            getText(listing.priceCurrency);

        lines.push(
            `Ціна: ${price}${currency ? ` ${currency}` : ""}`
        );
    }

    // Автор
    if (author) {
        lines.push("");
        lines.push(`Автор оголошення — ${author}`);
    }

    // Заклик до дії
    lines.push("");
    lines.push(`👉 ${config.question}`);
    lines.push(config.details);
    lines.push(listingUrl);

    // Хештеги
    lines.push("");
    lines.push(getHashtags(listing, category));

    return lines.join("\n");
};
