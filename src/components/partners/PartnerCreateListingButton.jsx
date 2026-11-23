
import {
  HousePlus,
  CarFront,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Mountain,
  HardHat,
  Wrench,
  BriefcaseBusiness,
  ArrowUpRight,
} from "lucide-react";

import Swal from "sweetalert2";

const PARTNER_BUTTON_CONFIG = {
  real_estate: {
    label: "Додати нерухомість",
    Icon: HousePlus,
  },
  auto: {
    label: "Додати автомобіль",
    Icon: CarFront,
  },
  beauty: {
    label: "Додати б'юті-послугу",
    Icon: Sparkles,
  },
  retail: {
    label: "Додати товар",
    Icon: ShoppingBag,
  },
  food: {
    label: "Додати пропозицію закладу",
    Icon: UtensilsCrossed,
  },
  tourism: {
    label: "Додати туристичну пропозицію",
    Icon: Mountain,
  },
  construction: {
    label: "Додати будівельну послугу",
    Icon: HardHat,
  },
  services: {
    label: "Додати послугу",
    Icon: Wrench,
  },
  other: {
    label: "Додати партнерське оголошення",
    Icon: BriefcaseBusiness,
  },
};

export default function PartnerCreateListingButton({
  partnerType,
  onCreate,
}) {
  const config = PARTNER_BUTTON_CONFIG[partnerType];

  if (!config) return null;

  const Icon = config.Icon;

  const handleClick = () => {
    if (onCreate) {
      onCreate(partnerType);
      return;
    }

    // Тимчасово, поки спеціальні форми не створені
    Swal.fire({
      icon: "info",
      title: "Форма в розробці",
      text: `Незабаром тут можна буде створити: ${config.label.toLowerCase()}.`,
      confirmButtonText: "Зрозуміло",
      confirmButtonColor: "#2563eb",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        group flex min-h-[76px] w-full items-center
        gap-3 rounded-2xl border border-blue-200
        bg-blue-50 px-4 py-4 text-left
        shadow-sm transition-all duration-200
        hover:border-blue-300 hover:bg-blue-100
        hover:shadow-md active:scale-[0.99]
        sm:px-5
      "
    >
      <div
        className="
          flex h-12 w-12 shrink-0 items-center
          justify-center rounded-xl bg-blue-600
          text-white transition-transform
          group-hover:scale-105
        "
      >
        <Icon size={23} strokeWidth={1.9} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-5 text-slate-900 sm:text-base">
          {config.label}
        </p>

        <p className="mt-1 text-xs text-blue-600">
          Можливість для партнера RBoard
        </p>
      </div>

      <ArrowUpRight
        size={20}
        className="shrink-0 text-blue-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </button>
  );
}
