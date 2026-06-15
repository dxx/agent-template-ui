# Agent Template UI

Agent Template UI 是一个用于调试和演示 [agent-template](https://github.com/dxx/agent-template) 的前端项目，基于 React、TypeScript 和 Vite 构建。

项目提供登录、会话管理、SSE 流式对话、工具调用过程展示和 Human-in-the-Loop 审批能力。

## 功能特性

- 手机号 + 验证码模拟登录，登录态通过 `localStorage` 中的 `user_token` 保存。
- 会话列表管理，支持创建会话、切换会话、删除会话和加载历史会话。
- 基于 `@microsoft/fetch-event-source` 的 SSE 流式对话。
- AI 消息支持 Markdown 和 GFM 渲染。
- 工具调用过程以独立卡片展示，流式处理中默认展开，完成后自动折叠。
- 错误消息展示在处理过程列表中，方便定位流式请求异常。
- 支持审批消息，用户可对 Agent 发起的审批请求选择同意或拒绝。
- 全局请求进度条和全局消息提示。

## 技术栈

- React 19
- TypeScript 6
- Vite 8
- React Router v7
- Sass
- Axios
- @microsoft/fetch-event-source
- react-markdown + remark-gfm

## 快速开始

### 环境要求

- Node.js 版本建议与当前 Vite/React 依赖兼容。
- 后端服务请参考 [agent-template](https://github.com/dxx/agent-template)。

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

开发模式使用 `.env.dev`，默认接口地址为：

```env
APP_API_BASE_URL=/api
```

如果需要直连后端，可以将其改为实际服务地址，例如：

```env
APP_API_BASE_URL=http://localhost:8000
```

### 生产构建

```bash
npm run build
```

生产模式使用 `.env.prod`，默认示例配置为：

```env
APP_API_BASE_URL=http://your-api-domain.com
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务，使用 `dev` 模式 |
| `npm run build` | TypeScript 编译并构建生产产物 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run preview` | 本地预览构建结果 |

## 环境变量

Vite 配置中允许读取 `APP_` 前缀的环境变量。

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `APP_API_BASE_URL` | 后端 API 基础地址 | `/api`、`http://localhost:8000` |

## 项目结构

```text
src/
├── api/
│   ├── chat.ts              # 流式对话 API，使用 SSE
│   ├── message.ts           # 会话和消息管理 API
│   └── request.ts           # Axios 实例与请求/响应拦截器
├── assets/                  # 静态资源
├── components/
│   ├── AuthGuard.tsx        # 路由登录守卫
│   ├── Message.tsx          # 全局消息提示
│   ├── Message.module.scss
│   ├── ProgressBar.tsx      # 全局请求进度条
│   ├── ProgressBar.module.scss
│   └── RouteTitle.tsx       # 页面标题处理
├── pages/
│   ├── Chat.tsx             # 对话页
│   ├── Chat.scss
│   ├── Login.tsx            # 登录页
│   ├── Login.scss
│   └── Markdown.scss        # Markdown 渲染样式
├── types/
│   ├── chat.ts              # 流式对话、审批相关类型
│   └── message.ts           # 会话消息类型
├── App.tsx                  # 路由配置和全局组件挂载
├── App.css
├── index.css
└── main.tsx                 # 应用入口
```

## 路由

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | 登录页 | 模拟手机号验证码登录 |
| `/chat` | 对话页 | 需要登录后访问 |
| `/` | 重定向 | 自动跳转到 `/chat` |

## 接口约定

项目默认对接 agent-template 后端，详细接口以 [agent-template 文档](https://github.com/dxx/agent-template/tree/main/docs) 为准。

### 请求头

普通 HTTP 请求会自动携带：

```http
user-token: <localStorage.user_token>
```

流式对话请求会额外携带：

```http
chat-id: <当前会话 ID>
```

## 登录说明

当前登录页为前端模拟登录：输入任意手机号和验证码即可登录。手机号会作为 `user_token` 写入 `localStorage`，后续请求会通过请求头传给后端。
