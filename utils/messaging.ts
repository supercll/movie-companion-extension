export async function sendToContent(
  tabId: number,
  message: { action: string; [key: string]: unknown },
): Promise<unknown> {
  return browser.tabs.sendMessage(tabId, message);
}

export async function sendToBackground(message: {
  action: string;
  [key: string]: unknown;
}): Promise<unknown> {
  return browser.runtime.sendMessage(message);
}

export async function getActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}
