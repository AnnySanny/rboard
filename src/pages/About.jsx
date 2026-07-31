import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import backgroundImage from "../image/background.png";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Головний блок із паралакс-ефектом */}
        <section
          className="relative flex min-h-[500px] items-center justify-center bg-cover bg-center bg-no-repeat md:bg-fixed"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          {/* Затемнення фотографії */}
          <div className="absolute inset-0 bg-slate-950/50" />

          {/* Легкий градієнт знизу */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/40" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
              Про нас
            </h1>

            <p className="mx-auto mt-7 max-w-4xl text-xl font-medium leading-9 text-white sm:text-2xl sm:leading-10 md:text-3xl md:leading-[1.4]">
              Локальний сервіс оголошень для жителів Рахова та
              Рахівського району
            </p>
          </div>
        </section>

        {/* Про сервіс */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Про сервіс
              </span>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Усе необхідне — у вашому місті та поруч
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                RBoard — це локальна дошка оголошень, створена для
                жителів Рахова та Рахівського району. Тут можна швидко
                знайти актуальні пропозиції, товари, послуги, житло в
                оренду та інші корисні оголошення.
              </p>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Сервіс допомагає знаходити потрібне неподалік, напряму
                зв’язуватися з авторами оголошень і пропонувати власні
                товари або послуги місцевим жителям.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-7 shadow-sm sm:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  Знаходьте потрібні пропозиції
                </h3>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Використовуйте пошук і категорії, щоб швидко знаходити
                  актуальні оголошення в Рахові та населених пунктах
                  району.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  Додавайте оголошення
                </h3>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Розміщуйте власні товари, послуги та інші пропозиції
                  для жителів вашого району.
                </p>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  Локальні пропозиції
                </h3>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Оголошення орієнтовані саме на Рахів і населені пункти
                  Рахівського району.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Обмеження без реєстрації */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
              <div className="grid items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.7fr] lg:px-14 lg:py-14">
                <div>
                  <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                    Розміщення оголошень
                  </span>

                  <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    До трьох оголошень без реєстрації
                  </h2>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                    Користувачі без облікового запису можуть 
                    опублікувати до трьох оголошень протягом одного
                    тижня.
                  </p>

                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                    Після досягнення цього обмеження для розміщення нових
                    оголошень потрібно буде зареєструватися або
                    дочекатися початку нового тижневого періоду.
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg shadow-blue-100/50">
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-black tracking-tight text-blue-600">
                      3
                    </span>

                    <span className="pb-3 text-xl font-bold text-slate-800">
                      оголошення
                    </span>
                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-blue-100">
                    <div className="h-full w-full rounded-full bg-blue-600" />
                  </div>

                  <p className="mt-5 text-base leading-7 text-slate-600">
                    Максимальна кількість публікацій без реєстрації
                    протягом одного тижня.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Як це працює */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Як це працює
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white">
                1
              </span>

              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Знайдіть оголошення
              </h3>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Введіть назву потрібного товару або послуги та оберіть
                відповідну категорію.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white">
                2
              </span>

              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Перегляньте пропозицію
              </h3>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Ознайомтеся з описом, місцем розташування та контактною
                інформацією автора.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white">
                3
              </span>

              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Додайте своє
              </h3>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Створіть власне оголошення та запропонуйте товар або
                послугу жителям Рахова та району.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;