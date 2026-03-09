import type { InventoryLog } from "../types/inventory";

type Props = {
  logs: InventoryLog[];
};

function getActionLabel(action: InventoryLog["action"]) {
  switch (action) {
    case "add":
      return "追加";
    case "edit":
      return "編集";
    case "delete":
      return "削除";
    case "use":
      return "使用";
    case "inbound":
      return "入庫";
    case "adjust":
      return "手修正";
    default:
      return "履歴";
  }
}

function getActionStyle(action: InventoryLog["action"]) {
  switch (action) {
    case "add":
      return "bg-emerald-50 text-emerald-700";
    case "edit":
      return "bg-sky-50 text-sky-700";
    case "delete":
      return "bg-rose-50 text-rose-700";
    case "use":
      return "bg-amber-50 text-amber-700";
    case "inbound":
      return "bg-violet-50 text-violet-700";
    case "adjust":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function InventoryLogs({ logs }: Props) {
  return (
    <div className="border-t border-slate-100 px-5 py-4">
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">履歴はまだありません。</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{log.itemName}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getActionStyle(
                    log.action
                  )}`}
                >
                  {getActionLabel(log.action)}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">{log.detail}</p>

              {log.quantity !== undefined && (
                <p className="mt-1 text-sm text-slate-500">
                  数量: {log.quantity} {log.unit}
                </p>
              )}

              <p className="mt-1 text-xs text-slate-400">{log.createdAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}