# Agent Template UI

基于 React + TypeScript + Vite 构建的智能对话界面，支持流式对话、工具调用审批流程。

该项目是一个示例项目，由 [agent-template](https://github.com/dxx/agent-template) 提供 Agent 服务，主要用来开发和测试 Agent。

## 技术栈

- **框架**：React 19 + TypeScript + Vite
- **路由**：React Router v7
- **样式**：Sass
- **Markdown**：react-markdown + remark-gfm
- **SSE 请求**：@microsoft/fetch-event-source
- **HTTP**：axios

## 项目结构

```
src/
├── api/
│   ├── chat.ts          # 流式对话 API (SSE)
│   ├── message.ts       # 消息管理 API (创建/获取/删除会话)
│   └── request.ts       # axios 封装（请求/响应拦截器）
├── assets/              # 静态资源
├── components/
│   └── AuthGuard.tsx    # 路由守卫（登录校验）
├── pages/
│   ├── Chat.tsx         # 对话页面核心组件
│   ├── Chat.scss        # 对话页面样式
│   ├── Login.tsx        # 登录页面
│   ├── Login.scss       # 登录页面样式
│   └── Markdown.scss    # Markdown 内容样式
├── types/
│   ├── chat.ts          # 流式对话相关类型（请求/响应/审批结构）
│   └── message.ts       # 消息类型定义
├── App.tsx              # 路由配置
└── main.tsx             # 入口文件
```

## 环境变量

```env
APP_API_BASE_URL=http://localhost:8000
```

## 功能特性

### 登录模块

- 手机号 + 验证码登录（模拟）
- 登录信息存储至 localStorage

### 对话模块

- **SSE 流式对话**：基于 `@microsoft/fetch-event-source` 实现 Server-Sent Events
- **消息渲染**：用户消息纯文本展示，AI 消息支持 Markdown 渲染
- **工具调用处理**：process 类型消息以独立卡片展示，支持展开/折叠
  - 流式接收中：默认展开
  - 接收完成后：超过 3 条自动折叠
- **错误处理**：error 类型消息以红色卡片展示
- **审批流程**：Human-in-the-Loop 审批，支持同意/拒绝决策

### API 接口

参考 [agent-template](https://github.com/dxx/agent-template/tree/main/docs)。

### 流式响应类型

```typescript
// 响应类型
type ResponseMsgType = 'normal' | 'process' | 'approve' | 'error';

// normal: 普通文本消息
// process: 工具调用/执行结果（处理过程）
// approve: 审批请求（需用户决策）
// error: 错误消息
```

## 命令

```bash
npm run dev    # 开发模式
npm run build  # 生产构建
npm run lint   # 代码检查
npm run preview # 预览构建结果
```

## 路由

| 路径       | 组件    | 说明         |
| -------- | ----- | ---------- |
| `/login` | Login | 登录页        |
| `/chat`  | Chat  | 对话页（需登录）   |
| `/`      | -     | 重定向至 /chat |
