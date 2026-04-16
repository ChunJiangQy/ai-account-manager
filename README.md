# AI Account Manager

多平台 AI 账号管理系统，支持 Windsurf、Kiro、Cursor 等平台的自动注册、账号管理和 OpenAI 兼容的反向代理服务。

## 功能特性

### 账号管理
- 支持多平台账号管理（Windsurf、Kiro、Cursor）
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
  - 自动提取 sessionToken 并转换为 API Key

### 邮箱配置
- QQ 邮箱 IMAP 支持
- Gmail IMAP 支持
- erine.email 别名邮箱支持
- 验证码自动读取（最多6次重试，每次3秒）

### 反向代理
- OpenAI 兼容 API 接口
- 端口：http://localhost:3220
- 支持的端点：
  - `POST /v1/chat/completions`
  - `GET /v1/models`
- 自动账号轮询和负载均衡

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
- 批量导入账号（JSON 格式）
- 删除账号
- 查看 Token 额度

### 4. 使用反向代理

```bash
# 聊天接口
curl http://localhost:3220/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'

# 获取模型列表
curl http://localhost:3220/v1/models
```

## 项目结构

```
src/
├── main/                      # Electron 主进程
│   ├── index.ts              # 入口文件
│   ├── proxy/                # 反向代理服务
│   │   └── index.ts
│   └── services/             # 服务模块
│       ├── account-manager.ts    # 账号管理
│       ├── email-config.ts       # 邮箱配置
│       ├── email-reader.ts       # 邮件读取
│       └── windsurf/             # Windsurf 相关
│           ├── register.ts       # 注册逻辑
│           ├── client.ts         # API 客户端
│           └── windsurf-api/     # Language Server API
├── preload/                   # Preload 脚本
│   └── index.ts
└── renderer/                  # React 前端
    └── src/
        ├── App.tsx           # 主应用
        └── components/       # 组件
            ├── AccountList.tsx      # 账号列表
            ├── RegisterPanel.tsx    # 注册面板
            ├── EmailConfig.tsx      # 邮箱配置
            └── ProxyStatus.tsx      # 反代状态
```

## Token 获取流程

详见 [TOKEN_FLOW.md](./TOKEN_FLOW.md)

1. 使用 Playwright 自动化注册 Windsurf 账号
2. 从 IMAP 邮箱读取验证码
3. 自动填写验证码
4. 从 localStorage 提取 `devin_session_token`
5. 调用 `https://api.codeium.com/register_user/` 转换为 API Key
6. 通过 Language Server 调用 AI 模型

## 配置文件

- `C:\Users\{用户名}\AppData\Roaming\ai-account-manager\config.json` - 账号数据
- `C:\Users\{用户名}\AppData\Roaming\ai-account-manager\email-config.json` - 邮箱配置

## 注意事项

1. **邮箱配置必须正确**：至少配置一个真实邮箱（QQ 或 Gmail）用于接收验证码
2. **erine.email 用户名必填**：需要先在 erine.email 注册账号
3. **QQ 邮箱授权码**：不是 QQ 密码，需要在 QQ 邮箱设置中生成
4. **Gmail 应用专用密码**：需要开启两步验证后生成
5. **Language Server**：首次启动会自动采用已运行的 Language Server（端口 42100）
6. **端口占用**：确保端口 3220 未被占用

## 支持的模型

- gpt-4o-mini
- gemini-2.5-flash
- glm-5.1

## 免责声明

本项目仅供学习和研究使用，请勿用于商业用途。使用本项目所产生的一切后果由使用者自行承担。

## License

MIT
