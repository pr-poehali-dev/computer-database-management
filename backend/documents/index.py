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
    """CRUD для документов: GET /list, POST /add, PUT /update, DELETE /delete"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # GET — список документов (опционально ?computer_id=xxx)
    if method == "GET":
        computer_id = params.get("computer_id")
        if computer_id:
            cur.execute(
                "SELECT id, title, type, computer_id, date, number, note FROM documents WHERE computer_id = %s ORDER BY date DESC",
                (computer_id,),
            )
        else:
            cur.execute(
                "SELECT id, title, type, computer_id, date, number, note FROM documents ORDER BY date DESC"
            )
        rows = cur.fetchall()
        cols = ["id", "title", "type", "computerId", "date", "number", "note"]
        result = [dict(zip(cols, [str(v) if v is not None else "" for v in row])) for row in rows]
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(result, ensure_ascii=False)}

    # POST — добавить документ
    if method == "POST":
        new_id = body.get("id") or ("d" + uuid.uuid4().hex[:8])
        cur.execute(
            "INSERT INTO documents (id, title, type, computer_id, date, number, note) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                new_id,
                body.get("title", ""),
                body.get("type", "Прочее"),
                body.get("computerId", ""),
                body.get("date") or None,
                body.get("number", "—"),
                body.get("note", ""),
            ),
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True, "id": new_id}, ensure_ascii=False)}

    # PUT — обновить поле документа
    if method == "PUT":
        did = body.get("id")
        field = body.get("field")
        value = body.get("value", "")
        allowed = {"title", "type", "computer_id", "date", "number", "note"}
        field_map = {"computerId": "computer_id"}
        col = field_map.get(field, field)
        if not did or col not in allowed:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "bad request"})}
        cur.execute(f"UPDATE documents SET {col} = %s WHERE id = %s", (value, did))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    # DELETE — удалить документ
    if method == "DELETE":
        did = body.get("id") or params.get("id")
        if not did:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "id required"})}
        cur.execute("DELETE FROM documents WHERE id = %s", (did,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": HEADERS, "body": json.dumps({"error": "method not allowed"})}
