import { useState, useMemo, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Computer, Doc, exportCSV } from "@/components/shared/types";
import { EditableCell, SearchBar, FilterSelect } from "@/components/shared/TableControls";
import { getDocuments, addDocument, updateDocument, deleteDocument } from "@/api/db";

interface DocsSectionProps {
  computers: Computer[];
  filterComputerId: string | null;
}

export default function DocsSection({ computers, filterComputerId }: DocsSectionProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterComp, setFilterComp] = useState(filterComputerId ?? "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Doc>>({});
  const [list, setList] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getDocuments();
    setList(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // При смене фильтра по компьютеру — обновляем локальный фильтр
  useEffect(() => { setFilterComp(filterComputerId ?? ""); }, [filterComputerId]);

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

  async function updateField<K extends keyof Doc>(id: string, key: K, value: Doc[K]) {
    setList(prev => prev.map(d => d.id === id ? { ...d, [key]: value } : d));
    await updateDocument(id, key, value as string);
  }

  async function handleAdd() {
    if (!form.title || !form.computerId) return;
    const payload = {
      title: form.title ?? "",
      type: form.type ?? "Прочее",
      computerId: form.computerId ?? "",
      date: form.date ?? new Date().toISOString().slice(0, 10),
      number: form.number ?? "—",
      note: form.note ?? "",
    };
    const res = await addDocument(payload);
    const newD: Doc = { id: res.id, ...payload };
    setList(prev => [newD, ...prev]);
    setForm({});
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
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
              {loading && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  <Icon name="Loader" size={16} className="inline mr-2 animate-spin" />Загрузка...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                        <EditableCell value={d.type} onSave={v => updateField(d.id, "type", v)} />
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.number} onSave={v => updateField(d.id, "number", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {comp ? (
                        <span className="font-mono-custom">{comp.name}</span>
                      ) : (
                        <span className="text-red-400/60">{d.computerId}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.date} onSave={v => updateField(d.id, "date", v)} mono dim />
                    </td>
                    <td className="px-4 py-2.5">
                      <EditableCell value={d.note} onSave={v => updateField(d.id, "note", v)} dim />
                    </td>
                    <td className="px-4 py-2.5">
                      {deleteConfirm === d.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Удалить</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(d.id)}
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
          <div className="px-4 py-2 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            Показано {filtered.length} из {list.length}
          </div>
        )}
      </div>
    </div>
  );
}
