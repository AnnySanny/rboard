import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  arrayRemove,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  createAdminLog,
  ADMIN_LOG_ACTIONS,
} from "../../utils/adminLogger";
import { db } from "../../firebase";
import UserStatisticsModal from "../../components/admin/UserStatisticsModal";

const STATUS_FILTERS = [
  {
    value: "all",
    label: "Усі користувачі",
  },
  {
    value: "active",
    label: "Активні",
  },
  {
    value: "blocked",
    label: "Заблоковані",
  },
  {
    value: "online",
    label: "На платформі",
  },
  {
    value: "offline",
    label: "Не в мережі",
  },
];


const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Спочатку нові",
  },
  {
    value: "oldest",
    label: "Спочатку старі",
  },
  {
    value: "mostListings",
    label: "Найбільше оголошень",
  },
  {
    value: "leastListings",
    label: "Найменше оголошень",
  },
  {
    value: "alphabetical",
    label: "За ім’ям",
  },
];


const DELETE_BATCH_SIZE = 100;

const deleteDocuments = async (createQuery) => {
  let count = 0;

  while (true) {
    const snapshot = await getDocs(createQuery());

    if (snapshot.empty) break;

    const batch = writeBatch(db);

    snapshot.docs.forEach((item) => {
      batch.delete(item.ref);
    });

    await batch.commit();
    count += snapshot.size;
  }

  return count;
};

const deleteUserReviews = async (uid) => {
  const received = await deleteDocuments(() =>
    query(
      collection(db, "publicProfiles", uid, "reviews"),
      limit(DELETE_BATCH_SIZE)
    )
  );

  const written = await deleteDocuments(() =>
    query(
      collectionGroup(db, "reviews"),
      where("reviewerUid", "==", uid),
      limit(DELETE_BATCH_SIZE)
    )
  );

  return { received, written };
};

const deleteUserChats = async (uid) => {
  let count = 0;

  while (true) {
    const snapshot = await getDocs(
      query(
        collection(db, "chats"),
        where("participants", "array-contains", uid),
        limit(DELETE_BATCH_SIZE)
      )
    );

    if (snapshot.empty) break;

    for (const chat of snapshot.docs) {
      await deleteDocuments(() =>
        query(
          collection(db, "chats", chat.id, "messages"),
          limit(DELETE_BATCH_SIZE)
        )
      );

      await deleteDoc(chat.ref);
      count++;
    }
  }

  return count;
};

const deleteListingViews = async (listingId) => {
  return deleteDocuments(() =>
    query(
      collection(db, "listingViews"),
      where("listingId", "==", listingId),
      limit(DELETE_BATCH_SIZE)
    )
  );
};

const deleteUserListings = async (uid) => {
  let count = 0;

  while (true) {
    const snapshot = await getDocs(
      query(
        collection(db, "listings"),
        where("author.uid", "==", uid),
        limit(DELETE_BATCH_SIZE)
      )
    );

    if (snapshot.empty) break;

    for (const listing of snapshot.docs) {
      await deleteListingViews(listing.id);
      await deleteDoc(listing.ref);
      count++;
    }
  }

  return count;
};

const deleteOwnListingViews = async (uid) => {
  let count = 0;

  while (true) {
    const snapshot = await getDocs(
      query(
        collection(db, "listingViews"),
        where("viewerType", "==", "user"),
        where("viewerId", "==", `user_${uid}`),
        limit(DELETE_BATCH_SIZE)
      )
    );

    if (snapshot.empty) break;

    for (const view of snapshot.docs) {
      const listingId = view.data().listingId;

      if (!listingId) {
        await deleteDoc(view.ref);
        count++;
        continue;
      }

      const listingRef = doc(db, "listings", listingId);

      const deleted = await runTransaction(
        db,
        async (transaction) => {
          const currentView = await transaction.get(view.ref);
          const currentListing = await transaction.get(listingRef);

          if (!currentView.exists()) return false;

          transaction.delete(view.ref);

          if (currentListing.exists()) {
            const views = Number(
              currentListing.data().views ?? 0
            );

            transaction.update(listingRef, {
              views: Math.max(0, views - 1),
            });
          }

          return true;
        }
      );

      if (deleted) count++;
    }
  }

  return count;
};

const removeUserFavorites = async (uid) => {
  let count = 0;

  while (true) {
    const snapshot = await getDocs(
      query(
        collection(db, "listings"),
        where("favoriteUserIds", "array-contains", uid),
        limit(DELETE_BATCH_SIZE)
      )
    );

    if (snapshot.empty) break;

    const batch = writeBatch(db);

    snapshot.docs.forEach((listing) => {
      batch.update(listing.ref, {
        favoriteUserIds: arrayRemove(uid),
      });
    });

    await batch.commit();
    count += snapshot.size;
  }

  return count;
};

const AdminUsers = () => {
  const [users, setUsers] =
    useState([]);
  const [userPresence, setUserPresence] = useState({});
  const [presenceNow, setPresenceNow] = useState(Date.now());

  const [listings, setListings] =
    useState([]);

  const [usersLoading, setUsersLoading] =
    useState(true);

  const [
    listingsLoading,
    setListingsLoading,
  ] = useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [sortOrder, setSortOrder] =
    useState("newest");

  const [
    changingBlockId,
    setChangingBlockId,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    statisticsUser,
    setStatisticsUser,
  ] = useState(null);

  const loading =
    usersLoading ||
    listingsLoading;

  /*
   * Користувачі
   */
  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(db, "users"),

        (snapshot) => {
          const receivedUsers =
            snapshot.docs
              .filter((document) => {
                const data =
                  document.data();

                return (
                  data.role !== "admin"
                );
              })
              .map((document) => {
                const data =
                  document.data();

                return {
                  id: document.id,

                  login:
                    data.login || "",

                  phone:
                    data.phone || "",

                  email:
                    data.email || "",

                  role:
                    data.role || "user",

                  blocked:
                    data.blocked ===
                    true,

                  createdAt:
                    data.createdAt ||
                    null,
                };
              });

          setUsers(
            receivedUsers
          );

          setUsersLoading(false);
        },

        (error) => {
          console.error(
            "Помилка завантаження користувачів:",
            error
          );

          setLoadError(
            "Не вдалося завантажити користувачів."
          );

          setUsersLoading(false);
        }
      );

    return unsubscribe;
  }, []);


  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "userPresence"),
      (snapshot) => {
        const presence = {};

        snapshot.forEach((documentSnapshot) => {
          presence[documentSnapshot.id] =
            documentSnapshot.data().lastSeenAt?.toMillis?.() ?? null;
        });

        setUserPresence(presence);
        setPresenceNow(Date.now());
      },
      (error) => {
        console.error("Помилка завантаження онлайн-статусів:", error);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceNow(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);



  /*
   * Усі оголошення.
   *
   * Вони потрібні для:
   * - кількості оголошень;
   * - статусів;
   * - сортування;
   * - статистики;
   * - каскадного видалення.
   */
  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "listings"
        ),

        (snapshot) => {
          const receivedListings =
            snapshot.docs.map(
              (document) => {
                const data =
                  document.data();

                return {
                  id:
                    document.id,

                  authorUid:
                    data.author
                      ?.uid ||
                    null,

                  title:
                    data.title ||
                    "",

                  status:
                    data.status ||
                    "pending",

                  type:
                    data.type ||
                    "Інше",

                  views:
                    Number(
                      data.views ??
                      0
                    ),

                  createdAt:
                    data.createdAt ||
                    null,
                };
              }
            );

          setListings(
            receivedListings
          );

          setListingsLoading(
            false
          );
        },

        (error) => {
          console.error(
            "Помилка завантаження оголошень:",
            error
          );

          setLoadError(
            "Не вдалося завантажити дані оголошень."
          );

          setListingsLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * Формуємо статистику
   * оголошень кожного користувача.
   */
  const usersWithStatistics =
    useMemo(() => {
      const listingsByUser =
        new Map();

      listings.forEach(
        (listing) => {
          if (
            !listing.authorUid
          ) {
            return;
          }

          if (
            !listingsByUser.has(
              listing.authorUid
            )
          ) {
            listingsByUser.set(
              listing.authorUid,
              []
            );
          }

          listingsByUser
            .get(
              listing.authorUid
            )
            .push(listing);
        }
      );

      return users.map(
        (user) => {
          const userListings =
            listingsByUser.get(
              user.id
            ) || [];

          const approved =
            userListings.filter(
              (listing) =>
                listing.status ===
                "approved"
            ).length;

          const pending =
            userListings.filter(
              (listing) =>
                listing.status ===
                "pending"
            ).length;

          /*
           * У твоєму проєкті
           * відхилений статус —
           * cancelled.
           */
          const cancelled =
            userListings.filter(
              (listing) =>
                listing.status ===
                "cancelled"
            ).length;

          const totalViews =
            userListings.reduce(
              (
                total,
                listing
              ) =>
                total +
                Number(
                  listing.views ??
                  0
                ),
              0
            );

          return {
            ...user,
            online:
              !user.blocked &&
              typeof userPresence[user.id] === "number" &&
              presenceNow - userPresence[user.id] >= 0 &&
              presenceNow - userPresence[user.id] < 5 * 60 * 1000,
            listings:
              userListings,

            listingsCount:
              userListings.length,

            approved,

            pending,

            cancelled,

            totalViews,
          };
        }
      );
    }, [users, listings, userPresence, presenceNow]);

  /*
   * Пошук + фільтри +
   * сортування
   */
  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const result =
        usersWithStatistics.filter(
          (user) => {

            const matchesStatus =
              statusFilter === "all" ||
              (statusFilter === "blocked" && user.blocked) ||
              (statusFilter === "active" && !user.blocked) ||
              (statusFilter === "online" && user.online) ||
              (statusFilter === "offline" && !user.online);

            const searchableText =
              [
                user.login,
                user.phone,
                user.email,
                user.id,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
              !normalizedSearch ||
              searchableText.includes(
                normalizedSearch
              );

            return (
              matchesStatus &&
              matchesSearch
            );
          }
        );

      result.sort(
        (first, second) => {
          if (
            sortOrder ===
            "alphabetical"
          ) {
            return first.login.localeCompare(
              second.login,
              "uk"
            );
          }

          if (
            sortOrder ===
            "mostListings"
          ) {
            return (
              second.listingsCount -
              first.listingsCount
            );
          }

          if (
            sortOrder ===
            "leastListings"
          ) {
            return (
              first.listingsCount -
              second.listingsCount
            );
          }

          const firstDate =
            getTimestamp(
              first.createdAt
            );

          const secondDate =
            getTimestamp(
              second.createdAt
            );

          if (
            sortOrder ===
            "oldest"
          ) {
            return (
              firstDate -
              secondDate
            );
          }

          return (
            secondDate -
            firstDate
          );
        }
      );

      return result;
    }, [
      usersWithStatistics,
      search,
      statusFilter,
      sortOrder,
    ]);

  /*
   * Блокування /
   * розблокування
   */
  const handleToggleBlock =
    async (user) => {
      const willBlock =
        !user.blocked;

      const result =
        await Swal.fire({
          icon: willBlock
            ? "warning"
            : "question",

          title: willBlock
            ? "Заблокувати користувача?"
            : "Розблокувати користувача?",

          html: willBlock
            ? `
              <div style="line-height:1.6">
                Користувач
                <strong>${escapeHtml(
              user.login
            )}</strong>
                буде заблокований.
              </div>
            `
            : `
              <div style="line-height:1.6">
                Користувач
                <strong>${escapeHtml(
              user.login
            )}</strong>
                знову отримає доступ.
              </div>
            `,

          showCancelButton: true,

          confirmButtonText:
            willBlock
              ? "Заблокувати"
              : "Розблокувати",

          cancelButtonText:
            "Скасувати",

          confirmButtonColor:
            willBlock
              ? "#dc2626"
              : "#2563eb",

          cancelButtonColor:
            "#64748b",

          reverseButtons: true,
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      try {
        setChangingBlockId(
          user.id
        );

        const userRef = doc(
          db,
          "users",
          user.id
        );

        if (willBlock) {
          /*
           * Якщо поля blocked
           * немає — updateDoc
           * просто створить його.
           */
          await updateDoc(
            userRef,
            {
              blocked: true,
            }
          );
        } else {
          /*
           * При розблокуванні
           * залишаємо blocked:false.
           *
           * Так у БД одразу видно
           * стан користувача.
           */
          await updateDoc(
            userRef,
            {
              blocked: false,
            }
          );
        }
        await createAdminLog({
          action:
            willBlock
              ? ADMIN_LOG_ACTIONS.USER_BLOCKED
              : ADMIN_LOG_ACTIONS.USER_UNBLOCKED,

          category:
            "users",

          title:
            willBlock
              ? "Заблоковано користувача"
              : "Розблоковано користувача",

          description:
            willBlock
              ? `Користувача «${user.login || "Без імені"}» заблоковано.`
              : `Користувача «${user.login || "Без імені"}» розблоковано.`,

          targetId:
            user.id,

          targetName:
            user.login || "Без імені",
        });
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",

          title: willBlock
            ? "Користувача заблоковано"
            : "Користувача розблоковано",

          showConfirmButton:
            false,

          timer: 2000,

          timerProgressBar:
            true,
        });
      } catch (error) {
        console.error(
          "Помилка зміни блокування:",
          error
        );

        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title:
            "Не вдалося змінити статус користувача",
          showConfirmButton:
            false,
          timer: 2500,
          timerProgressBar:
            true,
        });
      } finally {
        setChangingBlockId(
          null
        );
      }
    };

  /*
   * Видалення користувача
   * + ВСІХ його оголошень.
   */
  
const handleDelete = async (user) => {
  const result = await Swal.fire({
    icon: "warning",
    title: "Видалити користувача?",
    html: `
      <div style="line-height:1.7;color:#64748b">
        <p>
          Користувача
          <strong style="color:#0f172a">
            ${escapeHtml(user.login || "Без імені")}
          </strong>
          та його дані буде назавжди видалено.
        </p>
        <p style="margin-top:12px">
          Будуть очищені профіль, оголошення, перегляди,
          обране, чати, повідомлення та відгуки.
        </p>
        <p style="margin-top:12px;color:#dc2626;font-weight:600">
          Цю дію неможливо скасувати.
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Видалити дані",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  setDeletingId(user.id);

  try {
    const uid = user.id;

    const reviews = await deleteUserReviews(uid);
    const chatsCount = await deleteUserChats(uid);
    const listingsCount = await deleteUserListings(uid);
    const viewsCount = await deleteOwnListingViews(uid);
    const favoritesCount = await removeUserFavorites(uid);

    await deleteDoc(doc(db, "userPresence", uid));
    await deleteDoc(doc(db, "publicProfiles", uid));
    await deleteDoc(doc(db, "users", uid));

    setStatisticsUser((current) =>
      current?.id === uid ? null : current
    );

    try {
      await createAdminLog({
        action: ADMIN_LOG_ACTIONS.USER_DELETED,
        category: "users",
        title: "Видалено дані користувача",
        description:
          `Видалено дані користувача «${user.login || "Без імені"}». ` +
          `Оголошень: ${listingsCount}, ` +
          `власних переглядів: ${viewsCount}, ` +
          `записів обраного: ${favoritesCount}, ` +
          `чатів: ${chatsCount}, ` +
          `отриманих відгуків: ${reviews.received}, ` +
          `залишених відгуків: ${reviews.written}.`,
        targetId: uid,
        targetName: user.login || "Без імені",
      });
    } catch (logError) {
      console.error("Помилка запису журналу:", logError);
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Дані користувача видалено",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error("Помилка видалення користувача:", error);

    await Swal.fire({
      icon: "error",
      title: "Не вдалося завершити видалення",
      text: "Частину даних уже могло бути видалено. Перевірте Firestore та повторіть операцію.",
      confirmButtonColor: "#2563eb",
    });
  } finally {
    setDeletingId(null);
  }
};


  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Адміністрування
            </span>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Користувачі
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Керуйте користувачами,
              їхнім доступом та
              оголошеннями.
            </p>
          </div>

          {!loading &&
            !loadError && (
              <div className="flex flex-wrap gap-2">
                <CounterBadge
                  label="Всього"
                  value={
                    users.length
                  }
                />

                <CounterBadge
                  label="Активні"
                  value={
                    users.filter(
                      (user) =>
                        !user.blocked
                    ).length
                  }
                  green
                />

                <CounterBadge
                  label="Заблоковані"
                  value={
                    users.filter(
                      (user) =>
                        user.blocked
                    ).length
                  }
                  red
                />
              </div>
            )}
        </div>
      </section>

      {/* Пошук + фільтри */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Пошук */}
          <div className="relative flex-1">
            <SearchIcon />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Пошук за ім’ям, телефоном, поштою..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Статус */}
          <div className="relative lg:w-52">
            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {STATUS_FILTERS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <SelectArrow />
          </div>

          {/* Сортування */}
          <div className="relative lg:w-60">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <SelectArrow />
          </div>
        </div>
      </section>

      {/* Завантаження */}
      {loading && (
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Завантаження
            користувачів...
          </p>
        </section>
      )}

      {/* Помилка */}
      {!loading &&
        loadError && (
          <section className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="font-semibold text-red-700">
              {loadError}
            </p>
          </section>
        )}

      {/* Нічого немає */}
      {!loading &&
        !loadError &&
        filteredUsers.length ===
        0 && (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersIcon />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900">
              Користувачів не
              знайдено
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Спробуйте змінити
              пошук або фільтри.
            </p>
          </section>
        )}

      {/* Таблиця */}
      {!loading &&
        !loadError &&
        filteredUsers.length >
        0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <TableHeader>
                      Користувач
                    </TableHeader>

                    <TableHeader>
                      Контакт
                    </TableHeader>

                    <TableHeader>
                      Оголошення
                    </TableHeader>

                    <TableHeader>
                      Статус
                    </TableHeader>

                    <TableHeader
                      alignRight
                    >
                      Дії
                    </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(
                    (user) => (
                      <UserRow
                        key={
                          user.id
                        }
                        user={user}
                        changingBlock={
                          changingBlockId ===
                          user.id
                        }
                        deleting={
                          deletingId ===
                          user.id
                        }
                        onStatistics={() =>
                          setStatisticsUser(
                            user
                          )
                        }
                        onToggleBlock={() =>
                          handleToggleBlock(
                            user
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            user
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET */}
            <div className="divide-y divide-slate-100 xl:hidden">
              {filteredUsers.map(
                (user) => (
                  <UserMobileCard
                    key={user.id}
                    user={user}
                    changingBlock={
                      changingBlockId ===
                      user.id
                    }
                    deleting={
                      deletingId ===
                      user.id
                    }
                    onStatistics={() =>
                      setStatisticsUser(
                        user
                      )
                    }
                    onToggleBlock={() =>
                      handleToggleBlock(
                        user
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        user
                      )
                    }
                  />
                )
              )}
            </div>
          </section>
        )}

      {/* Статистика */}
      {statisticsUser && (
        <UserStatisticsModal
          user={
            statisticsUser
          }
          onClose={() =>
            setStatisticsUser(
              null
            )
          }
        />
      )}
    </div>
  );
};

/*
 * Desktop рядок
 */
const UserRow = ({
  user,
  changingBlock,
  deleting,
  onStatistics,
  onToggleBlock,
  onDelete,
}) => {
  return (
    <tr className="transition hover:bg-slate-50/80">
      {/* Користувач */}
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.login}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">

              <Link
                to={`/dashboard/users/${encodeURIComponent(user.id)}`}
                className="font-black text-slate-900 transition-colors hover:text-blue-600 hover:underline hover:underline-offset-4 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title={`Переглянути профіль: ${user.login || "Без імені"}`}
              >
                {user.login || "Без імені"}
              </Link>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              {formatDate(
                user.createdAt
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Контакт */}
      <td className="px-6 py-5">
        <p className="max-w-[220px] break-all text-sm font-bold text-blue-600">
          {user.email ||
            user.phone ||
            "Не вказано"}
        </p>
      </td>

      {/* Оголошення */}
      <td className="px-6 py-5">
        <ListingsStats
          user={user}
        />
      </td>

      {/* Статус */}
      <td className="px-6 py-5">
        <UserStatus
          blocked={user.blocked}
          online={user.online}
        />
      </td>

      {/* Дії */}
      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">
          <StatisticsButton
            onClick={
              onStatistics
            }
          />

          <BlockButton
            blocked={
              user.blocked
            }
            loading={
              changingBlock
            }
            onClick={
              onToggleBlock
            }
          />

          <DeleteButton
            loading={deleting}
            onClick={onDelete}
          />
        </div>
      </td>
    </tr>
  );
};

/*
 * Mobile картка
 */

const UserMobileCard = ({
  user,
  changingBlock,
  deleting,
  onStatistics,
  onToggleBlock,
  onDelete,
}) => {
  return (
    <article className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <UserAvatar name={user.login} />

        <div className="min-w-0 flex-1">
          <Link
            to={`/dashboard/users/${encodeURIComponent(user.id)}`}
            className="block w-fit max-w-full truncate text-sm font-black text-slate-900 transition hover:text-blue-600"
            title={`Переглянути профіль: ${user.login || "Без імені"}`}
          >
            {user.login || "Без імені"}
          </Link>

          <p className="mt-1 break-all text-xs font-medium text-slate-500">
            {user.email || user.phone || "Контакт не вказано"}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Реєстрація: {formatDate(user.createdAt)}
          </p>
        </div>

        <Link
          to={`/dashboard/users/${encodeURIComponent(user.id)}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          aria-label="Переглянути профіль"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <UserStatus
          blocked={user.blocked}
          online={user.online}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Оголошення
          </span>

          <span className="text-xs font-bold text-slate-600">
            Всього: {user.listingsCount}
          </span>
        </div>

        <ListingsStats user={user} mobile />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onStatistics}
          disabled={deleting || changingBlock}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
        >
          <ChartIcon />
          <span>Статистика</span>
        </button>

        <button
          type="button"
          onClick={onToggleBlock}
          disabled={changingBlock || deleting}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition disabled:opacity-50 ${
            user.blocked
              ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          {changingBlock ? (
            <Spinner />
          ) : user.blocked ? (
            <UnlockIcon />
          ) : (
            <LockIcon />
          )}

          <span>
            {user.blocked ? "Розблок." : "Блокувати"}
          </span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting || changingBlock}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {deleting ? <Spinner /> : <TrashIcon />}
          <span>Видалити</span>
        </button>
      </div>
    </article>
  );
};


/*
 * Кількість оголошень
 */
const ListingsStats = ({
  user,
  mobile = false,
}) => (
  <div
    className={
      mobile
        ? "grid grid-cols-4 gap-2"
        : "flex items-center gap-2"
    }
  >
    <ListingCount
      value={
        user.listingsCount
      }
      label="Всього"
    />

    <ListingCount
      value={user.approved}
      label="Активні"
      green
    />

    <ListingCount
      value={user.pending}
      label="Перевірка"
      amber
    />

    <ListingCount
      value={
        user.cancelled
      }
      label="Скасовані"
      red
    />
  </div>
);

const ListingCount = ({
  value,
  label,
  green,
  amber,
  red,
}) => {
  let className =
    "border-slate-200 bg-slate-50 text-slate-700";

  if (green) {
    className =
      "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (amber) {
    className =
      "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (red) {
    className =
      "border-red-100 bg-red-50 text-red-700";
  }

  return (
    <div
      className={`min-w-[58px] rounded-xl border px-2.5 py-2 text-center ${className}`}
      title={`${label}: ${value}`}
    >
      <p className="text-sm font-black">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>
    </div>
  );
};

/*
 * Статус користувача
 */

const UserStatus = ({ blocked, online }) => (
  <div className="flex flex-col items-start gap-1.5">
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${blocked
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-blue-100 bg-blue-50 text-blue-700"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${blocked ? "bg-red-500" : "bg-blue-500"
          }`}
      />
      {blocked ? "Заблокований" : "Активний"}
    </span>

    <span
      className={`inline-flex items-center gap-1.5 px-1 text-[11px] font-semibold ${online ? "text-emerald-600" : "text-red-500"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-red-400"
          }`}
      />
      {online ? "На платформі" : "Не в мережі"}
    </span>
  </div>
);


/*
 * Кнопки desktop
 */
const StatisticsButton = ({
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
    title="Статистика"
  >
    <ChartIcon />
  </button>
);

const BlockButton = ({
  blocked,
  loading,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${blocked
      ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
      : "border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100"
      }`}
    title={
      blocked
        ? "Розблокувати"
        : "Заблокувати"
    }
  >
    {loading ? (
      <Spinner />
    ) : blocked ? (
      <UnlockIcon />
    ) : (
      <LockIcon />
    )}
  </button>
);

const DeleteButton = ({
  loading,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    title="Видалити користувача"
  >
    {loading ? (
      <Spinner />
    ) : (
      <TrashIcon />
    )}
  </button>
);


/*
 * Допоміжні компоненти
 */
const CounterBadge = ({
  label,
  value,
  green,
  red,
}) => {
  let className =
    "bg-blue-50 text-blue-700";

  if (green) {
    className =
      "bg-emerald-50 text-emerald-700";
  }

  if (red) {
    className =
      "bg-red-50 text-red-700";
  }

  return (
    <div
      className={`rounded-xl px-4 py-2 text-sm font-bold ${className}`}
    >
      {label}: {value}
    </div>
  );
};

const TableHeader = ({
  children,
  alignRight,
}) => (
  <th
    className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400 ${alignRight
      ? "text-right"
      : "text-left"
      }`}
  >
    {children}
  </th>
);

const UserAvatar = ({
  name,
}) => {
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase()
      )
      .join("") || "U";

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">
      {initials}
    </div>
  );
};

/*
 * Helpers
 */
const getTimestamp = (
  value
) => {
  if (!value) {
    return 0;
  }

  const date =
    value?.toDate?.() ||
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();
};

const formatDate = (
  value
) => {
  if (!value) {
    return "Дата не вказана";
  }

  const date =
    value?.toDate?.() ||
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Дата не вказана";
  }

  return date.toLocaleDateString(
    "uk-UA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const escapeHtml = (
  value = ""
) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );

/*
 * Icons
 */
const SearchIcon = () => (
  <svg
    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle
      cx="11"
      cy="11"
      r="8"
    />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const SelectArrow = () => (
  <svg
    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChartIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

const LockIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="11"
      rx="2"
    />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const UnlockIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="11"
      rx="2"
    />
    <path d="M8 10V7a4 4 0 0 1 7.5-2" />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

const UsersIcon = () => (
  <svg
    className="h-7 w-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle
      cx="9"
      cy="7"
      r="4"
    />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

export default AdminUsers;