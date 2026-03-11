import { ChevronDown, ChevronUp, Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "../types/inventory";

type Props = {
  items: InventoryItem[];
  editingId: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onManualSave: (id: string) => void;
  onUseStock: (id: string) => void;
  onInbound: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (item: InventoryItem) => void;
};

function getStatus(stock: number, dangerLevel: number) {
  if (stock <= 0) {
    return {
      label: "欠品",
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (stock <= dangerLevel) {
    return {
      label: "危険在庫",
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (stock <= dangerLevel * 1.5) {
    return {
      label: "要注意",
      className: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "正常",
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
  };
}

function getStockGuide(stock: number, dangerLevel: number, unit: string) {
  if (stock <= 0) return "在庫がありません";
  if (stock <= dangerLevel) return "危険数量以下";
  return `危険まであと ${stock - dangerLevel}${unit}`;
}

function MobileInventoryCard({
  item,
  isOpen,
  onToggle,
  editingId,
  editValue,
  setEditValue,
  setEditingId,
  onManualSave,
  onUseStock,
  onInbound,
  onDelete,
  onStartEdit,
}: {
  item: InventoryItem;
  isOpen: boolean;
  onToggle: () => void;
  editingId: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onManualSave: (id: string) => void;
  onUseStock: (id: string) => void;
  onInbound: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (item: InventoryItem) => void;
}) {
  const status = getStatus(item.stock, item.dangerLevel);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {item.name}
            </p>
            {item.orderedQuantity > 0 ? (
              <span className="shrink-0 rounded-full border border-[#EAC11A]/30 bg-[#FFF8DF] px-2 py-0.5 text-[10px] font-medium text-[#9A7B00]">
                発注中
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">{item.category}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            在庫 {item.stock}
            {item.unit} / 1日使用 {item.dailyUsage}
            {item.unit}
          </p>
        </div>

        <div className="shrink-0 text-slate-400">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              仕入先: {item.vendor || "未設定"}
            </p>
            <p className="text-xs text-slate-500">
              発注: {item.orderedQuantity} {item.unit}
            </p>
            <p className="text-xs font-medium text-indigo-500">
              入荷予定: {item.expectedArrival || "未定"}
            </p>
            {item.memo ? (
              <p className="break-words text-xs leading-relaxed text-slate-400">
                {item.memo}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              <p className="text-[11px] text-slate-500">現在庫</p>

              {editingId === item.id ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-right outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onManualSave(item.id)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Save className="h-3.5 w-3.5" />
                        保存
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditValue("");
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <X className="h-3.5 w-3.5" />
                        戻す
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none text-slate-900">
                      {item.stock} {item.unit}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                      {getStockGuide(item.stock, item.dangerLevel, item.unit)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(String(item.stock));
                    }}
                    className="shrink-0 rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] text-slate-500">状態</p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>
                  1日使用: {item.dailyUsage} {item.unit}
                </p>
                <p>
                  危険数量: {item.dangerLevel} {item.unit}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUseStock(item.id)}
              className="rounded-xl bg-[#1D2E61] px-3 py-3 text-sm font-medium text-white hover:bg-[#16244d]"
            >
              使用
            </button>

            <button
              type="button"
              onClick={() => onInbound(item.id)}
              className="rounded-xl border border-[#1D2E61]/20 px-3 py-3 text-sm font-medium text-[#1D2E61] hover:bg-[#EEF3FF]"
            >
              入庫
            </button>

            <button
              type="button"
              onClick={() => onStartEdit(item)}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              編集
            </button>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded-xl border border-rose-200 px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <span className="inline-flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                削除
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function InventoryTable({
  items,
  editingId,
  editValue,
  setEditValue,
  setEditingId,
  onManualSave,
  onUseStock,
  onInbound,
  onDelete,
  onStartEdit,
}: Props) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#D9E2F2] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-[#1D2E61]">在庫一覧</h2>
        <p className="mt-1 text-sm text-slate-500">
          登録済みの美容製剤を一覧で確認・操作できます
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-slate-500 sm:px-6">
          条件に一致する製剤はありません。
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {items.map((item) => (
              <MobileInventoryCard
                key={item.id}
                item={item}
                isOpen={openItemId === item.id}
                onToggle={() =>
                  setOpenItemId((prev) => (prev === item.id ? null : item.id))
                }
                editingId={editingId}
                editValue={editValue}
                setEditValue={setEditValue}
                setEditingId={setEditingId}
                onManualSave={onManualSave}
                onUseStock={onUseStock}
                onInbound={onInbound}
                onDelete={onDelete}
                onStartEdit={onStartEdit}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">製剤情報</th>
                  <th className="px-4 py-3 text-left font-medium">現在庫</th>
                  <th className="px-4 py-3 text-left font-medium">1日使用数</th>
                  <th className="px-4 py-3 text-left font-medium">危険数量</th>
                  <th className="px-4 py-3 text-left font-medium">状態</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const status = getStatus(item.stock, item.dangerLevel);

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 align-top transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.name}
                              </p>
                              {item.category ? (
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.category}
                                </p>
                              ) : null}
                            </div>

                            {item.orderedQuantity > 0 ? (
                              <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                                発注中
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-slate-500">
                            仕入先: {item.vendor || "未設定"}
                          </p>

                          <p className="text-xs text-slate-500">
                            発注: {item.orderedQuantity} {item.unit}
                            <span className="ml-2 font-medium text-indigo-500">
                              入荷予定: {item.expectedArrival || "未定"}
                            </span>
                          </p>

                          {item.memo ? (
                            <p className="text-xs leading-relaxed text-slate-400">
                              {item.memo}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-6">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-right outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                            />
                            <button
                              type="button"
                              onClick={() => onManualSave(item.id)}
                              className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditValue("");
                              }}
                              className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.stock} {item.unit}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {getStockGuide(item.stock, item.dangerLevel, item.unit)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(String(item.stock));
                              }}
                              className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-6">
                        <span className="text-slate-700">
                          {item.dailyUsage} {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-6">
                        <span className="text-slate-700">
                          {item.dangerLevel} {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-6">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-6">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onUseStock(item.id)}
                            className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
                          >
                            使用
                          </button>

                          <button
                            type="button"
                            onClick={() => onInbound(item.id)}
                            className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                          >
                            入庫
                          </button>

                          <button
                            type="button"
                            onClick={() => onStartEdit(item)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            編集
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50"
                            aria-label={`${item.name} を削除`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}