# 观影伴侣 - Movie Companion v2

Chrome 浏览器扩展，为视频网站提供智能截图和 GIF 录制功能。

使用 **WXT + React + TypeScript + Tailwind CSS** 现代技术栈构建。

## 功能

- **视频截图** — 一键截取当前视频画面，支持 PNG/JPEG/WebP 格式
- **GIF 录制** — 从视频中录制指定时长的 GIF 动图（基于 gifenc，Web Worker 级性能）
- **连拍模式** — 自动连续截取 5 张图片
- **预设指令** — 在页面输入框中输入触发词自动执行操作
- **快捷键** — Alt+S 截图 / Alt+G 录制 GIF / Alt+B 连拍

## 技术栈

| 模块 | 技术 |
|------|------|
| 开发框架 | WXT (Vite + Manifest V3) |
| UI 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4 |
| GIF 编码 | gifenc (5KB, 高性能量化) |
| 图标 | Lucide React |
| 快捷键 | hotkeys-js |
| 文件下载 | FileSaver.js + Chrome Downloads API |
| 状态持久化 | WXT Storage API |

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（自动热更新）
pnpm dev

# 构建生产版本
pnpm build

# 打包 zip
pnpm zip
```

## 安装

1. 运行 `pnpm build`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `.output/chrome-mv3` 文件夹

## 使用

### 方式一：弹出面板

点击浏览器工具栏中的插件图标，使用快捷操作按钮。

### 方式二：快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt+S` | 截图 |
| `Alt+G` | 录制 GIF |
| `Alt+B` | 连拍 |

### 方式三：预设指令

在视频页面的任意输入框中输入预设触发词，按 Enter 执行。

默认预设：

| 触发词 | 操作 |
|--------|------|
| `截图` / `cap` | 截取视频画面 |
| `录制` / `gif` | 录制 GIF |
| `连拍` | 连续截取 5 张 |

## 项目结构

```
movie-companion-extension/
├── wxt.config.ts                    # WXT 配置
├── package.json
├── tsconfig.json
├── public/                          # 静态资源（图标）
├── utils/
│   ├── types.ts                     # TypeScript 类型定义
│   ├── constants.ts                 # 默认预设 & 设置常量
│   ├── storage.ts                   # WXT Storage 持久化
│   ├── messaging.ts                 # Chrome 消息通信封装
│   ├── video.ts                     # 视频检测 & 帧捕获
│   ├── gif-recorder.ts             # GIF 录制（gifenc）
│   └── downloader.ts               # 文件下载（FileSaver.js）
├── entrypoints/
│   ├── background.ts               # Service Worker
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx                 # React 入口
│   │   ├── App.tsx                  # 主组件
│   │   ├── style.css                # Tailwind 入口
│   │   └── components/
│   │       ├── StatusBar.tsx        # 视频状态指示
│   │       ├── ActionGrid.tsx       # 操作按钮网格
│   │       ├── PresetsPanel.tsx     # 预设指令管理
│   │       ├── SettingsPanel.tsx    # GIF/截图设置
│   │       └── HelpModal.tsx        # 帮助弹窗
│   └── content/
│       ├── index.tsx                # Content Script 入口
│       ├── style.css                # 覆盖层样式
│       └── components/
│           └── ContentOverlay.tsx   # Toast/预览/录制指示器
└── .output/chrome-mv3/             # 构建产物
```

## 支持的网站

任何包含 `<video>` 标签的网页，包括 YouTube、Bilibili、Netflix、爱奇艺等。
