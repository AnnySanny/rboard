
import {
  Trash2,
  LockKeyhole,
  Clock3,
} from "lucide-react";

export default function ProfileAccountSettings() {
  return (
    <div className="space-y-4">
      {/* Інформація про пароль */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
          <LockKeyhole size={19} />
        </span>

        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800">
            Пароль облікового запису
          </h4>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Якщо ви забули пароль або хочете його
            змінити, зверніться до адміністрації
            RBoard.
          </p>
        </div>
      </div>

      {/* Видалення акаунта — тимчасово недоступне */}
      <button
        type="button"
        disabled
        aria-label="Видалення акаунта тимчасово недоступне"
        className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-65"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Trash2 size={19} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-500">
            Видалити акаунт
          </span>

          <span className="mt-1 block text-xs leading-5 text-slate-400">
            Функція тимчасово недоступна
          </span>
        </span>

        <Clock3
          size={18}
          className="shrink-0 text-slate-400"
        />
      </button>
    </div>
  );
}
