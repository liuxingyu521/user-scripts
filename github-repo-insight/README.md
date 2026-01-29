# GitHub Repo Insight

在 GitHub 仓库页面的标题旁添加一个按钮，点击后跳转到 [OSSInsight](https://ossinsight.io) 查看该仓库的详细分析数据。

## 功能

- 在 GitHub 仓库页面标题旁显示分析按钮
- 点击按钮在新标签页打开 OSSInsight 分析页面
- 支持 GitHub SPA 页面导航

## 安装

[点击安装](./github-repo-insight.user.js)

或复制 `github-repo-insight.user.js` 内容到 Tampermonkey。

## 截图

<img src="https://github.com/user-attachments/assets/e2c487ad-8f6b-4571-bec9-57fdc5dc324a" alt="脚本示意截图" width="50%" />

## 权限说明

| 权限 | 用途 |
|------|------|
| `GM_addStyle` | 添加按钮样式 |
| `window.onurlchange` | 监听 SPA 页面导航 |
