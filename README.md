# 观影伴侣 - Movie Companion

Chrome 浏览器扩展，为视频网站提供智能截图和 GIF 录制功能。

## 功能

- **视频截图** — 一键截取当前视频画面，支持 PNG/JPEG/WebP 格式
- **GIF 录制** — 从视频中录制指定时长的 GIF 动图
- **连拍模式** — 自动连续截取 5 张图片
- **预设指令** — 在页面输入框中输入触发词自动执行操作
- **快捷键** — Alt+S 截图 / Alt+G 录制 GIF / Alt+B 连拍

## 安装

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `movie-companion-extension` 文件夹

### 生成图标

首次安装前需要生成图标文件：

1. 用浏览器打开 `generate-icons.html`
2. 下载三个图标文件（icon16.png、icon48.png、icon128.png）
3. 将它们放入 `icons/` 文件夹

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

可在弹出面板的「预设」中自定义触发词。

## 设置

### GIF 设置

- **录制时长** — 1~10 秒
- **帧率** — 5~30 FPS
- **画质** — 高/中/低

### 截图设置

- **图片格式** — PNG / JPEG / WebP
- **JPEG 质量** — 50%~100%

## 支持的网站

任何包含 `<video>` 标签的网页，包括：

- YouTube
- Bilibili
- Netflix
- 爱奇艺 / 优酷 / 腾讯视频
- 其他视频网站

## 技术实现

- **Manifest V3** — 使用最新的 Chrome 扩展标准
- **Canvas API** — 从 video 元素捕获画面
- **GIF 编码** — 内置 NeuQuant 量化 + LZW 压缩
- **Chrome Downloads API** — 自动保存到下载目录

## 文件结构

```
movie-companion-extension/
├── manifest.json        # 扩展配置
├── background.js        # Service Worker
├── content.js           # 内容脚本（核心逻辑）
├── content.css          # 内容脚本样式
├── popup.html           # 弹出面板
├── popup.css            # 弹出面板样式
├── popup.js             # 弹出面板逻辑
├── lib/
│   └── gif.js           # GIF 编码器
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
