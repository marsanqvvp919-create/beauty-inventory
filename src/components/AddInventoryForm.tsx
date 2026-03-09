import { ARRIVAL_OPTIONS, UNIT_OPTIONS } from "../data/inventory";
import type { InventoryForm } from "../types/inventory";

type Props = {
  form: InventoryForm;
  categoryOptions: string[];
  isEditMode: boolean;
  setForm: (value: InventoryForm) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export default function AddInventoryForm({
  form,
  categoryOptions,
  isEditMode,
  setForm,
  onSubmit,
  onCancelEdit,
}: Props) {
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100";
  const textareaClassName =
    "min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100";

  const hasCategories = categoryOptions.length > 0;

  return (
    <div className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditMode ? "製剤編集" : "新規製剤追加"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode
            ? "登録済み製剤の情報を更新します"
            : "在庫管理に新しい製剤を追加します"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            製剤名
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClassName}
            placeholder="例：リジュラン"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            カテゴリー
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as InventoryForm["category"],
              })
            }
            className={inputClassName}
            disabled={!hasCategories}
          >
            {hasCategories ? (
              categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            ) : (
              <option value="">カテゴリーがありません</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              現在庫
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className={`${inputClassName} text-right`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              単位
            </label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={inputClassName}
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              危険数量
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.dangerLevel}
              onChange={(e) =>
                setForm({ ...form, dangerLevel: e.target.value })
              }
              className={`${inputClassName} text-right`}
              placeholder="5"
            />
            <p className="mt-1 text-xs text-slate-400">
              この数量以下で危険在庫として表示します
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              1日使用数量
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.dailyUsage}
              onChange={(e) =>
                setForm({ ...form, dailyUsage: e.target.value })
              }
              className={`${inputClassName} text-right`}
              placeholder="1"
            />
            <p className="mt-1 text-xs text-slate-400">
              使用ボタン押下時に減算する数量です
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              発注数量
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.orderedQuantity}
              onChange={(e) =>
                setForm({ ...form, orderedQuantity: e.target.value })
              }
              className={`${inputClassName} text-right`}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-slate-400">
              現在発注している数量を入力します
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              入荷予定
            </label>
            <select
  value={form.expectedArrival}
  onChange={(e) =>
    setForm({
      ...form,
      expectedArrival: e.target.value as InventoryForm["expectedArrival"],
    })
  }
  className={inputClassName}
>
              {ARRIVAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              厳密な日付ではなく、ざっくりした予定を記録します
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            仕入先
          </label>
          <input
            type="text"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            className={inputClassName}
            placeholder="例：韓国サプライヤーA"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            メモ
          </label>
          <textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            className={textareaClassName}
            placeholder="自由記載"
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-medium text-white transition hover:from-pink-600 hover:to-rose-600"
          >
            {isEditMode ? "更新する" : "追加する"}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
}