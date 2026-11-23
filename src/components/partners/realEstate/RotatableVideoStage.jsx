
import { useEffect, useRef, useState } from "react";

export default function RotatableVideoStage({
  orientation = "vertical",
  rotation = "none",
  children,
}) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);

  const [availableWidth, setAvailableWidth] =
    useState(0);

  const [videoHeight, setVideoHeight] =
    useState(
      orientation === "vertical" ? 760 : 430
    );

  const videoWidth =
    orientation === "vertical" ? 400 : 760;

  const degrees =
    rotation === "right"
      ? 90
      : rotation === "left"
        ? -90
        : 0;

  const rotated = degrees !== 0;

  // Враховуємо ширину екрана
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      setAvailableWidth(viewport.clientWidth);
    });

    observer.observe(viewport);
    setAvailableWidth(viewport.clientWidth);

    return () => observer.disconnect();
  }, []);

  // Скидаємо початкову висоту при зміні формату
  useEffect(() => {
    setVideoHeight(
      orientation === "vertical" ? 760 : 430
    );
  }, [orientation]);

  // Визначаємо реальну висоту Facebook iframe
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateHeight = () => {
      const iframe = content.querySelector("iframe");

      const height =
        iframe?.offsetHeight ||
        content.scrollHeight ||
        0;

      if (height > 120) {
        setVideoHeight((previous) =>
          previous === Math.ceil(height)
            ? previous
            : Math.ceil(height)
        );
      }
    };

    const observer = new ResizeObserver(updateHeight);

    observer.observe(content);
    updateHeight();

    return () => observer.disconnect();
  }, [orientation]);

  // Після повороту ширина та висота міняються місцями
  const displayWidth = rotated
    ? videoHeight
    : videoWidth;

  const displayHeight = rotated
    ? videoWidth
    : videoHeight;

  // Масштабуємо, якщо плеєр ширший за екран
  const scale =
    availableWidth > 0
      ? Math.min(1, availableWidth / displayWidth)
      : 0;

  return (
    <div
      ref={viewportRef}
      className="flex w-full justify-center"
    >
      <div
        className="relative overflow-hidden rounded-xl bg-black"
        style={{
          width: displayWidth * scale,
          height: displayHeight * scale,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: videoWidth,
            height: videoHeight,
            transform: `
              translate(-50%, -50%)
              rotate(${degrees}deg)
              scale(${scale})
            `,
            transformOrigin: "center center",
            transition: "transform 250ms ease",
          }}
        >
          <div
            ref={contentRef}
            style={{ width: videoWidth }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
