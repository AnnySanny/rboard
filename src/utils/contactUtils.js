export const CONTACT_TYPES = {
    PHONE: "phone",
    EMAIL: "email",
    TELEGRAM: "telegram",
    INSTAGRAM: "instagram",
    FACEBOOK: "facebook",
    WHATSAPP: "whatsapp",
    VIBER: "viber",
    OTHER: "other",
};

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex =
    /^\+?[0-9\s\-()]{9,20}$/;

export const detectContactType = (
    value
) => {
    const contact = String(
        value || ""
    )
        .trim()
        .toLowerCase();

    if (!contact) {
        return null;
    }

    if (
        contact.startsWith("@") ||
        contact.includes("t.me/") ||
        contact.includes("telegram.me/")
    ) {
        return CONTACT_TYPES.TELEGRAM;
    }

    if (
        contact.includes(
            "instagram.com/"
        ) ||
        contact.includes("instagr.am/")
    ) {
        return CONTACT_TYPES.INSTAGRAM;
    }

    if (
        contact.includes(
            "facebook.com/"
        ) ||
        contact.includes("fb.com/")
    ) {
        return CONTACT_TYPES.FACEBOOK;
    }

    if (
        contact.includes("wa.me/") ||
        contact.includes(
            "api.whatsapp.com/"
        ) ||
        contact.startsWith(
            "whatsapp://"
        )
    ) {
        return CONTACT_TYPES.WHATSAPP;
    }

    if (
        contact.startsWith("viber://") ||
        contact.includes("viber.com/")
    ) {
        return CONTACT_TYPES.VIBER;
    }

    if (emailRegex.test(contact)) {
        return CONTACT_TYPES.EMAIL;
    }

    if (phoneRegex.test(contact)) {
        return CONTACT_TYPES.PHONE;
    }

    return CONTACT_TYPES.OTHER;
};

export const normalizePhone = (
    value
) => {
    let phone = String(value || "")
        .trim()
        .replace(/\D/g, "");

    if (phone.startsWith("380")) {
        phone = `+${phone}`;
    } else if (phone.startsWith("0")) {
        phone = `+38${phone}`;
    } else if (phone.length > 0) {
        phone = `+${phone}`;
    }

    return phone;
};

export const normalizeContactValue = (
    value
) => {
    const original = String(
        value || ""
    ).trim();

    if (!original) {
        return "";
    }

    const type =
        detectContactType(original);

    switch (type) {
        case CONTACT_TYPES.PHONE:
            return normalizePhone(
                original
            );

        case CONTACT_TYPES.EMAIL:
            return original.toLowerCase();

        case CONTACT_TYPES.TELEGRAM:
            return normalizeTelegram(
                original
            );

        case CONTACT_TYPES.INSTAGRAM:
        case CONTACT_TYPES.FACEBOOK:
        case CONTACT_TYPES.WHATSAPP:
        case CONTACT_TYPES.VIBER:
            return original;

        default:
            return original;
    }
};

export const normalizeTelegram = (
    value
) => {
    const contact = String(
        value || ""
    ).trim();

    if (contact.startsWith("@")) {
        return contact;
    }

    return contact;
};

export const isValidGuestContact = (
    value
) => {
    const contact = String(
        value || ""
    ).trim();

    if (!contact) {
        return false;
    }

    return (
        detectContactType(contact) !==
        CONTACT_TYPES.OTHER
    );
};

export const getContactLabel = (
    type
) => {
    switch (type) {
        case CONTACT_TYPES.PHONE:
            return "Телефон";

        case CONTACT_TYPES.EMAIL:
            return "Email";

        case CONTACT_TYPES.TELEGRAM:
            return "Telegram";

        case CONTACT_TYPES.INSTAGRAM:
            return "Instagram";

        case CONTACT_TYPES.FACEBOOK:
            return "Facebook";

        case CONTACT_TYPES.WHATSAPP:
            return "WhatsApp";

        case CONTACT_TYPES.VIBER:
            return "Viber";

        default:
            return "Інший контакт";
    }
};

export const getContactHref = (
    value
) => {
    const contact = String(
        value || ""
    ).trim();

    if (!contact) {
        return null;
    }

    const type =
        detectContactType(contact);

    switch (type) {
        case CONTACT_TYPES.PHONE:
            return `tel:${normalizePhone(
                contact
            )}`;

        case CONTACT_TYPES.EMAIL:
            return `mailto:${contact}`;

        case CONTACT_TYPES.TELEGRAM:
            if (contact.startsWith("@")) {
                return `https://t.me/${contact.slice(
                    1
                )}`;
            }

            if (
                /^https?:\/\//i.test(
                    contact
                )
            ) {
                return contact;
            }

            return `https://${contact}`;

        case CONTACT_TYPES.INSTAGRAM:
        case CONTACT_TYPES.FACEBOOK:
        case CONTACT_TYPES.WHATSAPP:
            if (
                /^[a-z]+:\/\//i.test(
                    contact
                )
            ) {
                return contact;
            }

            return `https://${contact}`;

        case CONTACT_TYPES.VIBER:
            if (
                contact.startsWith(
                    "viber://"
                )
            ) {
                return contact;
            }

            if (
                /^https?:\/\//i.test(
                    contact
                )
            ) {
                return contact;
            }

            return `https://${contact}`;

        default:
            return null;
    }
};