const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// フロントエンド（HTMLやブラウザ画面）の静的ファイルを提供
app.use(express.static(__dirname));

// ❌ Googleなどの埋め込みブロックを解除するプロキシ機能
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URLが指定されていません');
    }

    try {
        // ターゲットサイトからデータを代わりに取得
        const response = await axios.get(targetUrl, {
            responseType: 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // 💡 ここが超重要！埋め込みを禁止してくるセキュリティヘッダーを削除します
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');

        // きれいに書き換えたデータをブラウザに送り返す
        res.send(response.data);
    } catch (error) {
        res.status(500).send('ページの取得に失敗しました: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`WebOS running on port ${PORT}`);
});
