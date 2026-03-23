# AI Idea Realizer Dashboard

アイデアを入力するだけで、AIが **Proposal → Spec → UI → Implementation** の4ステップを自動生成するダッシュボードです。

---

## アーキテクチャ

```
Browser (Next.js :3000)
  ↓ HTTP REST
API Server (Fastify :3001)
  ↓ PostgreSQL          ↓ BullMQ/Redis
  DB (ideas, jobs)    Worker
                        ↓ AI Provider (OpenAI/Claude/Gemini/Ollama)
                      /outputs/{ideaId}/
                        ├── proposal.md
                        ├── specification.json
                        ├── preview.html
                        └── implementation.md
```

---

## ディレクトリ構成

```
ai-idea-dashboard/
├── apps/
│   ├── api/          # Fastify バックエンド
│   ├── worker/       # BullMQ ワーカー
│   └── web/          # Next.js フロントエンド
├── packages/
│   └── shared/       # 共有型定義
├── outputs/          # AI生成ファイル保存先
├── docker-compose.yml
└── .env.example
```

---

## セットアップ

### 方法1: Docker Compose（推奨）

```bash
# 1. 環境変数を設定
cp .env.example .env
# .env を編集して OPENAI_API_KEY などを記入

# 2. 起動
docker compose up --build

# 3. DBマイグレーション（初回のみ）
docker compose exec api node dist/db/migrate.js

# 4. アクセス
open http://localhost:3000
```

### 方法2: ローカル開発

```bash
# 1. PostgreSQL & Redis を起動
docker run -d -e POSTGRES_DB=ai_dashboard -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

docker run -d -p 6379:6379 redis:7-alpine

# 2. 依存インストール
npm install

# 3. 環境変数をコピー・編集
cp .env.example apps/api/.env
cp .env.example apps/worker/.env
cp .env.example apps/web/.env.local

# 4. DBマイグレーション
cd apps/api && npm run migrate && cd ../..

# 5. 全サービス起動
npm run dev
```

---

## 環境変数

| 変数 | 説明 | デフォルト |
|---|---|---|
| `POSTGRES_HOST` | PostgreSQLホスト | localhost |
| `REDIS_HOST` | Redisホスト | localhost |
| `API_PORT` | APIポート | 3001 |
| `NEXT_PUBLIC_API_URL` | フロント→API URL | http://localhost:3001 |
| `OUTPUTS_DIR` | 生成ファイル保存先 | ../../outputs |
| `OPENAI_API_KEY` | OpenAI APIキー | - |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | - |
| `GEMINI_API_KEY` | Gemini APIキー | - |
| `OLLAMA_BASE_URL` | Ollama URL | http://localhost:11434 |
| `WORKER_CONCURRENCY` | 同時処理数 | 2 |

---

## API エンドポイント

| Method | Path | 説明 |
|---|---|---|
| GET | /api/ideas | アイデア一覧 |
| GET | /api/ideas/stats | ステータス集計 |
| GET | /api/ideas/:id | アイデア詳細 |
| POST | /api/ideas | アイデア作成 |
| POST | /api/jobs/:id/retry | ジョブリトライ |
| GET | /api/outputs/:ideaId/:file | 生成ファイル取得 |
| GET | /health | ヘルスチェック |

### POST /api/ideas

```json
{
  "title": "AI-powered recipe generator",
  "description": "冷蔵庫の食材から最適なレシピを提案するアプリ",
  "ai_provider": "openai"
}
```

---

## 生成フロー

```
登録 → [1] proposal.md → [2] specification.json
     → [3] preview.html → [4] implementation.md → 完了
```

各ステップは前ステップの出力を入力として使用します。失敗時はUIからリトライ可能。

---

## AIプロバイダー設定

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-haiku-20240307

# Gemini
GEMINI_API_KEY=AIza...

# Ollama（ローカル・無料）
ollama pull llama3
OLLAMA_MODEL=llama3
```

---

## トラブルシューティング

**ジョブが止まる場合**
```bash
docker compose logs worker -f
```

**DB接続エラー**
```bash
docker compose exec api node dist/db/migrate.js
```

**APIキーエラー**
.env のキーが正しく設定されているか、クォータが残っているか確認してください。
