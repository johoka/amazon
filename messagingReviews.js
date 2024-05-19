chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message && message.startInvite) {
    // 获取当前标签页的 URL
    var currentUrl = window.location.href;
    var orderId = getParameterByName("orderId", currentUrl);
    let confirmButton;
    let invitedSuccessfully;
    let alreadyInvited;
    let loopCount = 0;
    while (
      !confirmButton &&
      !invitedSuccessfully &&
      !alreadyInvited &&
      loopCount < 30
    ) {
      debugger;
      loopCount = loopCount + 1;

      //确认邀请评论
      confirmButton = document.querySelector(
        '#ayb-reviews > div > kat-button[label="是"]'
      );
      if (confirmButton) {
        confirmButton = confirmButton.shadowRoot.querySelector("button");
        if (confirmButton) {
          // alert("找到是按钮了");
          confirmButton.click();

          loopCount = 0;
          while (loopCount < 35) {
            loopCount = loopCount + 1;
            //点击确认邀请后，成功返回的标识
            invitedSuccessfully = document.querySelector(
              "#ayb-reviews > div > kat-alert[variant='success']"
            );
            if (invitedSuccessfully) {
              //发送成功事件
              chrome.runtime.sendMessage({
                action: "invitedSuccessfully",
                orderId: orderId,
                parentTabId: message.parentTabId,
              });
            }
            await sleep(1000);
          }
          //发送邀请失败事件
          chrome.runtime.sendMessage({
            action: "invitedFail",
            orderId: orderId,
            parentTabId: message.parentTabId,
          });
          break;
        }
      }

      //已经邀请评论，返回关闭页签
      alreadyInvited = document.querySelector(
        ".ayb-request-review-error-description"
      );
      if (alreadyInvited) {
        let textContent = alreadyInvited.textContent;
        if (textContent == "您已请求对此订单进行评论。") {
          chrome.runtime.sendMessage({
            action: "invitedSuccessfully",
            orderId: orderId,
            parentTabId: message.parentTabId,
          });
        }
      }
      await sleep(1000);
    }
  }
});

// 解析 URL 参数
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// 定义一个 sleep 函数，接受一个延迟时间（以毫秒为单位）作为参数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
