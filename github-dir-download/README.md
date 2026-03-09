# GitHub Dir Download

在 GitHub 文件/目录页面添加下载按钮，支持下载单个文件或将整个目录打包为 zip 下载。

## 功能

- 在文件页面（`blob`）添加单文件下载按钮
- 在目录页面（`tree`）添加目录下载按钮，自动打包为 zip
- 支持配置 GitHub Token 以提升 API 速率限制
- 支持 GitHub SPA 页面导航

## 安装

[点击安装](./github-dir-download.user.js)

或复制 `github-dir-download.user.js` 内容到 Tampermonkey。

## 使用

安装后访问任意 GitHub 仓库的文件或目录页面，下载按钮会自动出现在文件/目录路径面包屑旁边。

- **文件页面**：点击按钮直接下载当前文件
- **目录页面**：点击按钮将目录内所有文件打包为 zip 下载

## 截图

<img src="https://github.com/user-attachments/assets/9962d1e9-9496-49de-b314-952061430308" alt="脚本示意截图" width="50%" />

## Token 配置

通过 Tampermonkey 菜单 → `设置 GitHub Token` 配置 Personal Access Token。

| 认证方式 | 速率限制 |
|----------|----------|
| 未认证 | 60 次/小时 |
| Token 认证 | 5,000 次/小时 |

下载大型目录时建议配置 Token 以避免触发速率限制。

## 权限说明

| 权限 | 用途 |
|------|------|
| `GM_xmlhttpRequest` | 跨域请求 GitHub API 和文件内容 |
| `GM_addStyle` | 添加下载按钮样式 |
| `GM_getValue` / `GM_setValue` | 存储和读取 GitHub Token |
| `GM_registerMenuCommand` | 注册 Tampermonkey 菜单项（设置 Token） |
| `window.onurlchange` | 监听 SPA 页面导航 |
| `@connect api.github.com` | 允许请求 GitHub API（获取目录内容） |
| `@connect raw.githubusercontent.com` | 允许请求 GitHub 原始文件内容 |
