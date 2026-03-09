import type { ExpectedArrivalOption, InventoryForm, InventoryItem, InventoryLog } from "../types/inventory";

export const DEFAULT_CATEGORIES = [
  "ヒアルロン酸",
  "ボトックス",
  "スキンブースター",
  "脂肪溶解注射",
  "その他",
] as const;

export const ARRIVAL_OPTIONS: ExpectedArrivalOption[] = [
  "未定",
  "今週中",
  "今週末ごろ",
  "来週前半",
  "来週後半",
  "2週間以内",
  "今月中",
  "来月1週目",
  "来月2週目",
  "来月3週目",
];

export const UNIT_OPTIONS = ["本", "箱", "本セット", "バイアル", "cc", "ml"] as const;

export const STATUS_OPTIONS = ["すべて", "正常", "要注意", "危険在庫", "欠品"] as const;

export const SORT_OPTIONS = ["更新が新しい順", "在庫が少ない順", "製剤名順"] as const;

export const INITIAL_FORM: InventoryForm = {
  name: "",
  category: "ヒアルロン酸",
  stock: "",
  unit: "本",
  dangerLevel: "",
  dailyUsage: "",
  orderedQuantity: "",
  expectedArrival: "未定",
  vendor: "",
  memo: "",
};

export const INITIAL_ITEMS: InventoryItem[] = [];

export const INITIAL_LOGS: InventoryLog[] = [];