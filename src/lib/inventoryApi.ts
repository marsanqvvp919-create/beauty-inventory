import { supabase } from "./supabase";
import type {
  DeletedInventoryItem,
  InventoryCategory,
  InventoryItem,
  InventoryLog,
} from "../types/inventory";
import {
  mapDbCategoryToCategory,
  mapDbDeletedItemToDeletedItem,
  mapDbItemToItem,
  mapDbLogToLog,
  mapItemToDbInsert,
  mapItemToDbUpdate,
  mapItemToDeletedDbInsert,
} from "./inventoryMappers";

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapDbItemToItem);
}

export async function fetchDeletedInventoryItems(): Promise<DeletedInventoryItem[]> {
  const { data, error } = await supabase
    .from("deleted_inventory_items")
    .select("*")
    .order("deleted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapDbDeletedItemToDeletedItem);
}

export async function fetchInventoryLogs(): Promise<InventoryLog[]> {
  const { data, error } = await supabase
    .from("inventory_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapDbLogToLog);
}

export async function fetchInventoryCategories(): Promise<InventoryCategory[]> {
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapDbCategoryToCategory);
}

export async function createInventoryItem(
  payload: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(mapItemToDbInsert(payload))
    .select("*")
    .single();

  if (error) throw error;

  return mapDbItemToItem(data);
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .update(mapItemToDbUpdate(updates))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return mapDbItemToItem(data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);

  if (error) throw error;
}

export async function archiveDeletedInventoryItem(
  item: InventoryItem
): Promise<DeletedInventoryItem> {
  const { data, error } = await supabase
    .from("deleted_inventory_items")
    .insert(mapItemToDeletedDbInsert(item))
    .select("*")
    .single();

  if (error) throw error;

  return mapDbDeletedItemToDeletedItem(data);
}

export async function restoreDeletedInventoryItem(
  deletedItem: DeletedInventoryItem
): Promise<InventoryItem> {
  const insertPayload = {
    name: deletedItem.name,
    category: deletedItem.category,
    stock: deletedItem.stock,
    danger_level: deletedItem.dangerLevel,
    daily_usage: deletedItem.dailyUsage,
    ordered_quantity: deletedItem.orderedQuantity,
    expected_arrival: deletedItem.expectedArrival,
    unit: deletedItem.unit,
    vendor: deletedItem.vendor,
    memo: deletedItem.memo,
    created_at: deletedItem.createdAt,
    updated_at: deletedItem.updatedAt,
  };

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;

  return mapDbItemToItem(data);
}

export async function permanentlyDeleteDeletedInventoryItem(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("deleted_inventory_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function createInventoryLog(payload: {
  itemId: string | null;
  itemName: string;
  action: InventoryLog["action"];
  quantity?: number;
  unit?: string;
  detail: string;
}): Promise<InventoryLog> {
  const { data, error } = await supabase
    .from("inventory_logs")
    .insert({
      item_id: payload.itemId,
      item_name: payload.itemName,
      action: payload.action,
      quantity: payload.quantity ?? 0,
      unit: payload.unit ?? "",
      detail: payload.detail,
    })
    .select("*")
    .single();

  if (error) throw error;

  return mapDbLogToLog(data);
}

export async function createInventoryCategory(
  name: string
): Promise<InventoryCategory> {
  const { data, error } = await supabase
    .from("inventory_categories")
    .insert({
      name,
      is_default: false,
    })
    .select("*")
    .single();

  if (error) throw error;

  return mapDbCategoryToCategory(data);
}

export async function deleteInventoryCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("inventory_categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}