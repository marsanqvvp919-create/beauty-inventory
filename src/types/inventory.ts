export type ExpectedArrivalOption =
  | "未定"
  | "今週中"
  | "今週末ごろ"
  | "来週前半"
  | "来週後半"
  | "2週間以内"
  | "今月中"
  | "来月1週目"
  | "来月2週目"
  | "来月3週目";

export type InventoryStatus = "正常" | "要注意" | "危険在庫" | "欠品";

export type InventoryAction =
  | "add"
  | "edit"
  | "use"
  | "inbound"
  | "adjust"
  | "delete"
  | "restore"
  | "permanent_delete";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  dangerLevel: number;
  dailyUsage: number;
  orderedQuantity: number;
  expectedArrival: ExpectedArrivalOption;
  unit: string;
  vendor: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeletedInventoryItem {
  id: string;
  originalItemId: string | null;
  name: string;
  category: string;
  stock: number;
  dangerLevel: number;
  dailyUsage: number;
  orderedQuantity: number;
  expectedArrival: ExpectedArrivalOption;
  unit: string;
  vendor: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export interface InventoryLog {
  id: string;
  itemId: string | null;
  itemName: string;
  action: InventoryAction;
  quantity?: number;
  unit?: string;
  detail: string;
  createdAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InventoryForm {
  name: string;
  category: string;
  stock: string;
  unit: string;
  dangerLevel: string;
  dailyUsage: string;
  orderedQuantity: string;
  expectedArrival: ExpectedArrivalOption;
  vendor: string;
  memo: string;
}