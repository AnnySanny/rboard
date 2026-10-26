
import { Check, CheckCheck } from "lucide-react";

const formatMessageTime = (value) => {
    if (!value) return "";

    const date =
        typeof value?.toDate === "function"
            ? value.toDate()
            : new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function ChatMessage({
    message,
    isOwn = false,
}) {
    const time = formatMessageTime(message.createdAt);

    return (
        <div
            className={`flex w-full ${isOwn ? "justify-end" : "justify-start"
                }`}
        >
            <div
                className={`relative w-fit min-w-[85px] max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[75%] ${isOwn
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    }`}
            >
                <p className="whitespace-pre-wrap break-words text-sm leading-[22px]">
                    {message.text}
                    <span className="inline-block w-[74px] align-baseline" />
                </p>

                <div
                    className={`absolute bottom-2 right-3 flex items-center gap-1 whitespace-nowrap text-[10px] leading-none ${isOwn ? "text-blue-100" : "text-slate-400"
                        }`}
                >
                    <span>{time}</span>

                    {isOwn &&
                        (message.read ? (
                            <CheckCheck
                                size={14}
                                strokeWidth={1.8}
                                className="text-sky-200"
                            />
                        ) : (
                            <Check size={14} strokeWidth={1.8} />
                        ))}
                </div>
            </div>
        </div>
    );
}
