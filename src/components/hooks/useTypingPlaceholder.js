import { useEffect, useState } from "react";

export default function useTypingPlaceholder(
    phrases,
    typingSpeed = 80,
    pauseTime = 1800
) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [text, setText] = useState("");

    useEffect(() => {
        if (!phrases || phrases.length === 0) {
            return;
        }

        const currentPhrase = phrases[phraseIndex];

        let timeout;

        // Поки фраза не надрукована повністю
        if (text.length < currentPhrase.length) {
            timeout = setTimeout(() => {
                setText(
                    currentPhrase.slice(
                        0,
                        text.length + 1
                    )
                );
            }, typingSpeed);
        }

        // Коли фраза надрукована
        else {
            timeout = setTimeout(() => {
                // Одразу очищаємо текст
                setText("");

                // Переходимо до наступної фрази
                setPhraseIndex(
                    (currentIndex) =>
                        (currentIndex + 1) %
                        phrases.length
                );
            }, pauseTime);
        }

        return () => clearTimeout(timeout);
    }, [
        text,
        phraseIndex,
        phrases,
        typingSpeed,
        pauseTime,
    ]);

    return text;
}