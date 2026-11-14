
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import {
    Building2,
    MapPin,
    Phone,
    Globe,
    Save,
    Loader2,
    Handshake,
    ArrowRight,
    Eye,
    EyeOff,
} from "lucide-react";

import Swal from "sweetalert2";

import { auth, db } from "../../firebase";
import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";
import ListingContacts from "../../components/listings/ListingContacts";

const CONTACT_KEYS = [
    "instagram",
    "telegram",
    "viber",
    "whatsapp",
    "facebook",
    "tiktok",
];

const emptyAdditionalContacts = () =>
    Object.fromEntries(
        CONTACT_KEYS.map((key) => [
            key,
            {
                enabled: false,
                value: "",
            },
        ])
    );

const emptyForm = {
    businessName: "",
    description: "",
    city: "",
    address: "",
    phone: "",
    website: "",
    additionalContacts: emptyAdditionalContacts(),
    published: false,
};

const getContactValue = (contact) => {
    if (typeof contact === "string") {
        return contact.trim();
    }

    if (
        contact &&
        typeof contact.value === "string" &&
        contact.enabled !== false
    ) {
        return contact.value.trim();
    }

    return "";
};

const getCityName = (city) => {
    if (typeof city === "string") {
        return city.trim();
    }

    if (typeof city?.name === "string") {
        return city.name.trim();
    }

    return "";
};

const prepareForm = (partner, profile) => {
    const firstSetup = partner.profileEdited !== true;

    const partnerContacts =
        partner.contacts && typeof partner.contacts === "object"
            ? partner.contacts
            : {};

    const profileContacts =
        profile.additionalContacts &&
        typeof profile.additionalContacts === "object"
            ? profile.additionalContacts
            : {};

    const getValue = (savedValue, profileValue) => {
        const saved = getContactValue(savedValue);

        if (saved) return saved;

        return firstSetup
            ? getContactValue(profileValue)
            : "";
    };

    const additionalContacts = Object.fromEntries(
        CONTACT_KEYS.map((key) => {
            const value = getValue(
                partnerContacts[key],
                profileContacts[key]
            );

            return [
                key,
                {
                    enabled: Boolean(value),
                    value,
                },
            ];
        })
    );

    return {
        businessName: getValue(
            partner.businessName,
            profile.login
        ),

        description: getValue(
            partner.description,
            profile.bio
        ),

        city:
            getCityName(partner.city) ||
            (firstSetup ? getCityName(profile.city) : ""),

        address: getValue(
            partner.address,
            profile.address
        ),

        phone: getValue(
            partnerContacts.phone,
            profile.phone
        ),

        website: getValue(
            partnerContacts.website,
            profile.website
        ),

        additionalContacts,

        published: partner.published === true,
    };
};

const showToast = (icon, title) => {
    return Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2800,
        timerProgressBar: true,
    });
};

export default function UserPartner() {
    const [status, setStatus] = useState("loading");
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        document.title = "Партнерська сторінка | RBoard";

        let active = true;
        let partnerSubscribed = false;
        let initialized = false;

        let unsubscribeProfile = () => {};
        let unsubscribePartner = () => {};

        const unsubscribeAuth = onAuthStateChanged(
            auth,
            (currentUser) => {
                unsubscribeProfile();
                unsubscribePartner();

                partnerSubscribed = false;
                initialized = false;

                setStatus("loading");

                if (!currentUser) {
                    setStatus("guest");
                    return;
                }

                const uid = currentUser.uid;

                unsubscribeProfile = onSnapshot(
                    doc(db, "users", uid),
                    (snapshot) => {
                        if (
                            !active ||
                            auth.currentUser?.uid !== uid
                        ) {
                            return;
                        }

                        const profile = snapshot.data();

                        if (
                            !snapshot.exists() ||
                            profile?.blocked === true ||
                            profile?.role !== "user"
                        ) {
                            unsubscribePartner();
                            partnerSubscribed = false;
                            initialized = false;
                            setStatus("denied");
                            return;
                        }

                        if (profile.partner !== true) {
                            unsubscribePartner();
                            partnerSubscribed = false;
                            initialized = false;
                            setStatus("not-partner");
                            return;
                        }

                        if (partnerSubscribed) return;

                        partnerSubscribed = true;

                        unsubscribePartner = onSnapshot(
                            doc(db, "partners", uid),
                            (partnerSnapshot) => {
                                if (
                                    !active ||
                                    auth.currentUser?.uid !== uid
                                ) {
                                    return;
                                }

                                if (
                                    !partnerSnapshot.exists() ||
                                    partnerSnapshot.data().active !== true
                                ) {
                                    setStatus("not-partner");
                                    return;
                                }

                                if (!initialized) {
                                    setForm(
                                        prepareForm(
                                            partnerSnapshot.data(),
                                            profile
                                        )
                                    );

                                    initialized = true;
                                }

                                setStatus("ready");
                            },
                            (error) => {
                                if (!active) return;

                                console.error(
                                    "Помилка завантаження партнера:",
                                    error
                                );

                                if (error.code === "permission-denied") {
                                    setStatus("not-partner");
                                    return;
                                }

                                setStatus("error");
                                showToast(
                                    "error",
                                    "Не вдалося завантажити партнерську сторінку"
                                );
                            }
                        );
                    },
                    (error) => {
                        if (!active) return;

                        console.error(
                            "Помилка перевірки профілю:",
                            error
                        );

                        setStatus("error");
                        showToast(
                            "error",
                            "Не вдалося перевірити дані користувача"
                        );
                    }
                );
            }
        );

        return () => {
            active = false;
            unsubscribeAuth();
            unsubscribeProfile();
            unsubscribePartner();
        };
    }, []);

    const changeField = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (saving || status !== "ready") return;

        const uid = auth.currentUser?.uid;

        if (!uid) {
            showToast("error", "Необхідно авторизуватися");
            return;
        }

        const businessName = form.businessName.trim();
        const description = form.description.trim();
        const city = form.city.trim();

        if (
            form.published &&
            (
                businessName.length < 2 ||
                description.length < 20 ||
                city.length < 2
            )
        ) {
            showToast(
                "warning",
                "Для публікації заповніть назву, місто й опис від 20 символів"
            );
            return;
        }

        const contacts = {
            phone: form.phone.trim(),
            website: form.website.trim(),
        };

        CONTACT_KEYS.forEach((key) => {
            const contact = form.additionalContacts[key];

            contacts[key] =
                contact?.enabled === true
                    ? String(contact.value || "").trim()
                    : "";
        });

        setSaving(true);

        try {
            await updateDoc(
                doc(db, "partners", uid),
                {
                    businessName,
                    description,
                    city,
                    address: form.address.trim(),
                    contacts,
                    published: form.published,
                    profileEdited: true,
                    updatedAt: serverTimestamp(),
                }
            );

            showToast(
                "success",
                "Партнерську сторінку збережено"
            );
        } catch (error) {
            console.error(
                "Помилка збереження партнерської сторінки:",
                error
            );

            showToast(
                "error",
                "Не вдалося зберегти зміни"
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60";

    const sectionClass =
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

    return (
        <div className="flex min-h-screen flex-col bg-[#f5f8ff]">
            <Navbar />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">

                {status === "loading" && (
                    <div className="flex min-h-[45vh] items-center justify-center">
                        <Loader2
                            size={32}
                            className="animate-spin text-blue-600"
                        />
                    </div>
                )}

                {(status === "guest" || status === "denied") && (
                    <Navigate to="/403" replace />
                )}

                {status === "not-partner" && (
                    <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Handshake size={30} strokeWidth={1.8} />
                        </div>

                        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                            Ви ще не партнер RBoard
                        </h1>

                        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">
                            Керування партнерською сторінкою доступне
                            користувачам із підтвердженим статусом партнера.
                            Якщо ви хочете приєднатися до партнерської
                            програми, зв’яжіться з нашою командою.
                        </p>

                        <Link
                            to="/contacts"
                            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Зв’язатися з нами
                            <ArrowRight size={17} />
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <h1 className="text-xl font-bold text-slate-900">
                            Сторінка тимчасово недоступна
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Перевірте підключення до інтернету та
                            спробуйте відкрити сторінку знову.
                        </p>
                    </div>
                )}

                {status === "ready" && (
                    <>
                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                                    <Handshake size={16} />
                                    Партнер RBoard
                                </div>

                                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    Моя партнерська сторінка
                                </h1>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Розкажіть про свій бізнес та керуйте
                                    інформацією для відвідувачів RBoard.
                                </p>
                            </div>

                            <span
                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                    form.published
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-slate-200/70 text-slate-600"
                                }`}
                            >
                                {form.published ? (
                                    <Eye size={14} />
                                ) : (
                                    <EyeOff size={14} />
                                )}

                                {form.published
                                    ? "Публікацію увімкнено"
                                    : "Не опубліковано"}
                            </span>
                        </div>

                        <form
                            onSubmit={handleSave}
                            className="space-y-5"
                        >
                            {/* ОСНОВНА ІНФОРМАЦІЯ */}
                            <section className={sectionClass}>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Building2 size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-black text-slate-900">
                                            Інформація про бізнес
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Назва та короткий опис вашої діяльності
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-5">
                                    <div>
                                        <label
                                            htmlFor="partner-business"
                                            className="text-sm font-semibold text-slate-700"
                                        >
                                            Назва бізнесу
                                        </label>

                                        <input
                                            id="partner-business"
                                            type="text"
                                            value={form.businessName}
                                            onChange={(event) =>
                                                changeField(
                                                    "businessName",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Назва компанії або закладу"
                                            maxLength={80}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between gap-3">
                                            <label
                                                htmlFor="partner-description"
                                                className="text-sm font-semibold text-slate-700"
                                            >
                                                Опис бізнесу
                                            </label>

                                            <span className="text-xs text-slate-400">
                                                {form.description.length}/1800
                                            </span>
                                        </div>

                                        <textarea
                                            id="partner-description"
                                            value={form.description}
                                            onChange={(event) =>
                                                changeField(
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Чим ви займаєтесь, які товари чи послуги пропонуєте?"
                                            maxLength={1800}
                                            rows={5}
                                            disabled={saving}
                                            className={`${inputClass} resize-y`}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* РОЗТАШУВАННЯ */}
                            <section className={sectionClass}>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <MapPin size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-black text-slate-900">
                                            Розташування
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Де вас можуть знайти клієнти
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="partner-city"
                                            className="text-sm font-semibold text-slate-700"
                                        >
                                            Населений пункт
                                        </label>

                                        <input
                                            id="partner-city"
                                            type="text"
                                            value={form.city}
                                            onChange={(event) =>
                                                changeField(
                                                    "city",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Наприклад, Рахів"
                                            maxLength={200}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="partner-address"
                                            className="text-sm font-semibold text-slate-700"
                                        >
                                            Адреса
                                        </label>

                                        <input
                                            id="partner-address"
                                            type="text"
                                            value={form.address}
                                            onChange={(event) =>
                                                changeField(
                                                    "address",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Вулиця, номер будинку"
                                            maxLength={200}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ОСНОВНІ КОНТАКТИ */}
                            <section className={sectionClass}>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Phone size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-black text-slate-900">
                                            Контактна інформація
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Основні способи зв’язку з бізнесом
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="partner-phone"
                                            className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                                        >
                                            <Phone size={15} className="text-slate-400" />
                                            Телефон
                                        </label>

                                        <input
                                            id="partner-phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={(event) =>
                                                changeField(
                                                    "phone",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="+380 XX XXX XX XX"
                                            maxLength={300}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="partner-website"
                                            className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                                        >
                                            <Globe size={15} className="text-slate-400" />
                                            Вебсайт
                                        </label>

                                        <input
                                            id="partner-website"
                                            type="text"
                                            value={form.website}
                                            onChange={(event) =>
                                                changeField(
                                                    "website",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="https://example.com"
                                            maxLength={300}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <p className="mt-4 text-xs leading-5 text-slate-500">
                                    Дані з особистого профілю використовуються
                                    лише для початкового заповнення. Перевірте
                                    їх перед публікацією — контакти бізнесу
                                    можуть бути видимими іншим користувачам.
                                </p>
                            </section>

                            {/* ДОДАТКОВІ КОНТАКТИ */}
                            <ListingContacts
                                value={form.additionalContacts}
                                onChange={(additionalContacts) =>
                                    changeField(
                                        "additionalContacts",
                                        additionalContacts
                                    )
                                }
                                showPhonePrivacy={false}
                                variant="partner"
                                disabled={saving}
                            />

                            {/* ПУБЛІКАЦІЯ */}
                            <section className={sectionClass}>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Eye size={21} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-black text-slate-900">
                                            Публікація сторінки
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Ви самостійно вирішуєте, коли
                                            показувати свою бізнес-сторінку.
                                        </p>
                                    </div>
                                </div>

                                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <input
                                        type="checkbox"
                                        checked={form.published}
                                        onChange={(event) =>
                                            changeField(
                                                "published",
                                                event.target.checked
                                            )
                                        }
                                        disabled={saving}
                                        className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                                    />

                                    <span>
                                        <span className="block text-sm font-bold text-slate-900">
                                            Опублікувати партнерську сторінку
                                        </span>

                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                            Після запуску публічного каталогу
                                            сторінка буде доступна відвідувачам,
                                            якщо партнерство активне.
                                        </span>
                                    </span>
                                </label>
                            </section>

                            {/* ЗБЕРЕЖЕННЯ */}
                            <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-6">
                                <p className="text-xs leading-5 text-slate-500">
                                    Зміни будуть збережені у вашому
                                    партнерському профілі.
                                </p>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save size={18} />
                                    )}

                                    {saving
                                        ? "Збереження..."
                                        : "Зберегти зміни"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
