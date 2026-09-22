import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import backgroundImage from "../image/background.png";
import backgroundAutumn from "../image/background-autumn.png";
import backgroundWinter from "../image/background-winter.png";


const getSeasonBackground = () => {
  const month = new Date().getMonth();

  if (month >= 8 && month <= 10) {
    return backgroundAutumn;
  }

  if (month === 11 || month <= 1) {
    return backgroundWinter;
  }

  return backgroundImage;
};


const About = () => {
  const seasonBackground = getSeasonBackground();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative flex min-h-[360px] items-center justify-center bg-cover bg-center bg-no-repeat sm:min-h-[430px] md:min-h-[500px] md:bg-fixed"
          style={{
            backgroundImage: `url(${seasonBackground})`,
          }}
        >
          <div className="absolute inset-0 bg-slate-950/50" />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/40" />

          <div className="relative z-10 mx-auto max-w-5xl px-5 text-center sm:px-6">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
              Про нас
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-lg font-medium leading-8 text-white sm:mt-7 sm:text-2xl sm:leading-10 md:text-3xl md:leading-[1.4]">
              Локальний сервіс оголошень для жителів Рахова та
              Рахівського району
            </p>
          </div>
        </section>


        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
                Про сервіс
              </span>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Усе необхідне — у вашому місті та поруч
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
                RBoard — це локальна дошка оголошень, створена для
                жителів Рахова та Рахівського району. Тут можна швидко
                знайти актуальні пропозиції, товари, послуги, житло в
                оренду та інші корисні оголошення.
              </p>

              <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
                Сервіс допомагає знаходити потрібне неподалік, напряму
                зв’язуватися з авторами оголошень і пропонувати власні
                товари або послуги місцевим жителям.
              </p>
            </div>


            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:col-span-2 sm:rounded-3xl sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-12 sm:w-12 sm:rounded-2xl">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-950 sm:mt-5 sm:text-xl">
                  Знаходьте потрібні пропозиції
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                  Використовуйте пошук і категорії, щоб швидко знаходити
                  актуальні оголошення в Рахові та населених пунктах
                  району.
                </p>
              </div>


              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-950 sm:mt-5 sm:text-xl">
                  Додавайте оголошення
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                  Розміщуйте власні товари, послуги та інші пропозиції
                  для жителів вашого району.
                </p>
              </div>


              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-950 sm:mt-5 sm:text-xl">
                  Локальні пропозиції
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                  Оголошення орієнтовані саме на Рахів і населені пункти
                  Рахівського району.
                </p>
              </div>
            </div>
          </div>
        </section>


        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">

            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm sm:rounded-[32px]">
              <div className="grid items-center gap-6 px-5 py-7 sm:gap-10 sm:px-10 sm:py-10 lg:grid-cols-[1fr_0.7fr] lg:px-14 lg:py-14">
                <div>
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 sm:px-4 sm:py-2 sm:text-sm">
                    Розміщення оголошень
                  </span>

                  <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:mt-5 sm:text-4xl">
                    До трьох оголошень без реєстрації
                  </h2>

                  <p className="mt-4 text-base leading-7 text-slate-600 sm:mt-5 sm:max-w-2xl sm:text-lg sm:leading-8">
                    Користувачі без облікового запису можуть
                    опублікувати до трьох оголошень протягом одного
                    тижня.
                  </p>

                  <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:max-w-2xl sm:text-lg sm:leading-8">
                    Після досягнення цього обмеження для розміщення нових
                    оголошень потрібно буде зареєструватися або
                    дочекатися початку нового тижневого періоду.
                  </p>
                </div>


                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-100/50 sm:rounded-3xl sm:p-8">
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black tracking-tight text-blue-600 sm:text-7xl">
                      3
                    </span>

                    <span className="pb-2 text-lg font-bold text-slate-800 sm:pb-3 sm:text-xl">
                      оголошення
                    </span>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-blue-100 sm:mt-6 sm:h-3">
                    <div className="h-full w-full rounded-full bg-blue-600" />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7">
                    Максимальна кількість публікацій без реєстрації
                    протягом одного тижня.
                  </p>
                </div>
              </div>
            </div>


            <div className="mt-4 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm sm:mt-6 sm:rounded-[32px]">
              <div className="grid items-center gap-5 px-5 py-7 sm:gap-8 sm:px-10 sm:py-8 lg:grid-cols-[0.35fr_1fr] lg:px-14 lg:py-10">

                <div className="flex items-end gap-3 border-b border-blue-100 pb-5 sm:border-0 sm:pb-0 lg:block">
                  <span className="text-7xl font-black leading-none tracking-tight text-blue-600 sm:text-8xl lg:text-9xl">
                    7
                  </span>

                  <span className="pb-1 text-2xl font-black text-slate-800 sm:pb-2 sm:text-3xl lg:pb-3 lg:text-4xl">
                    днів
                  </span>
                </div>


                <div>
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 sm:px-4 sm:py-2 sm:text-sm">
                    Термін публікації
                  </span>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Оголошення активне протягом 7 днів
                  </h3>

                  <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
                    Після публікації оголошення буде доступне на
                    платформі протягом 7 днів. Після завершення цього
                    терміну воно буде автоматично видалене.
                  </p>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 sm:mt-5 sm:rounded-2xl sm:px-5 sm:py-4">
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      Якщо потрібно продовжити термін розміщення
                      оголошення, зверніться до адміністрації RBoard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>


        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Як це працює
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                1
              </span>

              <h3 className="mt-4 text-xl font-bold text-slate-950 sm:mt-6 sm:text-2xl">
                Знайдіть оголошення
              </h3>

              <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
                Введіть назву потрібного товару або послуги та оберіть
                відповідну категорію.
              </p>
            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                2
              </span>

              <h3 className="mt-4 text-xl font-bold text-slate-950 sm:mt-6 sm:text-2xl">
                Перегляньте пропозицію
              </h3>

              <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
                Ознайомтеся з описом, місцем розташування та контактною
                інформацією автора.
              </p>
            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white sm:h-12 sm:w-12 sm:text-xl">
                3
              </span>

              <h3 className="mt-4 text-xl font-bold text-slate-950 sm:mt-6 sm:text-2xl">
                Додайте своє
              </h3>

              <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
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