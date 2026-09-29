import { initializeApp } from "firebase/app";
import {
    collection,
    getDocs,
    getFirestore,
    query,
    where,
} from "firebase/firestore";

import fs from "node:fs";

const firebaseConfig = {
    apiKey: "AIzaSyC7NvuxpLtsNkH40S07-pPa2LHmlMxKlUw",
    authDomain: "rboard-f06b0.firebaseapp.com",
    projectId: "rboard-f06b0",
    storageBucket: "rboard-f06b0.firebasestorage.app",
    messagingSenderId: "763581356708",
    appId: "1:763581356708:web:f5b8fca10f6fb604956431",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SITE_URL = "https://rboard.netlify.app";

const generateSitemap = async () => {
    console.log("Генерація sitemap...");

    const listingsQuery = query(
        collection(db, "listings"),
        where("status", "==", "approved")
    );

    const snapshot = await getDocs(listingsQuery);

    const now = new Date();

    const listings = snapshot.docs.filter((document) => {
        const data = document.data();

        if (!data.expiresAt) {
            return false;
        }

        const expiresAt =
            data.expiresAt?.toDate?.() ||
            new Date(data.expiresAt);

        return (
            !Number.isNaN(expiresAt.getTime()) &&
            expiresAt > now
        );
    });

    console.log(
        `Активних оголошень для sitemap: ${listings.length}`
    );

const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/about`,
    `${SITE_URL}/rules`,
    `${SITE_URL}/contacts`,
];

const categorySlugs = [
    "sale",
    "buy",
    "rent",
    "services",
    "jobs",
    "questions",
    "exchange",
    "free",
    "lost-found",
    "events",
    "community",
    "other",
];

const categoryUrls = categorySlugs.map(
    (slug) =>
        `${SITE_URL}/category/${slug}`
);

const listingUrls = listings.map(
    (document) =>
        `${SITE_URL}/listing/${document.id}`
);

const urls = [
    ...staticUrls,
    ...categoryUrls,
    ...listingUrls,
];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
        (url) => `  <url>
    <loc>${url}</loc>
  </url>`
    )
    .join("\n")}
</urlset>
`;

    fs.writeFileSync(
        "./public/sitemap.xml",
        xml,
        "utf8"
    );

    console.log(
        `sitemap.xml створено. URL: ${urls.length}`
    );
};

generateSitemap().catch((error) => {
    console.error(
        "Помилка генерації sitemap:",
        error
    );

    process.exit(1);
});