
export const MAX_ADDITIONAL_LINKS = 5;

const SERVICES = [
    {
        type: "youtube",
        label: "YouTube",
        domains: ["youtube.com", "youtu.be"],
    },
    {
        type: "facebook",
        label: "Facebook",
        domains: ["facebook.com", "fb.com", "fb.watch"],
    },
    {
        type: "linkedin",
        label: "LinkedIn",
        domains: ["linkedin.com", "lnkd.in"],
    },
    {
        type: "tiktok",
        label: "TikTok",
        domains: ["tiktok.com"],
    },
    {
        type: "instagram",
        label: "Instagram",
        domains: ["instagram.com"],
    },
    {
        type: "telegram",
        label: "Telegram",
        domains: ["t.me", "telegram.me"],
    },
    {
        type: "whatsapp",
        label: "WhatsApp",
        domains: ["wa.me", "whatsapp.com"],
    },
    {
        type: "twitter",
        label: "X (Twitter)",
        domains: ["x.com", "twitter.com"],
    },
    {
        type: "pinterest",
        label: "Pinterest",
        domains: ["pinterest.com", "pin.it"],
    },
    {
        type: "twitch",
        label: "Twitch",
        domains: ["twitch.tv"],
    },
    {
        type: "discord",
        label: "Discord",
        domains: ["discord.com", "discord.gg"],
    },
    {
        type: "github",
        label: "GitHub",
        domains: ["github.com"],
    },
    {
        type: "reddit",
        label: "Reddit",
        domains: ["reddit.com"],
    },
    {
        type: "maps",
        label: "Google Maps",
        domains: ["maps.google.com", "maps.app.goo.gl"],
    },
];

export const parseAdditionalLink = (value) => {
    const input = String(value || "").trim();

    if (!input || /\s/.test(input)) {
        return null;
    }

    const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(input);

    if (
        hasProtocol &&
        !/^https?:\/\//i.test(input)
    ) {
        return null;
    }

    try {
        const url = new URL(
            hasProtocol ? input : `https://${input}`
        );

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        if (url.username || url.password) {
            return null;
        }

        const hostname = url.hostname.toLowerCase();

        if (
            !hostname.includes(".") ||
            hostname.startsWith(".") ||
            hostname.endsWith(".") ||
            hostname.endsWith(".local") ||
            /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
        ) {
            return null;
        }

        const service = SERVICES.find(({ domains }) =>
            domains.some(
                (domain) =>
                    hostname === domain ||
                    hostname.endsWith(`.${domain}`)
            )
        );

        return {
            url: url.href,
            type: service?.type || "website",
            label: service?.label || "Вебсайт",
            hostname: hostname.replace(/^www\./, ""),
        };
    } catch {
        return null;
    }
};
