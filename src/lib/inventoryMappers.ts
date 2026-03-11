import type {
  DeletedInventoryItem,
  InventoryCategory,
  InventoryItem,
  InventoryLog,
} from "../types/inventory";

type DbInventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number | string | null;
  danger_level: number | string | null;
  daily_usage: number | string | null;
  ordered_quantity: number | string | null;
  expected_arrival: string | null;
  unit: string | null;
  vendor: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type DbDeletedInventoryItem = {
  id: string;
  original_item_id: string | null;
  name: string;
  category: string;
  stock: number | string | null;
  danger_level: number | string | null;
  daily_usage: number | string | null;
  ordered_quantity: number | string | null;
  expected_arrival: string | null;
  unit: string | null;
  vendor: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
};

type DbInventoryLog = {
  id: string;
  item_id: string | null;
  item_name: string;
  action: string;
  quantity: number | string | null;
  unit: string | null;
  detail: string | null;
  created_at: string;
};

type DbInventoryCategory = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
};

export function mapDbItemToItem(row: DbInventoryItem): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    stock: Number(row.stock ?? 0),
    dangerLevel: Number(row.danger_level ?? 0),
    dailyUsage: Number(row.daily_usage ?? 0),
    orderedQuantity: Number(row.ordered_quantity ?? 0),
    expectedArrival: row.expected_arrival as InventoryItem["expectedArrival"],
    unit: row.unit ?? "本",
    vendor: row.vendor ?? "",
    memo: row.memo ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbDeletedItemToDeletedItem(
  row: DbDeletedInventoryItem
): DeletedInventoryItem {
  return {
    id: row.id,
    originalItemId: row.original_item_id,
    name: row.name,
    category: row.category,
    stock: Number(row.stock ?? 0),
    dangerLevel: Number(row.danger_level ?? 0),
    dailyUsage: Number(row.daily_usage ?? 0),
    orderedQuantity: Number(row.ordered_quantity ?? 0),
    expectedArrival:
      row.expected_arrival as DeletedInventoryItem["expectedArrival"],
    unit: row.unit ?? "本",
    vendor: row.vendor ?? "",
    memo: row.memo ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function mapItemToDbInsert(
  item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
) {
  return {
    name: item.name,
    category: item.category,
    stock: item.stock,
    danger_level: item.dangerLevel,
    daily_usage: item.dailyUsage,
    ordered_quantity: item.orderedQuantity,
    expected_arrival: item.expectedArrival,
    unit: item.unit,
    vendor: item.vendor,
    memo: item.memo,
  };
}

export function mapItemToDbUpdate(item: Partial<InventoryItem>) {
  return {
    ...(item.name !== undefined ? { name: item.name } : {}),
    ...(item.category !== undefined ? { category: item.category } : {}),
    ...(item.stock !== undefined ? { stock: item.stock } : {}),
    ...(item.dangerLevel !== undefined ? { danger_level: item.dangerLevel } : {}),
    ...(item.dailyUsage !== undefined ? { daily_usage: item.dailyUsage } : {}),
    ...(item.orderedQuantity !== undefined
      ? { ordered_quantity: item.orderedQuantity }
      : {}),
    ...(item.expectedArrival !== undefined
      ? { expected_arrival: item.expectedArrival }
      : {}),
    ...(item.unit !== undefined ? { unit: item.unit } : {}),
    ...(item.vendor !== undefined ? { vendor: item.vendor } : {}),
    ...(item.memo !== undefined ? { memo: item.memo } : {}),
  };
}

export function mapItemToDeletedDbInsert(item: InventoryItem) {
  return {
    original_item_id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    danger_level: item.dangerLevel,
    daily_usage: item.dailyUsage,
    ordered_quantity: item.orderedQuantity,
    expected_arrival: item.expectedArrival,
    unit: item.unit,
    vendor: item.vendor,
    memo: item.memo,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function mapDbLogToLog(row: DbInventoryLog): InventoryLog {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    action: row.action as InventoryLog["action"],
    quantity:
      row.quantity !== null && row.quantity !== undefined
        ? Number(row.quantity)
        : 0,
    unit: row.unit ?? "",
    detail: row.detail ?? "",
    createdAt: row.created_at,
  };
}

export function mapDbCategoryToCategory(
  row: DbInventoryCategory
): InventoryCategory {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}