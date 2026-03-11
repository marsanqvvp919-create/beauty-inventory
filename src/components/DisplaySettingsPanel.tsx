type DisplaySettings = {
  showDashboard: boolean;
  showAlerts: boolean;
  showLogs: boolean;
  showCategoryManager: boolean;
  showAddForm: boolean;
  showTrash: boolean;
};

type Props = {
  settings: DisplaySettings;
  onChange: (next: DisplaySettings) => void;
};

const settingItems: Array<{
  key: keyof DisplaySettings;
  label: string;
  description: string;
}> = [
  {
    key: "showDashboard",
    label: "ダッシュボード",
    description: "上部の集計カードを表示します",
  },
  {
    key: "showAlerts",
    label: "危険在庫アラート",
    description: "危険在庫カードを表示します",
  },
  {
    key: "showLogs",
    label: "履歴一覧",
    description: "履歴アコーディオンを表示します",
  },
  {
    key: "showCategoryManager",
    label: "カテゴリー管理",
    description: "カテゴリー追加・削除カードを表示します",
  },
  {
    key: "showAddForm",
    label: "新規追加フォーム",
    description: "製剤追加・編集フォームを表示します",
  },
  {
    key: "showTrash",
    label: "削除済み一覧",
    description: "復元・完全削除できるゴミ箱を表示します",
  },
];

export default function DisplaySettingsPanel({
  settings,
  onChange,
}: Props) {
  function toggleSetting(key: keyof DisplaySettings) {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  }

  return (
    <div className="rounded-3xl border border-[#D9E2F2] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#1D2E61]">表示設定</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          必要なセクションだけ表示できます
        </p>
      </div>

      <div className="space-y-3">
        {settingItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-2xl border border-[#D9E2F2] bg-[#F8FAFC] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1D2E61]">{item.label}</p>
              <p className="mt-1 text-xs text-[#6B7280]">{item.description}</p>
            </div>

            <button
              type="button"
              onClick={() => toggleSetting(item.key)}
              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
                settings[item.key] ? "bg-[#1D2E61]" : "bg-slate-300"
              }`}
              aria-pressed={settings[item.key]}
              aria-label={item.label}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  settings[item.key] ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}