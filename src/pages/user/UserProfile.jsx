
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import {
    UserRound,
    MapPin,
    CalendarDays,
    Pencil,
    Settings,
    LoaderCircle,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProfileEditor from "../../components/profile/ProfileEditor";
import ProfileContacts from "../../components/profile/ProfileContacts";
import { auth, db } from "../../firebase";

export default function UserProfile() {
    const { uid } = useParams();

    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");

    const profileUid = uid || currentUser?.uid || null;

    const isOwner = Boolean(
        currentUser &&
        profileUid === currentUser.uid
    );

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

    const cityName =
        typeof profile?.city === "string"
            ? profile.city
            : profile?.city?.name || "";

    const showCity =
        isOwner ||
        !profile?.privacy?.hideCity;

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
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">

                    {loading ? (
                        <div className="flex min-h-80 items-center justify-center">
                            <LoaderCircle
                                className="animate-spin text-blue-600"
                                size={28}
                            />
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <UserRound
                                className="mx-auto mb-4 text-slate-400"
                                size={36}
                            />

                            <h1 className="text-xl font-bold text-slate-900">
                                {error}
                            </h1>

                            <Link
                                to="/"
                                className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:underline"
                            >
                                На головну
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Основна інформація */}
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

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

                                        {cityName && showCity && (
                                            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                                                <MapPin size={17} />
                                                <span>{cityName}</span>
                                            </div>
                                        )}

                                        {getJoinedDate(profile.createdAt) && (
                                            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
                                                <CalendarDays size={16} />
                                                <span>
                                                    На RBoard з {getJoinedDate(profile.createdAt)}
                                                </span>
                                            </div>
                                        )}

                                        {isOwner && (
                                            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">

                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                                                >
                                                    <Pencil size={16} />
                                                    Редагувати профіль
                                                </button>

                                                <Link
                                                    to="/user/settings"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                                >
                                                    <Settings size={17} />
                                                    Налаштування
                                                </Link>

                                            </div>
                                        )}

                                    </div>
                                </div>
                            </section>

                            {/* Інформація про користувача */}
                            {profile.bio && (
                                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                                    <h2 className="text-lg font-black text-slate-950">
                                        Про мене
                                    </h2>

                                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                                        {profile.bio}
                                    </p>
                                </section>
                            )}

                            {!isEditing && (
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
                            )}

                            {/* Наступні компоненти:
                  ProfileEditor
                  ProfileContacts
                  ProfileListings
              */}


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

            <Footer />
        </div>
    );
}
