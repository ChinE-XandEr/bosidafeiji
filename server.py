from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os

class GameDataHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/data/data.json':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # 确保data目录存在
            os.makedirs('data', exist_ok=True)

            # 保存数据到文件
            with open('data/data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path == '/data/data.json':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            try:
                with open('data/data.json', 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            except FileNotFoundError:
                self.wfile.write(b'{"coins": 0, "highScore": 0}')
        else:
            super().do_GET()

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, GameDataHandler)
    print('Starting server on port 8000...')
    httpd.serve_forever()
