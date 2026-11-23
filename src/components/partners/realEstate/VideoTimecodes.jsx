
import {
  Clock3,
  Plus,
  Play,
  Trash2,
} from "lucide-react";

const MAX_TIMECODES = 15;

export const timecodeToSeconds = (value) => {
  if (typeof value !== "string") return null;

  const time = value.trim();

  // Підтримує 00:35, 01:20, 01:02:30
  if (
    !/^(?:\d{1,3}:[0-5]\d|\d{1,2}:[0-5]\d:[0-5]\d)$/.test(time)
  ) {
    return null;
  }

  const parts = time.split(":").map(Number);

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return (
    parts[0] * 3600 +
    parts[1] * 60 +
    parts[2]
  );
};

export default function VideoTimecodes({
  value = [],
  onChange,
  onSeek,
  playerReady = false,
}) {
  const addTimecode = () => {
    if (value.length >= MAX_TIMECODES) return;

    onChange([
      ...value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: "",
        title: "",
        rotation: "none",
      },
    ]);
  };

  const updateTimecode = (id, field, newValue) => {
    onChange(
      value.map((item) =>
        item.id === id
          ? { ...item, [field]: newValue }
          : item
      )
    );
  };

  const removeTimecode = (id) => {
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock3 size={18} className="text-blue-600" />
            Таймкоди відео
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Додайте розділи, щоб швидко переходити
            до потрібного моменту.
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {value.length}/{MAX_TIMECODES}
        </span>
      </div>

      {value.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
          <p className="text-sm text-slate-500">
            Таймкодів поки немає.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Наприклад: 00:35 — Загальний вигляд будинку
          </p>
        </div>
      )}

      <div className="space-y-2">
        {value.map((item, index) => {
          const seconds = timecodeToSeconds(item.time);

          const invalidTime =
            Boolean(item.time.trim()) &&
            seconds === null;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500">
                  {index + 1}
                </span>

                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <input
                    type="text"
                    value={item.time}
                    onChange={(event) =>
                      updateTimecode(
                        item.id,
                        "time",
                        event.target.value
                      )
                    }
                    placeholder="00:35"
                    maxLength={8}
                    aria-label={`Час розділу ${index + 1}`}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${invalidTime
                        ? "border-red-300 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                  />

                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) =>
                      updateTimecode(
                        item.id,
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Назва фрагмента"
                    maxLength={100}
                    aria-label={`Назва розділу ${index + 1}`}
                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeTimecode(item.id)}
                  title="Видалити таймкод"
                  aria-label="Видалити таймкод"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>


              <div className="mt-3 grid gap-2 pl-8 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label
                    htmlFor={`rotation-${item.id}`}
                    className="mb-1 block text-xs font-semibold text-slate-600"
                  >
                    Як показувати відео з цього моменту
                  </label>

                  <select
                    id={`rotation-${item.id}`}
                    value={item.rotation || "none"}
                    onChange={(event) =>
                      updateTimecode(
                        item.id,
                        "rotation",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="none">
                      Звичайний вигляд (0°)
                    </option>

                    <option value="right">
                      Повернути вправо (90°)
                    </option>

                    <option value="left">
                      Повернути вліво (-90°)
                    </option>
                  </select>

                  {invalidTime && (
                    <p className="mt-1 text-xs text-red-600">
                      Формат часу: 00:35 або 01:02:30
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!playerReady || seconds === null}
                  onClick={() =>
                    onSeek(seconds, item.rotation || "none")
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play size={14} />
                  Перевірити
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {value.length < MAX_TIMECODES && (
        <button
          type="button"
          onClick={addTimecode}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-50"
        >
          <Plus size={17} />
          Додати таймкод
        </button>
      )}
    </section>
  );
}
