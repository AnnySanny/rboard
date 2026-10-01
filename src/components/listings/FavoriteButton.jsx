import {
    useEffect,
    useState,
} from "react";

import {
    arrayRemove,
    arrayUnion,
    doc,
    updateDoc,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import Swal from "sweetalert2";

import {
    auth,
    db,
} from "../../firebase";


const FavoriteButton = ({
    listing,
}) => {
    const [currentUser, setCurrentUser] =
        useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);

    const [updating, setUpdating] =
        useState(false);


    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                (user) => {
                    setCurrentUser(user);
                    setAuthLoading(false);
                }
            );

        return unsubscribe;
    }, []);


    /*
     * Поки Firebase перевіряє сесію
     * або користувач не авторизований,
     * кнопку не показуємо.
     */
    if (
        authLoading ||
        !currentUser
    ) {
        return null;
    }


    const favoriteUserIds =
        Array.isArray(
            listing.favoriteUserIds
        )
            ? listing.favoriteUserIds
            : [];


    /*
     * Тепер використовуємо
     * Firebase Authentication UID.
     */
    const isFavorite =
        favoriteUserIds.includes(
            currentUser.uid
        );


    const handleFavorite =
        async (event) => {
            /*
             * Картка оголошення
             * сама є клікабельною.
             *
             * Тому не дозволяємо
             * кліку по сердечку
             * відкривати оголошення.
             */
            event.preventDefault();
            event.stopPropagation();

            if (updating) {
                return;
            }

            setUpdating(true);

            try {
                const listingRef =
                    doc(
                        db,
                        "listings",
                        listing.id
                    );


                /*
                 * ВИДАЛЕННЯ З ОБРАНОГО
                 */
                if (isFavorite) {
                    await updateDoc(
                        listingRef,
                        {
                            favoriteUserIds:
                                arrayRemove(
                                    currentUser.uid
                                ),
                        }
                    );

                    await Swal.fire({
                        toast: true,
                        position:
                            "top-end",
                        icon: "success",
                        title:
                            "Видалено з обраного",
                        showConfirmButton:
                            false,
                        timer: 1800,
                        timerProgressBar:
                            true,
                    });

                    return;
                }


                /*
                 * ДОДАВАННЯ В ОБРАНЕ
                 */
                await updateDoc(
                    listingRef,
                    {
                        favoriteUserIds:
                            arrayUnion(
                                currentUser.uid
                            ),
                    }
                );

                await Swal.fire({
                    toast: true,
                    position:
                        "top-end",
                    icon: "success",
                    title:
                        "Додано в обране",
                    showConfirmButton:
                        false,
                    timer: 1800,
                    timerProgressBar:
                        true,
                });
            } catch (error) {
                console.error(
                    "Помилка зміни обраного:",
                    error
                );

                await Swal.fire({
                    toast: true,
                    position:
                        "top-end",
                    icon: "error",
                    title:
                        "Не вдалося змінити обране",
                    showConfirmButton:
                        false,
                    timer: 2200,
                    timerProgressBar:
                        true,
                });
            } finally {
                setUpdating(false);
            }
        };


    return (
        <button
            type="button"
            onClick={
                handleFavorite
            }
            disabled={updating}
            className={`
                absolute
                bottom-2
                right-1
                z-20
                flex
                h-11
                w-11
                items-center
                justify-center
                transition-all
                duration-200
${isFavorite
                    ? "text-[#f35179]"
                    : "text-[#f35179] hover:text-[#f35179]"
                }
                ${updating
                    ? "cursor-wait opacity-50"
                    : "hover:scale-110 active:scale-95"
                }
            `}
            title={
                isFavorite
                    ? "Видалити з обраного"
                    : "Додати в обране"
            }
            aria-label={
                isFavorite
                    ? "Видалити з обраного"
                    : "Додати в обране"
            }
        >
            {updating ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#f35179] border-t-transparent" />
            ) : (
                <HeartIcon
                    filled={
                        isFavorite
                    }
                />
            )}
        </button>
    );
};


const HeartIcon = ({
    filled = false,
}) => {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill={
                filled
                    ? "currentColor"
                    : "none"
            }
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
    );
};


export default FavoriteButton;