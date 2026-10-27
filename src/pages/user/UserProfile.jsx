
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
    collection,
    count,
    doc,
    getAggregateFromServer,
    getDoc,
    sum,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import {
    UserRound,
    MapPin,
    CalendarDays,
    Pencil,
    LoaderCircle,
    ArrowLeft,
    Star,
    MessageSquareText,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProfileEditor from "../../components/profile/ProfileEditor";
import ProfileContacts from "../../components/profile/ProfileContacts";
import ProfileListings from "../../components/profile/ProfileListings";
import ProfileListingStats from "../../components/profile/ProfileListingStats";
import ProfileReviews from "../../components/profile/ProfileReviews";
import { auth, db } from "../../firebase";
import useUserPresence from "../../hooks/useUserPresence";
export default function UserProfile({
    adminView = false,
}) {
    const { uid } = useParams();

    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);

    const [profile, setProfile] = useState(null);
    const [reviewsVersion, setReviewsVersion] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [reviewStats, setReviewStats] = useState({
        count: 0,
        average: 0,
        loading: true,
    });
    const profileUid = uid || currentUser?.uid || null;
    const presence = useUserPresence(profileUid);
    const isOwner = Boolean(
        currentUser &&
        profileUid === currentUser.uid
    );

    useEffect(() => {
        if (!profileUid) return;

        let active = true;

        const loadReviewStats = async () => {
            setReviewStats({
                count: 0,
                average: 0,
                loading: true,
            });

            try {
                const reviewsCollection = collection(
                    db,
                    "publicProfiles",
                    profileUid,
                    "reviews"
                );

                const snapshot = await getAggregateFromServer(
                    reviewsCollection,
                    {
                        reviewCount: count(),
                        ratingSum: sum("rating"),
                    }
                );

                if (!active) return;

                const data = snapshot.data();

                const reviewCount = data.reviewCount || 0;
                const ratingSum = data.ratingSum || 0;

                const average =
                    reviewCount > 0
                        ? ratingSum / reviewCount
                        : 0;

                setReviewStats({
                    count: reviewCount,
                    average,
                    loading: false,
                });
            } catch (error) {
                console.error(
                    "Помилка завантаження рейтингу:",
                    error
                );

                if (active) {
                    setReviewStats({
                        count: 0,
                        average: 0,
                        loading: false,
                    });
                }
            }
        };

        loadReviewStats();

        return () => {
            active = false;
        };
    }, [profileUid, reviewsVersion]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                setCurrentUser(user);
                setAuthLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!profileUid) {
            setProfile(null);
            setProfileLoading(false);
            setError("Увійдіть, щоб переглянути свій профіль.");
            return;
        }

        let active = true;

        const loadProfile = async () => {
            setProfileLoading(true);
            setError("");
            setProfile(null);

            try {
                // Власник читає власний документ.
                // Відвідувач читає лише publicProfiles.
                const collectionName = isOwner
                    ? "users"
                    : "publicProfiles";

                const snapshot = await getDoc(
                    doc(db, collectionName, profileUid)
                );

                if (!active) return;

                if (!snapshot.exists()) {
                    setError("Профіль користувача не знайдено.");
                    return;
                }

                setProfile({
                    uid: profileUid,
                    ...snapshot.data(),
                });
            } catch (err) {
                console.error("Помилка профілю:", err);

                if (active) {
                    setError("Не вдалося завантажити профіль.");
                }
            } finally {
                if (active) {
                    setProfileLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            active = false;
        };
    }, [profileUid, authLoading, isOwner]);

    const loading = authLoading || profileLoading;

    const getJoinedDate = (value) => {
        const date = value?.toDate?.();

        if (!date) return null;

        return date.toLocaleDateString("uk-UA", {
            month: "long",
            year: "numeric",
        });
    };

    const getDaysOnRBoard = (value) => {
        if (!value) return null;

        const date =
            value?.toDate?.() ||
            (value instanceof Date
                ? value
                : new Date(value));

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const now = new Date();

        const startDay = Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const today = Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        return Math.max(
            0,
            Math.floor(
                (today - startDay) / 86400000
            )
        );
    };

    const cityName =
        typeof profile?.city === "string"
            ? profile.city
            : profile?.city?.name || "";

    const showCity = !profile?.privacy?.hideCity;

    const handleProfileSaved = async () => {
        try {
            const user = auth.currentUser;

            if (!user || user.uid !== profileUid) return;

            const snapshot = await getDoc(
                doc(db, "users", user.uid)
            );

            if (snapshot.exists()) {
                setProfile({
                    uid: user.uid,
                    ...snapshot.data(),
                });
            }

            setIsEditing(false);
        } catch (error) {
            console.error(
                "Не вдалося оновити відображення профілю:",
                error
            );
        }
    };

    return (
        <div
            className={
                adminView
                    ? "w-full"
                    : "flex min-h-screen flex-col bg-slate-100"
            }
        >
            {!adminView && <Navbar />}

            <main className="flex-1">
                <div
                    className={
                        adminView
                            ? "mx-auto max-w-6xl py-2"
                            : "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10"
                    }
                >

                    {loading ? (
                        <div className="flex min-h-80 items-center justify-center">
                            <LoaderCircle
                                className="animate-spin text-blue-600"
                                size={28}
                            />
                        </div>

                    ) : error ? (
                        <div className="flex min-h-[65vh] items-center justify-center">
                            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">

                                {/* Іконка */}
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 ring-1 ring-blue-100">
                                    <UserRound
                                        size={38}
                                        strokeWidth={1.8}
                                        className="text-blue-600"
                                    />
                                </div>

                                {/* Заголовок */}
                                <h1 className="mt-6 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                                    {error === "Увійдіть, щоб переглянути свій профіль."
                                        ? "Потрібна авторизація"
                                        : "Не вдалося відкрити профіль"}
                                </h1>

                                {/* Опис */}
                                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                                    {error === "Увійдіть, щоб переглянути свій профіль."
                                        ? "Увійдіть у свій акаунт RBoard, щоб переглядати та редагувати особистий профіль."
                                        : error}
                                </p>

                                {/* Кнопка */}
                                <Link
                                    to="/"
                                    className="mx-auto mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] sm:w-auto"
                                >
                                    <ArrowLeft size={18} />
                                    На головну
                                </Link>

                            </div>
                        </div>
                    ) : (

                        <div className="space-y-6">
                            {!isEditing && (
                                <>
                                    {/* Основна інформація */}
                                    <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                                        {isOwner && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition duration-200 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700 active:scale-95 sm:right-6 sm:top-6"
                                                aria-label="Редагувати профіль"
                                                title="Редагувати профіль"
                                            >
                                                <Pencil size={21} strokeWidth={2} />
                                            </button>
                                        )}
                                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

                                            <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-blue-50 bg-slate-100 sm:mx-0 sm:h-32 sm:w-32">

                                                {profile.avatarUrl ? (
                                                    <img
                                                        src={profile.avatarUrl}
                                                        alt="Фото профілю"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserRound
                                                        size={52}
                                                        className="text-slate-400"
                                                    />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1 text-center sm:text-left">
                                                <h1 className="break-words text-2xl font-black text-slate-950 sm:text-3xl">
                                                    {profile.login || "Користувач RBoard"}
                                                </h1>

                                                <div className="mt-2 flex justify-center sm:justify-start">
                                                    <span
                                                        className={`inline-flex items-center gap-2 text-xs font-semibold ${presence.online
                                                            ? "text-emerald-600"
                                                            : presence.text === "Перевірка статусу..."
                                                                ? "text-slate-400"
                                                                : "text-red-500"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`h-2 w-2 shrink-0 rounded-full ${presence.online
                                                                ? "bg-emerald-500"
                                                                : presence.text === "Перевірка статусу..."
                                                                    ? "bg-slate-300"
                                                                    : "bg-red-400"
                                                                }`}
                                                        />

                                                        {presence.text}
                                                    </span>
                                                </div>

                                                {cityName && showCity && (
                                                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                                                        <MapPin size={17} />
                                                        <span>{cityName}</span>
                                                    </div>
                                                )}

                                                {getJoinedDate(profile.createdAt) && (


                                                    <div className="mt-3 flex flex-col items-center gap-1.5 text-sm text-slate-400 sm:mt-2 sm:flex-row sm:justify-start sm:gap-2">
                                                        {/* Мобільна версія */}
                                                        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:hidden">
                                                            <CalendarDays size={15} className="shrink-0 text-slate-400" />

                                                            <span className="text-xs font-medium text-slate-500">
                                                                На RBoard з {getJoinedDate(profile.createdAt)}
                                                            </span>

                                                            {getDaysOnRBoard(profile.createdAt) !== null && (
                                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                                                                    {getDaysOnRBoard(profile.createdAt)} дн.
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Версія для планшетів і комп'ютерів */}
                                                        <div className="hidden items-center gap-2 sm:flex">
                                                            <CalendarDays size={16} className="shrink-0" />

                                                            <span>
                                                                Реєстрація на платформі:{" "}
                                                                {getJoinedDate(profile.createdAt)}

                                                                {getDaysOnRBoard(profile.createdAt) !== null && (
                                                                    <>
                                                                        {" "}(
                                                                        <span className="text-blue-600">
                                                                            {getDaysOnRBoard(profile.createdAt)} дн.
                                                                        </span>
                                                                        )
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>


                                                )}


                                                {/* Рейтинг користувача */}
                                                <div className="mt-3 flex flex-col items-center gap-2 text-sm text-slate-400 sm:items-start">

                                                    {/* Середній рейтинг */}
                                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                                        <Star
                                                            size={16}
                                                            className="shrink-0 text-slate-400"
                                                        />

                                                        <span>Рейтинг:</span>

                                                        {reviewStats.loading ? (
                                                            <span className="text-xs text-slate-400">
                                                                Завантаження...
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                                        const fillPercent = Math.max(
                                                                            0,
                                                                            Math.min(
                                                                                100,
                                                                                (reviewStats.average - (star - 1)) * 100
                                                                            )
                                                                        );

                                                                        return (
                                                                            <div
                                                                                key={star}
                                                                                className="relative h-[17px] w-[17px]"
                                                                            >
                                                                                <Star
                                                                                    size={17}
                                                                                    className="fill-slate-100 text-slate-300"
                                                                                />

                                                                                <div
                                                                                    className="absolute inset-0 overflow-hidden"
                                                                                    style={{
                                                                                        width: `${fillPercent}%`,
                                                                                    }}
                                                                                >
                                                                                    <Star
                                                                                        size={17}
                                                                                        className="min-w-[17px] fill-amber-400 text-amber-400"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <span className="font-medium text-blue-600">
                                                                    {reviewStats.average
                                                                        .toFixed(1)
                                                                        .replace(".", ",")}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Кількість відгуків */}
                                                    {!reviewStats.loading && (
                                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                                            <MessageSquareText
                                                                size={16}
                                                                className="shrink-0 text-slate-400"
                                                            />

                                                            <span>
                                                                Кількість відгуків:{" "}
                                                                <span className="font-medium text-blue-600">
                                                                    {reviewStats.count}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>


                                                {/* Статистика оголошень користувача */}
                                                <ProfileListingStats
                                                    profileUid={profileUid}
                                                    isOwner={isOwner}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Інформація про користувача */}

                                    {profile.bio && (
                                        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                                            <h2 className="flex items-center gap-2 text-base font-medium text-slate-900 sm:text-lg">
                                                <UserRound
                                                    className="h-[18px] w-[18px] shrink-0 text-blue-600 sm:h-[21px] sm:w-[21px]"
                                                />
                                                Про мене
                                            </h2>

                                            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                                                {profile.bio}
                                            </p>
                                        </section>
                                    )}

                                    {/* Оголошення користувача */}
                                    <ProfileListings profileUid={profileUid} />
                                    <ProfileContacts
                                        profile={
                                            isOwner
                                                ? {
                                                    ...profile,
                                                    city: profile.privacy?.hideCity
                                                        ? ""
                                                        : profile.city,
                                                    phone: profile.privacy?.hidePhone
                                                        ? ""
                                                        : profile.phone,
                                                    additionalContacts:
                                                        profile.privacy?.hideContacts
                                                            ? {}
                                                            : Object.fromEntries(
                                                                Object.entries(
                                                                    profile.additionalContacts || {}
                                                                ).map(([key, value]) => [
                                                                    key,
                                                                    typeof value === "string"
                                                                        ? value
                                                                        : value?.enabled
                                                                            ? value.value || ""
                                                                            : "",
                                                                ])
                                                            ),
                                                }
                                                : profile
                                        }
                                    />

                                    <ProfileReviews
                                        profileUid={profileUid}
                                        currentUser={currentUser}
                                        isOwner={isOwner}
                                        profile={profile}
                                        onReviewsChanged={() =>
                                            setReviewsVersion((previous) => previous + 1)
                                        }
                                    />

                                </>
                            )}

                            {isOwner && isEditing && (
                                <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-8">
                                    <ProfileEditor
                                        profile={profile}
                                        onSaved={handleProfileSaved}
                                        onCancel={() => setIsEditing(false)}
                                    />
                                </section>
                            )}

                        </div>
                    )}

                </div>
            </main>

            {!adminView && <Footer />}
        </div>
    );
}
