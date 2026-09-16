import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Rules = () => {
    const allowedItems = [
        "Продаж та купівля звичайних товарів",
        "Пропозиції послуг і пошук спеціалістів",
        "Оголошення про оренду житла та нерухомості",
        "Пошук роботи та пропозиції роботи",
        "Локальні оголошення для жителів Рахова та району",
        "Інші законні пропозиції, що не порушують правила сервісу",
    ];

    const prohibitedItems = [
        "Незаконні товари, послуги або пропозиції",
        "Наркотичні та психотропні речовини",
        "Зброя, боєприпаси, вибухові речовини та небезпечні предмети",
        "Підроблені документи, гроші та інші незаконні матеріали",
        "Шахрайські пропозиції та спроби введення користувачів в оману",
        "Порнографічний або відверто сексуальний контент",
        "Матеріали, що пропагують насильство, жорстокість або незаконну діяльність",
        "Оголошення, що порушують права інших осіб або чинне законодавство",
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1">
                {/* Заголовок */}
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Правила використання сервісу
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                            RBoard створений для зручного та безпечного
                            розміщення локальних оголошень. Користуючись
                            платформою, ви погоджуєтесь дотримуватися цих
                            правил та поважати інших користувачів.
                        </p>
                    </div>
                </section>

                {/* Основні правила */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Дозволено */}
                        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-8 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>

                            <h2 className="mt-6 text-2xl font-black text-slate-950">
                                Що можна публікувати
                            </h2>

                            <p className="mt-3 leading-7 text-slate-600">
                                На платформі дозволено розміщувати
                                добросовісні та законні оголошення.
                            </p>

                            <ul className="mt-6 space-y-4">
                                {allowedItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-3 text-slate-700"
                                    >
                                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700">
                                            ✓
                                        </span>

                                        <span className="leading-6">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Заборонено */}
                        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </div>

                            <h2 className="mt-6 text-2xl font-black text-slate-950">
                                Що заборонено
                            </h2>

                            <p className="mt-3 leading-7 text-slate-600">
                                Оголошення не повинні містити незаконний,
                                небезпечний або неприйнятний контент.
                            </p>

                            <ul className="mt-6 space-y-4">
                                {prohibitedItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-3 text-slate-700"
                                    >
                                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-700">
                                            ×
                                        </span>

                                        <span className="leading-6">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Спілкування */}
                <section className="border-y border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                        <div className="max-w-3xl">
                            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                                Спілкування
                            </span>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                Поважайте інших користувачів
                            </h2>

                            <p className="mt-5 text-lg leading-8 text-slate-600">
                                Забороняються образи, погрози, приниження,
                                переслідування та інша агресивна поведінка
                                щодо інших користувачів.
                            </p>

                            <p className="mt-4 text-lg leading-8 text-slate-600">
                                Не допускаються висловлювання, спрямовані
                                на розпалювання ненависті або ворожнечі,
                                а також дискримінаційні та принизливі
                                матеріали.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Контент 18+ */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                    <div className="overflow-hidden rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
                        <div className="p-8 sm:p-10 lg:p-12">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                <span className="text-base font-black">
                                    18+
                                </span>
                            </div>

                            <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
                                Еротичний та неприйнятний контент
                            </h2>

                            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
                                На RBoard заборонено публікувати
                                порнографічні матеріали, відверто сексуальні
                                зображення або відео, пропозиції сексуальних
                                послуг та інший контент сексуального
                                характеру, який не відповідає призначенню
                                платформи.
                            </p>

                            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
                                Категорично заборонений будь-який сексуальний
                                або експлуатаційний контент за участю
                                неповнолітніх.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Чесність оголошень */}
                <section className="border-y border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                        <div className="grid gap-8 lg:grid-cols-3">
                            <div>
                                <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                                    Безпека
                                </span>

                                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                                    Будьте чесними
                                </h2>
                            </div>

                            <div className="lg:col-span-2">
                                <p className="text-lg leading-8 text-slate-600">
                                    Інформація в оголошенні повинна
                                    відповідати дійсності. Не вводьте інших
                                    користувачів в оману щодо товару,
                                    послуги, ціни, стану речі або інших
                                    важливих характеристик.
                                </p>

                                <p className="mt-4 text-lg leading-8 text-slate-600">
                                    Заборонено видавати себе за іншу особу,
                                    використовувати чужі персональні дані
                                    без дозволу, створювати фальшиві
                                    пропозиції або використовувати сервіс
                                    для шахрайства.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Модерація */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                    <div className="rounded-[32px] bg-slate-950 px-7 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
                        <span className="text-sm font-bold uppercase tracking-widest text-blue-400">
                            Модерація
                        </span>

                        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            Порушення правил
                        </h2>

                        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">
                            Оголошення, які порушують правила RBoard,
                            можуть бути відхилені під час модерації або
                            видалені після публікації.
                        </p>

                        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">
                            У разі систематичних або серйозних порушень
                            доступ користувача до окремих можливостей
                            сервісу або до облікового запису може бути
                            обмежено.
                        </p>
                    </div>
                </section>

                {/* Відповідальність */}
                <section className="border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                        <h2 className="text-3xl font-black tracking-tight text-slate-950">
                            Відповідальність користувачів
                        </h2>

                        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
                            Користувач самостійно відповідає за зміст
                            опублікованих оголошень, достовірність наданої
                            інформації та домовленості з іншими
                            користувачами.
                        </p>

                        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
                            RBoard є платформою для розміщення оголошень і
                            не є стороною домовленостей між продавцем,
                            покупцем, замовником або виконавцем послуг.
                            Перед передачею коштів або особистої інформації
                            рекомендуємо перевіряти пропозицію та
                            співрозмовника.
                        </p>

                        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                            <p className="font-semibold leading-7 text-blue-900">
                                Користуючись RBoard, ви підтверджуєте, що
                                ознайомилися з цими правилами та
                                погоджуєтесь їх дотримуватися.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Rules;