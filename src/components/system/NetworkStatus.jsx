
import { useEffect, useState } from "react";
import { WifiOff, LoaderCircle } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    () => navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-9">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
          <WifiOff size={38} strokeWidth={1.8} />
        </div>

        <h2 className="mt-6 text-2xl font-black text-slate-900">
          Немає інтернету
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Схоже, з'єднання з інтернетом втрачено.
          Перевірте Wi-Fi або мобільну мережу.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Очікуємо відновлення з'єднання...
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Сторінка відновить роботу після підключення.
        </p>

      </div>
    </div>
  );
}
