import {
    doc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";


const VISITOR_STORAGE_KEY = "rboardVisitorId";

const getRegisteredUser = () => {
    try {
        const savedUser =
            localStorage.getItem("rboardUser");

        if (!savedUser) {
            return null;
        }

        return JSON.parse(savedUser);
    } catch {
        return null;
    }
};

const getGuestVisitorId = () => {
    let visitorId =
        localStorage.getItem(VISITOR_STORAGE_KEY);

    if (visitorId) {
        return visitorId;
    }

    visitorId = crypto.randomUUID();

    localStorage.setItem(
        VISITOR_STORAGE_KEY,
        visitorId
    );

    return visitorId;
};

export const getViewerId = () => {
    const user = getRegisteredUser();

    if (user?.id) {
        return `user_${user.id}`;
    }

    return `guest_${getGuestVisitorId()}`;
};

export const registerListingView = async (listingId) => {
    if (!listingId) {
        return null;
    }

    const viewerId = getViewerId();

    const listingRef = doc(
        db,
        "listings",
        listingId
    );

    const viewId = `${listingId}_${viewerId}`;

    const viewRef = doc(
        db,
        "listingViews",
        viewId
    );

    return runTransaction(
        db,
        async (transaction) => {
            const viewSnapshot =
                await transaction.get(viewRef);

            if (viewSnapshot.exists()) {
                const listingSnapshot =
                    await transaction.get(
                        listingRef
                    );

                if (!listingSnapshot.exists()) {
                    return null;
                }

                return (
                    listingSnapshot.data().views ?? 0
                );
            }

            const listingSnapshot =
                await transaction.get(listingRef);

            if (!listingSnapshot.exists()) {
                return null;
            }

            const listingData =
                listingSnapshot.data();

            const currentViews =
                Number(listingData.views ?? 0);

            const newViews =
                currentViews + 1;

            transaction.set(viewRef, {
                listingId,
                viewerId,
                viewedAt: serverTimestamp(),
            });

            transaction.update(listingRef, {
                views: newViews,
            });

            return newViews;
        }
    );
};