const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

// WebOSの画面（HTML/CSS/JS）
const HTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Single-file WebOS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { height: 100vh; background: #1e293b; font-family: sans-serif; overflow: hidden; }
    #taskbar { position: fixed; bottom: 0; width: 100%; height: 40px; background: #0f172a; display: flex; align-items: center; padding: 0 10px; }
    button { background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    .window { position: absolute; top: 40px; left: 40px; width: 640px; height: 420px; background: #fff; border-radius: 6px; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; }
    .window-header { background: #334155; color: #fff; padding: 8px; display: flex; justify-content: space-between; cursor: move; }
    .window-body { flex: 1; display: flex; flex-direction: column; }
    .toolbar { display: flex; padding: 6px; background: #e2e8f0; gap: 6px; }
    .toolbar input { flex: 1; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; }
    iframe { flex: 1; border: none; width: 100%; height: 100%; background: #fff; }
  </style>
</head>
<body>
  <div id="desktop"></div>
  <div id="taskbar">
    <button onclick="createWindow()">🌐 ブラウザ起動</button>
  </div>

  <script>
    let z = 10;
    function createWindow() {
      const win = document.createElement('div');
      win.className = 'window';
      win.style.zIndex = ++z;
      win.innerHTML = \`
        <div class="window-header">
          <span>Browser</span>
          <button style="background:#ef4444;padding:2px 6px;" onclick="this.closest('.window').remove()">×</button>
        </div>
        <div class="window-body">
          <div class="toolbar">
            <input type="text" value="https://example.com" placeholder="URLを入力" />
            <button class="go">移動</button>
          </div>
          <iframe src=""></iframe>
        </div>\`;

      win.onmousedown = () => win.style.zIndex = ++z;
      
      const input = win.querySelector('input');
      const frame = win.querySelector('iframe');
      const load = () => {
        let url = input.value.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        frame.src = '/proxy?url=' + encodeURIComponent(url);
      };
      
      win.querySelector('.go').onclick = load;
      input.onkeydown = (e) => { if(e.key === 'Enter') load(); };
      load();

      const header = win.querySelector('.window-header');
      header.onmousedown = (e) => {
        let shiftX = e.clientX - win.getBoundingClientRect().left;
        let shiftY = e.clientY - win.getBoundingClientRect().top;
        const move = (e) => {
          win.style.left = (e.clientX - shiftX) + 'px';
          win.style.top = (e.clientY - shiftY) + 'px';
        };
        document.addEventListener('mousemove', move);
        document.onmouseup = () => {
          document.removeEventListener('mousemove', move);
          document.onmouseup = null;
        };
      };

      document.getElementById('desktop').appendChild(win);
    }
  </script>
</body>
</html>
`;

// プロキシ & Webサーバー
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === '/proxy') {
    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('URLが指定されていません');
    }

    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const proxyReq = client.request(targetUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          host: parsed.host
        }
      }, (proxyRes) => {
        const headers = { ...proxyRes.headers };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        delete headers['frame-options'];
        headers['access-control-allow-origin'] = '*';

        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy Error: ' + err.message);
      });

      req.pipe(proxyReq);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid URL');
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebOS running on port ${PORT}`);
});
