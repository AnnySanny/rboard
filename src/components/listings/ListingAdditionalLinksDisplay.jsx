
import { Globe, MapPin } from "lucide-react";

import {
    FaYoutube,
    FaFacebookF,
    FaLinkedinIn,
    FaTiktok,
    FaInstagram,
    FaTelegramPlane,
    FaWhatsapp,
    FaTwitter,
    FaPinterestP,
    FaTwitch,
    FaDiscord,
    FaGithub,
    FaRedditAlien,
} from "react-icons/fa";

import {
    parseAdditionalLink,
} from "../../utils/additionalLinks";

const LINK_ICONS = {
    youtube: FaYoutube,
    facebook: FaFacebookF,
    linkedin: FaLinkedinIn,
    tiktok: FaTiktok,
    instagram: FaInstagram,
    telegram: FaTelegramPlane,
    whatsapp: FaWhatsapp,
    twitter: FaTwitter,
    pinterest: FaPinterestP,
    twitch: FaTwitch,
    discord: FaDiscord,
    github: FaGithub,
    reddit: FaRedditAlien,
    maps: MapPin,
    website: Globe,
};

export default function ListingAdditionalLinksDisplay({
    links = [],
}) {
    const validLinks = (Array.isArray(links) ? links : [])
        .map(parseAdditionalLink)
        .filter(Boolean)
        .slice(0, 5);

    if (validLinks.length === 0) {
        return null;
    }

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Посилання
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
                {validLinks.map((link, index) => {
                    const Icon =
                        LINK_ICONS[link.type] || Globe;

                    return (
                        <a
                            key={`${link.url}-${index}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={link.label}
                            aria-label={`Відкрити ${link.label}`}
                            className="
                                flex h-9 w-9
                                items-center justify-center
                                rounded-xl
                                border border-slate-200
                                bg-slate-50
                                text-blue-600
                                transition-all duration-200
                                hover:border-blue-300
                                hover:bg-blue-50
                                hover:text-blue-700
                                hover:-translate-y-0.5
                                focus-visible:outline
                                focus-visible:outline-2
                                focus-visible:outline-blue-500
                            "
                        >
                            <Icon size={18} />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
