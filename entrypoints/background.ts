export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'download') {
      browser.downloads.download({
        url: message.url,
        filename: message.filename,
      }).then((downloadId) => {
        sendResponse({ success: true, downloadId });
      }).catch((err: Error) => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
  });
});
