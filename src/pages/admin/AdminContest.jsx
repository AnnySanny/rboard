import { useState } from "react";

import {
    Trophy,
    Power,
    LoaderCircle,
    AlertCircle,
    CalendarDays,
    Clock3,
    Pencil,
    Save,
    X,
} from "lucide-react";

import {
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { db } from "../../firebase";

import {
    CONTEST_ID,
    useContest,
} from "../../context/ContestContext";
import ContestLeaderboard from "../../components/contest/ContestLeaderboard";
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

const formatDateForInput = (value) => {
    if (!value) return "";

    const date = value?.toDate?.() || new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const parts = Object.fromEntries(
        dateFormatter
            .formatToParts(date)
            .map(({ type, value }) => [type, value])
    );

    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const parseKyivDate = (value) => {
    if (!value) return null;

    const wallTime = Date.parse(`${value}:00Z`);

    if (!Number.isFinite(wallTime)) return null;

    const day = 24 * 60 * 60 * 1000;

    const offsets = new Set(
        [-day, 0, day].map((shift) => {
            const probe = wallTime + shift;

            const localTime = formatDateForInput(
                new Date(probe)
            );

            return Date.parse(`${localTime}:00Z`) - probe;
        })
    );

    const matches = [...offsets]
        .map((offset) => new Date(wallTime - offset))
        .filter(
            (date) => formatDateForInput(date) === value
        );

    return matches.length === 1 ? matches[0] : null;
};

const getContestForm = (contest) => ({
    title: contest?.title || "",
    description: contest?.description || "",
    startsAt: formatDateForInput(contest?.startsAt),
    endsAt: formatDateForInput(contest?.endsAt),
    totalBoots: String(contest?.totalBoots ?? ""),
});

const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate || endDate <= startDate) {
        return "—";
    }

    const totalMinutes = Math.floor(
        (endDate.getTime() - startDate.getTime()) / 60000
    );

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return [
        days > 0 ? `${days} дн.` : null,
        hours > 0 ? `${hours} год.` : null,
        minutes > 0 ? `${minutes} хв.` : null,
    ].filter(Boolean).join(" ") || "0 хв.";
};

const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-600";

const AdminContest = () => {
    const {
        contest,
        loading,
        error,
        isSynced,
        isContestEnabled,
    } = useContest();

    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(null);

    const values = editing && form
        ? form
        : getContestForm(contest);

    const startDate = parseKyivDate(values.startsAt);
    const endDate = parseKyivDate(values.endsAt);

    const duration = formatDuration(startDate, endDate);

    const invalidDates =
        !startDate ||
        !endDate ||
        endDate <= startDate;

    const handleEdit = () => {
        if (!contest || saving || !isSynced) return;

        setForm(getContestForm(contest));
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setForm(null);
        setEditing(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const showValidationError = (text) => {
        Swal.fire({
            icon: "warning",
            title: "Перевірте введені дані",
            text,
            confirmButtonColor: "#2563eb",
        });
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();

        if (
            !contest ||
            !editing ||
            !form ||
            saving ||
            !isSynced
        ) {
            return;
        }

        const title = form.title.trim();
        const description = form.description.trim();
        const totalBoots = Number(form.totalBoots);

        if (
            !Number.isInteger(totalBoots) ||
            totalBoots < 1 ||
            totalBoots > 1000
        ) {
            showValidationError(
                "Кількість елементів повинна бути цілим числом від 1 до 1000."
            );
            return;
        }
        if (title.length < 2 || title.length > 100) {
            showValidationError(
                "Назва конкурсу повинна містити від 2 до 100 символів."
            );
            return;
        }

        if (
            !description ||
            description.length > 2000
        ) {
            showValidationError(
                "Опис конкурсу повинен містити від 1 до 2000 символів."
            );
            return;
        }

        if (!startDate || !endDate) {
            showValidationError(
                "Вкажіть коректні та однозначні дати й час проведення конкурсу."
            );
            return;
        }

        if (endDate <= startDate) {
            showValidationError(
                "Дата завершення повинна бути пізнішою за дату початку конкурсу."
            );
            return;
        }

        setSaving(true);

        try {
            await updateDoc(
                doc(db, "contests", CONTEST_ID),
                {
                    title,
                    description,
                    totalBoots,
                    startsAt: Timestamp.fromDate(startDate),
                    endsAt: Timestamp.fromDate(endDate),
                    updatedAt: serverTimestamp(),
                }
            );

            setEditing(false);
            setForm(null);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Налаштування збережено",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка збереження налаштувань конкурсу:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Помилка",
                text: "Не вдалося зберегти налаштування конкурсу.",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleContest = async () => {
        if (
            !contest ||
            saving ||
            !isSynced
        ) {
            return;
        }

        const nextEnabled = !isContestEnabled;

        setSaving(true);

        try {
            const result = await Swal.fire({
                icon: "question",

                title: nextEnabled
                    ? "Увімкнути конкурс?"
                    : "Вимкнути конкурс?",

                text: nextEnabled
                    ? "Конкурсні елементи стануть доступними на сайті."
                    : "Усі конкурсні елементи будуть приховані. Результати учасників збережуться.",

                showCancelButton: true,

                confirmButtonText: nextEnabled
                    ? "Увімкнути"
                    : "Вимкнути",

                cancelButtonText: "Скасувати",

                confirmButtonColor: nextEnabled
                    ? "#2563eb"
                    : "#dc2626",
            });

            if (!result.isConfirmed) {
                return;
            }

            await updateDoc(
                doc(db, "contests", CONTEST_ID),
                {
                    enabled: nextEnabled,
                    updatedAt: serverTimestamp(),
                }
            );

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",

                title: nextEnabled
                    ? "Конкурс увімкнено"
                    : "Конкурс вимкнено",

                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка зміни стану конкурсу:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Помилка",
                text: "Не вдалося змінити стан конкурсу.",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Заголовок сторінки */}
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Trophy className="h-6 w-6" />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                        Управління конкурсом
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Налаштування та керування конкурсами RBoard
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10">
                    <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />

                    {error}
                </div>
            ) : !contest ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />

                    Очікуємо завантаження конкурсу.
                </div>
            ) : (
                <>
                    {!isSynced && (
                        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
                            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />

                            Очікуємо синхронізацію з сервером.
                        </div>
                    )}

                    {/* Активність конкурсу */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${contest.enabled
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-slate-100 text-slate-500"
                                    }`}>
                                    <Trophy className="h-7 w-7" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="break-words text-lg font-black text-slate-950">
                                        {contest.title}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {contest.description}
                                    </p>
                                </div>
                            </div>

                            <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${contest.enabled
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                                }`}>
                                <span className={`h-2 w-2 rounded-full ${contest.enabled
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                    }`} />

                                {contest.enabled
                                    ? "Увімкнено"
                                    : "Вимкнено"}
                            </span>
                        </div>

                        <div className="my-6 border-t border-slate-100" />

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    Активність конкурсу
                                </h3>

                                <p className="mt-1 max-w-lg text-sm text-slate-500">
                                    Керуйте відображенням конкурсних
                                    елементів на всьому сайті.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleToggleContest}
                                disabled={saving || !isSynced}
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${contest.enabled
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {saving ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Power className="h-4 w-4" />
                                )}

                                {contest.enabled
                                    ? "Вимкнути конкурс"
                                    : "Увімкнути конкурс"}
                            </button>
                        </div>
                    </div>

                    {/* Основні налаштування */}
                    <form
                        onSubmit={handleSaveSettings}
                        noValidate
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-950">
                                    Налаштування конкурсу
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Основна інформація та термін проведення
                                </p>
                            </div>

                            {!editing && (
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    disabled={saving || !isSynced}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Pencil className="h-4 w-4" />

                                    Редагувати
                                </button>
                            )}
                        </div>

                        <div className="my-6 border-t border-slate-100" />

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                            {/* Поля налаштувань */}
                            <div className="min-w-0 space-y-5">
                                <div>
                                    <label
                                        htmlFor="contest-title"
                                        className="mb-2 block text-sm font-bold text-slate-700"
                                    >
                                        Назва конкурсу
                                    </label>

                                    <input
                                        id="contest-title"
                                        type="text"
                                        name="title"
                                        value={values.title}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        maxLength={100}
                                        placeholder="Введіть назву конкурсу"
                                        className={inputClassName}
                                    />

                                    <p className="mt-1.5 text-right text-xs text-slate-400">
                                        {values.title.length}/100
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="contest-description"
                                        className="mb-2 block text-sm font-bold text-slate-700"
                                    >
                                        Опис конкурсу
                                    </label>

                                    <textarea
                                        id="contest-description"
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        maxLength={2000}
                                        rows={5}
                                        placeholder="Введіть опис конкурсу"
                                        className={`${inputClassName} resize-y`}
                                    />

                                    <p className="mt-1.5 text-right text-xs text-slate-400">
                                        {values.description.length}/2000
                                    </p>
                                </div>

                                {/* Дати проведення */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="contest-start"
                                            className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                                        >
                                            <CalendarDays className="h-4 w-4 text-blue-600" />

                                            Початок конкурсу
                                        </label>

                                        <input
                                            id="contest-start"
                                            type="datetime-local"
                                            name="startsAt"
                                            value={values.startsAt}
                                            onChange={handleChange}
                                            disabled={!editing || saving}
                                            className={`${inputClassName} min-w-0`}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="contest-end"
                                            className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                                        >
                                            <CalendarDays className="h-4 w-4 text-blue-600" />

                                            Завершення конкурсу
                                        </label>

                                        <input
                                            id="contest-end"
                                            type="datetime-local"
                                            name="endsAt"
                                            value={values.endsAt}
                                            onChange={handleChange}
                                            disabled={!editing || saving}
                                            min={values.startsAt || undefined}
                                            className={`${inputClassName} min-w-0`}
                                        />
                                    </div>
                                </div>

                                {editing && invalidDates && (
                                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                                        <AlertCircle className="h-4 w-4 shrink-0" />

                                        Вкажіть коректні дати. Завершення
                                        конкурсу повинно бути пізніше
                                        його початку.
                                    </div>
                                )}

                                <p className="text-xs text-slate-400">
                                    Усі дати та час вказуються за
                                    часовим поясом Europe/Kyiv.
                                </p>
                            </div>

                            {/* Інформаційні картки */}
                            <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                {/* Тривалість */}
                                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                                        <Clock3 className="h-5 w-5" />
                                    </div>

                                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                        Тривалість конкурсу
                                    </p>

                                    <div className="mt-2 break-words text-3xl font-black text-slate-950">
                                        {duration}
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-blue-700/70">
                                        Розраховується автоматично
                                        відповідно до вибраних дат.
                                    </p>
                                </div>

                                {/* Кількість чобітків */}
                                {/* Кількість чобітків */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                                        <Trophy className="h-5 w-5" />
                                    </div>

                                    <label
                                        htmlFor={editing ? "contest-total-boots" : undefined}
                                        className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        Кількість чобітків
                                    </label>

                                    {editing ? (
                                        <input
                                            id="contest-total-boots"
                                            type="number"
                                            name="totalBoots"
                                            value={values.totalBoots}
                                            onChange={handleChange}
                                            disabled={saving}
                                            min={1}
                                            max={1000}
                                            step={1}
                                            className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-2xl font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                                        />
                                    ) : (
                                        <div className="mt-2 text-3xl font-black text-slate-950">
                                            {contest.totalBoots ?? "—"}
                                        </div>
                                    )}

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        {editing
                                            ? "Вкажіть загальну кількість прихованих елементів."
                                            : "Загальна кількість прихованих елементів на сайті."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Кнопки збереження */}
                        {editing && (
                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />

                                    Скасувати
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !isSynced ||
                                        invalidDates
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}

                                    {saving
                                        ? "Збереження..."
                                        : "Зберегти зміни"}
                                </button>
                            </div>
                        )}
                    </form>
                     <ContestLeaderboard adminView />
                </>
            )}
        </div>
    );
};

export default AdminContest;