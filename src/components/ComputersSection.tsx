import { useState, useMemo, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Computer, Doc, Status, exportCSV } from "@/components/shared/types";
import { EditableCell, StatusCell, SearchBar, FilterSelect, StatCard } from "@/components/shared/TableControls";
import { getComputers, addComputer, updateComputer, deleteComputer } from "@/api/db";

interface ComputersSectionProps {
  docs: Doc[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  onComputersLoaded?: (computers: Computer[]) => void;
}

export default function ComputersSection({ docs, onSelect, selectedId, onComputersLoaded }: ComputersSectionProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Computer>>({ status: "активен" });
  const [list, setList] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getComputers();
    setList(data);
    onComputersLoaded?.(data);
    setLoading(false);
  }, [onComputersLoaded]);

  useEffect(() => { load(); }, [load]);

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

  async function updateField<K extends keyof Computer>(id: string, key: K, value: Computer[K]) {
    setList(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c));
    await updateComputer(id, key, value as string);
  }

  async function handleAdd() {
    if (!form.name || !form.inventory) return;
    const payload = {
      name: form.name ?? "",
      inventory: form.inventory ?? "",
      model: form.model ?? "—",
      location: form.location ?? "—",
      user: form.user ?? "—",
      status: form.status ?? "активен",
      ip: form.ip ?? "—",
      os: form.os ?? "—",
      added: new Date().toISOString().slice(0, 10),
    };
    const res = await addComputer(payload);
    const newC: Computer = { id: res.id, ...payload } as Computer;
    setList(prev => [newC, ...prev]);
    onComputersLoaded?.([newC, ...list]);
    setForm({ status: "активен" });
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await deleteComputer(id);
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
              {loading && (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  <Icon name="Loader" size={16} className="inline mr-2 animate-spin" />Загрузка...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
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
                      <EditableCell value={c.model} onSave={v => updateField(c.id, "model", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.location} onSave={v => updateField(c.id, "location", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.user} onSave={v => updateField(c.id, "user", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusCell value={c.status as Status} onSave={v => updateField(c.id, "status", v)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={c.ip} onSave={v => updateField(c.id, "ip", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onSelect(isSelected ? null : c.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                        }`}
                      >
                        <Icon name="FileText" size={10} />
                        {docCount}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      {deleteConfirm === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Удалить</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
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
        {!loading && (
          <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>Показано {filtered.length} из {list.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
