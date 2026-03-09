import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Status, STATUS_COLORS, STATUS_DOT } from "@/components/shared/types";

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);

  return [value, set];
}

export function EditableCell({
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

export function StatusCell({ value, onSave }: { value: Status; onSave: (v: Status) => void }) {
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

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
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

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
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

export function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
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
