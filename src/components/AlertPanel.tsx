import type { InventoryItem } from "../types/inventory";

type Props = {
  alertItems: InventoryItem[];
  onInboundQuick?: (id: string) => void;
};

function getShortageText(item: InventoryItem) {
  if (item.stock <= 0) return "欠品中です";
  const shortage = item.dangerLevel - item.stock;
  if (shortage > 0) return `危険数量を ${shortage}${item.unit} 下回っています`;
  return "危険数量に達しています";
}

export default function AlertPanel({ alertItems, onInboundQuick }: Props) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">危険在庫アラート</h2>
        <p className="mt-1 text-sm text-slate-500">補充や使用計画の見直しが必要な製剤です</p>
      </div>

      <div className="space-y-3">
        {alertItems.length === 0 ? (
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">
              現在、危険数量に達している製剤はありません。
            </p>
          </div>
        ) : (
          alertItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  要確認
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-700">
                現在庫:{" "}
                <span className="font-semibold text-rose-600">
                  {item.stock} {item.unit}
                </span>
              </p>
              <p className="text-sm text-slate-700">
                危険数量: {item.dangerLevel} {item.unit}
              </p>
              <p className="text-sm text-slate-700">
                発注数量: {item.orderedQuantity} {item.unit}
              </p>
              <p className="text-sm text-slate-700">
                入荷予定: {item.expectedArrival || "未定"}
              </p>
              <p className="mt-2 text-xs text-rose-600">{getShortageText(item)}</p>

              {onInboundQuick && (
                <button
                  type="button"
                  onClick={() => onInboundQuick(item.id)}
                  className="mt-4 w-full rounded-xl border border-violet-200 px-3 py-2 text-violet-700 hover:bg-violet-50"
                >
                  10{item.unit} を簡易入庫
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}