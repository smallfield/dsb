# DSB Departure Info

## 開発環境のセットアップ (Development Setup)

このプロジェクトは Backend (Hono/Cloudflare Workers) と Frontend (Vue) で構成されています。
開発時はそれぞれのディレクトリでサーバーを起動する必要があります。

### 前提条件 (Prerequisites)

- Node.js (推奨: v18以上)

### 1. Backend (Hono)

バックエンドサーバーを起動します (Port: 8787)。

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (Vue)

フロントエンド開発サーバーを起動します。
**新しいターミナル**を開いて実行してください。

```bash
cd frontend
npm install
npm run dev
```

### 3. アプリケーションへアクセス

コマンド実行後に表示されるURLにブラウザでアクセスしてください。

- Frontend: http://localhost:5173 (または 5174, 5175...)
- Backend API: http://localhost:8787

> Note: フロントエンドの `vite.config.js` で `/departure` へのリクエストをバックエンド (`http://localhost:8787`) にプロキシする設定を行っています。
