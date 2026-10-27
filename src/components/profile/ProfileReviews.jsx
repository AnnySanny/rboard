
import { useCallback, useEffect, useRef, useState } from "react";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
} from "firebase/firestore";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    MessageSquareText,
    Star,
    UserRound,
    Trash2,
    LoaderCircle,
    ChevronDown,
    Smile,
    Send,
    X,
    Flag,
} from "lucide-react";

import Swal from "sweetalert2";
import { db } from "../../firebase";

const PAGE_SIZE = 10;
const MAX_LENGTH = 350;

const EMOJI_GROUPS = [
    {
        name: "Емоції",
        emojis: [
            "😀", "😃", "😄", "😁", "😆", "😊",
            "🙂", "😉", "😍", "🥰", "😘", "😎",
            "🤩", "🥳", "😇", "😌", "🤗", "🤔",
            "😐", "😕", "😢", "😭", "😡", "😤",
        ],
    },
    {
        name: "Реакції",
        emojis: [
            "👍", "👎", "👏", "🙌", "🤝", "🙏",
            "👌", "✌️", "🤞", "💪", "👀", "🫶",
            "❤️", "🩷", "💙", "💚", "💛", "💜",
            "🔥", "✨", "⭐", "💯", "🎉", "🎊",
        ],
    },
    {
        name: "Інше",
        emojis: [
            "✅", "❌", "✔️", "💬", "💌", "🎁",
            "🏆", "🥇", "👑", "💎", "🌟", "🌈",
            "🌹", "🌸", "🍀", "☀️", "🚀", "💰",
            "📦", "🛍️", "💼", "📱", "🏡", "🎯",
        ],
    },
];

const getLength = (text) =>
    Array.from(text).length;

const limitText = (text) =>
    Array.from(text).slice(0, MAX_LENGTH).join("");

const formatDate = (value) => {
    const date =
        value?.toDate?.() ||
        (value instanceof Date ? value : null);

    if (!date) return "";

    const time = date.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const day = date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
    });

    return `${time}, ${day}`;
};

const StarRating = ({
    value,
    onChange,
    interactive = false,
}) => (
    <div
        className="flex items-center gap-1"
        aria-label={`Оцінка ${value} із 5`}
    >
        {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= value;

            return interactive ? (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={`Поставити ${star} з 5`}
                >
                    <Star
                        size={25}
                        className={
                            active
                                ? "fill-amber-400 text-amber-400"
                                : "fill-transparent text-slate-300"
                        }
                    />
                </button>
            ) : (
                <Star
                    key={star}
                    size={14}
                    className={
                        active
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-slate-300"
                    }
                />
            );
        })}
    </div>
);

export default function ProfileReviews({
    profileUid,
    currentUser,
    isOwner = false,
    profile = null,
    onOpenLogin,
    onOpenRegister,
    onReviewsChanged,
}) {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [error, setError] = useState("");

    const [ownReviewExists, setOwnReviewExists] = useState(false);
    const [checkingPermissions, setCheckingPermissions] = useState(
        Boolean(currentUser?.uid)
    );
    const [isAdmin, setIsAdmin] = useState(false);

    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiGroup, setEmojiGroup] = useState(0);

    const emojiRef = useRef(null);
    const textareaRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const getReviewerProfileUrl = (reviewerUid) => {
        const encodedUid = encodeURIComponent(reviewerUid);

        return location.pathname.startsWith("/dashboard")
            ? `/dashboard/users/${encodedUid}`
            : `/user/${encodedUid}`;
    };
    const reviewsRef = collection(
        db,
        "publicProfiles",
        profileUid,
        "reviews"
    );

    useEffect(() => {
        if (!emojiOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (
                emojiRef.current &&
                !emojiRef.current.contains(event.target)
            ) {
                setEmojiOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setEmojiOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [emojiOpen]);

    const loadReviewerProfiles = useCallback(async (items) => {
        return Promise.all(
            items.map(async (item) => {
                try {
                    const snapshot = await getDoc(
                        doc(db, "publicProfiles", item.id)
                    );

                    return {
                        ...item,
                        reviewer: snapshot.exists()
                            ? snapshot.data()
                            : null,
                    };
                } catch {
                    return {
                        ...item,
                        reviewer: null,
                    };
                }
            })
        );
    }, []);

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const snapshot = await getDocs(
                query(
                    collection(
                        db,
                        "publicProfiles",
                        profileUid,
                        "reviews"
                    ),
                    orderBy("createdAt", "desc"),
                    limit(PAGE_SIZE)
                )
            );

            const items = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            const resolved = await loadReviewerProfiles(items);

            setReviews(resolved);
            setCursor(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.size === PAGE_SIZE);
        } catch (err) {
            console.error("Помилка відгуків:", err);
            setError("Не вдалося завантажити відгуки.");
        } finally {
            setLoading(false);
        }
    }, [profileUid, loadReviewerProfiles]);

    useEffect(() => {
        setReviews([]);
        setCursor(null);
        setHasMore(false);
        loadReviews();
    }, [loadReviews]);

    useEffect(() => {
        let active = true;

        setOwnReviewExists(false);
        setIsAdmin(false);
        setCheckingPermissions(Boolean(currentUser?.uid));

        if (!currentUser?.uid) {
            return undefined;
        }

        const checkPermissions = async () => {
            try {
                const [reviewSnapshot, userSnapshot] =
                    await Promise.all([
                        getDoc(
                            doc(
                                db,
                                "publicProfiles",
                                profileUid,
                                "reviews",
                                currentUser.uid
                            )
                        ),
                        getDoc(doc(db, "users", currentUser.uid)),
                    ]);

                if (!active) return;

                setOwnReviewExists(reviewSnapshot.exists());
                setIsAdmin(userSnapshot.data()?.role === "admin");
            } catch (err) {
                console.error(
                    "Помилка перевірки відгуку:",
                    err
                );
            } finally {
                if (active) {
                    setCheckingPermissions(false);
                }
            }
        };

        checkPermissions();

        return () => {
            active = false;
        };
    }, [profileUid, currentUser?.uid]);

    const loadMore = async () => {
        if (!cursor || !hasMore || loadingMore) return;

        setLoadingMore(true);

        try {
            const snapshot = await getDocs(
                query(
                    reviewsRef,
                    orderBy("createdAt", "desc"),
                    startAfter(cursor),
                    limit(PAGE_SIZE)
                )
            );

            const items = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            const resolved = await loadReviewerProfiles(items);

            setReviews((previous) => {
                const ids = new Set(
                    previous.map((item) => item.id)
                );

                return [
                    ...previous,
                    ...resolved.filter(
                        (item) => !ids.has(item.id)
                    ),
                ];
            });

            setCursor(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.size === PAGE_SIZE);
        } catch (err) {
            console.error(
                "Помилка завантаження відгуків:",
                err
            );

            Swal.fire({
                icon: "error",
                title: "Не вдалося завантажити відгуки",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setLoadingMore(false);
        }
    };

    const publishReview = async () => {
        const text = message.trim();

        if (
            !currentUser ||
            isOwner ||
            ownReviewExists ||
            checkingPermissions ||
            saving ||
            getLength(text) > MAX_LENGTH ||
            rating < 1 ||
            rating > 5
        ) {
            return;
        }

        setSaving(true);
        setEmojiOpen(false);

        try {

            await setDoc(
                doc(
                    db,
                    "publicProfiles",
                    profileUid,
                    "reviews",
                    currentUser.uid
                ),
                {
                    reviewerUid: currentUser.uid,
                    profileUid,
                    rating,
                    text,
                    createdAt: serverTimestamp(),
                }
            );

            setOwnReviewExists(true);
            setMessage("");
            setRating(5);

            await loadReviews();
            onReviewsChanged?.();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Відгук опубліковано",
                timer: 2200,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(
                "Помилка публікації:",
                err
            );

            Swal.fire({
                icon: "error",
                title: "Не вдалося опублікувати відгук",
                text: "Перевірте підключення та спробуйте ще раз.",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setSaving(false);
        }
    };

    const removeReview = async (reviewId) => {
        if (
            currentUser?.uid !== reviewId &&
            !isAdmin
        ) {
            return;
        }


        const result = await Swal.fire({
            icon: "warning",
            title: "Видалити відгук?",
            html: `
        <div style="margin-top:8px">
            Цей відгук буде назавжди видалено.
            <div style="margin-top:8px; color:#dc2626">
                Цю дію неможливо скасувати.
            </div>
        </div>
    `,
            showCancelButton: true,
            confirmButtonText: "Видалити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
            focusCancel: true,
        });


        if (!result.isConfirmed) return;

        setDeletingId(reviewId);

        try {
            await deleteDoc(
                doc(
                    db,
                    "publicProfiles",
                    profileUid,
                    "reviews",
                    reviewId
                )
            );

            if (reviewId === currentUser?.uid) {
                setOwnReviewExists(false);
            }

            await loadReviews();
            onReviewsChanged?.();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Відгук видалено",
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Помилка видалення:", err);

            Swal.fire({
                icon: "error",
                title: "Не вдалося видалити відгук",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const addEmoji = (emoji) => {
        const textarea = textareaRef.current;

        const start =
            textarea?.selectionStart ?? message.length;

        const end =
            textarea?.selectionEnd ?? message.length;

        const next =
            message.slice(0, start) +
            emoji +
            message.slice(end);

        if (getLength(next) > MAX_LENGTH) return;

        setMessage(next);

        const nextCursor = start + emoji.length;

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();

                textareaRef.current.setSelectionRange(
                    nextCursor,
                    nextCursor
                );
            }
        });
    };

    const handleReportReview = (review) => {
        // Скаржитися може лише власник профілю
        if (
            !currentUser ||
            !isOwner ||
            currentUser.uid !== profileUid ||
            review.id === currentUser.uid
        ) {
            return;
        }

        const reviewerName =
            review.reviewer?.login || "Користувач RBoard";

        const reviewerUid = review.id;

        const reviewDate = formatDate(review.createdAt);

        const reviewText = review.text || "";

        const complaintText = [
            "Скарга на відгук у моєму профілі RBoard.",
            "",
            "Прошу адміністрацію перевірити та, у разі порушення правил сайту, видалити наведений нижче відгук.",
            "",
            `Автор відгуку: ${reviewerName}`,
            `Оцінка: ${review.rating}/5`,
            `Дата відгуку: ${reviewDate}`,
            "",
            "Текст відгуку:",
            `«${reviewText}»`,
            "",
            "Прошу розглянути моє звернення.",
        ].join("\n");

        navigate("/contacts", {
            state: {
                reviewComplaint: {
                    reporterUid: currentUser.uid,
                    name: profile?.login || "",
                    phone: profile?.phone || "",
                    type: "Інше",
                    message: complaintText,
                    profileUid,
                    reviewId: reviewerUid,
                },
            },
        });
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-base font-medium text-slate-900 sm:text-lg">
                <MessageSquareText
                    className="h-[18px] w-[18px] shrink-0 text-blue-600 sm:h-[21px] sm:w-[21px]"
                />
                Відгуки користувача
            </h2>



            {currentUser &&
                !isOwner &&
                !isAdmin &&
                !checkingPermissions &&
                !ownReviewExists && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800">
                                Залишити відгук
                            </p>

                            <span className="text-xs text-slate-400">
                                Оцініть користувача
                            </span>
                        </div>

                        <div className="mt-3">
                            <StarRating
                                value={rating}
                                onChange={setRating}
                                interactive
                            />
                        </div>

                        <div className="relative mt-3">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        limitText(event.target.value)
                                    )
                                }
                                maxLength={350}
                                rows={3}
                                placeholder="Ваші враження про користувача (необов'язково)..."
                                className="block min-h-[105px] w-full resize-none rounded-xl border border-slate-200 bg-white pl-3 pr-12 pb-9 pt-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            <div
                                ref={emojiRef}
                                className="absolute right-2 top-2 z-20"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEmojiOpen((previous) => !previous)
                                    }
                                    aria-label="Додати емоджі"
                                    title="Додати емоджі"
                                    aria-expanded={emojiOpen}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${emojiOpen
                                        ? "bg-blue-100 text-blue-600"
                                        : "text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                        }`}
                                >
                                    <Smile size={20} />
                                </button>

                                {emojiOpen && (
                                    <div className="absolute right-0 top-full z-30 mt-2 w-[min(300px,calc(100vw-65px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                                            <span className="text-xs font-semibold text-slate-700">
                                                Оберіть емоджі
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => setEmojiOpen(false)}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                aria-label="Закрити емоджі"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-1 border-b border-slate-100 p-2">
                                            {EMOJI_GROUPS.map((group, index) => (
                                                <button
                                                    key={group.name}
                                                    type="button"
                                                    onClick={() => setEmojiGroup(index)}
                                                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${emojiGroup === index
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "text-slate-500 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {group.name}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid max-h-44 grid-cols-6 gap-1 overflow-y-auto p-2">
                                            {EMOJI_GROUPS[emojiGroup].emojis.map(
                                                (emoji, index) => (
                                                    <button
                                                        key={`${emoji}-${index}`}
                                                        type="button"
                                                        onClick={() => addEmoji(emoji)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:scale-110 hover:bg-blue-50"
                                                        title={emoji}
                                                        aria-label={`Додати ${emoji}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <span className="absolute bottom-4 right-3 text-[11px] text-slate-400">
                                {getLength(message)}/{MAX_LENGTH}
                            </span>
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={publishReview}
                                disabled={
                                    saving ||
                                    getLength(message.trim()) > MAX_LENGTH
                                }
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Send
                                        size={14}
                                        className="sm:h-4 sm:w-4"
                                    />
                                )}

                                {message.trim()
                                    ? "Опублікувати відгук"
                                    : "Опублікувати оцінку"}
                            </button>
                        </div>
                    </div>
                )}

            {currentUser &&
                !isOwner &&
                checkingPermissions && (
                    <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                        <LoaderCircle
                            size={15}
                            className="animate-spin"
                        />
                        Перевірка можливості залишити відгук...
                    </div>
                )}

            {currentUser &&
                !isOwner &&
                !checkingPermissions &&
                ownReviewExists && (
                    <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                        Ви вже залишили відгук цьому користувачу.
                    </p>
                )}

            <div className={reviews.length > 0 ? "mt-6 space-y-4" : ""}>
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <LoaderCircle
                            size={18}
                            className="animate-spin text-blue-600"
                        />
                        Завантаження відгуків...
                    </div>
                ) : error ? (
                    <p className="mt-4 text-sm text-red-600">
                        {error}
                    </p>
                ) : reviews.length === 0 ? (
                    !currentUser ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            Поки немає відгуків. Станьте першим!
                        </div>
                    ) : null
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                        >

                            <div className="flex items-start gap-3">
                                <Link
                                    to={getReviewerProfileUrl(review.id)}
                                    title="Переглянути профіль автора відгуку"
                                    className="group/avatar flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-2 ring-transparent transition hover:ring-blue-200"
                                >
                                    {review.reviewer?.avatarUrl ? (
                                        <img
                                            src={review.reviewer.avatarUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound
                                            size={20}
                                            className="text-blue-400"
                                        />
                                    )}
                                </Link>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Link
                                            to={getReviewerProfileUrl(review.id)}
                                            title="Переглянути профіль автора відгуку"
                                            className="break-words text-sm font-semibold text-slate-900 transition hover:text-blue-600 hover:underline hover:underline-offset-4"
                                        >
                                            {review.reviewer?.login ||
                                                "Користувач RBoard"}
                                        </Link>




                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="mr-1 whitespace-nowrap text-xs font-medium text-slate-500">
                                                {formatDate(review.createdAt)}
                                            </span>

                                            {isOwner &&
                                                currentUser?.uid === profileUid &&
                                                review.id !== currentUser.uid && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReportReview(review)}
                                                        title="Поскаржитися на відгук"
                                                        aria-label="Поскаржитися на відгук"
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 active:scale-95"
                                                    >
                                                        <Flag size={19} strokeWidth={1.8} />
                                                    </button>
                                                )}

                                            {(currentUser?.uid === review.id || isAdmin) && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeReview(review.id)}
                                                    disabled={deletingId === review.id}
                                                    title="Видалити відгук"
                                                    aria-label="Видалити відгук"
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingId === review.id ? (
                                                        <LoaderCircle
                                                            size={19}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={19} strokeWidth={1.8} />
                                                    )}
                                                </button>
                                            )}
                                        </div>


                                    </div>

                                    <div className="mt-1">
                                        <StarRating value={review.rating} />
                                    </div>

                                    {review.text?.trim() && (
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                            {review.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {hasMore && !loading && (
                <div className="mt-5 flex justify-center">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <ChevronDown size={16} />
                        )}

                        Завантажити ще
                    </button>
                </div>
            )}
        </section>
    );
}
