
export const CONTACT_TYPES = [
  "instagram",
  "telegram",
  "viber",
  "whatsapp",
  "facebook",
  "tiktok",
];

export const createEmptyContacts = () =>
  Object.fromEntries(
    CONTACT_TYPES.map((key) => [
      key,
      { enabled: false, value: "" },
    ])
  );

export const createProfileForm = (profile = {}) => {
  const contacts = createEmptyContacts();

  CONTACT_TYPES.forEach((key) => {
    const saved = profile.additionalContacts?.[key];

    contacts[key] = {
      enabled:
        typeof saved === "string"
          ? Boolean(saved.trim())
          : Boolean(saved?.enabled),
      value:
        typeof saved === "string"
          ? saved
          : saved?.value || "",
    };
  });

  return {
    login: profile.login || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    city:
      typeof profile.city === "string"
        ? profile.city
        : profile.city?.name || "",
    avatarUrl: profile.avatarUrl || "",
    avatarPublicId: profile.avatarPublicId || "",
    additionalContacts: contacts,
    privacy: {
      hidePhone: Boolean(profile.privacy?.hidePhone),
      hideCity: Boolean(profile.privacy?.hideCity),
      hideContacts: Boolean(
        profile.privacy?.hideContacts
      ),
    },
  };
};

export const cleanContacts = (contacts) => {
  const result = {};

  CONTACT_TYPES.forEach((key) => {
    const contact = contacts?.[key];
    const value = contact?.value?.trim() || "";

    if (contact?.enabled && value) {
      result[key] = value;
    }
  });

  return result;
};

export const createPublicProfile = (
  data,
  createdAt = null
) => {
  const publicProfile = {
    login: data.login,
    avatarUrl: data.avatarUrl || "",
    bio: data.bio || "",
    city: data.privacy.hideCity
      ? ""
      : data.city || "",
    additionalContacts: data.privacy.hideContacts
      ? {}
      : cleanContacts(data.additionalContacts),
    updatedAt: data.updatedAt,
  };

  if (!data.privacy.hidePhone && data.phone) {
    publicProfile.phone = data.phone;
  }

  if (createdAt) {
    publicProfile.createdAt = createdAt;
  }

  return publicProfile;
};
