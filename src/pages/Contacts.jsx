import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Contacts = () => {
  const [formData, setFormData] = useState({
    contact: "",
    name: "",
    type: "Пропозиція",
    comment: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Поки що форма працює лише як макет.
    console.log("Дані форми:", formData);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Заголовок сторінки */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Зворотний зв’язок
            </span>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Контакти
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Напишіть нам, якщо маєте пропозицію, помітили проблему в
              роботі сайту або хочете поставити запитання.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
            {/* Контактна інформація */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-7 sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      width="20"
                      height="16"
                      x="2"
                      y="4"
                      rx="2"
                    />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>

                <h2 className="mt-6 text-2xl font-black text-slate-950">
                  Електронна пошта
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Ви також можете зв’язатися з нами безпосередньо через
                  електронну пошту.
                </p>

                <a
                  href="mailto:rboard@example.com"
                  className="mt-5 inline-flex items-center gap-2 text-lg font-bold text-blue-600 transition hover:text-blue-700"
                >
                  rboard@example.com

                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </a>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-slate-950">
                  Коли варто написати?
                </h2>

                <div className="mt-6 space-y-5">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Маєте пропозицію
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Поділіться ідеєю щодо розвитку або покращення
                        сервісу.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Виникла проблема
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Повідомте про помилку або неправильну роботу
                        сайту.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
                        <path d="M12 18h.01" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Маєте запитання
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Напишіть нам з будь-якого іншого питання щодо
                        роботи RBoard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Форма */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Напишіть нам
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Заповніть форму, і ми зможемо зв’язатися з вами після
                  обробки повідомлення.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="contact"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Номер телефону або електронна пошта
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="+380... або example@email.com"
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Ваше ім’я
                    <span className="ml-2 font-normal text-slate-400">
                      необов’язково
                    </span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Як до вас звертатися?"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Тип звернення
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="Пропозиція">Пропозиція</option>
                      <option value="Проблеми з сайтом">
                        Проблеми з сайтом
                      </option>
                      <option value="Інше">Інше</option>
                    </select>

                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Коментар
                    <span className="ml-2 font-normal text-slate-400">
                      необов’язково
                    </span>
                  </label>

                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Опишіть вашу пропозицію або проблему..."
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99]"
                >
                  Відправити

                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>

                <p className="text-center text-sm leading-6 text-slate-400">
                  Форма поки що є демонстраційним макетом. Надсилання
                  повідомлень буде реалізовано пізніше.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contacts;