import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const UserProfile = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                            Особистий кабінет
                        </span>

                        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Мій профіль
                        </h1>

                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            Тут далі дамо можливість налаштовувати вигляд, видаляти профіль, і так далі.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserProfile;