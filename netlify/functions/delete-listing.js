const {
    initializeApp,
    cert,
    getApps,
} = require("firebase-admin/app");

const {
    getAuth,
} = require("firebase-admin/auth");

const {
    getFirestore,
} = require("firebase-admin/firestore");

const {
    v2: cloudinary,
} = require("cloudinary");


/*
 * =========================================
 * FIREBASE ADMIN
 * =========================================
 */

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const privateKey =
        process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
        );

    if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !privateKey
    ) {
        throw new Error(
            "Firebase Admin environment variables are missing."
        );
    }

    return initializeApp({
        credential: cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey,
        }),
    });
}


const firebaseAdminApp =
    getFirebaseAdminApp();

const adminAuth =
    getAuth(firebaseAdminApp);

const adminDb =
    getFirestore(firebaseAdminApp);


/*
 * =========================================
 * CLOUDINARY
 * =========================================
 */

cloudinary.config({
    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET,

    secure: true,
});


/*
 * =========================================
 * RESPONSE
 * =========================================
 */

function response(statusCode, body) {
    return {
        statusCode,

        headers: {
            "Content-Type":
                "application/json; charset=utf-8",
        },

        body: JSON.stringify(body),
    };
}


/*
 * =========================================
 * FUNCTION
 * =========================================
 */

exports.handler = async (event) => {
    /*
     * Дозволяємо тільки POST.
     */
    if (event.httpMethod !== "POST") {
        return response(405, {
            success: false,
            message: "Method not allowed.",
        });
    }

    try {
        /*
         * =========================================
         * 1. FIREBASE TOKEN
         * =========================================
         */

        const authorizationHeader =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";

        if (
            !authorizationHeader.startsWith(
                "Bearer "
            )
        ) {
            return response(401, {
                success: false,
                message:
                    "Необхідна авторизація.",
            });
        }

        const idToken =
            authorizationHeader.substring(7);

        let decodedToken;

        try {
            decodedToken =
                await adminAuth.verifyIdToken(
                    idToken
                );
        } catch (error) {
            console.error(
                "Invalid Firebase token:",
                error
            );

            return response(401, {
                success: false,
                message:
                    "Недійсний токен авторизації.",
            });
        }

        const uid = decodedToken.uid;


        /*
         * =========================================
         * 2. BODY
         * =========================================
         */

        let body;

        try {
            body = JSON.parse(
                event.body || "{}"
            );
        } catch {
            return response(400, {
                success: false,
                message:
                    "Некоректний формат запиту.",
            });
        }

        const listingId =
            typeof body.listingId === "string"
                ? body.listingId.trim()
                : "";

        if (!listingId) {
            return response(400, {
                success: false,
                message:
                    "Не вказано ID оголошення.",
            });
        }


        /*
         * =========================================
         * 3. ОТРИМУЄМО ОГОЛОШЕННЯ
         * =========================================
         */

        const listingRef =
            adminDb
                .collection("listings")
                .doc(listingId);

        const listingSnapshot =
            await listingRef.get();

        if (!listingSnapshot.exists) {
            return response(404, {
                success: false,
                message:
                    "Оголошення не знайдено.",
            });
        }

        const listing =
            listingSnapshot.data();


        /*
         * =========================================
         * 4. ОТРИМУЄМО КОРИСТУВАЧА
         * =========================================
         */

        const userSnapshot =
            await adminDb
                .collection("users")
                .doc(uid)
                .get();

        if (!userSnapshot.exists) {
            return response(403, {
                success: false,
                message:
                    "Профіль користувача не знайдено.",
            });
        }

        const user =
            userSnapshot.data();

        const isAdmin =
            user.role === "admin";

        const isOwner =
            listing.author?.isAuthenticated === true &&
            listing.author?.uid === uid;


        /*
         * =========================================
         * 5. ПЕРЕВІРКА ПРАВ
         * =========================================
         *
         * ADMIN:
         * може видаляти будь-яке оголошення.
         *
         * USER:
         * тільки власне.
         *
         * Гостьове:
         * звичайний user видалити не може.
         */

        if (!isAdmin && !isOwner) {
            return response(403, {
                success: false,
                message:
                    "Ви не маєте права видаляти це оголошення.",
            });
        }


        /*
         * =========================================
         * 6. PUBLIC IDs CLOUDINARY
         * =========================================
         */

        const images =
            Array.isArray(listing.images)
                ? listing.images
                : [];

        const publicIds = [
            ...new Set(
                images
                    .map(
                        (image) =>
                            image?.imagePublicId
                    )
                    .filter(
                        (publicId) =>
                            typeof publicId ===
                                "string" &&
                            publicId.trim()
                    )
                    .map(
                        (publicId) =>
                            publicId.trim()
                    )
            ),
        ];


        /*
         * =========================================
         * 7. ВИДАЛЯЄМО CLOUDINARY
         * =========================================
         */

        if (publicIds.length > 0) {
            const cloudinaryResult =
                await cloudinary.api.delete_resources(
                    publicIds,
                    {
                        resource_type: "image",
                        type: "upload",
                        invalidate: true,
                    }
                );

            console.log(
                "Cloudinary delete result:",
                cloudinaryResult
            );

            /*
             * Перевіряємо кожен publicId.
             *
             * "deleted"    — видалено.
             * "not_found"  — файла вже немає,
             *                це теж нормально.
             */

            const failedIds =
                publicIds.filter(
                    (publicId) => {
                        const status =
                            cloudinaryResult
                                ?.deleted
                                ?.[publicId];

                        return (
                            status !== "deleted" &&
                            status !== "not_found"
                        );
                    }
                );

            if (failedIds.length > 0) {
                console.error(
                    "Cloudinary failed IDs:",
                    failedIds
                );

                return response(502, {
                    success: false,
                    message:
                        "Не вдалося видалити всі фотографії оголошення.",

                    /*
                     * publicId користувачу
                     * спеціально не повертаємо.
                     */
                    failedImages:
                        failedIds.length,
                });
            }
        }


        /*
         * =========================================
         * 8. ВИДАЛЯЄМО FIRESTORE
         * =========================================
         *
         * До цього моменту всі фотографії
         * Cloudinary вже видалені.
         */

        await listingRef.delete();


        /*
         * =========================================
         * 9. SUCCESS
         * =========================================
         */

        return response(200, {
            success: true,

            message:
                "Оголошення успішно видалено.",

            deletedImages:
                publicIds.length,
        });
    } catch (error) {
        console.error(
            "DELETE LISTING ERROR:",
            error
        );

        return response(500, {
            success: false,
            message:
                "Не вдалося видалити оголошення.",
        });
    }
};