# Movie Companion

[中文](./README.md) ｜ English

A Chrome extension that provides screenshot, GIF recording, and video recording features for video websites.

## Features

### Screenshot

- One-click capture of the current video frame
- Supports PNG / JPEG / WebP formats
- Adjustable JPEG compression quality

### GIF Recording

- Record a GIF from video for a specified duration
- Customizable duration, frame rate, and quality
- Powered by modern-gif encoding

### Video Recording

- Record video clips with audio
- Multiple formats: MP4 (H264), WebM (VP9), WebM (H264), WebM
- Adjustable duration and bitrate

### Burst Mode

- Automatically capture 5 consecutive frames

### Timed Actions

- Enter a video time point for precise screenshot (e.g. `1:30`)
- Enter a time range for GIF / video recording (e.g. `1:00-2:00`)
- Batch screenshots at multiple time points (e.g. `0:10, 0:30, 1:00`)

## Keyboard Shortcuts

| Shortcut | Action         |
| -------- | -------------- |
| `Alt+S`  | Screenshot     |
| `Alt+G`  | Record GIF     |
| `Alt+V`  | Record Video   |
| `Alt+B`  | Burst Capture  |

## Development

```bash
# Install dependencies
pnpm install

# Development mode (hot reload)
pnpm dev

# Production build
pnpm build

# Package as zip
pnpm zip

# Release
pnpm release
```

## Installation

1. Run `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `.output/chrome-mv3` folder

## Usage

### Popup Panel

Click the extension icon in the browser toolbar to access quick action buttons for screenshots, GIF recording, video recording, and burst capture.

The panel also includes a "Timed Actions" section where you can enter video time points or ranges to perform precise screenshot and recording operations.

Click the gear icon in the top right to open the settings modal, where you can configure screenshot format, GIF parameters, video recording parameters, and more.

### Keyboard Shortcuts

Use keyboard shortcuts directly on video pages to trigger actions without opening the popup panel.

## Supported Websites

Any webpage containing a `<video>` tag.

## Tech Stack

- [WXT](https://wxt.dev/) - Browser extension development framework
- [Vue 3](https://vuejs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [modern-gif](https://github.com/nichenqin/modern-gif) - GIF encoding
- [vue-i18n](https://vue-i18n.intlify.dev/) - Internationalization

## Disclaimer

This tool is intended for personal learning and research purposes only. Users are responsible for ensuring their usage complies with applicable laws and regulations, and for respecting the intellectual property rights of content creators. This tool uses standard browser APIs and does not circumvent any DRM protections. Recording duration is capped at 120 seconds.

See [DISCLAIMER.md](./DISCLAIMER.md) for the full disclaimer.

## License

This project is licensed under the [MIT License](./LICENSE).
