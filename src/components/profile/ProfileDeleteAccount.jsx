
import { Trash2, Clock3 } from "lucide-react";

export default function ProfileDeleteAccount() {
  return (
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
  );
}
