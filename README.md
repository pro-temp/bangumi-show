# Bangumi Show

Bangumi Show 是一个本地优先的日本动画查询工具，面向中文用户。当前 MVP 目标是提供当前季度番表、关键词搜索、筛选排序、详情面板、最近搜索和本地收藏状态。

项目不会优先面向公开发布，后续可能封装 Electron 桌面壳；因此代码会尽量隔离平台能力、本地存储和第三方数据源访问。

## 当前阶段

Phase 2 数据源基础接入已完成：

- Next.js + TypeScript + React + Tailwind CSS
- pnpm 包管理与 lockfile
- ESLint、Prettier、Vitest、Playwright
- 首页、当前季度番表占位、搜索入口、详情面板占位
- 内部 API route 占位
- Bangumi adapter、normalizer、内存缓存和 source status
- anime model、season helper、sample data、server service
- collection repository 平台抽象
- `AGENTS.md` Codex 项目规范

真实 UI 查询体验会在 Phase 3 继续接到页面交互中。

## 环境要求

- Node.js 24+
- pnpm 11+

本项目固定使用 pnpm，不使用 npm/yarn 管理前端依赖。

## 快速开始

```powershell
pnpm install
pnpm dev
```

默认开发地址：

```text
http://127.0.0.1:3000
```

首次运行端到端测试前，如果本机还没有 Playwright 浏览器：

```powershell
pnpm exec playwright install chromium
```

## Bangumi 配置

默认使用公开 Bangumi API：

```text
https://api.bgm.tv
```

可选环境变量：

```text
BANGUMI_API_BASE_URL=https://api.bgm.tv
BANGUMI_ACCESS_TOKEN=
BANGUMI_USER_AGENT=bangumi-show/0.1.0 (local use)
```

MVP 的公开查询不强制要求 token；如果后续接入用户相关能力，再配置 OAuth token。

## 常用命令

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

`pnpm typecheck` 会先运行 `next typegen`，生成 Next.js 所需的本地类型文件。`next-env.d.ts` 是 Next.js 生成文件，不纳入 Git 管理。

格式化代码：

```powershell
pnpm format
```

## 目录结构

```text
src/app                         Next.js App Router 页面与 API routes
src/app/api/search              搜索接口占位
src/app/api/schedule            当前季度番表接口占位
src/app/api/anime/[id]          作品详情接口占位
src/app/api/anime/[id]/relations 关联作品接口占位
src/app/api/suggest             搜索联想接口占位
src/app/api/sources/status      数据源状态接口占位
src/lib/anime                   动画领域模型与季度 helper
src/lib/sample-data             Phase 1/2.5 使用的固定样例数据
src/lib/server                  服务端编排层、缓存和 API envelope
src/lib/sources/bangumi         Bangumi adapter、raw types 和 normalizer
src/lib/platform                Web/Electron 可替换的平台抽象
e2e                             Playwright 测试
```

## 架构约定

- UI 组件不直接访问 Bangumi、AniList 或其他第三方 API。
- 第三方 API 访问必须走服务端 adapter 和 normalizer。
- Bangumi 是主数据源；AniList 只补充缺失字段。
- 服务端优先返回 Bangumi 数据；请求失败时降级为固定样例并在 `warnings` 中说明。
- 本地收藏状态必须通过 repository 抽象访问，避免业务代码散落 `localStorage`。
- 平台能力要留出 Electron 替换口，包括持久化、文件、图片缓存、日志和配置。
- 当前季度番表是首页核心入口，不做营销落地页。

## 参考文档

- [PLAN.md](./PLAN.md)
- [AGENTS.md](./AGENTS.md)
