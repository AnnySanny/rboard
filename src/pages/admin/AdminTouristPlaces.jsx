
import { useMemo, useRef, useState } from "react";
import {
  UserRound,
  Copy,
  Check,
  MessageSquareText,
  ExternalLink,
  Upload,
  Search,
  Trash2,
  Link2,
  Send,
  FileSpreadsheet,
  Download,
  Users,
} from "lucide-react";

const SITE_URL = "https://rboard.netlify.app/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61595151419973";
const INSTAGRAM_URL =
  "https://www.instagram.com/rakhivboard/";
const BOT_URL = "https://t.me/RBoard_Rakhiv_Bot";

const STORAGE_KEY = "rboard_invitation_records_v1";
const DEFAULT_GROUP = "Рахів | Дошка оголошень";

const VALID_STATUSES = [
  "new",
  "sent",
  "replied",
  "declined",
];

const createMessage = (name, title, groupName) =>
  [
    `Вітаю, ${name}! 👋`,

    `Побачили ваше оголошення «${title}» у групі «${groupName || DEFAULT_GROUP}».`,

    "Хочемо запропонувати вам також розмістити його на нашому місцевому сайті RBoard 💙",

    `🌐 ${SITE_URL}`,

    "✅ Розміщення оголошень абсолютно безкоштовне!",

    "📊 На RBoard ви можете відстежувати кількість переглядів свого оголошення, спілкуватися із зацікавленими людьми через особисті повідомлення та зручно керувати своїми публікаціями.",

    `📣 Також ваше оголошення може бути додатково опубліковане на нашій Facebook-сторінці, щоб його побачило ще більше людей:\n${FACEBOOK_URL}`,

    "💙 А щоб не пропускати нові оголошення, цікаві пропозиції та оновлення RBoard, запрошуємо підписатися на наші сторінки!",

    `📸 Instagram:\n${INSTAGRAM_URL}`,

    `🤖 Наш Telegram-бот:\n${BOT_URL}`,

    "Будемо раді бачити вас на RBoard! Дякуємо за увагу та гарного дня! 😊",
  ].join("\n\n");

const safeUrl = (value) => {
  const url = String(value || "").trim();

  try {
    const parsed = new URL(url);

    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : "";
  } catch {
    return "";
  }
};

const parseCsv = (text) => {
  const content = String(text || "").replace(/^\uFEFF/, "");
  const firstLine = content.split(/\r?\n/, 1)[0] || "";

  const separator = firstLine.includes(";")
    ? ";"
    : firstLine.includes("\t")
      ? "\t"
      : ",";

  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (quoted && content[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === separator && !quoted) {
      row.push(value);
      value = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !quoted
    ) {
      if (char === "\r" && content[i + 1] === "\n") {
        i++;
      }

      row.push(value);

      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);

  if (row.some((cell) => cell.trim())) {
    rows.push(row);
  }

  return rows;
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const getColumn = (headers, aliases) =>
  headers.findIndex((header) =>
    aliases.includes(normalizeHeader(header))
  );

const getRecordKey = (record) => {
  if (record.sourceUrl) {
    return `post:${record.sourceUrl}`;
  }

  return [
    "listing",
    record.profileUrl || record.name.toLowerCase(),
    record.title.toLowerCase(),
  ].join("|");
};

const loadSavedRecords = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(saved)
      ? saved.map((record) => ({
          ...record,
          groupName: record.groupName || DEFAULT_GROUP,
          status: VALID_STATUSES.includes(record.status)
            ? record.status
            : "new",
        }))
      : [];
  } catch {
    return [];
  }
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

export default function AdminTouristPlaces() {
  const [records, setRecords] = useState(loadSavedRecords);

  const [importGroupName, setImportGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [copiedRecordId, setCopiedRecordId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);

  const fileRef = useRef(null);

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextRecords)
      );
    } catch {
      setError("Не вдалося зберегти список у браузері.");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setNotice("");

    if (file.size > 2 * 1024 * 1024) {
      setError("Максимальний розмір CSV — 2 МБ.");
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        setError(
          "CSV повинен містити заголовки та хоча б один запис."
        );
        return;
      }

      const headers = rows[0];

      const nameIndex = getColumn(headers, [
        "ім'я",
        "ім’я",
        "імя",
        "автор",
        "імяавтора",
        "name",
        "author",
        "authorname",
        "username",
        "sendername",
      ]);

      const titleIndex = getColumn(headers, [
        "назва",
        "назваоголошення",
        "оголошення",
        "title",
        "listingtitle",
        "text",
        "messagetext",
      ]);

      const profileIndex = getColumn(headers, [
        "профіль",
        "посиланнянапрофіль",
        "profile",
        "profileurl",
        "authorurl",
        "userlink",
        "senderlink",
      ]);

      const sourceIndex = getColumn(headers, [
        "допис",
        "посиланнянадопис",
        "посиланнянаоголошення",
        "post",
        "posturl",
        "sourceurl",
        "messagelink",
        "messageurl",
      ]);

      const groupIndex = getColumn(headers, [
        "група",
        "назвагрупи",
        "group",
        "groupname",
      ]);

      const statusIndex = getColumn(headers, [
        "статус",
        "status",
      ]);

      if (nameIndex === -1 || titleIndex === -1) {
        setError(
          "У CSV потрібні колонки «Ім'я» та «Назва оголошення»."
        );
        return;
      }

      const fallbackGroup = importGroupName.trim();

      const existingKeys = new Set(
        records.map(getRecordKey)
      );

      const imported = [];
      const now = Date.now();

      let skipped = 0;

      for (const [index, row] of rows.slice(1, 5001).entries()) {
        const name = String(row[nameIndex] || "").trim();
        const title = String(row[titleIndex] || "").trim();

        if (!name || !title) {
          skipped++;
          continue;
        }

        const csvGroup =
          groupIndex >= 0
            ? String(row[groupIndex] || "").trim()
            : "";

        const groupName = csvGroup || fallbackGroup;

        if (!groupName) {
          setError(
            "Вкажіть назву групи перед імпортом або додайте колонку «Група» до CSV."
          );
          return;
        }

        const csvStatus =
          statusIndex >= 0
            ? String(row[statusIndex] || "").trim()
            : "new";

        const record = {
          id: `${now}-${index}`,
          name,
          title,
          groupName,
          profileUrl:
            profileIndex >= 0
              ? safeUrl(row[profileIndex])
              : "",
          sourceUrl:
            sourceIndex >= 0
              ? safeUrl(row[sourceIndex])
              : "",
          status: VALID_STATUSES.includes(csvStatus)
            ? csvStatus
            : "new",
        };

        const key = getRecordKey(record);

        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }

        existingKeys.add(key);
        imported.push(record);
      }

      if (imported.length === 0) {
        setNotice(
          "Нових записів не знайдено. Можливо, вони вже імпортовані."
        );
        return;
      }

      saveRecords([...imported, ...records]);

      setNotice(
        `Імпортовано ${imported.length} оголошень. Пропущено: ${skipped}.`
      );
    } catch (err) {
      console.error("Помилка імпорту CSV:", err);
      setError("Не вдалося прочитати CSV-файл.");
    } finally {
      setImporting(false);
    }
  };

  const handleRecordCopy = async (record) => {
    try {
      const message = createMessage(
        record.name,
        record.title,
        record.groupName
      );

      await navigator.clipboard.writeText(message);

      setCopiedRecordId(record.id);
      setError("");
    } catch {
      setError("Не вдалося скопіювати повідомлення.");
    }
  };

  const changeRecordStatus = (id, status) => {
    if (!VALID_STATUSES.includes(status)) return;

    saveRecords(
      records.map((record) =>
        record.id === id
          ? { ...record, status }
          : record
      )
    );
  };

  const removeRecord = (id) => {
    saveRecords(
      records.filter((record) => record.id !== id)
    );

    if (copiedRecordId === id) {
      setCopiedRecordId(null);
    }
  };

  const clearRecords = () => {
    saveRecords([]);
    setCopiedRecordId(null);
    setNotice("");
    setSearch("");
    setStatusFilter("all");
  };

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.name.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query) ||
        (record.groupName || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    new: records.filter((r) => r.status === "new").length,
    sent: records.filter((r) => r.status === "sent").length,
    replied: records.filter((r) => r.status === "replied").length,
  }), [records]);

  const exportCsv = () => {
    if (records.length === 0) return;

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Ім'я",
      "Назва оголошення",
      "Профіль",
      "Допис",
      "Група",
      "Статус",
    ];

    const csv = [
      headers,
      ...records.map((record) => [
        record.name,
        record.title,
        record.profileUrl,
        record.sourceUrl,
        record.groupName || DEFAULT_GROUP,
        record.status,
      ]),
    ]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rboard-invitations.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MessageSquareText size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Запрошення на RBoard
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Імпортуйте оголошення з CSV, відкривайте профілі
              авторів та копіюйте персоналізовані запрошення.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Усього оголошень",
            value: stats.total,
            color: "text-blue-600",
          },
          {
            label: "Не опрацьовано",
            value: stats.new,
            color: "text-slate-800",
          },
          {
            label: "Надіслано",
            value: stats.sent,
            color: "text-amber-600",
          },
          {
            label: "Відповіли",
            value: stats.replied,
            color: "text-emerald-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500">
              {item.label}
            </p>

            <p className={`mt-2 text-3xl font-black ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Upload size={20} />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Імпорт оголошень
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Додавайте списки з різних груп.
            </p>
          </div>
        </div>

        <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label
              htmlFor="import-group-name"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <Users size={17} className="text-blue-600" />
              Назва групи
            </label>

            <input
              id="import-group-name"
              type="text"
              value={importGroupName}
              onChange={(event) => {
                setImportGroupName(event.target.value);
                setError("");
              }}
              placeholder="Наприклад: Рахів | Дошка оголошень"
              maxLength={150}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Цю назву буде додано до нових оголошень.
              Якщо група вже вказана в CSV, використаємо її.
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 lg:w-auto"
            >
              <Upload size={18} />
              {importing ? "Імпортуємо..." : "Імпортувати CSV"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
        >
          {notice}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Імпортовані оголошення
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Дані зберігаються локально у вашому браузері.
            </p>
          </div>

          {records.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Download size={16} />
                Експорт CSV
              </button>

              <button
                type="button"
                onClick={clearRecords}
                className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={16} />
                Очистити
              </button>
            </div>
          )}
        </div>

        {records.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <FileSpreadsheet
              size={38}
              className="mb-4 text-blue-500"
            />

            <h3 className="text-base font-bold text-slate-900">
              Оголошень поки немає
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Завантажте CSV-файл із даними авторів,
              назвами оголошень та посиланнями.
            </p>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Обрати CSV
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Пошук за автором, оголошенням або групою..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">Усі записи</option>
                <option value="new">Не опрацьовано</option>
                <option value="sent">Надіслано</option>
                <option value="replied">Відповіли</option>
                <option value="declined">Відмовилися</option>
              </select>
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Показано {filteredRecords.length} із{" "}
              {records.length} оголошень
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-bold text-slate-500">
                    <th className="px-4 py-3">Автор</th>
                    <th className="px-4 py-3">Оголошення</th>
                    <th className="px-4 py-3">Посилання</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3 text-right">
                      Дії
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <UserRound size={17} />
                          </div>

                          <span className="max-w-[160px] break-words text-sm font-bold text-slate-900">
                            {record.name}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-[280px] px-4 py-4">
                        <p className="line-clamp-2 text-sm text-slate-700">
                          {record.title}
                        </p>

                        <p className="mt-1.5 text-[11px] font-semibold text-blue-600">
                          {record.groupName || DEFAULT_GROUP}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {record.profileUrl && (
                            <a
                              href={safeUrl(record.profileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                            >
                              <UserRound size={14} />
                              Профіль
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {record.sourceUrl && (
                            <a
                              href={safeUrl(record.sourceUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
                            >
                              <Link2 size={14} />
                              Допис
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {!record.profileUrl &&
                            !record.sourceUrl && (
                              <span className="text-xs text-slate-400">
                                Немає посилань
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={record.status}
                          onChange={(event) =>
                            changeRecordStatus(
                              record.id,
                              event.target.value
                            )
                          }
                          className="max-w-[145px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="new">
                            Не опрацьовано
                          </option>

                          <option value="sent">
                            Надіслано
                          </option>

                          <option value="replied">
                            Відповіли
                          </option>

                          <option value="declined">
                            Відмовилися
                          </option>
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRecordCopy(record)
                            }
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold text-white transition ${
                              copiedRecordId === record.id
                                ? "bg-emerald-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {copiedRecordId === record.id ? (
                              <Check size={15} />
                            ) : (
                              <Copy size={15} />
                            )}

                            {copiedRecordId === record.id
                              ? "Скопійовано"
                              : "Копіювати"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeRecord(record.id)
                            }
                            aria-label="Видалити запис"
                            title="Видалити запис"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                За вибраними умовами оголошень немає.
              </p>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
              <Send
                size={16}
                className="mt-0.5 shrink-0"
              />

              <span>
                Копіювання лише підготовлює текст.
                Після фактичного надсилання змініть статус
                на «Надіслано», щоб не звернутися до
                того самого автора повторно.
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
