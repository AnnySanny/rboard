
import { useRef, useState } from "react";
import { Trash2, LoaderCircle, ChevronRight } from "lucide-react";
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  where,
  collectionGroup,
  runTransaction,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { auth, db } from "../../firebase";
import { deleteChatForEveryone } from "../../utils/chatService";
import { stopAndRemoveUserPresence } from "../../utils/userPresence";
const DELETE_BATCH_SIZE = 50;

export default function ProfileDeleteAccount() {
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const navigate = useNavigate();

  const updateProgress = (message) => {
    Swal.update({
      title: "Видалення акаунта",
      text: message,
    });
  };
const runDeleteStep = async (name, action) => {
  console.log(`[Видалення] Початок: ${name}`);

  try {
    await action();
    console.log(`[Видалення] Успішно: ${name}`);
  } catch (error) {
    console.error(`[Видалення] Помилка: ${name}`, {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};
  const deleteDocuments = async (createQuery) => {
    while (true) {
      const snapshot = await getDocs(createQuery());

      if (snapshot.empty) break;

      for (const documentSnapshot of snapshot.docs) {
        await deleteDoc(documentSnapshot.ref);
      }
    }
  };

  const deleteProfileReviews = async (uid) => {
    await deleteDocuments(() =>
      query(
        collection(db, "publicProfiles", uid, "reviews"),
        limit(DELETE_BATCH_SIZE)
      )
    );
  };

const deleteWrittenReviews = async (uid) => {
  await deleteDocuments(() =>
    query(
      collectionGroup(db, "reviews"),
      where("reviewerUid", "==", uid),
      limit(DELETE_BATCH_SIZE)
    )
  );
};

  const deleteUserChats = async (uid) => {
    while (true) {
      const snapshot = await getDocs(
        query(
          collection(db, "chats"),
          where("participants", "array-contains", uid),
          limit(DELETE_BATCH_SIZE)
        )
      );

      if (snapshot.empty) break;

      for (const chatSnapshot of snapshot.docs) {
        await deleteChatForEveryone(chatSnapshot.id);
      }
    }
  };


const deleteOwnListingViews = async (uid) => {
  let deletedCount = 0;

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

    for (const viewSnapshot of snapshot.docs) {
      const listingId = viewSnapshot.data().listingId;

      if (!listingId) {
        await deleteDoc(viewSnapshot.ref);
        deletedCount++;
        continue;
      }

      const listingRef = doc(db, "listings", listingId);

      const result = await runTransaction(
        db,
        async (transaction) => {
          const currentView = await transaction.get(
            viewSnapshot.ref
          );

          const currentListing = await transaction.get(
            listingRef
          );

          if (!currentView.exists()) {
            return false;
          }

          if (!currentListing.exists()) {
            transaction.delete(viewSnapshot.ref);
            return true;
          }

          const currentViews = Number(
            currentListing.data().views ?? 0
          );

          transaction.delete(viewSnapshot.ref);

          transaction.update(listingRef, {
            views: Math.max(0, currentViews - 1),
          });

          return true;
        }
      );

      if (result) {
        deletedCount++;
      }
    }
  }

  console.log(
    `[Видалення] Видалено ${deletedCount} переглядів користувача`
  );
};


  const deleteListingViews = async (listingId) => {
    await deleteDocuments(() =>
      query(
        collection(db, "listingViews"),
        where("listingId", "==", listingId),
        limit(DELETE_BATCH_SIZE)
      )
    );
  };


  const deleteUserListings = async (uid) => {
    while (true) {
      const snapshot = await getDocs(
        query(
          collection(db, "listings"),
          where("author.uid", "==", uid),
          limit(DELETE_BATCH_SIZE)
        )
      );

      if (snapshot.empty) break;

      for (const listingSnapshot of snapshot.docs) {
        await deleteListingViews(listingSnapshot.id);
        await deleteDoc(listingSnapshot.ref);
      }
    }
  };


  const handleDeleteAccount = async () => {
    if (deletingRef.current) return;

    const user = auth.currentUser;

    if (!user?.uid || !user.email) {
      await Swal.fire({
        icon: "error",
        title: "Помилка авторизації",
        text: "Не вдалося визначити поточного користувача.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }


    const confirmation = await Swal.fire({
      width: 460,
      padding: "28px 26px 24px",
      customClass: {
        popup: "rounded-3xl",
      },
      html: `
    <div style="font-family:inherit;text-align:left">

      <div style="
        display:flex;
        justify-content:center;
        margin-bottom:16px;
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:56px;
          height:56px;
          border-radius:18px;
          background:#fef2f2;
          color:#dc2626;
        ">
          <svg
            width="27"
            height="27"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18"/>
            <path d="M8 6V4h8v2"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 10v6"/>
            <path d="M14 10v6"/>
          </svg>
        </div>
      </div>

      <h2 style="
        margin:0;
        font-size:22px;
        font-weight:750;
        letter-spacing:-0.6px;
        color:#0f172a;
        text-align:center;
      ">
        Видалити акаунт?
      </h2>

      <p style="
        margin:10px auto 22px;
        max-width:350px;
        text-align:center;
        font-size:13px;
        line-height:1.7;
        color:#64748b;
      ">
        Ви збираєтеся назавжди видалити свій
        обліковий запис RBoard та пов'язані з ним дані.
      </p>

      <div style="
        border:1px solid #fee2e2;
        border-radius:16px;
        background:#fffafa;
        padding:16px;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          margin-bottom:14px;
          font-size:13px;
          font-weight:700;
          color:#b91c1c;
        ">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
          Що буде видалено
        </div>

        <div style="
          display:grid;
          gap:11px;
          font-size:12.5px;
          color:#475569;
        ">
          ${[
          "Ваш профіль та особисті дані",
          "Усі опубліковані оголошення",
          "Чати та історія повідомлень",
          "Відгуки на вашій сторінці",
          "Обліковий запис RBoard",
        ].map((item) => `
            <div style="
              display:flex;
              align-items:center;
              gap:10px;
            ">
              <span style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:18px;
                height:18px;
                flex-shrink:0;
                border-radius:6px;
                background:#fee2e2;
                color:#dc2626;
              ">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </span>
              <span>${item}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <div style="margin-top:22px">
        <label for="deleteAccountPassword" style="
          display:block;
          margin-bottom:9px;
          font-size:13px;
          font-weight:700;
          color:#334155;
        ">
          Підтвердження паролем
        </label>

        <div style="position:relative">
          <input
            id="deleteAccountPassword"
            type="password"
            autocomplete="current-password"
            placeholder="Введіть пароль від акаунта"
            style="
              width:100%;
              height:46px;
              box-sizing:border-box;
              padding:0 46px 0 15px;
              border:1px solid #e2e8f0;
              border-radius:12px;
              background:#f8fafc;
              color:#0f172a;
              font-size:13px;
              outline:none;
              transition:border-color .2s,box-shadow .2s;
            "
          />

          <button
            type="button"
            id="toggleDeletePassword"
            aria-label="Показати пароль"
            style="
              position:absolute;
              right:8px;
              top:50%;
              transform:translateY(-50%);
              display:flex;
              align-items:center;
              justify-content:center;
              width:34px;
              height:34px;
              border:0;
              border-radius:9px;
              background:transparent;
              color:#94a3b8;
              cursor:pointer;
            "
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <p id="deletePasswordError" style="
          display:none;
          margin:8px 0 0;
          font-size:12px;
          color:#dc2626;
        ">
          Введіть пароль для підтвердження.
        </p>

        <p style="
          margin:12px 0 0;
          font-size:11.5px;
          line-height:1.6;
          color:#94a3b8;
        ">
          Ця дія незворотна. Після видалення відновити
          обліковий запис та видалені дані буде неможливо.
        </p>
      </div>
    </div>
  `,
      showCancelButton: true,
      confirmButtonText: "Продовжити",
      cancelButtonText: "Скасувати",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#f1f5f9",
      reverseButtons: true,
      focusConfirm: false,
      didOpen: (popup) => {
        const passwordInput = popup.querySelector(
          "#deleteAccountPassword"
        );
        const toggleButton = popup.querySelector(
          "#toggleDeletePassword"
        );
        const errorElement = popup.querySelector(
          "#deletePasswordError"
        );

        const confirmButton = popup.querySelector(
          ".swal2-confirm"
        );
        const cancelButton = popup.querySelector(
          ".swal2-cancel"
        );

        if (confirmButton) {
          Object.assign(confirmButton.style, {
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: "650",
            boxShadow: "none",
          });
        }

        if (cancelButton) {
          Object.assign(cancelButton.style, {
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: "650",
            color: "#475569",
            boxShadow: "none",
          });
        }

        if (passwordInput) {
          passwordInput.addEventListener("focus", () => {
            passwordInput.style.borderColor = "#3b82f6";
            passwordInput.style.boxShadow =
              "0 0 0 3px #dbeafe";
          });

          passwordInput.addEventListener("blur", () => {
            passwordInput.style.borderColor = "#e2e8f0";
            passwordInput.style.boxShadow = "none";
          });

          passwordInput.addEventListener("input", () => {
            if (errorElement) {
              errorElement.style.display = "none";
            }
          });
        }

        toggleButton?.addEventListener("click", () => {
          if (!passwordInput) return;

          const isHidden =
            passwordInput.type === "password";

          passwordInput.type = isHidden
            ? "text"
            : "password";

          toggleButton.setAttribute(
            "aria-label",
            isHidden ? "Приховати пароль" : "Показати пароль"
          );
        });
      },
      preConfirm: () => {
        const password = document.getElementById(
          "deleteAccountPassword"
        )?.value || "";

        if (!password.trim()) {
          const errorElement = document.getElementById(
            "deletePasswordError"
          );

          if (errorElement) {
            errorElement.style.display = "block";
          }

          return false;
        }

        return password;
      },
    });


    if (!confirmation.isConfirmed) return;

    deletingRef.current = true;
    setDeleting(true);

    let cleanupStarted = false;

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        confirmation.value
      );
console.log("Повторна авторизація:", {
  uid: user.uid,
  email: user.email,
  providerIds: user.providerData.map((provider) => provider.providerId),
});
      await reauthenticateWithCredential(user, credential);


      const finalConfirmation = await Swal.fire({
        width: 440,
        icon: "warning",
        title: "Останнє підтвердження",
        html: `
    <div style="margin-top:8px;line-height:1.7;color:#64748b;font-size:14px">
      Після підтвердження розпочнеться
      <strong style="color:#dc2626">незворотне видалення</strong>
      вашого акаунта та пов'язаних даних.
      <p style="margin:12px 0 0;color:#334155;font-weight:600">
        Ви впевнені, що хочете продовжити?
      </p>
    </div>
  `,
        showCancelButton: true,
        confirmButtonText: "Так, видалити назавжди",
        cancelButtonText: "Скасувати",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
        focusCancel: true,
        customClass: {
          popup: "rounded-3xl",
          confirmButton: "rounded-xl",
          cancelButton: "rounded-xl",
        },
        didOpen: (popup) => {
          popup.style.borderRadius = "24px";

          popup.querySelectorAll(
            ".swal2-confirm, .swal2-cancel"
          ).forEach((button) => {
            button.style.borderRadius = "12px";
            button.style.padding = "12px 20px";
            button.style.fontSize = "13px";
            button.style.fontWeight = "600";
            button.style.boxShadow = "none";
          });
        },
      });


      if (!finalConfirmation.isConfirmed) return;

      Swal.fire({
        title: "Видалення акаунта",
        text: "Підготовка до видалення...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      cleanupStarted = true;


updateProgress("Видаляємо отримані відгуки...");
await runDeleteStep("Отримані відгуки", () =>
  deleteProfileReviews(user.uid)
);

updateProgress("Видаляємо залишені відгуки...");
await runDeleteStep("Залишені відгуки", () =>
  deleteWrittenReviews(user.uid)
);

updateProgress("Видаляємо розмови та повідомлення...");
await runDeleteStep("Чати", () =>
  deleteUserChats(user.uid)
);

updateProgress("Видаляємо історію переглядів...");
await runDeleteStep("Власні перегляди", () =>
  deleteOwnListingViews(user.uid)
);

updateProgress("Видаляємо оголошення та їхні перегляди...");
await runDeleteStep("Оголошення", () =>
  deleteUserListings(user.uid)
);

updateProgress("Видаляємо публічний профіль...");
await runDeleteStep("Публічний профіль", () =>
  deleteDoc(doc(db, "publicProfiles", user.uid))
);
await runDeleteStep("Статус присутності", () =>
  stopAndRemoveUserPresence(user.uid)
);
updateProgress("Видаляємо особисті дані...");
await runDeleteStep("Приватний профіль", () =>
  deleteDoc(doc(db, "users", user.uid))
);

updateProgress("Видаляємо обліковий запис...");
await runDeleteStep("Firebase Authentication", () =>
  deleteUser(user)
);

Swal.close();

      navigate("/", { replace: true });


      await Swal.fire({
        width: 410,
        padding: "30px 26px",
        showConfirmButton: false,
        showCloseButton: false,
        allowOutsideClick: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: "rounded-3xl",
        },
        html: `
    <div style="text-align:center;font-family:inherit">
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:60px;
        height:60px;
        margin:0 auto 18px;
        border-radius:19px;
        background:#ecfdf5;
        color:#059669;
      ">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>

      <h2 style="
        margin:0;
        font-size:21px;
        font-weight:750;
        letter-spacing:-0.5px;
        color:#0f172a;
      ">
        Акаунт видалено
      </h2>

      <p style="
        max-width:310px;
        margin:11px auto 0;
        font-size:13px;
        line-height:1.7;
        color:#64748b;
      ">
        Ваш обліковий запис RBoard та пов'язані дані
        успішно видалено.
        Дякуємо, що користувалися нашим сервісом!
      </p>
    </div>
  `,
        didOpen: (popup) => {
          popup.style.borderRadius = "24px";
        },
      });

    } catch (error) {
      Swal.close();

      console.error("Помилка видалення акаунта:", error);

      let message =
        "Не вдалося завершити видалення акаунта.";

      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password"
      ) {
        message = "Неправильний пароль.";
      } else if (error?.code === "auth/too-many-requests") {
        message =
          "Забагато спроб. Спробуйте пізніше.";
      } else if (error?.code === "permission-denied") {
        message =
          "Недостатньо прав для видалення частини даних. Перевірте правила Firestore.";
      } else if (
        error?.code === "auth/requires-recent-login"
      ) {
        message =
          "Для завершення потрібно повторно увійти в акаунт.";
      }

      if (cleanupStarted) {
        message +=
          " Частину даних уже могло бути видалено. Для завершення очищення може знадобитися допомога адміністратора.";
      }

      await Swal.fire({
        icon: "error",
        title: "Не вдалося завершити видалення",
        text: message,
        confirmButtonText: "Зрозуміло",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDeleteAccount}
      disabled={deleting}
      aria-label="Видалити акаунт"
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition group-hover:bg-red-100 group-hover:text-red-600">
        {deleting ? (
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
        ) : (
          <Trash2 size={19} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-800 transition group-hover:text-red-600">
          {deleting
            ? "Видалення акаунта..."
            : "Видалити акаунт"}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          Назавжди видалити профіль, оголошення та листування
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-slate-400 transition group-hover:text-red-500"
      />
    </button>
  );
}
