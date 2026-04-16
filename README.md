# AI Account Manager

多平台 AI 账号管理系统，支持 Windsurf、平台的自动注册、账号管理和 OpenAI Anthropic 兼容的反向代理服务。

## 功能特性

### 账号管理
- 支持多平台账号管理（Windsurf）
- 账号启用/禁用控制（只有启用的账号才会被使用）
- 账号状态监控（活跃/禁用/错误）
- Token 额度追踪
- 批量导入/导出账号
- 账号池自动轮询

### 自动注册
- **Windsurf 自动注册**
  - 支持 erine.email 别名邮箱
  - 自动读取邮箱验证码（QQ/Gmail IMAP）
  - 自动生成密码和姓名
  - 无头/有头浏览器模式
  - 自动提取 x-auth-token 并转换为 API Key
  - IMAP 连接自动重连机制

### 邮箱配置
- QQ 邮箱 IMAP 支持
- Gmail IMAP 支持
- erine.email 别名邮箱支持
- 验证码自动读取（最多6次重试，每次3秒）
- 智能邮件过滤（收件人匹配、时间过滤）

### 反向代理
- **OpenAI 兼容 API** 接口（端口：3220）
  - `POST /v1/chat/completions`
  - `GET /v1/models`
- **Anthropic API** 接口（端口：3220）
  - `POST /v1/messages`
- 模型映射配置（将 Claude 模型映射到实际支持的模型）
- 自动账号轮询和负载均衡
- 支持 Cascade 和 Legacy 两种流程

## 技术栈

- **前端**: React + TypeScript
- **后端**: Electron + Node.js
- **浏览器自动化**: Playwright
- **邮件读取**: IMAP (node-imap + mailparser)
- **数据存储**: electron-store
- **Language Server**: Windsurf Language Server (gRPC over HTTP/2)

## 安装

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 使用说明

### 1. 邮箱配置

在"邮箱配置"标签页中配置：

**QQ 邮箱**（至少配置一个）
- 邮箱地址：your@qq.com
- 授权码：QQ 邮箱 IMAP 授权码

**Gmail**（至少配置一个）
- 邮箱地址：your@gmail.com
- 应用专用密码：Gmail 应用专用密码

**erine.email**（必填）
- 用户名：在 erine.email 注册的用户名

### 2. 注册账号

在"注册账号"标签页：

1. 选择应用（Windsurf/Kiro/Cursor）
2. 选择邮箱类型：
   - **erine.email**（推荐）：自动生成别名邮箱
   - **自定义邮箱**：使用自己的邮箱
3. 选择验证码接收邮箱（QQ/Gmail）
4. 填写 erine.email 前缀（可选，支持逗号分隔多个前缀）
5. 填写密码和姓名（留空自动生成）
6. 选择浏览器模式（无头/有头）
7. 点击"开始注册"

### 3. 账号管理

在"账号管理"标签页：

- 查看所有账号状态
- **启用/禁用账号**：点击按钮切换账号状态，只有启用的账号才会被用于 API 调用
- 批量导入账号（JSON 格式）
- 删除账号
- 查看 Token 额度

### 4. 模型映射配置

在"模型映射"标签页：

- 设置默认模型（当 Claude 模型没有配置映射时使用）
- 添加 Claude 模型到实际模型的映射规则
- 例如：`claude-sonnet-4.6` → `gpt-4o-mini`

### 5. 使用反向代理

**OpenAI API 格式：**

```bash
curl http://localhost:3220/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Anthropic API 格式：**

```bash
curl http://localhost:3220/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**获取模型列表：**

```bash
curl http://localhost:3220/v1/models
```

## 项目结构

```
src/
├── main/                      # Electron 主进程
│   ├── index.ts              # 入口文件
│   ├── proxy/                # 反向代理服务
│   │   ├── index.ts          # 路由和服务器
│   │   └── anthropic.ts      # Anthropic API 支持
│   └── services/             # 服务模块
│       ├── account-manager.ts    # 账号管理
│       ├── email-config.ts       # 邮箱配置
│       ├── email-reader.ts       # 邮件读取（IMAP）
│       ├── proxy-config.ts       # 模型映射配置
│       └── windsurf/             # Windsurf 相关
│           ├── register.ts       # 注册逻辑
│           ├── client.ts         # API 客户端
│           └── windsurf-api/     # Language Server API
│               ├── langserver.js # LS 管理
│               ├── client.js     # WindsurfClient
│               └── models.js     # 模型配置
├── preload/                   # Preload 脚本
│   └── index.ts
└── renderer/                  # React 前端
    └── src/
        ├── App.tsx           # 主应用
        └── components/       # 组件
            ├── AccountList.tsx      # 账号列表
            ├── RegisterPanel.tsx    # 注册面板
            ├── EmailConfig.tsx      # 邮箱配置
            ├── ProxyConfig.tsx      # 模型映射配置
            └── ProxyStatus.tsx      # 反代状态
```

## 配置文件

配置文件存储在：`C:\Users\{用户名}\AppData\Roaming\ai-account-manager\`

- `config.json` - 账号数据
- `email-config.json` - 邮箱配置
- `proxy-config.json` - 模型映射配置

## 注意事项

1. **邮箱配置必须正确**：至少配置一个真实邮箱（QQ 或 Gmail）用于接收验证码
2. **erine.email 用户名必填**：需要先在 erine.email 注册账号
3. **QQ 邮箱授权码**：不是 QQ 密码，需要在 QQ 邮箱设置中生成
4. **Gmail 应用专用密码**：需要开启两步验证后生成
5. **Language Server**：首次启动会自动采用已运行的 Language Server（端口 42100）
6. **端口占用**：确保端口 3220 未被占用
7. **账号启用状态**：只有启用的账号才会被用于 API 调用，可以通过启用/禁用按钮控制
8. **IMAP 连接**：如果遇到 "Not authenticated" 错误，检查邮箱授权码是否正确

## 支持的模型

### 免费模型（Free Tier）
- gpt-4o-mini
- gemini-2.5-flash
- glm-5.1

### 通过模型映射支持
- 所有 Claude 模型（通过映射到上述免费模型）
- claude-sonnet-4.6
- claude-opus-4.6
- 等等...

## 已知问题

1. **注册获取的 token 格式**：
   - 当前注册流程提取的是 `devin-session-token$...` 格式
   - 这个 token 可以用于 Windsurf 网页 API，但可能无法直接用于 Language Server
   - 建议使用 WindsurfAPI 项目的 dashboard 通过邮箱密码登录获取有效的 `sk-ws-01-...` 格式 apiKey

2. **Cascade 流程模型**：
   - 需要有效的 apiKey 才能使用 Cascade 流程（如 glm-5.1）
   - Legacy 流程模型（如 gpt-4o-mini）可以正常工作

## 免责声明

本项目仅供学习和研究使用，请勿用于商业用途。使用本项目所产生的一切后果由使用者自行承担。

## License

MIT
