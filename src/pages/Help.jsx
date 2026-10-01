import { useState } from "react";

import {
    ChevronDown,
    Search,
    PlusCircle,
    Eye,
    SlidersHorizontal,
    Pencil,
    ImagePlus,
    Heart,
    MessageCircle,
    BarChart3,
    Trash2,
    UserRound,
    CircleHelp,
    Check,
    LockKeyhole,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const helpItems = [
    {
        id: "search",
        title: "Пошук оголошень",
        description:
            "Знайдіть потрібний товар, послугу, роботу або інше оголошення.",
        icon: Search,
        access: "guest",
        accessLabel: "Доступно гостям",
        steps: [
            "Перейдіть на головну сторінку RBoard.",
            "У полі пошуку введіть назву товару, послуги або ключові слова, які вас цікавлять.",
            "Перегляньте знайдені оголошення.",
            "За потреби використайте фільтри, щоб звузити результати пошуку.",
        ],
    },
    {
        id: "filters",
        title: "Фільтрування оголошень",
        description:
            "Відберіть оголошення за категорією та іншими доступними параметрами.",
        icon: SlidersHorizontal,
        access: "guest",
        accessLabel: "Доступно гостям",
        steps: [
            "Відкрийте головну сторінку з оголошеннями.",
            "Оберіть потрібну категорію, наприклад «Продаж», «Купівля», «Оренда», «Послуга» або «Робота».",
            "Використайте інші доступні параметри фільтрації.",
            "Щоб повернути початковий список оголошень, скиньте активні фільтри або оберіть категорію «Усі».",
        ],
    },
    {
        id: "details",
        title: "Перегляд оголошення",
        description:
            "Перегляньте фотографії, опис, місцезнаходження та контакти автора.",
        icon: Eye,
        access: "guest",
        accessLabel: "Доступно гостям",
        steps: [
            "Знайдіть потрібне оголошення на головній сторінці.",
            "Натисніть на картку оголошення, щоб відкрити детальну інформацію.",
            "Перегляньте назву, опис, категорію, місцезнаходження та фотографії.",
            "Перегляньте доступні контактні дані автора.",
            "Зв’яжіться з автором зручним для вас способом.",
        ],
    },
    {
        id: "create",
        title: "Створення оголошення",
        description:
            "Розмістіть власне оголошення на RBoard.",
        icon: PlusCircle,
        access: "guest",
        accessLabel: "Доступно гостям",
        steps: [
            "Натисніть кнопку «Додати оголошення».",
            "Оберіть категорію, до якої належить ваше оголошення.",
            "Вкажіть назву оголошення та детально опишіть вашу пропозицію.",
            "Вкажіть населений пункт та необхідні контактні дані.",
            "Перевірте введену інформацію.",
            "Надішліть оголошення на публікацію.",
            "Після перевірки та схвалення оголошення стане доступним на сайті.",
        ],
    },

    // ЗАРЕЄСТРОВАНІ КОРИСТУВАЧІ

    {
        id: "edit",
        title: "Редагування оголошення",
        description:
            "Змінюйте інформацію у власних оголошеннях після їх створення.",
        icon: Pencil,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис RBoard.",
            "Перейдіть до розділу «Мої оголошення».",
            "Знайдіть оголошення, яке потрібно змінити.",
            "Натисніть кнопку редагування.",
            "Внесіть необхідні зміни до оголошення.",
            "Збережіть зміни.",
        ],
    },
    {
        id: "photos",
        title: "Додавання фотографій",
        description:
            "Доповнюйте власні оголошення фотографіями.",
        icon: ImagePlus,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис.",
            "Створіть нове оголошення або відкрийте редагування власного оголошення.",
            "Перейдіть до блоку додавання фотографій.",
            "Оберіть потрібні зображення зі свого пристрою.",
            "Перевірте завантажені фотографії.",
            "Збережіть або опублікуйте оголошення.",
        ],
    },
    {
        id: "favorites",
        title: "Улюблені оголошення",
        description:
            "Зберігайте цікаві оголошення, щоб швидко повернутися до них пізніше.",
        icon: Heart,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис.",
            "Знайдіть цікаве для вас оголошення.",
            "Натисніть кнопку додавання до улюблених.",
            "Оголошення буде збережене серед ваших улюблених.",
            "Щоб прибрати його з улюблених, натисніть відповідну кнопку ще раз.",
        ],
    },
    {
        id: "contacts",
        title: "Додаткові способи зв’язку",
        description:
            "Додайте Telegram, Viber, WhatsApp, Instagram або Facebook.",
        icon: MessageCircle,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис.",
            "Під час створення або редагування оголошення знайдіть блок «Додатковий зв’язок із вами».",
            "Увімкніть потрібний спосіб зв’язку.",
            "Вкажіть відповідний номер телефону, ім’я користувача або посилання.",
            "За бажанням увімкніть параметр «Не показувати номер телефону».",
            "Збережіть оголошення.",
        ],
    },
    {
        id: "statistics",
        title: "Статистика оголошень",
        description:
            "Відстежуйте активність та перегляди власних оголошень.",
        icon: BarChart3,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис RBoard.",
            "Перейдіть до розділу «Мої оголошення».",
            "Знайдіть потрібне оголошення.",
            "Перегляньте доступну статистику оголошення.",
            "Використовуйте ці дані, щоб оцінити активність вашої публікації.",
        ],
    },
    {
        id: "delete",
        title: "Видалення оголошення",
        description:
            "Видаліть власне оголошення, якщо воно більше не актуальне.",
        icon: Trash2,
        access: "user",
        accessLabel: "Потрібна реєстрація",
        steps: [
            "Увійдіть у свій обліковий запис.",
            "Відкрийте розділ «Мої оголошення».",
            "Знайдіть оголошення, яке потрібно видалити.",
            "Натисніть кнопку видалення.",
            "Підтвердьте свою дію у вікні підтвердження.",
            "Після підтвердження оголошення буде видалено.",
        ],
    },
];

const Help = () => {
    const [openItem, setOpenItem] =
        useState(null);

    const toggleItem = (id) => {
        setOpenItem((current) =>
            current === id ? null : id
        );
    };

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-slate-50">
                {/* HEADER */}
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <CircleHelp
                                    size={28}
                                    strokeWidth={2}
                                />
                            </div>

                            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                                Допомога RBoard
                            </p>

                            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                Як користуватися
                                RBoard?
                            </h1>

                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                                Оберіть потрібну
                                можливість, щоб
                                переглянути детальну
                                покрокову інструкцію.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                    {/* ACCESS INFO */}
                    <div className="mb-8 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                    <UserRound
                                        size={19}
                                    />
                                </div>

                                <div>
                                    <h2 className="font-black text-slate-900">
                                        Без
                                        реєстрації
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        Гість може
                                        шукати,
                                        фільтрувати,
                                        переглядати
                                        оголошення та
                                        створювати
                                        власні.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                    <LockKeyhole
                                        size={19}
                                    />
                                </div>

                                <div>
                                    <h2 className="font-black text-slate-900">
                                        Після
                                        реєстрації
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        Користувач
                                        отримує
                                        керування
                                        власними
                                        оголошеннями,
                                        фотографіями,
                                        улюбленими,
                                        контактами та
                                        статистикою.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACCORDION */}
                    <section>
                        <div className="mb-5">
                            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                Інструкція
                                користувача
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Натисніть на
                                потрібний пункт, щоб
                                побачити послідовність
                                дій.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {helpItems.map(
                                (item) => {
                                    const Icon =
                                        item.icon;

                                    const isOpen =
                                        openItem ===
                                        item.id;

                                    const isGuest =
                                        item.access ===
                                        "guest";

                                    return (
                                        <article
                                            key={
                                                item.id
                                            }
                                            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                                                isOpen
                                                    ? "border-blue-200 shadow-md"
                                                    : "border-slate-200"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleItem(
                                                        item.id
                                                    )
                                                }
                                                aria-expanded={
                                                    isOpen
                                                }
                                                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:p-5"
                                            >
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                        isOpen
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-blue-50 text-blue-600"
                                                    }`}
                                                >
                                                    <Icon
                                                        size={
                                                            21
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                        <h3 className="font-black text-slate-900 sm:text-base">
                                                            {
                                                                item.title
                                                            }
                                                        </h3>

                                                        <span
                                                            className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                                isGuest
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-blue-50 text-blue-700"
                                                            }`}
                                                        >
                                                            {
                                                                item.accessLabel
                                                            }
                                                        </span>
                                                    </div>

                                                    <p className="mt-1.5 hidden text-sm leading-5 text-slate-500 sm:block">
                                                        {
                                                            item.description
                                                        }
                                                    </p>
                                                </div>

                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                                        isOpen
                                                            ? "bg-blue-50 text-blue-600"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    <ChevronDown
                                                        size={
                                                            19
                                                        }
                                                        className={`transition-transform duration-200 ${
                                                            isOpen
                                                                ? "rotate-180"
                                                                : ""
                                                        }`}
                                                    />
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="border-t border-slate-100 px-4 py-5 sm:px-5 sm:py-6">
                                                    <p className="mb-5 text-sm leading-6 text-slate-600 sm:hidden">
                                                        {
                                                            item.description
                                                        }
                                                    </p>

                                                    <div className="mb-5 flex items-center gap-2">
                                                        {isGuest ? (
                                                            <Check
                                                                size={
                                                                    17
                                                                }
                                                                className="text-emerald-600"
                                                            />
                                                        ) : (
                                                            <LockKeyhole
                                                                size={
                                                                    17
                                                                }
                                                                className="text-blue-600"
                                                            />
                                                        )}

                                                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                                                            {isGuest
                                                                ? "Функція доступна без реєстрації"
                                                                : "Доступно зареєстрованим користувачам"}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {item.steps.map(
                                                            (
                                                                step,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={`${item.id}-${index}`}
                                                                    className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 sm:p-4"
                                                                >
                                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-blue-600 shadow-sm ring-1 ring-slate-200">
                                                                        {index +
                                                                            1}
                                                                    </div>

                                                                    <p className="pt-1 text-sm leading-6 text-slate-700">
                                                                        {
                                                                            step
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </>
    );
};

export default Help;
