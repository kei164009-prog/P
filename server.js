const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// フロントエンド（HTMLやブラウザ画面）の静的ファイルを提供
app.use(express.static(__dirname));

// 外部の部品を使わないプロキシ機能
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URLが指定されていません');
    }

    try {
        // Node.js標準のfetchを使ってページデータを取得
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();

        // 💡 埋め込みをブロックするセキュリティヘッダーを削除して返す
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        
        res.send(data);
    } catch (error) {
        res.status(500).send('ページの取得に失敗しました: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`WebOS running on port ${PORT}`);
});
