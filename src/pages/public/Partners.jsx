
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Megaphone,
  Palette,
  Rocket,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";

const benefits = [
  {
    icon: Rocket,
    title: "Пріоритетне розміщення",
    description:
      "Оголошення партнерів отримують пріоритетне представлення серед пропозицій на RBoard, допомагаючи привертати більше уваги.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Palette,
    title: "Унікальний дизайн",
    description:
      "Спеціальний стиль карток і сторінок деталей оголошень, який допомагає виділити ваші пропозиції.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Store,
    title: "Власний розділ у профілі",
    description:
      "Окрема сторінка ваших пропозицій у профілі зі зручним переглядом, пошуком і фільтрацією.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Megaphone,
    title: "Просування бізнесу",
    description:
      "Можливість поширення інформації про ваш бізнес, товари та послуги в соціальних мережах RBoard.",
    color: "bg-amber-50 text-amber-600",
  },
];

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPartners = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "users"),
            where("partner", "==", true)
          )
        );

        if (!active) return;

        const items = snapshot.docs
          .map((document) => ({
            uid: document.id,
            ...document.data(),
          }))
          .filter(
            (user) =>
              user.role === "user" &&
              user.blocked !== true
          )
          .sort((a, b) =>
            (a.login || "").localeCompare(
              b.login || "",
              "uk"
            )
          );

        setPartners(items);
      } catch (err) {
        if (!active) return;

        console.error(
          "Помилка завантаження партнерів:",
          err
        );

        setError(
          "Не вдалося завантажити список партнерів."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPartners();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">

        {/* Головний банер */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white sm:text-sm">
                <BadgeCheck size={17} />
                Партнерська програма RBoard
              </span>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-5xl sm:leading-tight">
                Розвивайте свій бізнес разом із RBoard
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
                Розповідайте про свої товари та послуги
                жителям Рахова й Рахівського району.
                Отримуйте додаткові можливості для
                представлення та просування бізнесу.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/contacts"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
                >
                  Стати партнером
                  <ArrowRight size={17} />
                </Link>

                <a
                  href="#benefits"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Дізнатися більше
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Переваги */}
        <section
          id="benefits"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Можливості для бізнесу
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Що дає партнерство з нами?
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Спеціальні можливості, які допоможуть
              зробити ваш бізнес помітнішим на RBoard.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:rounded-3xl sm:p-8"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${benefit.color}`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950 sm:text-xl">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Список партнерів */}
        <section
          id="partners-list"
          className="border-y border-slate-200 bg-white py-14 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Співпраця з RBoard
              </span>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Наші партнери
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Познайомтеся з партнерами RBoard.
                Переглядайте їхні профілі, товари
                та пропозиції.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Завантаження партнерів...
                </p>
              </div>
            ) : error ? (
              <div className="mt-10 rounded-2xl border border-red-100 bg-red-50 px-5 py-6 text-center text-sm text-red-600">
                {error}
              </div>
            ) : partners.length === 0 ? (
              <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <Users
                  size={36}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  Інформація про партнерів поки відсутня
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <Link
                    key={partner.uid}
                    to={`/user/${partner.uid}`}
                    className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-blue-50 sm:h-20 sm:w-20">
                        {partner.avatarUrl ? (
                          <img
                            src={partner.avatarUrl}
                            alt={partner.login || "Партнер"}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound
                            size={30}
                            className="text-blue-400"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          <BadgeCheck size={13} />
                          Партнер RBoard
                        </span>

                        <h3 className="mt-2 break-words text-base font-black text-slate-950 transition group-hover:text-blue-600 sm:text-lg">
                          {partner.login || "Без імені"}
                        </h3>
                      </div>
                    </div>

                    {partner.bio?.trim() && (
                      <p className="mt-5 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                        {partner.bio}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="text-xs font-semibold text-slate-500">
                        Переглянути профіль
                      </span>

                      <ArrowRight
                        size={18}
                        className="text-blue-600 transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Заклик до співпраці */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Building2 size={27} />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Хочете стати партнером RBoard?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Маєте власний бізнес або надаєте послуги?
              Зв'яжіться з нами, щоб обговорити умови
              співпраці та можливості просування.
            </p>

            <Link
              to="/contacts"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Зв'язатися з нами
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partners;
