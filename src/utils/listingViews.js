import {
    doc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";

import {
    auth,
    db,
} from "../firebase";


const VISITOR_STORAGE_KEY =
    "rboardVisitorId";


const getGuestVisitorId = () => {
    let visitorId =
        localStorage.getItem(
            VISITOR_STORAGE_KEY
        );

    if (visitorId) {
        return visitorId;
    }

    visitorId =
        crypto.randomUUID();

    localStorage.setItem(
        VISITOR_STORAGE_KEY,
        visitorId
    );

    return visitorId;
};


const getViewerData = () => {
    const currentUser =
        auth.currentUser;

    if (currentUser?.uid) {
        return {
            viewerId:
                `user_${currentUser.uid}`,

            viewerType:
                "user",
        };
    }

    const guestId =
        getGuestVisitorId();

    return {
        viewerId:
            `guest_${guestId}`,

        viewerType:
            "guest",
    };
};


export const getViewerId = () => {
    return getViewerData().viewerId;
};


export const registerListingView = async (
    listingId
) => {
    if (!listingId) {
        return null;
    }

    const {
        viewerId,
        viewerType,
    } = getViewerData();

    const listingRef = doc(
        db,
        "listings",
        listingId
    );

    /*
     * Один viewerId може створити
     * тільки один документ перегляду
     * для конкретного оголошення.
     */
    const viewId =
        `${listingId}_${viewerId}`;

    // Перевіряємо, чи перегляд уже зарахований
    try {
        if (
            localStorage.getItem(
                `rboardViewed_${viewId}`
            ) === "1"
        ) {
            return null;
        }
    } catch {
        // Якщо localStorage недоступний,
        // продовжуємо роботу через Firestore
    }

    const viewRef = doc(
        db,
        "listingViews",
        viewId
    );

    const result = await runTransaction(
        db,
        async (transaction) => {
            /*
             * Спочатку перевіряємо,
             * чи цей користувач/гість
             * уже переглядав оголошення.
             */
            const viewSnapshot =
                await transaction.get(
                    viewRef
                );

            if (viewSnapshot.exists()) {
                const listingSnapshot =
                    await transaction.get(
                        listingRef
                    );

                if (
                    !listingSnapshot.exists()
                ) {
                    return null;
                }

                return Number(
                    listingSnapshot
                        .data()
                        .views ?? 0
                );
            }

            /*
             * Отримуємо оголошення.
             */
            const listingSnapshot =
                await transaction.get(
                    listingRef
                );

            if (
                !listingSnapshot.exists()
            ) {
                return null;
            }

            const listingData =
                listingSnapshot.data();

            const currentViews =
                Number(
                    listingData.views ?? 0
                );

            const newViews =
                currentViews + 1;

            /*
             * Створюємо унікальний
             * запис перегляду.
             */
            transaction.set(
                viewRef,
                {
                    listingId,

                    viewerId,

                    viewerType,

                    viewedAt:
                        serverTimestamp(),
                }
            );

            /*
             * Збільшуємо лічильник
             * тільки на 1.
             */
            transaction.update(
                listingRef,
                {
                    views:
                        newViews,
                }
            );

            return newViews;
        }
    );

    // Запам'ятовуємо успішний перегляд
    if (result !== null) {
        try {
            localStorage.setItem(
                `rboardViewed_${viewId}`,
                "1"
            );
        } catch {
            // Якщо localStorage недоступний,
            // перегляд уже оброблений Firestore
        }
    }

    return result;
};