
export const mapListingDocument = (document) => {
    const data = document.data();

    return {
        id: document.id,

        title: data.title || "",

        description: data.comment || "",

        category: data.type || "Інше",

        city: data.city?.name || "",

        region: data.city?.region || "",

        district: data.city?.district || "",

        street: data.street || "",

        location: [
            data.city?.name,
            data.street,
        ]
            .filter(Boolean)
            .join(", "),

        contact:
            data.contactOriginal ||
            data.contact ||
            "",

        hidePhone: data.hidePhone === true,

        additionalContacts:
            data.additionalContacts &&
            typeof data.additionalContacts === "object"
                ? data.additionalContacts
                : {},

        authorName: data.authorName || "",

        author:
            data.author &&
            typeof data.author === "object"
                ? data.author
                : null,

        views: Number(data.views ?? 0),

        createdAt:
            data.createdAt?.toDate?.() ||
            null,

        expiresAt:
            data.expiresAt?.toDate?.() ||
            null,

        images: Array.isArray(data.images)
            ? data.images
            : [],

        favoriteUserIds:
            Array.isArray(data.favoriteUserIds)
                ? data.favoriteUserIds
                : [],
    };
};
