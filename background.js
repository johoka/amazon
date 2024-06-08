let storageKey = "orderIdArray";

chrome.runtime.onInstalled.addListener(() => {
  // 插件安装后处理流程;
});

// chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
//   console.log("wake me up");
// });
const orderTimeOutMap = new Map();
let getInvitedOrderIdLock = false;
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.action == "closeTab") {
    if (sender.tab) {
      chrome.tabs.remove(sender.tab.id);
    }
  } else if (request.action == "openNewTab") {
    url = request.url;
    let orderId = request.orderId;
    chrome.tabs.create({ url: url, active: request.active }, function (tab) {
      // 回应content.js
      sendResponse({ status: "Tab opened", tabId: tab.id });
      // 测试 URL
      // url = "https://sellercentral.amazon.com/orders-v3/order/111-4279826-6069030";

      // 使用字符串分割方法 split，以 "/" 作为分隔符，获取最后一部分
      // let parts = url.split("/");
      // let orderId = parts[parts.length - 1];
      let timeout = setTimeout(function () {
        //超时关闭标签
        orderTimeOutMap.delete(orderId);
        chrome.tabs.remove(tab.id, function () {
          subTabTimeOutClosedFunction(sender.tab.id, orderId);
        });
      }, 40 * 1000);
      orderTimeOutMap.set(orderId, timeout);

      // 监听标签页加载状态的变化
      chrome.tabs.onUpdated.addListener(function (
        tabId,
        changeInfo,
        updatedTab
      ) {
        if (tabId === tab.id && changeInfo.status === "loading") {
        } else if (tabId === tab.id && changeInfo.status === "complete") {
          // 确保是目标标签页加载完成
          // 向目标标签页发送消息
          chrome.tabs.sendMessage(tab.id, {
            startInvite: true,
            orderId: orderId,
            parentTabId: sender.tab.id,
          });
        }
      });
    });
  } else if (request.action == "updateTab") {
    let tab = sender.tab;
    if (tab) {
      chrome.tabs.update(tab.id, { url: request.url });
    }
  } else if (request.action == "invitedSuccessfully") {
    let tab = sender.tab;
    if (tab) {
      let parentTabId = request.parentTabId;
      let orderId = request.orderId;
      chrome.tabs.remove(sender.tab.id, function () {
        let timeout = orderTimeOutMap.get(orderId);
        if (timeout) {
          //关闭定时器
          clearTimeout(timeout);
          //删除timeout映射关系
          orderTimeOutMap.delete(orderId);
        }
        subTabClosedFunction(parentTabId, orderId);
      });
      let tryLockTimes = 0;
      while (getInvitedOrderIdLock && tryLockTimes < 15) {
        await sleep(1000);
        tryLockTimes++;
      }
      if (tryLockTimes >= 10) {
        console.log("获取本地已邀请订单号锁失败！，强行解锁");
      }
      //上锁
      getInvitedOrderIdLock = true;
      //记录成功标识
      //存储本地
      chrome.storage.local.get(storageKey, function (result) {
        if (chrome.runtime.lastError) {
          console.error("chrome.storage.local.get" + chrome.runtime.lastError);
          return;
        }
        let orderIdArray = result[storageKey];
        // 如果不存在数据或者数据为空，则设置一个空数组到本地存储中
        if (!orderIdArray || orderIdArray.length === 0) {
          orderIdArray = [];
        }
        if (orderIdArray.length >= 5000) {
          orderIdArray.shift();
        }
        orderIdArray.push(orderId);
        chrome.storage.local.set({ orderIdArray: orderIdArray }, function () {
          if (chrome.runtime.lastError) {
            console.error(
              "chrome.storage.local.set" + chrome.runtime.lastError
            );
          } else {
            chrome.tabs.sendMessage(parentTabId, {
              action: "invitedSuccessfully",
              orderId: orderId,
            });
          }
          //释放锁
          getInvitedOrderIdLock = false;
        });
      });
    }
  } else if (request.action == "invitedFail") {
    let tab = sender.tab;
    if (tab) {
      chrome.tabs.remove(sender.tab.id, function () {
        subTabTimeOutClosedFunction(request.parentTabId, request.orderId);
      });
      //记录失败标识
    }
  } else if (request.action == "noInvite") {
    let tab = sender.tab;
    if (tab) {
      chrome.tabs.remove(sender.tab.id);
      let orderId = request.orderId;
      let parentTabId = request.parentTabId;
      chrome.tabs.sendMessage(parentTabId, {
        action: "invitedSuccessfully",
        orderId: orderId,
      });
    }
  } else if (request.action == "outOfRange") {
    //您不能使用此功能请求在订单送达日期后5-30天范围之外的评论。
    chrome.tabs.remove(sender.tab.id);
    let orderId = request.orderId;
    let parentTabId = request.parentTabId;
    chrome.tabs.sendMessage(parentTabId, {
      action: "outOfRange",
      orderId: orderId,
    });
  }
  // 为了在异步响应完成后发送响应，返回 true
  return true;
});

//页签正常关闭
function subTabClosedFunction(tabId, orderId) {
  // 操作成功
  console.log("标签页已关闭");
  //页签关闭，发送消息给父页面
  chrome.tabs.sendMessage(tabId, { action: "subTabClosed", orderId: orderId });
}

//页签超时关闭
function subTabTimeOutClosedFunction(tabId, orderId) {
  //发送超时关闭标签事件
  chrome.tabs.sendMessage(tabId, {
    action: "subTabTimeOutClosed",
    orderId: orderId,
  });
}

// 定义一个 sleep 函数，接受一个延迟时间（以毫秒为单位）作为参数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
