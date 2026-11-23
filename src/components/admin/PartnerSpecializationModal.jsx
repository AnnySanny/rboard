
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Handshake,
  House,
  CarFront,
  Sparkles,
  Store,
  UtensilsCrossed,
  Mountain,
  HardHat,
  Wrench,
  BriefcaseBusiness,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import {
  PARTNER_SPECIALIZATIONS,
} from "../../utils/partnerSpecializations";

const SPECIALIZATION_ICONS = {
  real_estate: House,
  auto: CarFront,
  beauty: Sparkles,
  retail: Store,
  food: UtensilsCrossed,
  tourism: Mountain,
  construction: HardHat,
  services: Wrench,
  other: BriefcaseBusiness,
};

export default function PartnerSpecializationModal({
  user,
  onClose,
  onSave,
  onDisable,
  loading = false,
}) {
  const [selectedType, setSelectedType] = useState(
    user?.partnerType || ""
  );

  const [confirmDisable, setConfirmDisable] = useState(false);

  useEffect(() => {
    setSelectedType(user?.partnerType || "");
    setConfirmDisable(false);
  }, [user?.id, user?.partnerType]);

  useEffect(() => {
    if (!user) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [user, loading, onClose]);

  if (!user) return null;

  const isUnchanged =
    user.partner &&
    selectedType === (user.partnerType || "");

  const canSave =
    Boolean(selectedType) &&
    !loading &&
    !isUnchanged;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-modal-title"
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[90dvh]"
      >
        {/* Заголовок */}
        <div className="shrink-0 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Handshake size={24} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="partner-modal-title"
                className="text-lg font-black text-slate-950 sm:text-xl"
              >
                {user.partner
                  ? "Налаштування партнерства"
                  : "Надати партнерство"}
              </h2>

              <p className="mt-1 break-words text-sm text-slate-500">
                {user.login || "Користувач RBoard"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Закрити"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Основна частина */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Спеціалізація партнера
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Обрана сфера визначатиме доступні форми
                  оголошень, спеціальні картки та
                  додаткові можливості партнера.
                </p>
              </div>
            </div>
          </div>

          <fieldset disabled={loading || confirmDisable}>
            <legend className="mb-3 text-sm font-bold text-slate-900">
              Оберіть сферу діяльності
            </legend>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PARTNER_SPECIALIZATIONS.map((item) => {
                const Icon =
                  SPECIALIZATION_ICONS[item.value] ||
                  BriefcaseBusiness;

                const isSelected =
                  selectedType === item.value;

                return (
                  <label
                    key={item.value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="partner-specialization"
                      value={item.value}
                      checked={isSelected}
                      onChange={() => setSelectedType(item.value)}
                      className="peer sr-only"
                    />

                    <div
                      className={`relative flex min-h-[116px] h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 px-3 py-4 text-center transition-all duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon size={22} strokeWidth={1.8} />
                      </div>

                      <span
                        className={`text-xs font-bold leading-5 ${
                          isSelected
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Нижня панель */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7">
          {confirmDisable ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <p>
                  Скасувати партнерство? Бізнес-дані та
                  спеціалізація збережуться, але партнерські
                  можливості стануть недоступними.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmDisable(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Назад
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onDisable}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading
                    ? "Збереження..."
                    : "Так, скасувати"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Закрити
                </button>

                <button
                  type="button"
                  onClick={() => onSave(selectedType)}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? (
                    "Збереження..."
                  ) : user.partner ? (
                    "Зберегти зміни"
                  ) : (
                    "Надати партнерство"
                  )}
                </button>
              </div>

              {user.partner && (
                <button
                  type="button"
                  onClick={() => setConfirmDisable(true)}
                  disabled={loading}
                  className="self-start text-xs font-semibold text-red-500 transition hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  Скасувати партнерство
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
