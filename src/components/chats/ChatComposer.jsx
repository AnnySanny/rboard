
import { useRef, useState } from "react";
import { Send, LoaderCircle } from "lucide-react";

const MAX_MESSAGE_LENGTH = 1000;
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 120;

export default function ChatComposer({
  onSend,
  disabled = false,
  deleting = false,
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false);

  const canSend =
    !disabled &&
    !sending &&
    !deleting &&
    typeof onSend === "function" &&
    text.trim().length > 0;

  const resizeTextarea = (element) => {
    if (!element) return;

    element.style.height = `${MIN_INPUT_HEIGHT}px`;

    const nextHeight = Math.min(
      Math.max(element.scrollHeight, MIN_INPUT_HEIGHT),
      MAX_INPUT_HEIGHT
    );

    element.style.height = `${nextHeight}px`;
    element.style.overflowY =
      element.scrollHeight > MAX_INPUT_HEIGHT
        ? "auto"
        : "hidden";
  };

  const handleChange = (event) => {
    setText(event.target.value);
    resizeTextarea(event.target);
  };

  const handleSend = async () => {
    if (!canSend || sendingRef.current) return;

    const message = text.trim();

    sendingRef.current = true;
    setSending(true);

    try {
      const success = await onSend(message);

      if (success !== false) {
        setText((previous) =>
          previous.trim() === message ? "" : previous
        );

        requestAnimationFrame(() => {
          resizeTextarea(textareaRef.current);
        });
      }
    } catch (error) {
      console.error("Помилка надсилання:", error);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={disabled || sending || deleting}
            rows={1}
            placeholder={
              disabled || deleting
                ? "Листування поки недоступне"
                : "Напишіть повідомлення..."
            }
            aria-label="Текст повідомлення"
            style={{
              height: MIN_INPUT_HEIGHT,
              minHeight: MIN_INPUT_HEIGHT,
              maxHeight: MAX_INPUT_HEIGHT,
            }}
            className="block w-full min-w-0 resize-none overflow-y-hidden break-words rounded-xl bg-transparent px-3.5 py-[12px] text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          title="Надіслати повідомлення"
          aria-label="Надіслати повідомлення"
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:px-4"
        >
          {sending ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Send size={17} strokeWidth={2} />
          )}

          <span>Надіслати</span>
        </button>
      </div>
    </div>
  );
}
