
import { ChevronDown } from "lucide-react";

export default function ProfileAccordion({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
}) {
  return (
    <details
      open={undefined}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition hover:bg-slate-50 sm:p-5 [&::-webkit-details-marker]:hidden">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={20} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <ChevronDown
          size={20}
          className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-slate-100 p-4 sm:p-5">
        {children}
      </div>
    </details>
  );
}
