
import { useEffect, useRef, useState } from "react";
import {
  Send,
  LoaderCircle,
  Reply,
  X,
} from "lucide-react";

const MAX_MESSAGE_LENGTH = 1000;
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 120;

export default function ChatComposer({
  onSend,
  disabled = false,
  deleting = false,
  replyTo = null,
  onCancelReply,
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
    text.trim().length > 0 &&
    text.trim().length <= MAX_MESSAGE_LENGTH;

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

  useEffect(() => {
    if (replyTo && !disabled) {
      textareaRef.current?.focus();
    }
  }, [replyTo, disabled]);

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
      <div className="mx-auto max-w-4xl">
        {replyTo && (
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
            <Reply
              size={20}
              className="shrink-0 text-blue-600"
            />

            <div className="min-w-0 flex-1 border-l-2 border-blue-500 pl-3">
              <p className="text-xs font-bold text-blue-600">
                У відповідь на повідомлення
              </p>

              <p className="mt-1 truncate text-xs text-slate-600">
                {replyTo.text}
              </p>
            </div>

            <button
              type="button"
              onClick={onCancelReply}
              disabled={sending || deleting}
              aria-label="Скасувати відповідь"
              title="Скасувати відповідь"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
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
                  : replyTo
                    ? "Напишіть відповідь..."
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
    </div>
  );
}
