# User Scripts

个人自用的 Tampermonkey 油猴脚本集合。

## 脚本列表

| 脚本 | 描述 | 截图示例 |
|------|------|---------|
| [github-repo-insight](./github-repo-insight) | 在 GitHub 仓库页面添加 OSSInsight 分析按钮 | <img src="https://github.com/user-attachments/assets/e2c487ad-8f6b-4571-bec9-57fdc5dc324a" alt="脚本示意截图" width="300" /> |
| [github-dir-download](./github-dir-download) | 在 GitHub 文件/目录页添加下载按钮，支持下载整个目录为 zip | <img src="https://github.com/user-attachments/assets/9962d1e9-9496-49de-b314-952061430308" alt="脚本示意截图" width="300" /> |

## 安装方法

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击脚本目录中的 `.user.js` 文件
3. Tampermonkey 会自动识别并提示安装

或者手动安装：
1. 打开 Tampermonkey 控制面板
2. 点击「添加新脚本」
3. 将脚本内容复制粘贴进去
4. 保存

## 目录结构

```
user-scripts/
├── README.md
├── github-repo-insight/
│   ├── README.md
│   └── github-repo-insight.user.js
└── github-dir-download/
    ├── README.md
    └── github-dir-download.user.js
```

## License

MIT
