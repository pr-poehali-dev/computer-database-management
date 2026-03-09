import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { COMPUTERS_INIT, DOCS_INIT, Computer, Doc } from "@/components/shared/types";
import ComputersSection from "@/components/ComputersSection";
import DocsSection from "@/components/DocsSection";

export default function Index() {
  const [tab, setTab] = useState<"computers" | "docs">("computers");
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);
  const [computers] = useState<Computer[]>(COMPUTERS_INIT);
  const [docs] = useState<Doc[]>(DOCS_INIT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const hasData = localStorage.getItem("it-computers") || localStorage.getItem("it-docs");
    if (hasData) setSaved(true);
  }, []);

  function handleReset() {
    if (!confirm("Удалить все данные и начать заново? Это действие нельзя отменить.")) return;
    localStorage.removeItem("it-computers");
    localStorage.removeItem("it-docs");
    window.location.reload();
  }

  function handleExportJSON() {
    const computers = JSON.parse(localStorage.getItem("it-computers") ?? "[]");
    const docs = JSON.parse(localStorage.getItem("it-docs") ?? "[]");
    const data = { version: 1, exportedAt: new Date().toISOString(), computers, docs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `it-uchet-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.computers || !data.docs) throw new Error("Неверный формат");
        if (!confirm(`Импортировать ${data.computers.length} компьютеров и ${data.docs.length} документов? Текущие данные будут заменены.`)) return;
        localStorage.setItem("it-computers", JSON.stringify(data.computers));
        localStorage.setItem("it-docs", JSON.stringify(data.docs));
        window.location.reload();
      } catch {
        alert("Ошибка: неверный формат файла. Убедитесь, что это файл экспорта ИТ-Учёт.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const importRef = useRef<HTMLInputElement>(null);

  function handleSelectComputer(id: string | null) {
    setSelectedComputerId(id);
    if (id) setTab("docs");
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
              <Icon name="Database" size={14} className="text-primary" />
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight">ИТ-Учёт</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <nav className="flex gap-1">
            {([
              { key: "computers", label: "Компьютеры", icon: "Monitor" },
              { key: "docs", label: "Документы", icon: "FileText" },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); if (t.key === "computers") setSelectedComputerId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  tab === t.key
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon name={t.icon} size={14} />
                {t.label}
                {t.key === "docs" && selectedComputerId && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {selectedComputerId && (
              <button
                onClick={() => { setSelectedComputerId(null); setTab("computers"); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={12} />
                Сбросить фильтр
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Icon name="HardDrive" size={12} />
              <span className="hidden sm:inline">Сохранено локально</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <button
              onClick={handleExportJSON}
              title="Экспорт в JSON"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="Upload" size={12} />
              <span className="hidden sm:inline">Экспорт</span>
            </button>
            <button
              onClick={() => importRef.current?.click()}
              title="Импорт из JSON"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="FolderOpen" size={12} />
              <span className="hidden sm:inline">Импорт</span>
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            <div className="h-3 w-px bg-border" />
            <button
              onClick={handleReset}
              title="Сбросить все данные"
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Icon name="RotateCcw" size={12} />
              <span className="hidden sm:inline">Сброс</span>
            </button>
            <div className="h-3 w-px bg-border" />
            <div className="text-xs text-muted-foreground font-mono-custom">
              {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "computers" && (
          <ComputersSection
            computers={computers}
            docs={docs}
            onSelect={handleSelectComputer}
            selectedId={selectedComputerId}
          />
        )}
        {tab === "docs" && (
          <DocsSection
            docs={docs}
            computers={computers}
            filterComputerId={selectedComputerId}
          />
        )}
      </main>
    </div>
  );
}
