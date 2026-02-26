# 观影伴侣 - Movie Companion

[English](./README_en.md) ｜ 中文

Chrome 浏览器扩展，为视频网站提供截图、GIF 录制和视频录制功能。

## 功能特性

### 截图

- 一键截取当前视频画面
- 支持 PNG / JPEG / WebP 格式
- 可调节 JPEG 压缩质量

### GIF 录制

- 从视频中录制指定时长的 GIF 动图
- 可自定义录制时长、帧率和画质
- 基于 modern-gif 编码

### 视频录制

- 录制视频片段（含音频）
- 支持多种格式：MP4 (H264)、WebM (VP9)、WebM (H264)、WebM
- 可调节录制时长和码率

### 连拍模式

- 自动连续截取 5 张图片

### 定时操作

- 输入视频时间点进行精确截图（如 `1:30`）
- 输入时间范围进行 GIF / 视频录制（如 `1:00-2:00`）
- 支持多时间点批量截图（如 `0:10, 0:30, 1:00`）

## 快捷键

| 快捷键   | 功能     |
| -------- | -------- |
| `Alt+S`  | 截图     |
| `Alt+G`  | 录制 GIF |
| `Alt+V`  | 录制视频 |
| `Alt+B`  | 连拍     |

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

# 发版
pnpm release
```

## 安装

1. 运行 `pnpm build`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `.output/chrome-mv3` 文件夹

## 使用方式

### 弹出面板

点击浏览器工具栏中的插件图标，使用快捷操作按钮进行截图、GIF 录制、视频录制或连拍。

面板中还提供「定时操作」区域，可输入视频时间点或时间段来执行精确的截图和录制操作。

点击右上角齿轮图标可打开设置弹窗，配置截图格式、GIF 参数、视频录制参数等。

### 快捷键

在视频页面直接使用快捷键触发操作，无需打开弹出面板。

## 支持的网站

任何包含 `<video>` 标签的网页，包括 YouTube、Bilibili、Netflix、爱奇艺等。

## 技术栈

- [WXT](https://wxt.dev/) - 浏览器扩展开发框架
- [Vue 3](https://vuejs.org/) - UI 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式
- [modern-gif](https://github.com/nichenqin/modern-gif) - GIF 编码
- [vue-i18n](https://vue-i18n.intlify.dev/) - 国际化

## 许可证

本项目基于 [MIT License](./LICENSE) 开源。
