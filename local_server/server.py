"""
ИТ-Учёт — локальный сервер
Запускает API на http://localhost:8765 и открывает браузер с сайтом.
База данных хранится в файле it_uchet.db рядом со скриптом.
"""
import json
import mimetypes
import os
import sqlite3
import uuid
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

DB_PATH = os.path.join(os.path.dirname(__file__), "it_uchet.db")
DIST_PATH = os.path.join(os.path.dirname(__file__), "..", "dist")
PORT = 8765


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS computers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            inventory TEXT NOT NULL,
            model TEXT NOT NULL DEFAULT '—',
            location TEXT NOT NULL DEFAULT '—',
            user TEXT NOT NULL DEFAULT '—',
            status TEXT NOT NULL DEFAULT 'активен',
            ip TEXT NOT NULL DEFAULT '—',
            os TEXT NOT NULL DEFAULT '—',
            added TEXT NOT NULL DEFAULT (date('now'))
        );
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'Прочее',
            computer_id TEXT NOT NULL REFERENCES computers(id),
            date TEXT NOT NULL DEFAULT (date('now')),
            number TEXT NOT NULL DEFAULT '—',
            note TEXT NOT NULL DEFAULT ''
        );
    """)
    # Демо-данные если база пустая
    if conn.execute("SELECT COUNT(*) FROM computers").fetchone()[0] == 0:
        conn.executescript("""
            INSERT INTO computers VALUES
              ('c1','PC-001','ИНВ-0001','Dell OptiPlex 7090','Кабинет 101','Иванов А.В.','активен','192.168.1.10','Windows 11 Pro','2024-01-15'),
              ('c2','PC-002','ИНВ-0002','HP EliteDesk 800 G6','Кабинет 102','Петрова М.С.','активен','192.168.1.11','Windows 10 Pro','2024-02-10'),
              ('c3','PC-003','ИНВ-0003','Lenovo ThinkCentre M90q','Серверная','—','в ремонте','192.168.1.12','Windows Server 2022','2023-11-05'),
              ('c4','PC-004','ИНВ-0004','Acer Veriton M6680G','Склад','—','списан','—','Windows 7','2020-06-20'),
              ('c5','NB-001','ИНВ-0005','Lenovo ThinkPad X1 Carbon','Кабинет 201','Сидоров К.П.','активен','192.168.1.20','Windows 11 Pro','2024-03-01');
            INSERT INTO documents VALUES
              ('d1','Акт ввода в эксплуатацию','Акт','c1','2024-01-15','АКТ-2024-001','Подписан зам. директора'),
              ('d2','Гарантийный талон','Гарантия','c1','2024-01-15','ГАР-20240115-001','Срок до 2027-01-15'),
              ('d3','Акт ввода в эксплуатацию','Акт','c2','2024-02-10','АКТ-2024-002',''),
              ('d4','Акт ввода в эксплуатацию','Акт','c5','2024-03-01','АКТ-2024-005',''),
              ('d5','Акт на списание','Списание','c4','2024-03-15','СПС-2024-001','Комиссия от 15.03.2024'),
              ('d6','Заявка на ремонт','Ремонт','c3','2024-04-02','РЕМ-2024-003','Сервисный центр Техно');
        """)
    conn.commit()
    conn.close()


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"  [{args[1]}] {args[0]}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw) if raw else {}

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        path = parsed.path.rstrip("/")
        if path not in ("/computers", "/documents"):
            self._serve_static(parsed.path)
            return
        conn = get_conn()
        try:
            if path == "/computers":
                rows = conn.execute(
                    "SELECT id,name,inventory,model,location,user,status,ip,os,added FROM computers ORDER BY added DESC"
                ).fetchall()
                self.send_json([dict(r) for r in rows])
            elif path == "/documents":
                cid = qs.get("computer_id", [None])[0]
                if cid:
                    rows = conn.execute(
                        "SELECT id,title,type,computer_id as computerId,date,number,note FROM documents WHERE computer_id=? ORDER BY date DESC",
                        (cid,)
                    ).fetchall()
                else:
                    rows = conn.execute(
                        "SELECT id,title,type,computer_id as computerId,date,number,note FROM documents ORDER BY date DESC"
                    ).fetchall()
                self.send_json([dict(r) for r in rows])
        finally:
            conn.close()

    def _serve_static(self, path):
        if path == "/" or not path:
            path = "/index.html"
        file_path = os.path.join(DIST_PATH, path.lstrip("/"))
        # SPA fallback — все пути отдают index.html
        if not os.path.isfile(file_path):
            file_path = os.path.join(DIST_PATH, "index.html")
        if not os.path.isfile(file_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"dist/ not found. Download build from poehali.dev")
            return
        mime, _ = mimetypes.guess_type(file_path)
        with open(file_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = self.path.rstrip("/")
        body = self.read_body()
        conn = get_conn()
        try:
            if path == "/computers":
                new_id = body.get("id") or ("c" + uuid.uuid4().hex[:8])
                conn.execute(
                    "INSERT INTO computers(id,name,inventory,model,location,user,status,ip,os,added) VALUES(?,?,?,?,?,?,?,?,?,?)",
                    (new_id, body.get("name",""), body.get("inventory",""),
                     body.get("model","—"), body.get("location","—"), body.get("user","—"),
                     body.get("status","активен"), body.get("ip","—"), body.get("os","—"),
                     body.get("added") or __import__("datetime").date.today().isoformat())
                )
                conn.commit()
                self.send_json({"ok": True, "id": new_id})
            elif path == "/documents":
                new_id = body.get("id") or ("d" + uuid.uuid4().hex[:8])
                conn.execute(
                    "INSERT INTO documents(id,title,type,computer_id,date,number,note) VALUES(?,?,?,?,?,?,?)",
                    (new_id, body.get("title",""), body.get("type","Прочее"),
                     body.get("computerId",""), body.get("date") or __import__("datetime").date.today().isoformat(),
                     body.get("number","—"), body.get("note",""))
                )
                conn.commit()
                self.send_json({"ok": True, "id": new_id})
            else:
                self.send_json({"error": "not found"}, 404)
        finally:
            conn.close()

    def do_PUT(self):
        path = self.path.rstrip("/")
        body = self.read_body()
        conn = get_conn()
        try:
            if path == "/computers":
                field_map = {"user": "user", "name": "name", "inventory": "inventory",
                             "model": "model", "location": "location", "status": "status",
                             "ip": "ip", "os": "os"}
                field = field_map.get(body.get("field",""))
                if not field:
                    return self.send_json({"error": "bad field"}, 400)
                conn.execute(f"UPDATE computers SET {field}=? WHERE id=?", (body.get("value",""), body.get("id")))
                conn.commit()
                self.send_json({"ok": True})
            elif path == "/documents":
                field_map = {"title": "title", "type": "type", "computerId": "computer_id",
                             "date": "date", "number": "number", "note": "note"}
                field = field_map.get(body.get("field",""))
                if not field:
                    return self.send_json({"error": "bad field"}, 400)
                conn.execute(f"UPDATE documents SET {field}=? WHERE id=?", (body.get("value",""), body.get("id")))
                conn.commit()
                self.send_json({"ok": True})
            else:
                self.send_json({"error": "not found"}, 404)
        finally:
            conn.close()

    def do_DELETE(self):
        path = self.path.rstrip("/")
        body = self.read_body()
        conn = get_conn()
        try:
            if path == "/computers":
                cid = body.get("id")
                conn.execute("DELETE FROM documents WHERE computer_id=?", (cid,))
                conn.execute("DELETE FROM computers WHERE id=?", (cid,))
                conn.commit()
                self.send_json({"ok": True})
            elif path == "/documents":
                conn.execute("DELETE FROM documents WHERE id=?", (body.get("id"),))
                conn.commit()
                self.send_json({"ok": True})
            else:
                self.send_json({"error": "not found"}, 404)
        finally:
            conn.close()


if __name__ == "__main__":
    init_db()
    print(f"\n{'='*50}")
    print(f"  ИТ-Учёт — локальный сервер запущен!")
    print(f"  Адрес: http://localhost:{PORT}")
    print(f"  База данных: {DB_PATH}")
    print(f"  Для остановки нажмите Ctrl+C")
    print(f"{'='*50}\n")
    webbrowser.open(f"http://localhost:{PORT}")
    server = HTTPServer(("localhost", PORT), Handler)
    server.serve_forever()