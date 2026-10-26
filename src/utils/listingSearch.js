
const MIN_PREFIX_LENGTH = 3;
const MAX_PREFIX_LENGTH = 20;
const MAX_TOKENS = 450;

export const normalizeSearchText = (value = "") => {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("uk-UA")
    .replace(/['ʼ’`]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const getWords = (value) => {
  return normalizeSearchText(value)
    .split(" ")
    .filter(Boolean);
};

export const buildListingSearchTokens = (listing) => {
  const tokens = new Set();

  const addWord = (word, withPrefixes = false) => {
    if (!word) return;

    tokens.add(word);

    if (!withPrefixes || word.length < MIN_PREFIX_LENGTH) {
      return;
    }

    for (
      let length = MIN_PREFIX_LENGTH;
      length <= Math.min(word.length, MAX_PREFIX_LENGTH);
      length++
    ) {
      tokens.add(word.slice(0, length));
    }
  };

  const addField = (value, withPrefixes = false) => {
    getWords(value).forEach((word) => {
      addWord(word, withPrefixes);
    });
  };

  // Назва — з префіксами
  addField(listing.title, true);

  // Населений пункт
  addField(
    typeof listing.city === "object"
      ? listing.city?.name
      : listing.city,
    true
  );

  // Автор
  addField(listing.authorName, true);

  // Категорія
  addField(listing.type, true);

  // Вулиця
  addField(listing.street, true);

  // Опис — тільки повні слова
  // Обмежуємо обсяг індексації опису
  getWords(listing.comment)
    .slice(0, 60)
    .forEach((word) => addWord(word));

  // Додаткові ключові слова, якщо будуть
  if (Array.isArray(listing.keywords)) {
    listing.keywords.forEach((keyword) => {
      addField(keyword, true);
    });
  }

  return [...tokens].slice(0, MAX_TOKENS);
};
