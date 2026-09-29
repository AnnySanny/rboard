import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";

import {
    auth,
    db,
} from "../firebase";


export const ADMIN_LOG_ACTIONS = {
    LISTING_CREATED:
        "listing_created",

    LISTING_UPDATED:
        "listing_updated",

    LISTING_APPROVED:
        "listing_approved",

    LISTING_REJECTED:
        "listing_rejected",

    LISTING_DELETED:
        "listing_deleted",

    USER_BLOCKED:
        "user_blocked",

    USER_UNBLOCKED:
        "user_unblocked",

    USER_DELETED:
        "user_deleted",

    FEEDBACK_UPDATED:
        "feedback_updated",

    FEEDBACK_DELETED:
        "feedback_deleted",

    NEWS_CREATED:
        "news_created",

    NEWS_UPDATED:
        "news_updated",

    NEWS_DELETED:
        "news_deleted",

    TOURIST_PLACE_CREATED:
        "tourist_place_created",

    TOURIST_PLACE_UPDATED:
        "tourist_place_updated",

    TOURIST_PLACE_DELETED:
        "tourist_place_deleted",
};


export const createAdminLog = async ({
    action,
    category,
    title,
    description = "",
    targetId = null,
    targetName = null,
}) => {
    try {
        const currentUser =
            auth.currentUser;

        if (!currentUser) {
            return;
        }

        /*
         * Беремо актуальні дані
         * адміністратора з Firestore.
         */
        const adminSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );

        if (!adminSnapshot.exists()) {
            return;
        }

        const adminData =
            adminSnapshot.data();

        if (
            adminData.role !== "admin"
        ) {
            return;
        }
        const adminName =
            adminData.name ||
            adminData.login ||
            "Адміністратор";

        await addDoc(
            collection(
                db,
                "adminLogs"
            ),
            {
                adminUid:
                    currentUser.uid,

                adminName,

                action,

                category,

                title,

                description,

                targetId,

                targetName,

                createdAt:
                    serverTimestamp(),
            }
        );
    } catch (error) {
        /*
         * Помилка логування не повинна
         * ламати основну адмінську дію.
         */
        console.error(
            "Помилка створення системного логу:",
            error
        );
    }
};