let aTags = document.getElementsByTagName("button");
if (aTags && aTags.length > 0) {
  for (let index = 0; index < aTags.length; index++) {
    const element = aTags[index];
    // 添加目标属性，使链接在新标签页中打开
    element.click();
    debugger;
    // await sleep(1000)
    let parentTabId = chrome.storage.local.get("parentTabId");
    // 发送消息告诉订单管理页面已经成功邀请
    chrome.tabs.sendMessage(
      parentTabId,
      { action: "getData" },
      function (response) {
        console.log("Response:", response);
      }
    );
  }
}
