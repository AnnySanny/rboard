
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  UserRound,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import { db } from "../../firebase";

export default function ListingAuthor({ listing }) {
  const authorUid = listing?.author?.uid || null;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authorUid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setProfile(null);

      try {
        const snapshot = await getDoc(
          doc(db, "publicProfiles", authorUid)
        );

        if (!active) return;

        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
      } catch (error) {
        console.error(
          "Помилка завантаження автора:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [authorUid]);

  const authorName =
    profile?.login ||
    listing?.authorName ||
    "Користувач RBoard";

  const authorAvatar = profile?.avatarUrl || null;

  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 sm:h-12 sm:w-12">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound
            className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-slate-400">
          Автор оголошення
        </span>

        <span className="mt-0.5 block truncate text-sm font-semibold text-slate-800">
          {authorName}
        </span>
      </span>

      {loading ? (
        <LoaderCircle
          size={17}
          className="shrink-0 animate-spin text-blue-400"
        />
      ) : authorUid ? (
        <ChevronRight
          size={18}
          className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      ) : null}
    </>
  );

  if (!authorUid) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        {content}
      </div>
    );
  }

  return (
    <Link
        to={`/user/${encodeURIComponent(authorUid)}`}
      title={`Переглянути профіль: ${authorName}`}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
    >
      {content}
    </Link>
  );
}
