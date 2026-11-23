
export const PARTNER_SPECIALIZATIONS = [
  { value: "real_estate", label: "Нерухомість" },
  { value: "auto", label: "Автомобілі та транспорт" },
  { value: "beauty", label: "Б'юті-сфера" },
  { value: "retail", label: "Магазини та торгівля" },
  { value: "food", label: "Кафе та ресторани" },
  { value: "tourism", label: "Туризм і відпочинок" },
  { value: "construction", label: "Будівництво та ремонт" },
  { value: "services", label: "Послуги" },
  { value: "other", label: "Інша діяльність" },
];

export const getPartnerSpecializationLabel = (value) =>
  PARTNER_SPECIALIZATIONS.find(
    (item) => item.value === value
  )?.label || "Не визначено";
