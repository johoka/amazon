chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message && message.startInvite) {
    const orderId = getParameterByName("orderId", window.location.href);

    try {
      // 方法1: 等待确认按钮
      const confirmResult = await waitForAnyElement([
        '#ayb-reviews > div > kat-button[label="是"]',
        'kat-button[label*="是"]',
      ]);

      if (confirmResult) {
        const button = confirmResult.element.shadowRoot?.querySelector("button");
        if (button) {
          button.click();

          // 等待成功提示
          try {
            await waitForElement(
              '#ayb-reviews > div > kat-alert[variant="success"]',
              35000
            );
            sendMessage("invitedSuccessfully", orderId, message.parentTabId);
            return;
          } catch (error) {
            // 没有看到成功提示，可能是由于其他原因
            console.warn("未检测到成功提示:", error.message);
            sendMessage("invitedFail", orderId, message.parentTabId);
            return;
          }
        }
      }

      // 方法2: 检查是否已邀请或其他错误状态
      const alreadyInvited = await waitForElement(
        ".ayb-request-review-error-description",
        5000
      ).catch(() => null);

      if (alreadyInvited) {
        const text = alreadyInvited.textContent;
        if (text === "您已请求对此订单进行评论。") {
          console.log("订单已邀请过");
          sendMessage("invitedSuccessfully", orderId, message.parentTabId);
        } else if (text.includes("5-30天范围")) {
          console.log("订单不在邀请日期范围内");
          sendMessage("outOfRange", orderId, message.parentTabId);
        } else {
          console.warn("未知错误:", text);
          sendMessage("invitedFail", orderId, message.parentTabId);
        }
        return;
      }

      // 方法3: 检查是否禁用状态（需要重试）
      const disabledText = await waitForElement(
        ".disabled-state-retry-text",
        5000
      ).catch(() => null);

      if (disabledText?.textContent === "请单击此处重试") {
        console.log("当前无法邀请，需要重试");
        sendMessage("outOfRange", orderId, message.parentTabId);
        return;
      }

      // 未知错误
      console.error("邀请失败：无法检测到预期的页面状态");
      sendMessage("invitedFail", orderId, message.parentTabId);

    } catch (error) {
      console.error("邀请过程发生异常:", error);
      sendMessage("invitedFail", orderId, message.parentTabId);
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

/**
 * 等待元素出现
 * @param {string} selector - CSS选择器
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<HTMLElement>}
 */
function waitForElement(selector, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime < timeout) {
        setTimeout(check, 500);
      } else {
        reject(new Error(`元素未找到（超时${timeout}ms）: ${selector}`));
      }
    };

    check();
  });
}

/**
 * 等待多个选择器中的任意一个出现
 * @param {string[]} selectors - CSS选择器数组
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{element: HTMLElement, selector: string}>}
 */
function waitForAnyElement(selectors, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          resolve({ element, selector });
          return;
        }
      }

      if (Date.now() - startTime < timeout) {
        setTimeout(check, 500);
      } else {
        reject(
          new Error(
            `元素未找到（超时${timeout}ms），已尝试的选择器: ${selectors.join(', ')}`
          )
        );
      }
    };

    check();
  });
}

/**
 * 发送消息到父标签页
 * @param {string} action - 动作名称
 * @param {string} orderId - 订单ID
 * @param {number} parentTabId - 父标签页ID
 */
function sendMessage(action, orderId, parentTabId) {
  chrome.runtime
    .sendMessage({
      action: action,
      orderId: orderId,
      parentTabId: parentTabId,
    })
    .catch((error) => {
      console.error(`发送消息失败 (${action}):`, error);
    });
}
