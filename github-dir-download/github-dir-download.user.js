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

    const BUTTON_ID = 'github-dir-download-btn';

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
            transition: background-color 0.2s;
        }
        #${BUTTON_ID}:hover {
            background-color: var(--bgColor-neutral-muted, rgba(175,184,193,0.2));
            color: var(--fgColor-default, #1f2328);
        }
        #${BUTTON_ID}.downloading {
            pointer-events: none;
            opacity: 0.6;
        }
        #${BUTTON_ID} .spinner {
            animation: gh-dl-spin 0.6s linear infinite;
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
        btn.addEventListener('click', () => handleDownload(info));
        copyBtn.after(btn);
    }

    /**
     * 移除已注入的下载按钮
     */
    function removeButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (btn) btn.remove();
    }

    /**
     * 处理下载请求（占位函数，后续任务实现）
     */
    function handleDownload(info) {
        console.log('Download requested:', info);
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
        new MutationObserver(() => {
            if (!document.getElementById(BUTTON_ID) && parseGitHubURL()) {
                injectButton();
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    init();
})();
