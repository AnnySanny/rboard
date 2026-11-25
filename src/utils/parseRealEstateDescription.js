
export const parseRealEstateDescription = (description) => {
    const text = String(description || "")
        .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
        .replace(/[^\S\r\n]+/g, " ")
        .trim();

    const fields = {};
    const notes = [];

    const asNumber = (value) => {
        const number = String(value).replace(/\s/g, "");

        if (/^\d{1,3}(?:[.,]\d{3})+$/.test(number)) {
            return Number(number.replace(/[.,]/g, ""));
        }

        return Number(number.replace(",", "."));
    };

    // Тип об'єкта

    // Тип об'єкта
    const hasHouse =
        /(будинок|будинку|будинком|хата|котедж|особняк)(?![а-яіїєґ])/iu.test(text);

    const hasLand =
        /земельн[а-яіїєґ]*\s+ділянк[а-яіїєґ]*|ділянк[а-яіїєґ]*/iu.test(text);

    // Продаж конкретного комерційного об'єкта
    const hasCommercialSale =
        /(?:продається|продаю|продають|продаж|реалізується)\s+(?:(?:колишн[а-яіїєґ]*|діюч[а-яіїєґ]*|готов[а-яіїєґ]*|одно[а-яіїєґ]*поверхов[а-яіїєґ]*|дво[а-яіїєґ]*поверхов[а-яіїєґ]*|трьох[а-яіїєґ]*поверхов[а-яіїєґ]*|чотирьох[а-яіїєґ]*поверхов[а-яіїєґ]*)\s+){0,3}(?:автосервіс[а-яіїєґ]*|автомийк[а-яіїєґ]*|магазин[а-яіїєґ]*|бар(?![а-яіїєґ])|кафе|ресторан[а-яіїєґ]*|офіс[а-яіїєґ]*|склад[а-яіїєґ]*|готел[а-яіїєґ]*|будівл[а-яіїєґ]*|приміщен[а-яіїєґ]*)/iu.test(text);

    // Явне зазначення комерційного призначення
    const hasExplicitCommercial =
        /(?:комерційн[а-яіїєґ]*|нежитлов[а-яіїєґ]*|торгов[а-яіїєґ]*)\s+(?:приміщен[а-яіїєґ]*|будівл[а-яіїєґ]*|нерухом[а-яіїєґ]*|об[ʼ'’]єкт[а-яіїєґ]*)/iu.test(text);

    // Комерційні об'єкти без прямої фрази "продається"
    const hasCommercialKeyword =
        /автосервіс[а-яіїєґ]*|автомийк[а-яіїєґ]*|магазин[а-яіїєґ]*|бар(?![а-яіїєґ])|кафе|ресторан[а-яіїєґ]*|офіс[а-яіїєґ]*|склад[а-яіїєґ]*|готел[а-яіїєґ]*|будівл[а-яіїєґ]*|приміщен[а-яіїєґ]*/iu.test(text);

    if (hasCommercialSale || hasExplicitCommercial) {
        fields.propertyType = "commercial";
    } else if (hasHouse) {
        fields.propertyType = "house";
    } else if (hasLand) {
        fields.propertyType = "land";
    } else if (hasCommercialKeyword) {
        fields.propertyType = "commercial";
    }


    // Площа будинку
    const buildingArea = text.match(
        /(\d+(?:[.,]\d+)?)\s*(?:м²|м2|кв\.?\s*м)(?=\s|[,.!;]|$)/iu
    );

    if (buildingArea) {
        const value = asNumber(buildingArea[1]);

        if (fields.propertyType === "house" && value > 0) {
            fields.buildingArea = String(value);
        } else if (!fields.propertyType) {
            notes.push(
                `Знайдено площу будівлі ${value} м², ` +
                "але тип об'єкта не визначено."
            );
        }
    }

    // Площі земельних ділянок
    const plotPattern =
        /(\d+(?:[.,]\d+)?)\s*(соток|сотки|сотка|сотини|сотин|сот\.?|гектарів|гектари|гектар|га)(?![а-яіїєґ])/giu;

    const plots = [...text.matchAll(plotPattern)]
        .map((match) => {
            const value = asNumber(match[1]);

            return /^(га|гектар)/iu.test(match[2])
                ? value * 100
                : value;
        })
        .filter((value) => Number.isFinite(value) && value > 0);

    if (plots.length > 0 && fields.propertyType) {
        fields.landArea = String(plots[0]);
    }

    if (plots.length > 1) {
        notes.push(
            `Знайдено кілька ділянок: ${plots.join(" і ")} сот. ` +
            "Перевір їх вручну — площі не підсумовуються."
        );
    }

    // Кількість поверхів
    const numericFloors = text.match(
        /(\d{1,2})\s*(?:-?\s*поверх(?:ов[а-яіїєґ]*|і|ів|и)?|пов\.)/iu
    );

    const wordFloors = text.match(
        /(одно|дво|двох|три|трьох|чотири|чотирьох|п’яти|п'яти)\s*-?\s*поверх/iu
    );

    const floorsMap = {
        одно: 1,
        дво: 2,
        двох: 2,
        три: 3,
        трьох: 3,
        чотири: 4,
        чотирьох: 4,
        "п'яти": 5,
        "п’яти": 5,
    };

    const floors = numericFloors
        ? Number(numericFloors[1])
        : wordFloors
            ? floorsMap[wordFloors[1].toLowerCase()]
            : null;

    if (floors && fields.propertyType === "house") {
        fields.floors = String(floors);
    } else if (floors && !fields.propertyType) {
        notes.push(
            `Знайдено поверховість: ${floors}. ` +
            "Не підставлено через невизначений тип об'єкта."
        );
    }

    // Ціна: пріоритет має "Нова ціна"
    const pricePattern =
        /(нова\s+ціна|стара\s+ціна|ціна)\s*[:-]?\s*(\d[\d\s.,]*?)\s*(\$|usd|€|eur|грн\.?|uah|євро|долар(?:ів|и)?)/giu;

    const prices = [...text.matchAll(pricePattern)]
        .map((match) => ({
            kind: match[1].toLowerCase(),
            amount: asNumber(match[2]),
            currency: match[3].toLowerCase(),
        }))
        .filter(
            (item) =>
                Number.isFinite(item.amount) &&
                item.amount > 0
        );

    const currentPrice =
        prices.find((item) => item.kind.includes("нова")) ||
        [...prices]
            .reverse()
            .find((item) => !item.kind.includes("стара"));

    if (currentPrice) {
        fields.price = String(currentPrice.amount);

        const currency = currentPrice.currency;

        fields.currency =
            currency.includes("$") ||
                currency.includes("usd") ||
                currency.includes("долар")
                ? "USD"
                : currency.includes("€") ||
                    currency.includes("eur") ||
                    currency.includes("євро")
                    ? "EUR"
                    : "UAH";

        if (prices.length > 1) {
            notes.push(
                "Знайдено кілька цін. " +
                "Підставлено ймовірну актуальну ціну."
            );
        }
    }

    // Ціна за сотку
    if (
        fields.propertyType === "land" &&
        /за\s+(?:1\s+)?сот(?:ку|ину)/iu.test(text)
    ) {
        fields.priceMode = "per_sotka";
    }

    // Можливість торгу
    if (
        /без\s+торгу|торг\s+(?:відсутній|неможливий)/iu.test(text)
    ) {
        fields.negotiable = false;
    } else if (
        /торг(?![а-яіїєґ])|торгуватися/iu.test(text)
    ) {
        fields.negotiable = true;
    }

    // Телефонні номери
    const phonePattern =
        /(?:\+?38[\s()-]*)?0(?:[\s()-]*\d){9}(?!\d)/g;

    const phones = [
        ...new Set(
            [...text.matchAll(phonePattern)]
                .map((match) =>
                    match[0].replace(/\D/g, "")
                )
                .map((number) =>
                    number.startsWith("38")
                        ? `+${number}`
                        : number
                )
        ),
    ];

    if (phones[0]) fields.contact = phones[0];
    if (phones[1]) fields.secondContact = phones[1];

    if (phones.length > 2) {
        notes.push(
            "Знайдено понад два телефони. Перевір контакти."
        );
    }

    // Вулиця
    const street = text.match(
        /вул(?:иця)?\.?[ \t]+([А-ЯІЇЄҐ][а-яіїєґА-ЯІЇЄҐ'’-]+(?:[ \t]+(?!Стара(?:[ \t]|$)|Нова(?:[ \t]|$)|Ціна(?:[ \t]|$))[А-ЯІЇЄҐ][а-яіїєґА-ЯІЇЄҐ'’-]+){0,2}(?:[ \t]*,?[ \t]*\d+[А-Яа-я]?)?)/u
    );

    if (street) {
        fields.street = `вул. ${street[1].trim()}`;
    }

    // Місто: лише підказка, бо CityAutocomplete
    // потребує об'єкт міста, а не звичайний рядок
    const city = text.match(
            /(?:^|[\s,])м\.?[ \t]*([А-ЯІЇЄҐ][а-яіїєґ'’-]+)/u
    );

    if (city) {
        notes.push(
            `Знайдено населений пункт: ${city[1]}. ` +
            "Вибери його зі списку міст вручну."
        );
    }

    return { fields, notes };
};
