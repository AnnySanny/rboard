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

    const viewRef = doc(
        db,
        "listingViews",
        viewId
    );

    return runTransaction(
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
};