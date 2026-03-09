import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Computer, Doc } from "@/components/shared/types";
import ComputersSection from "@/components/ComputersSection";
import DocsSection from "@/components/DocsSection";

export default function Index() {
  const [tab, setTab] = useState<"computers" | "docs">("computers");
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);
  const [computers, setComputers] = useState<Computer[]>([]);

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
              <Icon name="Database" size={12} />
              <span className="hidden sm:inline">База данных</span>
            </div>
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
            docs={[] as Doc[]}
            onSelect={handleSelectComputer}
            selectedId={selectedComputerId}
            onComputersLoaded={setComputers}
          />
        )}
        {tab === "docs" && (
          <DocsSection
            computers={computers}
            filterComputerId={selectedComputerId}
          />
        )}
      </main>
    </div>
  );
}
