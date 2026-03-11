import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Package,
  PlusSquare,
  Search,
  Settings2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  INITIAL_FORM,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "../data/inventory";
import type {
  DeletedInventoryItem,
  InventoryCategory,
  InventoryForm,
  InventoryItem,
  InventoryLog,
  InventoryStatus,
} from "../types/inventory";
import {
  archiveDeletedInventoryItem,
  createInventoryCategory,
  createInventoryItem,
  createInventoryLog,
  deleteInventoryCategory,
  deleteInventoryItem,
  fetchDeletedInventoryItems,
  fetchInventoryCategories,
  fetchInventoryItems,
  fetchInventoryLogs,
  permanentlyDeleteDeletedInventoryItem,
  restoreDeletedInventoryItem,
  updateInventoryItem,
} from "../lib/inventoryApi";
import InventoryTable from "./InventoryTable";
import AddInventoryForm from "./AddInventoryForm";
import AlertPanel from "./AlertPanel";
import InventoryLogs from "./InventoryLogs";
import DisplaySettingsPanel from "./DisplaySettingsPanel";
import TrashPanel from "./TrashPanel";

const DISPLAY_SETTINGS_STORAGE_KEY = "beauty_inventory_display_settings";
const DELETE_UNDO_MS = 8000;

const LETTERS = [
  "すべて",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

type DisplaySettings = {
  showDashboard: boolean;
  showAlerts: boolean;
  showLogs: boolean;
  showCategoryManager: boolean;
  showAddForm: boolean;
  showTrash: boolean;
};

type PendingDelete = {
  item: InventoryItem;
  expiresAt: number;
};

type MobileTab = "inventory" | "add" | "alerts" | "logs" | "settings";

const INITIAL_DISPLAY_SETTINGS: DisplaySettings = {
  showDashboard: true,
  showAlerts: true,
  showLogs: true,
  showCategoryManager: true,
  showAddForm: true,
  showTrash: true,
};

const MOBILE_TABS: Array<{
  key: MobileTab;
  label: string;
  icon: typeof Package;
}> = [
  { key: "inventory", label: "在庫", icon: Package },
  { key: "add", label: "追加", icon: PlusSquare },
  { key: "alerts", label: "アラート", icon: AlertTriangle },
  { key: "logs", label: "履歴", icon: ClipboardList },
  { key: "settings", label: "設定", icon: Settings2 },
];

function normalizeNumericInput(value: string) {
  return value
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ",")
    .replace(/．/g, ".")
    .replace(/[\s,]/g, "")
    .trim();
}

function parseSafeNumber(value: string) {
  const normalized = normalizeNumericInput(value);
  if (!normalized) return 0;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function getStatus(item: InventoryItem): InventoryStatus {
  if (item.stock <= 0) return "欠品";
  if (item.stock <= item.dangerLevel) return "危険在庫";
  if (item.stock <= item.dangerLevel * 1.5) return "要注意";
  return "正常";
}

function MobileTabButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Package;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
        active
          ? "bg-[#EEF3FF] text-[#1D2E61]"
          : "text-[#6B7280] hover:bg-[#F8FAFC]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function InventoryApp() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [logsOpen, setLogsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedInventoryItem[]>([]);
  const [categoryRows, setCategoryRows] = useState<InventoryCategory[]>([]);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("すべて");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [purchaseFilter, setPurchaseFilter] = useState("すべて");
  const [letterFilter, setLetterFilter] = useState<string>("すべて");
  const [sortOrder, setSortOrder] = useState("更新が新しい順");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [form, setForm] = useState<InventoryForm>(INITIAL_FORM);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("inventory");

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const pendingDeleteTimerRef = useRef<number | null>(null);

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);

    if (!saved) return INITIAL_DISPLAY_SETTINGS;

    try {
      const parsed = JSON.parse(saved) as Partial<DisplaySettings>;
      return {
        ...INITIAL_DISPLAY_SETTINGS,
        ...parsed,
      };
    } catch {
      return INITIAL_DISPLAY_SETTINGS;
    }
  });

  useEffect(() => {
    void loadAll();

    return () => {
      if (pendingDeleteTimerRef.current) {
        window.clearTimeout(pendingDeleteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DISPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify(displaySettings)
    );
  }, [displaySettings]);

  async function loadAll() {
    try {
      setLoading(true);
      setErrorMessage("");

      const [itemsData, logsData, categoriesData, deletedItemsData] =
        await Promise.all([
          fetchInventoryItems(),
          fetchInventoryLogs(),
          fetchInventoryCategories(),
          fetchDeletedInventoryItems(),
        ]);

      setItems(itemsData);
      setLogs(logsData);
      setCategoryRows(categoriesData);
      setDeletedItems(deletedItemsData);
    } catch (error) {
      console.error(error);
      setErrorMessage("Supabase からのデータ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    if (categoryRows.length === 0) {
      return [...DEFAULT_CATEGORIES];
    }

    const names = categoryRows.map((row) => row.name);
    const merged = [
      ...DEFAULT_CATEGORIES,
      ...names.filter(
        (name) =>
          !DEFAULT_CATEGORIES.includes(
            name as (typeof DEFAULT_CATEGORIES)[number]
          )
      ),
    ];

    return Array.from(new Set(merged));
  }, [categoryRows]);

  const categoryItemCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const customCategories = useMemo(() => {
    return categoryRows.filter(
      (row) =>
        !DEFAULT_CATEGORIES.includes(
          row.name as (typeof DEFAULT_CATEGORIES)[number]
        )
    );
  }, [categoryRows]);

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const categoryMatch =
        category === "すべて" ? true : item.category === category;

      const keywordMatch = [
        item.name,
        item.category,
        item.vendor,
        item.memo,
        item.expectedArrival,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword.toLowerCase());

      const status = getStatus(item);
      const statusMatch =
        statusFilter === "すべて" ? true : status === statusFilter;

      const purchaseMatch =
        purchaseFilter === "すべて"
          ? true
          : purchaseFilter === "発注済みのみ"
          ? item.orderedQuantity > 0
          : true;

      const letterMatch =
        letterFilter === "すべて"
          ? true
          : item.name.toUpperCase().startsWith(letterFilter);

      return (
        categoryMatch &&
        keywordMatch &&
        statusMatch &&
        purchaseMatch &&
        letterMatch
      );
    });

    if (sortOrder === "在庫が少ない順") {
      result = [...result].sort((a, b) => a.stock - b.stock);
    }

    if (sortOrder === "更新が新しい順") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    if (sortOrder === "製剤名順") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    }

    return result;
  }, [
    items,
    keyword,
    category,
    statusFilter,
    purchaseFilter,
    letterFilter,
    sortOrder,
  ]);

  const alertItems = useMemo(() => {
    return items
      .filter((item) => item.stock <= item.dangerLevel)
      .sort((a, b) => a.stock - b.stock);
  }, [items]);

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const totalUsage = items.reduce((sum, item) => sum + item.dailyUsage, 0);
  const totalOrdered = items.reduce((sum, item) => sum + item.orderedQuantity, 0);

  const latestLogPreview = logs.slice(0, 3);

  async function addLog(log: Omit<InventoryLog, "id" | "createdAt">) {
    try {
      const newLog = await createInventoryLog({
        itemId: log.itemId ?? null,
        itemName: log.itemName,
        action: log.action as InventoryLog["action"],
        quantity: log.quantity ?? 0,
        unit: log.unit ?? "",
        detail: log.detail ?? "",
      });

      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    } catch (error) {
      console.error(error);
      setErrorMessage("履歴の保存に失敗しました。");
    }
  }

  const handleAddCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) return;

    try {
      const created = await createInventoryCategory(trimmed);
      setCategoryRows((prev) => [...prev, created]);

      if (!form.category || form.category === "その他") {
        setForm({ ...form, category: trimmed as InventoryForm["category"] });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("カテゴリー追加に失敗しました。");
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (DEFAULT_CATEGORIES.includes(name as (typeof DEFAULT_CATEGORIES)[number])) {
      window.alert("標準カテゴリーは削除できません。");
      return;
    }

    const count = categoryItemCounts[name] ?? 0;
    if (count > 0) {
      window.alert("このカテゴリーを使用している製剤があるため削除できません。");
      return;
    }

    const target = categoryRows.find((row) => row.name === name);
    if (!target) return;

    const ok = window.confirm(`「${name}」を削除しますか？`);
    if (!ok) return;

    try {
      await deleteInventoryCategory(target.id);
      setCategoryRows((prev) => prev.filter((row) => row.id !== target.id));

      if (form.category === name) {
        setForm({
          ...form,
          category: (DEFAULT_CATEGORIES[0] ?? "その他") as InventoryForm["category"],
        });
      }

      if (category === name) {
        setCategory("すべて");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("カテゴリー削除に失敗しました。");
    }
  };

  const handleUseStock = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const nextStock = Math.max(0, target.stock - target.dailyUsage);

    try {
      const updated = await updateInventoryItem(id, {
        stock: nextStock,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );

      await addLog({
        itemId: target.id,
        itemName: target.name,
        action: "use",
        quantity: target.dailyUsage,
        unit: target.unit,
        detail: "1日使用数量を反映しました",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("使用処理に失敗しました。");
    }
  };

  const handleInbound = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const quantity = 10;

    try {
      const updated = await updateInventoryItem(id, {
        stock: target.stock + quantity,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );

      await addLog({
        itemId: target.id,
        itemName: target.name,
        action: "inbound",
        quantity,
        unit: target.unit,
        detail: "簡易入庫を実行しました",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("入庫処理に失敗しました。");
    }
  };

  const handleManualSave = async (id: string) => {
    const numeric = parseSafeNumber(editValue);
    const target = items.find((item) => item.id === id);
    if (Number.isNaN(numeric) || numeric < 0 || !target) return;

    try {
      const updated = await updateInventoryItem(id, {
        stock: numeric,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );

      await addLog({
        itemId: target.id,
        itemName: target.name,
        action: "adjust",
        quantity: numeric,
        unit: target.unit,
        detail: "現在庫を手修正しました",
      });

      setEditingId(null);
      setEditValue("");
    } catch (error) {
      console.error(error);
      setErrorMessage("在庫手修正に失敗しました。");
    }
  };

  const handleSubmitForm = async () => {
    if (!form.name.trim()) return;

    const parsedStock = parseSafeNumber(form.stock);
    const parsedDangerLevel = parseSafeNumber(form.dangerLevel);
    const parsedDailyUsage = parseSafeNumber(form.dailyUsage);
    const parsedOrderedQuantity = parseSafeNumber(form.orderedQuantity);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      stock: Number.isNaN(parsedStock) ? 0 : parsedStock,
      dangerLevel: Number.isNaN(parsedDangerLevel) ? 0 : parsedDangerLevel,
      dailyUsage: Number.isNaN(parsedDailyUsage) ? 0 : parsedDailyUsage,
      orderedQuantity: Number.isNaN(parsedOrderedQuantity) ? 0 : parsedOrderedQuantity,
      expectedArrival: form.expectedArrival || "未定",
      unit: form.unit || "本",
      vendor: form.vendor?.trim() || "未設定",
      memo: form.memo || "",
    };

    if (editingItemId) {
      const target = items.find((item) => item.id === editingItemId);
      if (!target) return;

      try {
        const updatedItem = await updateInventoryItem(editingItemId, payload);

        setItems((prev) =>
          prev.map((item) => (item.id === editingItemId ? updatedItem : item))
        );

        await addLog({
          itemId: target.id,
          itemName: updatedItem.name,
          action: "edit",
          quantity: 0,
          unit: updatedItem.unit,
          detail: "製剤情報を編集しました",
        });

        setEditingItemId(null);
        setForm(INITIAL_FORM);
        setMobileTab("inventory");
      } catch (error) {
        console.error(error);
        setErrorMessage("製剤更新に失敗しました。");
      }

      return;
    }

    try {
      const newItem = await createInventoryItem(payload);

      setItems((prev) => [newItem, ...prev]);

      await addLog({
        itemId: newItem.id,
        itemName: newItem.name,
        action: "add",
        quantity: newItem.stock,
        unit: newItem.unit,
        detail: "新規製剤を追加しました",
      });

      setForm(INITIAL_FORM);
      setMobileTab("inventory");
    } catch (error) {
      console.error(error);
      setErrorMessage("新規製剤追加に失敗しました。");
    }
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      stock: String(item.stock),
      unit: item.unit,
      dangerLevel: String(item.dangerLevel),
      dailyUsage: String(item.dailyUsage),
      orderedQuantity: String(item.orderedQuantity),
      expectedArrival: item.expectedArrival || "未定",
      vendor: item.vendor,
      memo: item.memo,
    });
    setMobileTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setForm(INITIAL_FORM);
  };

  async function finalizePendingDelete(targetItem: InventoryItem) {
    try {
      const archived = await archiveDeletedInventoryItem(targetItem);
      await deleteInventoryItem(targetItem.id);

      setDeletedItems((prev) => [archived, ...prev]);

      await addLog({
        itemId: targetItem.id,
        itemName: targetItem.name,
        action: "delete",
        quantity: 0,
        unit: targetItem.unit,
        detail: "製剤を削除しました",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("製剤削除に失敗しました。");
      setItems((prev) => [targetItem, ...prev]);
    } finally {
      setPendingDelete(null);
      if (pendingDeleteTimerRef.current) {
        window.clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
    }
  }

  const handleDelete = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const ok = window.confirm(
      `「${target.name}」を削除しますか？\n削除後もしばらくは元に戻せます。`
    );
    if (!ok) return;

    if (pendingDelete) {
      await finalizePendingDelete(pendingDelete.item);
    }

    setItems((prev) => prev.filter((item) => item.id !== id));

    if (editingItemId === id) {
      setEditingItemId(null);
      setForm(INITIAL_FORM);
    }

    const expiresAt = Date.now() + DELETE_UNDO_MS;
    setPendingDelete({
      item: target,
      expiresAt,
    });

    pendingDeleteTimerRef.current = window.setTimeout(() => {
      void finalizePendingDelete(target);
    }, DELETE_UNDO_MS);
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;

    if (pendingDeleteTimerRef.current) {
      window.clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }

    setItems((prev) => [pendingDelete.item, ...prev]);
    setPendingDelete(null);
  };

  const handleRestoreDeletedItem = async (item: DeletedInventoryItem) => {
    try {
      const restored = await restoreDeletedInventoryItem(item);
      await permanentlyDeleteDeletedInventoryItem(item.id);

      setItems((prev) => [restored, ...prev]);
      setDeletedItems((prev) => prev.filter((row) => row.id !== item.id));

      await addLog({
        itemId: restored.id,
        itemName: restored.name,
        action: "restore",
        quantity: restored.stock,
        unit: restored.unit,
        detail: "削除済み一覧から復元しました",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("製剤の復元に失敗しました。");
    }
  };

  const handlePermanentDeleteDeletedItem = async (item: DeletedInventoryItem) => {
    const ok = window.confirm(`「${item.name}」を完全削除しますか？`);
    if (!ok) return;

    try {
      await permanentlyDeleteDeletedInventoryItem(item.id);
      setDeletedItems((prev) => prev.filter((row) => row.id !== item.id));

      await addLog({
        itemId: item.originalItemId,
        itemName: item.name,
        action: "permanent_delete",
        quantity: 0,
        unit: item.unit,
        detail: "削除済み一覧から完全削除しました",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("完全削除に失敗しました。");
    }
  };

  const desktopSearchCard = (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
        <div className="min-w-0 md:col-span-2">
          <label className="mb-1 block text-sm text-[#6B7280]">検索</label>
          <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#D9E2F2] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#6B7280]" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="製剤名・カテゴリー・仕入先・入荷予定・メモで検索"
              className="min-w-0 w-full border-none bg-transparent text-[#24324A] outline-none"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm text-[#6B7280]">カテゴリー</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF]"
          >
            <option value="すべて">すべて</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm text-[#6B7280]">状態</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm text-[#6B7280]">発注</label>
          <select
            value={purchaseFilter}
            onChange={(e) => setPurchaseFilter(e.target.value)}
            className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF]"
          >
            <option value="すべて">すべて</option>
            <option value="発注済みのみ">発注済みのみ</option>
          </select>
        </div>

        <div className="min-w-0 md:col-span-5">
          <label className="mb-1 block text-sm text-[#6B7280]">並び順</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF] md:w-64"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 border-t border-[#D9E2F2] pt-4">
        <p className="mb-2 text-sm font-medium text-[#6B7280]">頭文字検索</p>
        <div className="flex flex-wrap gap-2">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setLetterFilter(letter)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                letterFilter === letter
                  ? "border-[#1D2E61] bg-[#EEF3FF] text-[#1D2E61]"
                  : "border-[#D9E2F2] bg-white text-[#6B7280] hover:bg-[#EEF3FF]"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const mobileInventoryView = (
    <div className="space-y-4 md:hidden">
      <div className="rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-[#6B7280]">検索</label>
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#D9E2F2] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6B7280]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="製剤名・カテゴリー・仕入先・メモ"
            className="min-w-0 w-full border-none bg-transparent text-[#24324A] outline-none"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="mb-1 block text-sm text-[#6B7280]">カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none"
            >
              <option value="すべて">すべて</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm text-[#6B7280]">状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm text-[#6B7280]">発注</label>
            <select
              value={purchaseFilter}
              onChange={(e) => setPurchaseFilter(e.target.value)}
              className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none"
            >
              <option value="すべて">すべて</option>
              <option value="発注済みのみ">発注済みのみ</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm text-[#6B7280]">並び順</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="min-w-0 w-full rounded-2xl border border-[#D9E2F2] bg-white px-4 py-2 text-[#24324A] outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t border-[#D9E2F2] pt-4">
          <p className="mb-2 text-sm font-medium text-[#6B7280]">頭文字検索</p>
          <div className="flex flex-wrap gap-2">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setLetterFilter(letter)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  letterFilter === letter
                    ? "border-[#1D2E61] bg-[#EEF3FF] text-[#1D2E61]"
                    : "border-[#D9E2F2] bg-white text-[#6B7280] hover:bg-[#EEF3FF]"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <InventoryTable
        items={filteredItems}
        editingId={editingId}
        editValue={editValue}
        setEditValue={setEditValue}
        setEditingId={setEditingId}
        onManualSave={handleManualSave}
        onUseStock={handleUseStock}
        onInbound={handleInbound}
        onDelete={handleDelete}
        onStartEdit={handleStartEdit}
      />
    </div>
  );

  const mobileAddView = (
    <div className="space-y-4 md:hidden">
      <AddInventoryForm
        form={form}
        categoryOptions={categories}
        isEditMode={!!editingItemId}
        setForm={setForm}
        onSubmit={handleSubmitForm}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );

  const mobileAlertsView = (
    <div className="space-y-4 md:hidden">
      {displaySettings.showDashboard ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-[#EAC11A]/35 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#6B7280]">危険在庫</p>
            <div className="mt-2 flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-[#EAC11A]" />
              <p className="text-xl font-semibold text-[#1D2E61]">{alertItems.length}</p>
            </div>
            <p className="mt-2 text-xs text-[#6B7280]">補充確認が必要な製剤数</p>
          </div>

          <div className="rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#6B7280]">発注数量合計</p>
            <p className="mt-2 text-xl font-semibold text-[#1D2E61]">{totalOrdered}</p>
            <p className="mt-2 text-xs text-[#6B7280]">現在発注中の総数量</p>
          </div>
        </div>
      ) : null}

      <AlertPanel alertItems={alertItems} onInboundQuick={handleInbound} />
    </div>
  );

  const mobileLogsView = (
    <div className="space-y-4 md:hidden">
      <div className="overflow-hidden rounded-3xl border border-[#D9E2F2] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setLogsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#EAC11A]" />
              <h2 className="text-lg font-semibold text-[#1D2E61]">
                履歴一覧（{logs.length}件）
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">
              {logsOpen ? "クリックで閉じる" : "クリックで展開する"}
            </p>
          </div>

          {logsOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-[#6B7280]" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-[#6B7280]" />
          )}
        </button>

        {logsOpen ? <InventoryLogs logs={logs} /> : null}
      </div>
    </div>
  );

  const mobileSettingsView = (
    <div className="space-y-4 md:hidden">
      <DisplaySettingsPanel
        settings={displaySettings}
        onChange={setDisplaySettings}
      />

      {displaySettings.showCategoryManager ? (
        <div className="rounded-3xl border border-[#D9E2F2] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#1D2E61]">
              カテゴリー管理
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              カテゴリーを追加・管理できます。標準カテゴリーは削除できません。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex min-w-0 gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="カテゴリー追加"
                className="min-w-0 flex-1 rounded-xl border border-[#D9E2F2] px-3 py-2 text-sm text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF]"
              />
              <button
                type="button"
                onClick={() => {
                  void handleAddCategory(newCategory);
                  setNewCategory("");
                }}
                className="rounded-xl bg-[#1D2E61] px-3 py-2 text-sm text-white transition hover:bg-[#16244d]"
              >
                追加
              </button>
            </div>

            <div className="rounded-2xl border border-[#D9E2F2] bg-[#F8FAFC] p-4">
              {customCategories.length === 0 ? (
                <p className="text-sm text-[#6B7280]">
                  追加したカテゴリーはまだありません。
                </p>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((categoryRow) => {
                    const categoryName = categoryRow.name;
                    const count = categoryItemCounts[categoryName] ?? 0;
                    const inUse = count > 0;

                    return (
                      <div
                        key={categoryRow.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#D9E2F2] bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1D2E61]">
                            {categoryName}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            使用中製剤数: {count}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={inUse}
                          onClick={() => void handleDeleteCategory(categoryName)}
                          className={`shrink-0 rounded-xl px-3 py-2 text-sm ${
                            inUse
                              ? "cursor-not-allowed border border-slate-200 text-slate-300"
                              : "border border-[#EAC11A]/40 text-[#9A7B00] hover:bg-[#FFF8DF]"
                          }`}
                        >
                          削除
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {displaySettings.showTrash ? (
        <TrashPanel
          items={deletedItems}
          onRestore={handleRestoreDeletedItem}
          onPermanentDelete={handlePermanentDeleteDeletedItem}
        />
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#D9E2F2] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6B7280]">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] p-4 pb-28 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="hidden md:block">
          {displaySettings.showDashboard ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <div className="rounded-3xl border border-[#EAC11A]/35 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-[#6B7280]">危険在庫</p>
                <div className="mt-2 flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5 text-[#EAC11A]" />
                  <p className="text-xl font-semibold text-[#1D2E61] sm:text-2xl">
                    {alertItems.length}
                  </p>
                </div>
                <p className="mt-2 text-xs text-[#6B7280]">補充確認が必要な製剤数</p>
              </div>

              <div className="rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-[#6B7280]">本日使用予定</p>
                <p className="mt-2 text-xl font-semibold text-[#1D2E61] sm:text-2xl">
                  {totalUsage}
                </p>
                <p className="mt-2 text-xs text-[#6B7280]">1日使用数量の合計</p>
              </div>

              <div className="rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-[#6B7280]">総在庫数</p>
                <p className="mt-2 text-xl font-semibold text-[#1D2E61] sm:text-2xl">
                  {totalStock}
                </p>
                <p className="mt-2 text-xs text-[#6B7280]">登録中の全在庫数</p>
              </div>

              <div className="rounded-3xl border border-[#D9E2F2] bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-[#6B7280]">発注数量合計</p>
                <p className="mt-2 text-xl font-semibold text-[#1D2E61] sm:text-2xl">
                  {totalOrdered}
                </p>
                <p className="mt-2 text-xs text-[#6B7280]">現在発注中の総数量</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="md:hidden">
          {mobileTab === "inventory" ? mobileInventoryView : null}
          {mobileTab === "add" ? mobileAddView : null}
          {mobileTab === "alerts" ? mobileAlertsView : null}
          {mobileTab === "logs" ? mobileLogsView : null}
          {mobileTab === "settings" ? mobileSettingsView : null}
        </div>

        <div className="hidden min-w-0 gap-6 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)]">
          <div className="min-w-0 space-y-4">
            {desktopSearchCard}

            <InventoryTable
              items={filteredItems}
              editingId={editingId}
              editValue={editValue}
              setEditValue={setEditValue}
              setEditingId={setEditingId}
              onManualSave={handleManualSave}
              onUseStock={handleUseStock}
              onInbound={handleInbound}
              onDelete={handleDelete}
              onStartEdit={handleStartEdit}
            />

            {displaySettings.showLogs ? (
              <div className="overflow-hidden rounded-3xl border border-[#D9E2F2] bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setLogsOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-[#EAC11A]" />
                      <h2 className="text-lg font-semibold text-[#1D2E61]">
                        履歴一覧（{logs.length}件）
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {logsOpen ? "クリックで閉じる" : "クリックで展開する"}
                    </p>
                    {!logsOpen && latestLogPreview.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {latestLogPreview.map((log) => (
                          <p key={log.id} className="truncate text-xs text-[#6B7280]">
                            ・{log.itemName}：{log.detail}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {logsOpen ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#6B7280]" />
                  )}
                </button>

                {logsOpen ? <InventoryLogs logs={logs} /> : null}
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
            <DisplaySettingsPanel
              settings={displaySettings}
              onChange={setDisplaySettings}
            />

            {displaySettings.showAddForm ? (
              <AddInventoryForm
                form={form}
                categoryOptions={categories}
                isEditMode={!!editingItemId}
                setForm={setForm}
                onSubmit={handleSubmitForm}
                onCancelEdit={handleCancelEdit}
              />
            ) : null}

            {displaySettings.showCategoryManager ? (
              <div className="rounded-3xl border border-[#D9E2F2] bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[#1D2E61]">
                    カテゴリー管理
                  </h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    カテゴリーを追加・管理できます。標準カテゴリーは削除できません。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex min-w-0 gap-2">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="カテゴリー追加"
                      className="min-w-0 flex-1 rounded-xl border border-[#D9E2F2] px-3 py-2 text-sm text-[#24324A] outline-none focus:border-[#1D2E61] focus:ring-4 focus:ring-[#EEF3FF]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void handleAddCategory(newCategory);
                        setNewCategory("");
                      }}
                      className="rounded-xl bg-[#1D2E61] px-3 py-2 text-sm text-white transition hover:bg-[#16244d]"
                    >
                      追加
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#D9E2F2] bg-[#F8FAFC] p-4">
                    {customCategories.length === 0 ? (
                      <p className="text-sm text-[#6B7280]">
                        追加したカテゴリーはまだありません。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {customCategories.map((categoryRow) => {
                          const categoryName = categoryRow.name;
                          const count = categoryItemCounts[categoryName] ?? 0;
                          const inUse = count > 0;

                          return (
                            <div
                              key={categoryRow.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-[#D9E2F2] bg-white px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#1D2E61]">
                                  {categoryName}
                                </p>
                                <p className="text-xs text-[#6B7280]">
                                  使用中製剤数: {count}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={inUse}
                                onClick={() => void handleDeleteCategory(categoryName)}
                                className={`shrink-0 rounded-xl px-3 py-2 text-sm ${
                                  inUse
                                    ? "cursor-not-allowed border border-slate-200 text-slate-300"
                                    : "border border-[#EAC11A]/40 text-[#9A7B00] hover:bg-[#FFF8DF]"
                                }`}
                              >
                                削除
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {displaySettings.showAlerts ? (
              <AlertPanel alertItems={alertItems} onInboundQuick={handleInbound} />
            ) : null}

            {displaySettings.showTrash ? (
              <TrashPanel
                items={deletedItems}
                onRestore={handleRestoreDeletedItem}
                onPermanentDelete={handlePermanentDeleteDeletedItem}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D9E2F2] bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-1">
          {MOBILE_TABS.map((tab) => (
            <MobileTabButton
              key={tab.key}
              active={mobileTab === tab.key}
              label={tab.label}
              icon={tab.icon}
              onClick={() => setMobileTab(tab.key)}
            />
          ))}
        </div>
      </div>

      {pendingDelete ? (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-[#D9E2F2] bg-white px-4 py-3 shadow-lg md:bottom-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm text-[#1D2E61]">
              {pendingDelete.item.name} を削除しました
            </p>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="shrink-0 rounded-xl bg-[#1D2E61] px-3 py-2 text-xs font-medium text-white hover:bg-[#16244d]"
            >
              元に戻す
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}