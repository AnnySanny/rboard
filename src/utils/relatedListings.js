
import {
    collection,
    getDocs,
    limit,
    query,
    Timestamp,
    where,
} from "firebase/firestore";

import { db } from "../firebase";
import { mapListingDocument } from "./listingMapper";

// Налаштування рекомендацій
const SETTINGS = {
    displayLimit: 3,
    categoryFetchLimit: 12,
    fallbackFetchLimit: 8,
    cacheDuration: 5 * 60 * 1000,
};

// Кеш отриманих оголошень
const cache = new Map();

// Запити, які вже виконуються
const pendingRequests = new Map();

const normalize = (value) =>
    String(value || "").trim().toLowerCase();

// Перевірка актуальності оголошення
const isActiveListing = (listing) => {
    if (!listing?.expiresAt) return false;

    const expiresAt =
        listing.expiresAt instanceof Date
            ? listing.expiresAt.getTime()
            : new Date(listing.expiresAt).getTime();

    return (
        Number.isFinite(expiresAt) &&
        expiresAt > Date.now()
    );
};

// Завантаження кандидатів із Firestore
const fetchCandidates = async (category = null) => {
    const cacheKey = category
        ? `category:${category}`
        : "fallback:all";

    const cached = cache.get(cacheKey);

    if (
        cached &&
        Date.now() - cached.timestamp <
            SETTINGS.cacheDuration
    ) {
        return cached.listings;
    }

    // Якщо такий запит уже виконується,
    // очікуємо його результат
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }

    const request = (async () => {
        const constraints = [
            where("status", "==", "approved"),
            where(
                "expiresAt",
                ">",
                Timestamp.now()
            ),
        ];

        if (category) {
            constraints.push(
                where("type", "==", category)
            );
        }

        constraints.push(
            limit(
                category
                    ? SETTINGS.categoryFetchLimit
                    : SETTINGS.fallbackFetchLimit
            )
        );

        const q = query(
            collection(db, "listings"),
            ...constraints
        );

        const snapshot = await getDocs(q);

        const results = snapshot.docs
            .map(mapListingDocument)
            .filter(isActiveListing);

        cache.set(cacheKey, {
            timestamp: Date.now(),
            listings: results,
        });

        return results;
    })();

    pendingRequests.set(cacheKey, request);

    try {
        return await request;
    } finally {
        pendingRequests.delete(cacheKey);
    }
};

// Оцінка схожості оголошення
const getSimilarityScore = (
    candidate,
    currentListing
) => {
    let score = 0;

    if (
        normalize(candidate.category) ===
        normalize(currentListing.category)
    ) {
        score += 100;
    }

    if (
        currentListing.city &&
        normalize(candidate.city) ===
            normalize(currentListing.city)
    ) {
        score += 40;
    }

    if (
        currentListing.district &&
        normalize(candidate.district) ===
            normalize(currentListing.district)
    ) {
        score += 15;
    }

    return score;
};

// Головна функція отримання рекомендацій
export const getRelatedListings = async (
    currentListing
) => {
    if (!currentListing?.id) {
        return [];
    }

    const category =
        currentListing.category || "Інше";

    // 1. Спочатку отримуємо оголошення
    // тієї самої категорії
    const categoryListings =
        await fetchCandidates(category);

    const candidates = new Map();

    const addCandidates = (items) => {
        items.forEach((item) => {
            if (
                item.id !== currentListing.id &&
                isActiveListing(item)
            ) {
                candidates.set(item.id, item);
            }
        });
    };

    addCandidates(categoryListings);

    // 2. Якщо недостатньо рекомендацій,
    // завантажуємо запасні
    if (
        candidates.size <
        SETTINGS.displayLimit
    ) {
        const fallbackListings =
            await fetchCandidates();

        addCandidates(fallbackListings);
    }

    // 3. Сортуємо за релевантністю
    const sorted = Array.from(
        candidates.values()
    ).sort((a, b) => {
        const scoreDifference =
            getSimilarityScore(b, currentListing) -
            getSimilarityScore(a, currentListing);

        if (scoreDifference !== 0) {
            return scoreDifference;
        }

        const dateA =
            a.createdAt instanceof Date
                ? a.createdAt.getTime()
                : 0;

        const dateB =
            b.createdAt instanceof Date
                ? b.createdAt.getTime()
                : 0;

        if (dateA !== dateB) {
            return dateB - dateA;
        }

        return a.id.localeCompare(b.id);
    });

    // 4. Повертаємо до трьох рекомендацій
    return sorted.slice(
        0,
        SETTINGS.displayLimit
    );
};

// За потреби очищаємо кеш
export const clearRelatedListingsCache = () => {
    cache.clear();
};
