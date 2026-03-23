## 1) `README.md`（入口・言語切替）

（このファイルをリポジトリ直下に置いてください）

# AI Idea Realizer Dashboard

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)　[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)　[![Fastify](https://img.shields.io/badge/Fastify-Backend-000000?logo=fastify&logoColor=white)](https://fastify.dev/)　[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?logo=next.js&logoColor=white)](https://nextjs.org/)　[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)　[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)　[![License](https://img.shields.io/github/license/pyxudev/Idea_Realizer)](./LICENSE)

[![Stars](https://img.shields.io/github/stars/pyxudev/Idea_Realizer?style=social)](https://github.com/pyxudev/Idea_Realizer/stargazers)　[![Issues](https://img.shields.io/github/issues/pyxudev/Idea_Realizer)](https://github.com/pyxudev/Idea_Realizer/issues)　[![PRs](https://img.shields.io/github/issues-pr/pyxudev/Idea_Realizer)](https://github.com/pyxudev/Idea_Realizer/pulls)

---

## Languages / 语言 / 言語

- English: [README.en.md](http://README.en.md)
- 简体中文: [README.zh-CN.md](http://README.zh-CN.md)
- 日本語: [README.ja.md](http://README.ja.md)

---

## 2) `README.en.md`（英語・ネイティブ寄り）

# AI Idea Realizer Dashboard

A dashboard that automatically generates **Proposal → Spec → UI → Implementation** in four steps—just by entering an idea.

---

## Architecture

```
Browser (Next.js :3000)
 ↓ HTTP REST
API Server (Fastify :3001)
 ↓ PostgreSQL ↓ BullMQ/Redis
 DB (ideas, jobs) Worker
 ↓ AI Provider (OpenAI/Claude/Gemini/Ollama)
 /outputs/{ideaId}/
 ├── proposal.md
 ├── specification.json
 ├── preview.html
 └── implementation.md
```

---

## Directory Structure

```
ai-idea-dashboard/
├── apps/
│   ├── api/        # Fastify backend
│   ├── worker/     # BullMQ worker
│   └── web/        # Next.js frontend
├── packages/
│   └── shared/     # Shared type definitions
├── outputs/        # AI-generated files output
├── docker-compose.yml
└── .env.example
```

---

## Setup

### Option 1: Docker Compose (Recommended)

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env and fill in OPENAI_API_KEY, etc.

# 2. Start
docker compose up --build

# 3. Run DB migration (first time only)
docker compose exec api node dist/db/migrate.js

# 4. Open
open http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL & Redis
docker run -d -e POSTGRES_DB=ai_dashboard -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 2. Install dependencies
npm install

# 3. Copy & edit env vars
cp .env.example apps/api/.env
cp .env.example apps/worker/.env
cp .env.example apps/web/.env.local

# 4. DB migration
cd apps/api && npm run migrate && cd ../..

# 5. Start all services
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `POSTGRES_HOST` | PostgreSQL host | [localhost](http://localhost) |
| `REDIS_HOST` | Redis host | [localhost](http://localhost) |
| `API_PORT` | API port | 3001 |
| `NEXT_PUBLIC_API_URL` | Frontend → API URL | http://localhost:3001 |
| `OUTPUTS_DIR` | Output directory for generated files | ../../outputs |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `GEMINI_API_KEY` | Gemini API key | - |
| `OLLAMA_BASE_URL` | Ollama URL | http://localhost:11434 |
| `WORKER_CONCURRENCY` | Concurrency | 2 |

---

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | /api/ideas | List ideas |
| GET | /api/ideas/stats | Status aggregation |
| GET | /api/ideas/:id | Idea details |
| POST | /api/ideas | Create an idea |
| POST | /api/jobs/:id/retry | Retry a job |
| GET | /api/outputs/:ideaId/:file | Fetch generated output file |
| GET | /health | Health check |

### POST /api/ideas

```json
{
  "title": "AI-powered recipe generator",
  "description": "冷蔵庫の食材から最適なレシピを提案するアプリ",
  "ai_provider": "openai"
}
```

---

## Generation Flow

```
Register → [1] proposal.md → [2] specification.json
 → [3] preview.html → [4] implementation.md → Done
```

Each step uses the previous step’s output as input. If a step fails, you can retry from the UI.

---

## AI Provider Configuration

```
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-haiku-20240307

# Gemini
GEMINI_API_KEY=AIza...

# Ollama (local / free)
ollama pull llama3
OLLAMA_MODEL=llama3
```

---

## Troubleshooting

**If jobs get stuck**

```bash
docker compose logs worker -f
```

**DB connection error**

```bash
docker compose exec api node dist/db/migrate.js
```

**API key error**  

Make sure the keys in `.env` are set correctly and that you still have quota available.

---

## 3) `README.zh-CN.md`（简体中文）

# AI Idea Realizer Dashboard

只需输入一个想法，AI 就会自动生成四个步骤的产物：**Proposal → Spec → UI → Implementation**。

---

## 架构

```
Browser (Next.js :3000)
 ↓ HTTP REST
API Server (Fastify :3001)
 ↓ PostgreSQL ↓ BullMQ/Redis
 DB (ideas, jobs) Worker
 ↓ AI Provider (OpenAI/Claude/Gemini/Ollama)
 /outputs/{ideaId}/
 ├── proposal.md
 ├── specification.json
 ├── preview.html
 └── implementation.md
```

---

## 目录结构

```
ai-idea-dashboard/
├── apps/
│   ├── api/        # Fastify 后端
│   ├── worker/     # BullMQ Worker
│   └── web/        # Next.js 前端
├── packages/
│   └── shared/     # 共享类型定义
├── outputs/        # AI 生成文件保存目录
├── docker-compose.yml
└── .env.example
```

---

## 安装与启动

### 方式 1：Docker Compose（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 OPENAI_API_KEY 等

# 2. 启动
docker compose up --build

# 3. 数据库迁移（仅首次需要）
docker compose exec api node dist/db/migrate.js

# 4. 访问
open http://localhost:3000
```

### 方式 2：本地开发

```bash
# 1. 启动 PostgreSQL & Redis
docker run -d -e POSTGRES_DB=ai_dashboard -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 2. 安装依赖
npm install

# 3. 复制并编辑环境变量
cp .env.example apps/api/.env
cp .env.example apps/worker/.env
cp .env.example apps/web/.env.local

# 4. 数据库迁移
cd apps/api && npm run migrate && cd ../..

# 5. 启动所有服务
npm run dev
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `POSTGRES_HOST` | PostgreSQL 主机 | [localhost](http://localhost) |
| `REDIS_HOST` | Redis 主机 | [localhost](http://localhost) |
| `API_PORT` | API 端口 | 3001 |
| `NEXT_PUBLIC_API_URL` | 前端 → API URL | http://localhost:3001 |
| `OUTPUTS_DIR` | 生成文件保存目录 | ../../outputs |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `ANTHROPIC_API_KEY` | Anthropic API Key | - |
| `GEMINI_API_KEY` | Gemini API Key | - |
| `OLLAMA_BASE_URL` | Ollama URL | http://localhost:11434 |
| `WORKER_CONCURRENCY` | 并发数 | 2 |

---

## API 接口

| Method | Path | 说明 |
| --- | --- | --- |
| GET | /api/ideas | 想法列表 |
| GET | /api/ideas/stats | 状态汇总 |
| GET | /api/ideas/:id | 想法详情 |
| POST | /api/ideas | 创建想法 |
| POST | /api/jobs/:id/retry | 重试任务 |
| GET | /api/outputs/:ideaId/:file | 获取生成文件 |
| GET | /health | 健康检查 |

### POST /api/ideas

```json
{
  "title": "AI-powered recipe generator",
  "description": "冷蔵庫の食材から最適なレシピを提案するアプリ",
  "ai_provider": "openai"
}
```

---

## 生成流程

```
注册 → [1] proposal.md → [2] specification.json
 → [3] preview.html → [4] implementation.md → 完成
```

每一步都会使用前一步的输出作为输入。失败时可以在 UI 中重试。

---

## AI Provider 配置

```
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-haiku-20240307

# Gemini
GEMINI_API_KEY=AIza...

# Ollama（本地 / 免费）
ollama pull llama3
OLLAMA_MODEL=llama3
```

---

## 故障排查

**任务卡住时**

```bash
docker compose logs worker -f
```

**数据库连接错误**

```bash
docker compose exec api node dist/db/migrate.js
```

**API Key 错误**  

请确认 `.env` 中的 Key 配置正确，并检查配额是否充足。

---

## 4) `README.ja.md`（日本語・整形＋バッジ導線）

# AI Idea Realizer Dashboard

アイデアを入力するだけで、AIが **Proposal → Spec → UI → Implementation** の4ステップを自動生成するダッシュボードです。

---

## アーキテクチャ

```
Browser (Next.js :3000)
 ↓ HTTP REST
API Server (Fastify :3001)
 ↓ PostgreSQL ↓ BullMQ/Redis
 DB (ideas, jobs) Worker
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
│   ├── api/        # Fastify バックエンド
│   ├── worker/     # BullMQ ワーカー
│   └── web/        # Next.js フロントエンド
├── packages/
│   └── shared/     # 共有型定義
├── outputs/        # AI生成ファイル保存先
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
| --- | --- | --- |
| `POSTGRES_HOST` | PostgreSQLホスト | [localhost](http://localhost) |
| `REDIS_HOST` | Redisホスト | [localhost](http://localhost) |
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
| --- | --- | --- |
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

```
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