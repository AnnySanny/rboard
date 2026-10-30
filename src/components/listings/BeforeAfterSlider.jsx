
import { useId, useState } from "react";
import { MoveHorizontal } from "lucide-react";

export default function BeforeAfterSlider({
    before,
    after,
}) {
    const [position, setPosition] = useState(50);
    const clipId = useId();

    if (!before || !after) return null;

    return (
        <section className="mt-6">
            <div className="mb-3">
                <h3 className="text-lg font-black text-slate-950">
                    Результат роботи
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                    Переміщуйте повзунок, щоб порівняти
                    фотографії до та після виконання послуги.
                </p>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 sm:aspect-video">
                <img
                    src={after}
                    alt="Після виконання послуги"
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                />

                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        clipPath: `inset(0 ${100 - position}% 0 0)`,
                    }}
                >
                    <img
                        src={before}
                        alt="До виконання послуги"
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                    />
                </div>

                <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white">
                    До
                </span>

                <span className="pointer-events-none absolute right-3 top-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                    Після
                </span>

                <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-lg"
                    style={{ left: `${position}%` }}
                >
                    <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-xl">
                        <MoveHorizontal size={19} />
                    </span>
                </div>

                <input
                    id={clipId}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={position}
                    onChange={(event) =>
                        setPosition(Number(event.target.value))
                    }
                    aria-label="Порівняти фотографії до та після"
                    className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
                    style={{
                        touchAction: "pan-y",
                    }}
                />
            </div>
        </section>
    );
}
