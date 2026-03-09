// ==UserScript==
// @name         GitHub Dir Download
// @namespace    https://github.com/user-scripts/
// @version      1.0.0
// @description  在 GitHub 文件/目录页添加下载按钮，支持下载单文件或整个目录（zip）
// @author       xuer
// @match        https://github.com/*/*/tree/*
// @match        https://github.com/*/*/blob/*
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        window.onurlchange
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @icon         https://github.githubassets.com/favicons/favicon-dark.svg
// ==/UserScript==

(function () {
    'use strict';

    const BUTTON_ID = 'gh-dir-download-btn';

    const DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Zm-0-0ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path></svg>`;

    // 按钮样式
    GM_addStyle(`
        #${BUTTON_ID} {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 4px;
            padding: 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            color: var(--fgColor-muted, #656d76);
            vertical-align: middle;
            transition: background-color 0.2s, opacity 0.2s;
            position: relative;
            z-index: 1;
            pointer-events: auto;
        }
        #${BUTTON_ID}:hover {
            background-color: var(--bgColor-neutral-muted, rgba(175,184,193,0.2));
            color: var(--fgColor-default, #1f2328);
        }
        #${BUTTON_ID}.downloading {
            pointer-events: none;
            opacity: 0.5;
        }
        #${BUTTON_ID}.downloading svg {
            animation: gh-dl-spin 1s linear infinite;
        }
        @keyframes gh-dl-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `);

    /**
     * 从当前 URL 解析 GitHub 路径信息
     * @returns {{owner: string, repo: string, type: string, branch: string, path: string} | null}
     */
    function parseGitHubURL() {
        const match = window.location.pathname.match(
            /^\/([^/]+)\/([^/]+)\/(tree|blob)\/([^/]+)\/?(.*)/
        );
        if (!match) return null;
        return {
            owner: match[1],
            repo: match[2],
            type: match[3],
            branch: match[4],
            path: match[5] || ''
        };
    }

    /**
     * 在面包屑的 Copy path 按钮之后插入下载按钮
     */
    function injectButton() {
        if (document.getElementById(BUTTON_ID)) return;
        const info = parseGitHubURL();
        if (!info) return;
        const filenameEl = document.querySelector('[data-testid="breadcrumbs-filename"]');
        if (!filenameEl) return;
        const container = filenameEl.parentElement;
        const copyBtn = container.querySelector('button[data-component="IconButton"]');
        if (!copyBtn) return;
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.type = 'button';
        btn.title = info.type === 'tree'
            ? `下载目录: ${info.path || info.repo}`
            : `下载文件: ${info.path.split('/').pop()}`;
        btn.innerHTML = DOWNLOAD_ICON;
        if (isDownloading) {
            btn.classList.add('downloading');
        }
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDownload(info).catch(err => {
                console.error('[GitHub Dir Download] 下载出错:', err);
                alert(`下载失败: ${err.message}`);
            });
        });
        copyBtn.after(btn);
    }

    /**
     * 移除已注入的下载按钮
     */
    function removeButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (btn) btn.remove();
    }

    // ── Token 管理 ──────────────────────────────────────────────
    const TOKEN_KEY = 'gh_download_token';

    GM_registerMenuCommand('设置 GitHub Token', () => {
        const current = GM_getValue(TOKEN_KEY, '');
        const token = prompt(
            'GitHub Personal Access Token (留空清除)\n未认证: 60次/小时 | 认证后: 5000次/小时',
            current
        );
        if (token !== null) {
            GM_setValue(TOKEN_KEY, token.trim());
            alert(token.trim() ? 'Token 已保存' : 'Token 已清除');
        }
    });

    function getAuthHeaders() {
        const token = GM_getValue(TOKEN_KEY, '');
        return token ? { Authorization: `token ${token}` } : {};
    }

    // ── GM_xmlhttpRequest Promise 封装 ──────────────────────────
    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 30000;
            let settled = false;

            const timer = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    reject(new Error(`请求超时 (${timeout / 1000}s): ${url}`));
                }
            }, timeout);

            function settle(fn, arg) {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    fn(arg);
                }
            }

            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url,
                headers: { ...getAuthHeaders(), ...(options.headers || {}) },
                responseType: options.responseType || 'text',
                timeout,
                onload(res) {
                    if (res.status >= 200 && res.status < 300) {
                        settle(resolve, res);
                    } else if (res.status === 403) {
                        const headers = res.responseHeaders || '';
                        if (headers.includes('rate limit') || headers.includes('X-RateLimit')) {
                            settle(reject, new Error('GitHub API 限流，请配置 Token（油猴菜单 → 设置 GitHub Token）'));
                        } else {
                            settle(reject, new Error(`HTTP ${res.status}: ${url}`));
                        }
                    } else {
                        settle(reject, new Error(`HTTP ${res.status}: ${url}`));
                    }
                },
                onerror: () => settle(reject, new Error(`请求失败: ${url}`)),
                ontimeout: () => settle(reject, new Error(`请求超时: ${url}`)),
                onabort: () => settle(reject, new Error(`请求取消: ${url}`)),
            });
        });
    }

    // ── 并发控制 ────────────────────────────────────────────────
    async function parallelLimit(tasks, limit = 5) {
        const results = [];
        const executing = new Set();
        for (const task of tasks) {
            const p = task().finally(() => executing.delete(p));
            executing.add(p);
            results.push(p);
            if (executing.size >= limit) {
                await Promise.race(executing);
            }
        }
        return Promise.all(results);
    }

    // 下载状态管理（独立于按钮 DOM，避免 innerHTML 修改触发 React 重渲染）
    let isDownloading = false;

    function setDownloading(loading) {
        isDownloading = loading;
        const btn = document.getElementById(BUTTON_ID);
        if (btn) {
            btn.classList.toggle('downloading', loading);
        }
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function downloadFile(info) {
        const rawUrl = `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${info.branch}/${info.path}`;
        console.log('[GitHub Dir Download] 下载文件:', rawUrl);
        const res = await gmFetch(rawUrl, { responseType: 'arraybuffer' });
        const filename = info.path.split('/').pop();
        triggerDownload(new Blob([res.response]), filename);
    }

    async function fetchTree(owner, repo, branch, path) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        console.log('[GitHub Dir Download] 获取目录:', apiUrl);
        const res = await gmFetch(apiUrl);
        const items = JSON.parse(res.responseText);
        console.log(`[GitHub Dir Download] 目录 ${path || '/'} 包含 ${items.length} 项`);
        const files = [];

        const dirs = [];
        for (const item of items) {
            if (item.type === 'file') {
                if (!item.download_url) {
                    console.warn(`跳过大文件 (download_url 为空): ${item.path}`);
                    continue;
                }
                files.push({ path: item.path, downloadUrl: item.download_url, size: item.size });
            } else if (item.type === 'dir') {
                dirs.push(item.path);
            }
        }

        // 递归获取子目录
        const subResults = await parallelLimit(
            dirs.map(dir => () => fetchTree(owner, repo, branch, dir)),
            3
        );
        for (const sub of subResults) {
            files.push(...sub);
        }

        return files;
    }

    async function downloadDirectory(info) {
        console.log('[GitHub Dir Download] 正在获取目录结构...');
        const files = await fetchTree(info.owner, info.repo, info.branch, info.path);

        if (files.length === 0) {
            alert('目录为空');
            return;
        }

        console.log(`[GitHub Dir Download] 共 ${files.length} 个文件，开始下载...`);
        const zip = new JSZip();
        const basePath = info.path || '';
        let downloaded = 0;
        let failed = 0;

        await parallelLimit(
            files.map(file => async () => {
                try {
                    const res = await gmFetch(file.downloadUrl, { responseType: 'arraybuffer' });
                    const relativePath = basePath
                        ? file.path.slice(basePath.length + 1)
                        : file.path;
                    zip.file(relativePath, res.response);
                    downloaded++;
                    console.log(`[GitHub Dir Download] (${downloaded + failed}/${files.length}) ✓ ${relativePath}`);
                } catch (err) {
                    failed++;
                    console.warn(`[GitHub Dir Download] (${downloaded + failed}/${files.length}) ✗ ${file.path}: ${err.message}`);
                }
            }),
            5
        );

        if (downloaded === 0) {
            alert('所有文件下载失败');
            return;
        }
        if (failed > 0) {
            console.warn(`[GitHub Dir Download] ${failed} 个文件下载失败，已跳过`);
        }

        console.log(`[GitHub Dir Download] 下载完毕 (成功: ${downloaded}, 失败: ${failed})，开始打包 zip...`);
        const zipData = await zip.generateAsync({ type: 'uint8array' });
        console.log(`[GitHub Dir Download] 打包完成 (${(zipData.byteLength / 1024).toFixed(1)} KB)，触发下载`);
        const dirName = info.path ? info.path.split('/').pop() : info.repo;
        triggerDownload(new Blob([zipData]), `${dirName}.zip`);
    }

    /**
     * 处理下载请求
     */
    async function handleDownload(info) {
        if (isDownloading) return;

        console.log('[GitHub Dir Download] 开始下载:', info);
        setDownloading(true);

        try {
            if (info.type === 'blob') {
                await downloadFile(info);
            } else {
                await downloadDirectory(info);
            }
            console.log('[GitHub Dir Download] 下载完成');
        } catch (err) {
            console.error('[GitHub Dir Download] 下载失败:', err);
            alert(`下载失败: ${err.message}`);
        } finally {
            setDownloading(false);
        }
    }

    /**
     * 初始化：注入按钮、监听 SPA 导航和 DOM 变化
     */
    function init() {
        injectButton();

        // 监听 SPA 路由变化
        if (window.onurlchange === null) {
            window.addEventListener('urlchange', () => {
                removeButton();
                setTimeout(injectButton, 500);
            });
        }

        // 监听 DOM 变化，确保按钮在页面动态更新后仍然存在
        let debounceTimer;
        new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (!document.getElementById(BUTTON_ID) && parseGitHubURL()) {
                    injectButton();
                }
            }, 200);
        }).observe(document.body, { childList: true, subtree: true });
    }

    init();
})();
