CREATE TABLE IF NOT EXISTS computers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inventory TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '—',
  location TEXT NOT NULL DEFAULT '—',
  "user" TEXT NOT NULL DEFAULT '—',
  status TEXT NOT NULL DEFAULT 'активен',
  ip TEXT NOT NULL DEFAULT '—',
  os TEXT NOT NULL DEFAULT '—',
  added DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Прочее',
  computer_id TEXT NOT NULL REFERENCES computers(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  number TEXT NOT NULL DEFAULT '—',
  note TEXT NOT NULL DEFAULT ''
);

INSERT INTO computers (id, name, inventory, model, location, "user", status, ip, os, added) VALUES
  ('c1', 'PC-001', 'ИНВ-0001', 'Dell OptiPlex 7090', 'Кабинет 101', 'Иванов А.В.', 'активен', '192.168.1.10', 'Windows 11 Pro', '2024-01-15'),
  ('c2', 'PC-002', 'ИНВ-0002', 'HP EliteDesk 800 G6', 'Кабинет 102', 'Петрова М.С.', 'активен', '192.168.1.11', 'Windows 10 Pro', '2024-02-10'),
  ('c3', 'PC-003', 'ИНВ-0003', 'Lenovo ThinkCentre M90q', 'Серверная', '—', 'в ремонте', '192.168.1.12', 'Windows Server 2022', '2023-11-05'),
  ('c4', 'PC-004', 'ИНВ-0004', 'Acer Veriton M6680G', 'Склад', '—', 'списан', '—', 'Windows 7', '2020-06-20'),
  ('c5', 'NB-001', 'ИНВ-0005', 'Lenovo ThinkPad X1 Carbon', 'Кабинет 201', 'Сидоров К.П.', 'активен', '192.168.1.20', 'Windows 11 Pro', '2024-03-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (id, title, type, computer_id, date, number, note) VALUES
  ('d1', 'Акт ввода в эксплуатацию', 'Акт', 'c1', '2024-01-15', 'АКТ-2024-001', 'Подписан зам. директора'),
  ('d2', 'Гарантийный талон', 'Гарантия', 'c1', '2024-01-15', 'ГАР-20240115-001', 'Срок до 2027-01-15'),
  ('d3', 'Акт ввода в эксплуатацию', 'Акт', 'c2', '2024-02-10', 'АКТ-2024-002', ''),
  ('d4', 'Акт ввода в эксплуатацию', 'Акт', 'c5', '2024-03-01', 'АКТ-2024-005', ''),
  ('d5', 'Акт на списание', 'Списание', 'c4', '2024-03-15', 'СПС-2024-001', 'Комиссия от 15.03.2024'),
  ('d6', 'Заявка на ремонт', 'Ремонт', 'c3', '2024-04-02', 'РЕМ-2024-003', 'Сервисный центр Техно')
ON CONFLICT (id) DO NOTHING;
