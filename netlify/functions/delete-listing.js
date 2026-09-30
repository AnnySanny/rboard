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


cloudinary.config({
    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET,

    secure: true,
});


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


exports.handler = async (event) => {
    console.log(
        "=== DELETE LISTING START ==="
    );

    console.log(
        "HTTP method:",
        event.httpMethod
    );

    if (event.httpMethod !== "POST") {
        console.warn(
            "Request rejected: method is not POST"
        );

        return response(405, {
            success: false,
            message: "Method not allowed.",
        });
    }

    try {
        const authorizationHeader =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";

        if (
            !authorizationHeader.startsWith(
                "Bearer "
            )
        ) {
            console.warn(
                "Authorization header is missing"
            );

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
                "Firebase token verification failed:",
                error
            );

            return response(401, {
                success: false,
                message:
                    "Недійсний токен авторизації.",
            });
        }

        const uid =
            decodedToken.uid;

        console.log(
            "Authenticated UID:",
            uid
        );


        let body;

        try {
            body = JSON.parse(
                event.body || "{}"
            );
        } catch (error) {
            console.error(
                "Invalid JSON body:",
                error
            );

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
            console.warn(
                "Listing ID is missing"
            );

            return response(400, {
                success: false,
                message:
                    "Не вказано ID оголошення.",
            });
        }

        console.log(
            "Listing ID:",
            listingId
        );


        const listingRef =
            adminDb
                .collection("listings")
                .doc(listingId);

        const listingSnapshot =
            await listingRef.get();

        if (!listingSnapshot.exists) {
            console.warn(
                "Listing not found:",
                listingId
            );

            return response(404, {
                success: false,
                message:
                    "Оголошення не знайдено.",
            });
        }


        const listing =
            listingSnapshot.data();

        console.log(
            "Listing found:",
            listingId
        );

        console.log(
            "Listing images:",
            JSON.stringify(
                listing.images || []
            )
        );


        const userSnapshot =
            await adminDb
                .collection("users")
                .doc(uid)
                .get();

        if (!userSnapshot.exists) {
            console.warn(
                "User profile not found:",
                uid
            );

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

        console.log(
            "Permission check:",
            {
                isAdmin,
                isOwner,
            }
        );


        if (!isAdmin && !isOwner) {
            console.warn(
                "Delete permission denied:",
                {
                    uid,
                    listingId,
                }
            );

            return response(403, {
                success: false,
                message:
                    "Ви не маєте права видаляти це оголошення.",
            });
        }


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


        console.log(
            "Cloudinary public IDs:",
            publicIds
        );

        console.log(
            "Cloudinary configuration:",
            {
                cloudName:
                    process.env
                        .CLOUDINARY_CLOUD_NAME ||
                    null,

                hasApiKey:
                    Boolean(
                        process.env
                            .CLOUDINARY_API_KEY
                    ),

                hasApiSecret:
                    Boolean(
                        process.env
                            .CLOUDINARY_API_SECRET
                    ),
            }
        );


        if (
            images.length > 0 &&
            publicIds.length === 0
        ) {
            console.error(
                "Listing contains images but no imagePublicId:",
                listingId
            );

            return response(500, {
                success: false,
                message:
                    "Не вдалося визначити фотографії оголошення для видалення.",
            });
        }


        if (publicIds.length > 0) {
            console.log(
                "Deleting Cloudinary images..."
            );

            let cloudinaryResult;

            try {
                cloudinaryResult =
                    await cloudinary.api.delete_resources(
                        publicIds,
                        {
                            resource_type:
                                "image",

                            type:
                                "upload",

                            invalidate:
                                true,
                        }
                    );
            } catch (error) {
                console.error(
                    "Cloudinary request failed:",
                    error
                );

                return response(502, {
                    success: false,
                    message:
                        "Не вдалося видалити фотографії оголошення.",
                });
            }


            console.log(
                "Cloudinary delete result:",
                JSON.stringify(
                    cloudinaryResult
                )
            );


            const failedIds =
                publicIds.filter(
                    (publicId) => {
                        const status =
                            cloudinaryResult
                                ?.deleted
                                ?.[publicId];

                        console.log(
                            "Cloudinary image status:",
                            {
                                publicId,
                                status,
                            }
                        );

                        return (
                            status !== "deleted" &&
                            status !== "not_found"
                        );
                    }
                );


            if (failedIds.length > 0) {
                console.error(
                    "Cloudinary deletion failed for:",
                    failedIds
                );

                return response(502, {
                    success: false,
                    message:
                        "Не вдалося видалити всі фотографії оголошення.",
                    failedImages:
                        failedIds.length,
                });
            }


            console.log(
                "Cloudinary images deleted successfully:",
                publicIds.length
            );
        } else {
            console.log(
                "Listing has no Cloudinary images"
            );
        }


        console.log(
            "Deleting Firestore listing:",
            listingId
        );

        await listingRef.delete();

        console.log(
            "Firestore listing deleted:",
            listingId
        );

        console.log(
            "=== DELETE LISTING SUCCESS ==="
        );


        return response(200, {
            success: true,
            message:
                "Оголошення успішно видалено.",
            deletedImages:
                publicIds.length,
        });
    } catch (error) {
        console.error(
            "=== DELETE LISTING ERROR ===",
            error
        );

        return response(500, {
            success: false,
            message:
                "Не вдалося видалити оголошення.",
        });
    }
};