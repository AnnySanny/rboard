
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  SmilePlus,
  Reply,
} from "lucide-react";

const REACTIONS = [
  "👍",
  "👎",
  "😂",
  "❤️",
  "🔥",
  "🥰",
];

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
  currentUserId,
  onReact,
  onReply,
  onJumpToReply,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const time = formatMessageTime(message.createdAt);

  const reactions = message.reactions || {};

  const reactionCounts = REACTIONS.map((emoji) => ({
    emoji,
    count: Object.values(reactions).filter(
      (value) => value === emoji
    ).length,
  })).filter((item) => item.count > 0);

  const ownReaction = reactions[currentUserId];

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleReaction = (emoji) => {
    onReact?.(emoji);
    setMenuOpen(false);
  };

  return (
    <div
      className={`flex w-full ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        ref={menuRef}
        className={`group relative flex max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative w-fit min-w-[85px] max-w-full rounded-2xl px-3.5 py-2.5 shadow-sm ${
            isOwn
              ? "rounded-br-md bg-blue-600 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {message.replyTo && (
            <button
              type="button"
              onClick={() =>
                onJumpToReply?.(message.replyTo.id)
              }
              className={`mb-2 block w-full min-w-0 rounded-lg border-l-[3px] px-2.5 py-2 text-left transition ${
                isOwn
                  ? "border-blue-200 bg-blue-500/70 hover:bg-blue-500"
                  : "border-blue-500 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 text-xs font-bold ${
                  isOwn ? "text-blue-100" : "text-blue-600"
                }`}
              >
                <Reply size={14} />
                У відповідь на повідомлення
              </div>

              <p
                className={`mt-1 line-clamp-2 break-words text-xs ${
                  isOwn ? "text-blue-50" : "text-slate-600"
                }`}
              >
                {message.replyTo.text}
              </p>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Дії з повідомленням"
            aria-expanded={menuOpen}
            className="block w-full cursor-pointer text-left"
          >
            <span className="block whitespace-pre-wrap break-words text-sm leading-[22px]">
              {message.text}
              <span className="inline-block w-[74px] align-baseline" />
            </span>
          </button>

          <div
            className={`pointer-events-none absolute bottom-2 right-3 flex items-center gap-1 whitespace-nowrap text-[10px] leading-none ${
              isOwn ? "text-blue-100" : "text-slate-400"
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

        {reactionCounts.length > 0 && (
          <div className="flex max-w-full flex-wrap gap-1">
            {reactionCounts.map(({ emoji, count }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                title="Змінити реакцію"
                className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-sm transition active:scale-95 ${
                  ownReaction === emoji
                    ? "border-blue-300 bg-blue-100 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="text-sm">{emoji}</span>
                <span className="font-semibold">{count}</span>
              </button>
            ))}
          </div>
        )}

        {!menuOpen && (
          <div
            className={`hidden items-center gap-1 sm:absolute sm:top-0 sm:flex sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${
              isOwn
                ? "sm:right-full sm:mr-2"
                : "sm:left-full sm:ml-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Реагувати на повідомлення"
              title="Реагувати"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-blue-600"
            >
              <SmilePlus size={17} />
            </button>

            <button
              type="button"
              onClick={() => onReply?.(message)}
              aria-label="Відповісти на повідомлення"
              title="Відповісти"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-blue-600"
            >
              <Reply size={17} />
            </button>
          </div>
        )}

        {menuOpen && (
          <div
            className={`relative z-20 flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg ${
              isOwn ? "self-end" : "self-start"
            }`}
          >
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                aria-label={`Поставити реакцію ${emoji}`}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:scale-110 hover:bg-blue-50 active:scale-95 ${
                  ownReaction === emoji ? "bg-blue-100" : ""
                }`}
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                onReply?.(message);
                setMenuOpen(false);
              }}
              aria-label="Відповісти"
              title="Відповісти"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-l border-slate-100 text-blue-600 transition hover:bg-blue-50"
            >
              <Reply size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
