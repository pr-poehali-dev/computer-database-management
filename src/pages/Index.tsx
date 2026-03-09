import { useState, useMemo, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "активен" | "в ремонте" | "списан";

interface Computer {
  id: string;
  name: string;
  inventory: string;
  model: string;
  location: string;
  user: string;
  status: Status;
  ip: string;
  os: string;
  added: string;
}

interface Doc {
  id: string;
  title: string;
  type: string;
  computerId: string;
  date: string;
  number: string;
  note: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const COMPUTERS_INIT: Computer[] = [
  { id: "c1", name: "PC-001", inventory: "ИНВ-0001", model: "Dell OptiPlex 7090", location: "Кабинет 101", user: "Иванов А.В.", status: "активен", ip: "192.168.1.10", os: "Windows 11 Pro", added: "2024-01-15" },
  { id: "c2", name: "PC-002", inventory: "ИНВ-0002", model: "HP EliteDesk 800 G6", location: "Кабинет 102", user: "Петрова М.С.", status: "активен", ip: "192.168.1.11", os: "Windows 10 Pro", added: "2024-02-10" },
  { id: "c3", name: "PC-003", inventory: "ИНВ-0003", model: "Lenovo ThinkCentre M90q", location: "Серверная", user: "—", status: "в ремонте", ip: "192.168.1.12", os: "Windows Server 2022", added: "2023-11-05" },
  { id: "c4", name: "PC-004", inventory: "ИНВ-0004", model: "Acer Veriton M6680G", location: "Склад", user: "—", status: "списан", ip: "—", os: "Windows 7", added: "2020-06-20" },
  { id: "c5", name: "NB-001", inventory: "ИНВ-0005", model: "Lenovo ThinkPad X1 Carbon", location: "Кабинет 201", user: "Сидоров К.П.", status: "активен", ip: "192.168.1.20", os: "Windows 11 Pro", added: "2024-03-01" },
];

const DOCS_INIT: Doc[] = [
  { id: "d1", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c1", date: "2024-01-15", number: "АКТ-2024-001", note: "Подписан зам. директора" },
  { id: "d2", title: "Гарантийный талон", type: "Гарантия", computerId: "c1", date: "2024-01-15", number: "ГАР-20240115-001", note: "Срок до 2027-01-15" },
  { id: "d3", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c2", date: "2024-02-10", number: "АКТ-2024-002", note: "" },
  { id: "d4", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c5", date: "2024-03-01", number: "АКТ-2024-005", note: "" },
  { id: "d5", title: "Акт на списание", type: "Списание", computerId: "c4", date: "2024-03-15", number: "СПС-2024-001", note: "Комиссия от 15.03.2024" },
  { id: "d6", title: "Заявка на ремонт", type: "Ремонт", computerId: "c3", date: "2024-04-02", number: "РЕМ-2024-003", note: "Сервисный центр Техно" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<Status, string> = {
  "активен": "text-emerald-400 bg-emerald-400/10",
  "в ремонте": "text-amber-400 bg-amber-400/10",
  "списан": "text-red-400 bg-red-400/10",
};

const STATUS_DOT: Record<Status, string> = {
  "активен": "bg-emerald-400",
  "в ремонте": "bg-amber-400",
  "списан": "bg-red-400",
};

function exportCSV(rows: Record<string, string>[], filename: string) {
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(";"), ...rows.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Inline editable cell ──────────────────────────────────────────────────

function EditableCell({
  value, onSave, mono = false, dim = false, className = ""
}: {
  value: string;
  onSave: (v: string) => void;
  mono?: boolean;
  dim?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  function commit() {
    onSave(draft.trim() || value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        className={`w-full bg-primary/10 border border-primary/40 rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 ${mono ? "font-mono-custom" : ""} ${className}`}
      />
    );
  }

  return (
    <span
      title="Двойной клик для редактирования"
      onDoubleClick={() => setEditing(true)}
      className={`cursor-text hover:bg-muted/60 rounded px-1 py-0.5 -mx-1 transition-colors group relative ${mono ? "font-mono-custom text-xs" : ""} ${dim ? "text-muted-foreground" : "text-foreground"} ${className}`}
    >
      {value}
      <Icon name="Pencil" size={10} className="ml-1 opacity-0 group-hover:opacity-40 inline-block transition-opacity" />
    </span>
  );
}

function StatusCell({ value, onSave }: { value: Status; onSave: (v: Status) => void }) {
  const [open, setOpen] = useState(false);
  const statuses: Status[] = ["активен", "в ремонте", "списан"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[value]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[value]}`} />
        {value}
        <Icon name="ChevronDown" size={10} className="ml-0.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in min-w-32">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { onSave(s); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors ${s === value ? "bg-muted/60" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
              <span className={STATUS_COLORS[s].split(" ")[0]}>{s}</span>
              {s === value && <Icon name="Check" size={10} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <Icon name="X" size={12} />
        </button>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
    >
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${color}`}>
        <Icon name={icon} size={16} />
      </div>
      <div>
        <div className="text-2xl font-semibold font-mono-custom leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Computers Section ────────────────────────────────────────────────────────

function ComputersSection({
  computers, docs, onSelect, selectedId
}: {
  computers: Computer[];
  docs: Doc[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Computer>>({ status: "активен" });
  const [list, setList] = useState<Computer[]>(computers);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const locations = useMemo(() => [...new Set(list.map(c => c.location))], [list]);

  const filtered = useMemo(() => list.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || [c.name, c.inventory, c.model, c.user, c.ip, c.location].some(v => v.toLowerCase().includes(q));
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchLoc = !filterLocation || c.location === filterLocation;
    return matchSearch && matchStatus && matchLoc;
  }), [list, search, filterStatus, filterLocation]);

  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter(c => c.status === "активен").length,
    repair: list.filter(c => c.status === "в ремонте").length,
    retired: list.filter(c => c.status === "списан").length,
  }), [list]);

  function updateField<K extends keyof Computer>(id: string, key: K, value: Computer[K]) {
    setList(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c));
  }

  function handleAdd() {
    if (!form.name || !form.inventory) return;
    const newC: Computer = {
      id: "c" + Date.now(),
      name: form.name ?? "",
      inventory: form.inventory ?? "",
      model: form.model ?? "—",
      location: form.location ?? "—",
      user: form.user ?? "—",
      status: (form.status as Status) ?? "активен",
      ip: form.ip ?? "—",
      os: form.os ?? "—",
      added: new Date().toISOString().slice(0, 10),
    };
    setList(prev => [newC, ...prev]);
    setForm({ status: "активен" });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setList(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  }

  function handleExport() {
    exportCSV(filtered.map(c => ({
      "Имя": c.name, "Инвентарный №": c.inventory, "Модель": c.model,
      "Расположение": c.location, "Пользователь": c.user, "Статус": c.status,
      "IP": c.ip, "ОС": c.os, "Добавлен": c.added,
    })), "computers.csv");
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Всего" value={stats.total} icon="Monitor" color="bg-primary/10 text-primary" />
        <StatCard label="Активных" value={stats.active} icon="CheckCircle" color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="В ремонте" value={stats.repair} icon="Wrench" color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Списано" value={stats.retired} icon="Archive" color="bg-red-500/10 text-red-400" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Поиск по имени, инв. №, IP..." />
        </div>
        <FilterSelect value={filterStatus} onChange={setFilterStatus} options={["активен", "в ремонте", "списан"]} label="Все статусы" />
        <FilterSelect value={filterLocation} onChange={setFilterLocation} options={locations} label="Все локации" />
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-muted hover:bg-secondary text-sm text-foreground transition-colors">
          <Icon name="Download" size={14} />CSV
        </button>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={14} />Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-lg p-4 animate-fade-in">
          <div className="text-sm font-medium mb-3 text-foreground">Новый компьютер</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {([
              ["name", "Имя (PC-XXX) *"],
              ["inventory", "Инвентарный № *"],
              ["model", "Модель"],
              ["location", "Расположение"],
              ["user", "Пользователь"],
              ["ip", "IP-адрес"],
              ["os", "Операционная система"],
            ] as [keyof Computer, string][]).map(([key, label]) => (
              <input key={key} placeholder={label} value={(form[key] as string) ?? ""}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            ))}
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="активен">активен</option>
              <option value="в ремонте">в ремонте</option>
              <option value="списан">списан</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded bg-muted border border-border text-sm text-foreground hover:bg-secondary transition-colors">Отмена</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-2">
          <Icon name="Info" size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Двойной клик на ячейке — редактировать. Клик на статусе — сменить. Строку нажмите для просмотра документов.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Имя", "Инв. №", "Модель", "Расположение", "Пользователь", "Статус", "IP", "Документы", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">Ничего не найдено</td></tr>
              )}
              {filtered.map(c => {
                const docCount = docs.filter(d => d.computerId === c.id).length;
                const isSelected = selectedId === c.id;
                return (
                  <tr key={c.id} className={`border-b border-border group ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"} transition-colors`}>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.name} onSave={v => updateField(c.id, "name", v)} mono />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.inventory} onSave={v => updateField(c.id, "inventory", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.model} onSave={v => updateField(c.id, "model", v)} dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.location} onSave={v => updateField(c.id, "location", v)} dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.user} onSave={v => updateField(c.id, "user", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusCell value={c.status} onSave={v => updateField(c.id, "status", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.ip} onSave={v => updateField(c.id, "ip", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onSelect(isSelected ? null : c.id)}
                        className={`inline-flex items-center gap-1 text-xs transition-colors ${docCount > 0 ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon name="FileText" size={12} />
                        {docCount > 0 ? docCount : "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      {deleteConfirm === c.id ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Удалить</button>
                          <span className="text-muted-foreground text-xs">/</span>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          Показано {filtered.length} из {list.length}
        </div>
      </div>
    </div>
  );
}

// ─── Documents Section ────────────────────────────────────────────────────────

function DocsSection({
  docs, computers, filterComputerId
}: {
  docs: Doc[];
  computers: Computer[];
  filterComputerId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterComp, setFilterComp] = useState(filterComputerId ?? "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Doc>>({});
  const [list, setList] = useState<Doc[]>(docs);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(list.map(d => d.type))], [list]);

  const filtered = useMemo(() => {
    const compId = filterComputerId ?? filterComp;
    return list.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || [d.title, d.number, d.note, d.type].some(v => v.toLowerCase().includes(q));
      const matchType = !filterType || d.type === filterType;
      const matchComp = !compId || d.computerId === compId;
      return matchSearch && matchType && matchComp;
    });
  }, [list, search, filterType, filterComp, filterComputerId]);

  function updateField<K extends keyof Doc>(id: string, key: K, value: Doc[K]) {
    setList(prev => prev.map(d => d.id === id ? { ...d, [key]: value } : d));
  }

  function handleAdd() {
    if (!form.title || !form.computerId) return;
    const newD: Doc = {
      id: "d" + Date.now(),
      title: form.title ?? "",
      type: form.type ?? "Прочее",
      computerId: form.computerId ?? "",
      date: form.date ?? new Date().toISOString().slice(0, 10),
      number: form.number ?? "—",
      note: form.note ?? "",
    };
    setList(prev => [newD, ...prev]);
    setForm({});
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setList(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
  }

  function handleExport() {
    exportCSV(filtered.map(d => {
      const comp = computers.find(c => c.id === d.computerId);
      return {
        "Название": d.title, "Тип": d.type, "Номер": d.number,
        "Компьютер": comp?.name ?? d.computerId, "Дата": d.date, "Примечание": d.note,
      };
    }), "documents.csv");
  }

  const linkedComp = filterComputerId ? computers.find(c => c.id === filterComputerId) : null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {linkedComp && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 text-sm text-primary">
          <Icon name="Link" size={14} />
          Фильтр по компьютеру: <strong>{linkedComp.name}</strong> — {linkedComp.inventory}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию, номеру..." />
        </div>
        <FilterSelect value={filterType} onChange={setFilterType} options={types} label="Все типы" />
        {!filterComputerId && (
          <FilterSelect value={filterComp} onChange={setFilterComp} options={computers.map(c => c.id)} label="Все компьютеры" />
        )}
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-muted hover:bg-secondary text-sm text-foreground transition-colors">
          <Icon name="Download" size={14} />CSV
        </button>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={14} />Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-lg p-4 animate-fade-in">
          <div className="text-sm font-medium mb-3">Новый документ</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input placeholder="Название *" value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input placeholder="Тип (Акт, Гарантия...)" value={form.type ?? ""} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input placeholder="Номер документа" value={form.number ?? ""} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input type="date" value={form.date ?? ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <select value={form.computerId ?? filterComputerId ?? ""} onChange={e => setForm(f => ({ ...f, computerId: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="">Привязать к компьютеру *</option>
              {computers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.inventory}</option>)}
            </select>
            <input placeholder="Примечание" value={form.note ?? ""} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded bg-muted border border-border text-sm text-foreground hover:bg-secondary transition-colors">Отмена</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-2">
          <Icon name="Info" size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Двойной клик на ячейке — редактировать. Enter — сохранить, Escape — отменить.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Название", "Тип", "Номер", "Компьютер", "Дата", "Примечание", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Ничего не найдено</td></tr>
              )}
              {filtered.map(d => {
                const comp = computers.find(c => c.id === d.computerId);
                return (
                  <tr key={d.id} className="border-b border-border group hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.title} onSave={v => updateField(d.id, "title", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.type} onSave={v => updateField(d.id, "type", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.number} onSave={v => updateField(d.id, "number", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={d.computerId}
                        onChange={e => updateField(d.id, "computerId", e.target.value)}
                        className="bg-transparent border-0 text-xs text-primary focus:outline-none cursor-pointer hover:bg-muted rounded px-1 py-0.5 -mx-1"
                      >
                        {computers.map(c => (
                          <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name} — {c.inventory}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={d.date}
                        onChange={e => updateField(d.id, "date", e.target.value)}
                        className="bg-transparent border-0 text-xs text-muted-foreground font-mono-custom focus:outline-none focus:bg-muted rounded px-1 py-0.5 -mx-1 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5 max-w-48">
                      <EditableCell value={d.note || "—"} onSave={v => updateField(d.id, "note", v === "—" ? "" : v)} dim className="truncate block" />
                    </td>
                    <td className="px-3 py-2.5">
                      {deleteConfirm === d.id ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Удалить</button>
                          <span className="text-muted-foreground text-xs">/</span>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(d.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          Показано {filtered.length} из {list.length}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<"computers" | "docs">("computers");
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);
  const [computers] = useState<Computer[]>(COMPUTERS_INIT);
  const [docs] = useState<Doc[]>(DOCS_INIT);

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
