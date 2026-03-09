import json
import os
import uuid
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """CRUD для компьютеров: GET /list, POST /add, PUT /update, DELETE /delete"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # GET — список всех компьютеров
    if method == "GET":
        cur.execute(
            'SELECT id, name, inventory, model, location, "user", status, ip, os, added FROM computers ORDER BY added DESC'
        )
        rows = cur.fetchall()
        cols = ["id", "name", "inventory", "model", "location", "user", "status", "ip", "os", "added"]
        result = [dict(zip(cols, [str(v) if v is not None else "" for v in row])) for row in rows]
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(result, ensure_ascii=False)}

    # POST — добавить компьютер
    if method == "POST":
        new_id = body.get("id") or ("c" + uuid.uuid4().hex[:8])
        cur.execute(
            'INSERT INTO computers (id, name, inventory, model, location, "user", status, ip, os, added) '
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                new_id,
                body.get("name", ""),
                body.get("inventory", ""),
                body.get("model", "—"),
                body.get("location", "—"),
                body.get("user", "—"),
                body.get("status", "активен"),
                body.get("ip", "—"),
                body.get("os", "—"),
                body.get("added") or None,
            ),
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True, "id": new_id}, ensure_ascii=False)}

    # PUT — обновить поле компьютера
    if method == "PUT":
        cid = body.get("id")
        field = body.get("field")
        value = body.get("value", "")
        allowed = {"name", "inventory", "model", "location", "user", "status", "ip", "os"}
        if not cid or field not in allowed:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "bad request"})}
        col = '"user"' if field == "user" else field
        cur.execute(f"UPDATE computers SET {col} = %s WHERE id = %s", (value, cid))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    # DELETE — удалить компьютер (сначала удаляем его документы)
    if method == "DELETE":
        cid = body.get("id") or params.get("id")
        if not cid:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "id required"})}
        cur.execute("DELETE FROM documents WHERE computer_id = %s", (cid,))
        cur.execute("DELETE FROM computers WHERE id = %s", (cid,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": HEADERS, "body": json.dumps({"error": "method not allowed"})}
