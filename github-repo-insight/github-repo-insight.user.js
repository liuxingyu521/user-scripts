// ==UserScript==
// @name         GitHub Repo Insight
// @namespace    https://github.com/user-scripts/
// @version      1.0.0
// @description  在 GitHub 仓库页面添加 OSSInsight 分析按钮
// @author       xuer
// @match        https://github.com/*/*
// @exclude      https://github.com/settings/*
// @exclude      https://github.com/notifications
// @exclude      https://github.com/new
// @exclude      https://github.com/organizations/*
// @grant        GM_addStyle
// @grant        window.onurlchange
// @run-at       document-idle
// @icon         https://favicon.im/zh/ossinsight.io
// ==/UserScript==

(function() {
    'use strict';

    const BUTTON_ID = 'ossinsight-btn';

    // 按钮样式
    GM_addStyle(`
        #${BUTTON_ID} {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
            padding: 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            vertical-align: middle;
            transition: background-color 0.2s;
        }
        #${BUTTON_ID}:hover {
            background-color: var(--bgColor-neutral-muted, rgba(175, 184, 193, 0.2));
        }
        #${BUTTON_ID} svg {
            width: 20px;
            height: 20px;
        }
        #${BUTTON_ID}:hover svg {
        }
    `);

    // OSSInsight 图标 SVG
    const insightIcon = `
        <!--
tags: [logo, app, application, images, photos, videos, post, stories, online, community]
category: Brand
version: "1.9"
unicode: "ec20"
-->
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="32"
  height="32"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#ff6b22"
  stroke-width="2.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
  <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  <path d="M16.5 7.5l0 .01" />
</svg>
    `;

    /**
     * 从当前 URL 解析仓库信息
     * @returns {{owner: string, repo: string} | null}
     */
    function getRepoInfo() {
        const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
        // 也匹配仓库子页面，如 /owner/repo/issues
        const subMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
        if (subMatch && !isExcludedPath(subMatch[1])) {
            return { owner: subMatch[1], repo: subMatch[2] };
        }
        return null;
    }

    /**
     * 检查是否为排除的路径
     */
    function isExcludedPath(firstSegment) {
        const excluded = ['settings', 'notifications', 'new', 'organizations', 'orgs', 'users', 'login', 'signup', 'explore', 'topics', 'trending', 'collections', 'events', 'sponsors', 'features', 'enterprise', 'team', 'pricing', 'search'];
        return excluded.includes(firstSegment);
    }

    /**
     * 添加 OSSInsight 按钮
     */
    function addInsightButton() {
        // 如果按钮已存在，不重复添加
        if (document.getElementById(BUTTON_ID)) {
            return;
        }

        const repoInfo = getRepoInfo();
        console.log('repoInfo', repoInfo)
        if (!repoInfo) {
            return;
        }

        // 查找仓库标题元素
        const titleContainer = document.querySelector('#repo-title-component');
        if (!titleContainer) {
            return;
        }

        // 创建按钮
        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.title = `在 OSSInsight 中分析 ${repoInfo.owner}/${repoInfo.repo}`;
        button.innerHTML = insightIcon;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `https://ossinsight.io/analyze/${repoInfo.owner}/${repoInfo.repo}`;
            window.open(url, '_blank');
        });

        // 插入按钮
        titleContainer.appendChild(button);
    }

    /**
     * 移除按钮
     */
    function removeButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (btn) {
            btn.remove();
        }
    }

    /**
     * 初始化并监听页面变化
     */
    function init() {
        // 初次加载时添加按钮
        addInsightButton();

        // 监听 URL 变化（SPA 导航）
        if (window.onurlchange === null) {
            window.addEventListener('urlchange', () => {
                removeButton();
                setTimeout(addInsightButton, 500);
            });
        }

        // 监听 DOM 变化，处理动态加载的情况
        const observer = new MutationObserver((mutations) => {
            if (!document.getElementById(BUTTON_ID) && getRepoInfo()) {
                addInsightButton();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 启动脚本
    init();
})();
