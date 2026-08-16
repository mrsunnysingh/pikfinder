// PikFinder extension — background service worker (context menus).
const BASE = "https://www.pikfinder.com";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pf-search-text",
    title: "Search PikFinder for “%s”",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "pf-edit-image",
    title: "Edit this image in PikFinder Studio",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "pf-search-text" && info.selectionText) {
    chrome.tabs.create({ url: BASE + "/search?q=" + encodeURIComponent(info.selectionText.trim()) });
  } else if (info.menuItemId === "pf-edit-image" && info.srcUrl) {
    chrome.tabs.create({ url: BASE + "/studio?img=" + encodeURIComponent(info.srcUrl) });
  }
});
