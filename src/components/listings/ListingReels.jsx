
import { useEffect, useRef, useState } from "react";
import {
  X,
  MapPin,
  ChevronUp,
  ChevronDown,
  ImageOff,
} from "lucide-react";
import ReelDetailsPanel from "./ReelDetailsPanel";

const SWIPE_THRESHOLD = 55;
const ANIMATION_DURATION = 350;

const getListingImages = (listing) => {
  const images = Array.isArray(listing?.images)
    ? listing.images
    : [];

  const urls = images
    .map((image) =>
      typeof image === "string"
        ? image
        : image?.imageUrl || image?.url
    )
    .filter((url) => typeof url === "string" && url.trim());

  if (urls.length) return urls;

  return typeof listing?.imageUrl === "string" &&
    listing.imageUrl.trim()
    ? [listing.imageUrl]
    : [];
};

const ReelCard = ({
  listing,
  onShowDetails,
  photoIndex = 0,
}) => {
  const [failedUrl, setFailedUrl] = useState(null);

  if (!listing) return null;

  const images = getListingImages(listing);
  const imageUrl = images[photoIndex] || null;
  const showPlaceholder = !imageUrl || failedUrl === imageUrl;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {!showPlaceholder ? (
        <img
          src={imageUrl}
          alt={`${listing.title} — фото ${photoIndex + 1}`}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#10264c] via-[#1d4ed8] to-[#0f172a] px-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm">
            <ImageOff size={36} className="text-white/90" />
          </div>
          <p className="mt-2 text-sm text-white/70">
            Фото відсутнє
          </p>
        </div>
      )}

      {images.length > 1 && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {photoIndex + 1} / {images.length}
          </span>

          <div className="flex max-w-[65vw] gap-1.5 overflow-hidden">
            {images.slice(0, 12).map((url, index) => (
              <span
                key={`${index}-${url}`}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  index === photoIndex
                    ? "bg-white"
                    : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/90" />

      <div
        className="absolute bottom-0 left-0 right-0 px-5 pt-24"
        style={{
          paddingBottom:
            "max(48px, env(safe-area-inset-bottom))",
        }}
      >
        {listing.type && (
          <span className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            {listing.type}
          </span>
        )}

        <h2 className="mb-3 line-clamp-2 text-2xl font-bold leading-tight">
          {listing.title}
        </h2>

        {(listing.city || listing.location) && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin size={16} />
            <span>
              {listing.city || listing.location}
            </span>
          </div>
        )}

        {listing.description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-white/80">
            {listing.description}
          </p>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onShowDetails();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition active:scale-[0.97]"
        >
          Детальніше
          <ChevronUp size={15} />
        </button>
      </div>
    </div>
  );
};

const ListingReels = ({
  listings = [],
  onClose,
  onLoadMore,
  hasMoreListings,
  loadingMore,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const [transition, setTransition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionStarted, setTransitionStarted] =
    useState(false);

  const touchStart = useRef(null);
  const requestedAtCount = useRef(null);
  const animationFrameRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const transitionRef = useRef(null);

  const total = listings.length;
  const listing = listings[activeIndex];

  useEffect(() => {
    if (
      total === 0 ||
      activeIndex < total - 3 ||
      !hasMoreListings ||
      loadingMore ||
      requestedAtCount.current === total
    ) {
      return;
    }

    requestedAtCount.current = total;
    onLoadMore?.();
  }, [
    activeIndex,
    total,
    hasMoreListings,
    loadingMore,
    onLoadMore,
  ]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (showDetails) {
        setShowDetails(false);
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, showDetails]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (animationTimeoutRef.current !== null) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const changeListing = (direction) => {
    if (showDetails || transitionRef.current) return;

    const nextIndex =
      direction === "next"
        ? activeIndex + 1
        : activeIndex - 1;

    if (nextIndex < 0 || nextIndex >= total) return;

    const nextTransition = {
      fromIndex: activeIndex,
      toIndex: nextIndex,
      direction,
    };

    transitionRef.current = nextTransition;

    setTransition(nextTransition);
    setIsAnimating(true);
    setTransitionStarted(false);

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        setTransitionStarted(true);
      });
    });

    animationTimeoutRef.current = setTimeout(() => {
      setActiveIndex(nextIndex);
      setPhotoIndex(0);
      setTransition(null);
      setIsAnimating(false);
      setTransitionStarted(false);

      transitionRef.current = null;
      animationTimeoutRef.current = null;
    }, ANIMATION_DURATION + 40);
  };

  const goNext = () => {
    changeListing("next");
  };

  const goPrevious = () => {
    changeListing("previous");
  };

  const handleTouchStart = (event) => {
    if (showDetails || transitionRef.current) return;
    if (event.touches.length !== 1) return;

    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const handleTouchEnd = (event) => {
    if (showDetails || transitionRef.current) {
      touchStart.current = null;
      return;
    }

    if (!touchStart.current) return;

    const dx =
      event.changedTouches[0].clientX - touchStart.current.x;

    const dy =
      event.changedTouches[0].clientY - touchStart.current.y;

    touchStart.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

    if (absX > absY) {
      const imageCount = getListingImages(listing).length;

      if (imageCount > 1) {
        setPhotoIndex((current) =>
          Math.max(
            0,
            Math.min(
              current + (dx < 0 ? 1 : -1),
              imageCount - 1
            )
          )
        );
      }
    } else {
      if (dy > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
  };

  if (!listing) return null;

  const outgoingListing = transition
    ? listings[transition.fromIndex]
    : listing;

  const incomingListing = transition
    ? listings[transition.toIndex]
    : null;

  const incomingStartY =
    transition?.direction === "next"
      ? "-100%"
      : "100%";

  const outgoingEndY =
    transition?.direction === "next"
      ? "100%"
      : "-100%";

  const currentIndex = transition
    ? transition.toIndex
    : activeIndex;

  const progressIndex = currentIndex % 20;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-black text-white sm:hidden"
      style={{
        height: "100dvh",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform:
            transition && transitionStarted
              ? `translate3d(0, ${outgoingEndY}, 0)`
              : "translate3d(0, 0, 0)",
          transition: transitionStarted
            ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "none",
          willChange: "transform",
        }}
      >
        <ReelCard
          key={outgoingListing?.id}
          listing={outgoingListing}
          photoIndex={photoIndex}
          onShowDetails={() => {
            if (!transitionRef.current) {
              setShowDetails(true);
            }
          }}
        />
      </div>

      {transition && incomingListing && (
        <div
          className="absolute inset-0"
          style={{
            transform: transitionStarted
              ? "translate3d(0, 0, 0)"
              : `translate3d(0, ${incomingStartY}, 0)`,
            transition: transitionStarted
              ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
            willChange: "transform",
          }}
        >
          <ReelCard
            key={incomingListing.id}
            listing={incomingListing}
            photoIndex={0}
            onShowDetails={() => {
              if (!transitionRef.current) {
                setShowDetails(true);
              }
            }}
          />
        </div>
      )}

      <div
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pb-4 pt-5"
        style={{
          paddingTop:
            "max(20px, env(safe-area-inset-top))",
        }}
      >
        <div>
          <div className="text-lg font-bold tracking-tight">
            RBoard{" "}
            <span className="text-blue-600">
              Reels
            </span>
          </div>

          <p className="mt-0.5 text-xs text-white/70">
            {currentIndex + 1} / {total}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showDetails) {
              setShowDetails(false);
            } else {
              onClose();
            }
          }}
          aria-label={
            showDetails
              ? "Згорнути деталі"
              : "Закрити Reels"
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
        >
          <X size={23} />
        </button>
      </div>

      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-1">
        {Array.from({
          length: Math.min(20, total),
        }).map((_, index) => (
          <div
            key={index}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-200 ${
              index === progressIndex
                ? "bg-white"
                : index < progressIndex
                  ? "bg-white/70"
                  : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {!showDetails && (
        <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isAnimating || activeIndex === 0}
            aria-label="Попереднє оголошення"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md disabled:opacity-30"
          >
            <ChevronUp size={22} />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={
              isAnimating ||
              activeIndex === total - 1
            }
            aria-label="Наступне оголошення"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md disabled:opacity-30"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      )}

      {loadingMore && !showDetails && (
        <div
          className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md"
          style={{
            bottom:
              "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Завантажуємо оголошення...
        </div>
      )}

      {showDetails && (
        <ReelDetailsPanel
          listing={listing}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default ListingReels;
