import { RotateCcw, Trash2 } from "lucide-react";
import type { DeletedInventoryItem } from "../types/inventory";

type Props = {
  items: DeletedInventoryItem[];
  onRestore: (item: DeletedInventoryItem) => void;
  onPermanentDelete: (item: DeletedInventoryItem) => void;
};

export default function TrashPanel({
  items,
  onRestore,
  onPermanentDelete,
}: Props) {
  return (
    <div className="rounded-3xl border border-[#D9E2F2] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#1D2E61]">削除済み一覧</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          削除した製剤を復元、または完全削除できます
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#D9E2F2] bg-[#F8FAFC] px-4 py-6 text-sm text-[#6B7280]">
          削除済みの製剤はありません。
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#D9E2F2] bg-[#F8FAFC] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1D2E61]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">{item.category}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    在庫 {item.stock}
                    {item.unit} / 削除日時 {new Date(item.deletedAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(item)}
                  className="rounded-xl bg-[#1D2E61] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#16244d]"
                >
                  <span className="inline-flex items-center gap-1">
                    <RotateCcw className="h-4 w-4" />
                    復元
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onPermanentDelete(item)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    完全削除
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}