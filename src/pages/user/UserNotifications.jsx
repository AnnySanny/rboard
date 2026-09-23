import {
    useEffect,
    useState,
} from "react";

import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import { Mail } from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import UserNotificationCard from "../../components/UserNotificationCard";

import { db } from "../../firebase";


const UserNotifications = () => {
    const [
        notifications,
        setNotifications,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadError,
        setLoadError,
    ] = useState("");


    useEffect(() => {
        const notificationsQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const unsubscribe =
            onSnapshot(
                notificationsQuery,

                (snapshot) => {
                    const receivedNotifications =
                        snapshot.docs
                            .map(
                                (
                                    notificationDocument
                                ) => ({
                                    id:
                                        notificationDocument.id,

                                    ...notificationDocument.data(),
                                })
                            )
                            .filter(
                                Boolean
                            );

                    setNotifications(
                        receivedNotifications
                    );

                    setLoading(false);

                    setLoadError("");
                },

                (error) => {
                    console.error(
                        "Помилка завантаження повідомлень:",
                        error
                    );

                    setLoadError(
                        "Не вдалося завантажити повідомлення."
                    );

                    setLoading(false);
                }
            );

        return () => {
            unsubscribe();
        };
    }, []);


    return (
        <div className="min-h-screen bg-slate-50">

            <Navbar />

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                                RBoard
                            </p>

                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                                Повідомлення
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                                Важливі повідомлення та
                                оновлення від RBoard.
                            </p>

                        </div>


                        {!loading &&
                            !loadError && (
                                <div className="shrink-0 rounded-2xl bg-slate-100 px-4 py-3">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Усього
                                    </p>

                                    <p className="mt-1 text-2xl font-black text-slate-950">
                                        {
                                            notifications.length
                                        }
                                    </p>

                                </div>
                            )}

                    </div>

                </section>


                {loading && (
                    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                        <p className="mt-4 text-sm font-medium text-slate-500">
                            Завантаження повідомлень...
                        </p>

                    </section>
                )}


                {!loading &&
                    loadError && (
                        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">

                            <p className="text-sm font-semibold text-red-700">
                                {loadError}
                            </p>

                        </section>
                    )}


                {!loading &&
                    !loadError &&
                    notifications.length ===
                        0 && (
                        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                <Mail className="h-6 w-6 text-slate-400" />
                            </div>

                            <h2 className="mt-4 text-lg font-black text-slate-950">
                                Повідомлень поки немає
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Нові повідомлення від
                                RBoard з’являться на цій
                                сторінці.
                            </p>

                        </section>
                    )}


                {!loading &&
                    !loadError &&
                    notifications.length >
                        0 && (
                        <section className="mt-6">

                            <div className="space-y-3">

                                {notifications.map(
                                    (
                                        notification
                                    ) => (
                                        <UserNotificationCard
                                            key={
                                                notification.id
                                            }
                                            notification={
                                                notification
                                            }
                                        />
                                    )
                                )}

                            </div>

                        </section>
                    )}

            </main>

            <Footer />

        </div>
    );
};


export default UserNotifications;