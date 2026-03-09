export type Status = "активен" | "в ремонте" | "списан";

export interface Computer {
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

export interface Doc {
  id: string;
  title: string;
  type: string;
  computerId: string;
  date: string;
  number: string;
  note: string;
}

export const COMPUTERS_INIT: Computer[] = [
  { id: "c1", name: "PC-001", inventory: "ИНВ-0001", model: "Dell OptiPlex 7090", location: "Кабинет 101", user: "Иванов А.В.", status: "активен", ip: "192.168.1.10", os: "Windows 11 Pro", added: "2024-01-15" },
  { id: "c2", name: "PC-002", inventory: "ИНВ-0002", model: "HP EliteDesk 800 G6", location: "Кабинет 102", user: "Петрова М.С.", status: "активен", ip: "192.168.1.11", os: "Windows 10 Pro", added: "2024-02-10" },
  { id: "c3", name: "PC-003", inventory: "ИНВ-0003", model: "Lenovo ThinkCentre M90q", location: "Серверная", user: "—", status: "в ремонте", ip: "192.168.1.12", os: "Windows Server 2022", added: "2023-11-05" },
  { id: "c4", name: "PC-004", inventory: "ИНВ-0004", model: "Acer Veriton M6680G", location: "Склад", user: "—", status: "списан", ip: "—", os: "Windows 7", added: "2020-06-20" },
  { id: "c5", name: "NB-001", inventory: "ИНВ-0005", model: "Lenovo ThinkPad X1 Carbon", location: "Кабинет 201", user: "Сидоров К.П.", status: "активен", ip: "192.168.1.20", os: "Windows 11 Pro", added: "2024-03-01" },
];

export const DOCS_INIT: Doc[] = [
  { id: "d1", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c1", date: "2024-01-15", number: "АКТ-2024-001", note: "Подписан зам. директора" },
  { id: "d2", title: "Гарантийный талон", type: "Гарантия", computerId: "c1", date: "2024-01-15", number: "ГАР-20240115-001", note: "Срок до 2027-01-15" },
  { id: "d3", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c2", date: "2024-02-10", number: "АКТ-2024-002", note: "" },
  { id: "d4", title: "Акт ввода в эксплуатацию", type: "Акт", computerId: "c5", date: "2024-03-01", number: "АКТ-2024-005", note: "" },
  { id: "d5", title: "Акт на списание", type: "Списание", computerId: "c4", date: "2024-03-15", number: "СПС-2024-001", note: "Комиссия от 15.03.2024" },
  { id: "d6", title: "Заявка на ремонт", type: "Ремонт", computerId: "c3", date: "2024-04-02", number: "РЕМ-2024-003", note: "Сервисный центр Техно" },
];

export const STATUS_COLORS: Record<Status, string> = {
  "активен": "text-emerald-400 bg-emerald-400/10",
  "в ремонте": "text-amber-400 bg-amber-400/10",
  "списан": "text-red-400 bg-red-400/10",
};

export const STATUS_DOT: Record<Status, string> = {
  "активен": "bg-emerald-400",
  "в ремонте": "bg-amber-400",
  "списан": "bg-red-400",
};

export function exportCSV(rows: Record<string, string>[], filename: string) {
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(";"), ...rows.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
