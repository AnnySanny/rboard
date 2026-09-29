export default function GuestContactInput({
    value,
    onChange,
    error,
    disabled = false,
}) {
    return (
        <div>
            <label
                htmlFor="guestContact"
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                Зв’язок із ваміваіваіваіваи{" "}
                <span className="text-red-500">
                    *
                </span>
            </label>

            <input
                id="guestContact"
                type="text"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                disabled={disabled}
                placeholder="+380... або email@example.com"
                maxLength={120}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
            />

            {error && (
                <p className="mt-1.5 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}