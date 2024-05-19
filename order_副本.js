let orderLinks = [];
let orderIds = [];
let orderMap = new Map();
let invitedOrderIds = new Set();
let noInviteOrderIds = new Set();

let subTabNum = 0;
let parentTabId;
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message) {
    if (message.startInvite) {
      console.log("接收到邀请请求");
      let requestAReviewLink;
      let loopCount = 0;
      while (!requestAReviewLink && loopCount < 30) {
        loopCount = loopCount + 1;
        requestAReviewLink = document.querySelector(
          '[data-test-id="plugin-button-requestAReview"] a'
        );
        if (requestAReviewLink) {
          var href = requestAReviewLink.getAttribute("href");
          chrome.runtime.sendMessage({
            action: "updateTab",
            url: "https://sellercentral.amazon.com" + href,
          });
        }
        await sleep(1000);
      }
    } else if (message.action === "invitedSuccessfully") {
      let orderLink = orderMap.get(message.orderId);
      addInvitedFlag(orderLink, message.orderId);
    } else if (message.action == "subTabClosed") {
      subTabNum--;
      console.log("邀请成功，tab数减1");
    } else if (message.action == "subTabTimeOutClosed") {
      subTabNum--;
      if (!invitedOrderIds.has(message.orderId)) {
        //没邀请过，则重新放入邀请队列
        orderIds.push(message.orderId);
        console.log("超时，tab数减1，orderId is " + message.orderId);
      }
    }
  }
});

window.onload = function () {
  setTimeout(async function () {
    // 要添加的 HTML 片段
    let htmlFragment = `
        <div class="a-row">
            <button id="inviteCommentButton">邀请评论</button>
        </div>
        `;
    // 将 HTML 片段添加到目标元素下
    let targetElement = document.getElementById("myo-sorting-bar");
    if (targetElement) {
      targetElement.insertAdjacentHTML("afterend", htmlFragment);
      // 为动态添加的按钮添加点击事件处理程序
      var inviteCommentButton = document.getElementById("inviteCommentButton");
      inviteCommentButton.addEventListener("click", async function () {
        if (orderIds.length == 0) {
          nextPageAction(inviteCommentButton);
          return;
        }
        let noInviteOrderIdArray = Array.from(noInviteOrderIds);
        let needInviteOrderIdsLength = difference(
          orderIds,
          noInviteOrderIdArray
        ).length;
        let invitedOrderIdsLength = invitedOrderIds.size;
        //最终需要邀请的数量应该等于该批次需要邀请的数量+已经邀请的数量,
        let finalinvItedOrderIdsLength =
          needInviteOrderIdsLength + invitedOrderIdsLength;
        while (true) {
          console.log(orderIds);
          let orderId = orderIds.shift();
          if (!orderId) {
            //没有获取到订单号，等待一会儿，因为存在超时邀请的订单号还没返回状态
            await sleep(40 * 1000);
          }
          if (!orderId && finalinvItedOrderIdsLength > invitedOrderIds.size) {
            // invitedOrderIds.size是变化的
            //没有获取到订单号，但是需要邀请的数量大于已经邀请的数量，等待继续
            //存在超时邀请的订单号还没返回状态
            alert("存在没有邀请的订单，请重新点击邀请评论按钮");
            //重新检测订单是否邀请
            init();
            await sleep(5 * 1000);
            inviteCommentButton.click();
            break;
          } else if (finalinvItedOrderIdsLength == invitedOrderIds.size) {
            //下一页
            nextPageAction(inviteCommentButton);
            break;
          }
          if (noInviteOrderIds.has(orderId)) {
            //不邀请，跳过
            continue;
          }
          let orderLink = orderMap.get(orderId);
          if (orderLink) {
            let loopCount = 0;
            let maxLoopCount = 40;
            while (loopCount < maxLoopCount) {
              loopCount++;
              if (loopCount == maxLoopCount - 1) {
                //循环了多次，但是subTabNum一直不小于3，此时将subTabNum设置为0
                subTabNum = 0;
              }
              if (subTabNum < 3) {
                chrome.runtime.sendMessage(
                  {
                    action: "openNewTab",
                    url:
                      "https://sellercentral.amazon.com" +
                      orderLink.getAttribute("href"),
                    active: false,
                  },
                  function (response) {
                    console.log("Response:", response);
                  }
                );
                subTabNum++;
                //每隔200毫秒打开一个窗口
                await sleep(300);
                break;
              }
              await sleep(1000);
            }
          } else {
            //在此查询所有列表，看是否有存在没有邀请的
            //有，添加到orderLinks
            //没有，翻页，查询下一批次
            //暂时break
            console.log("当前页邀请完毕");
            break;
          }
        }
      });
    }
  }, 2000);
};

function init() {
  orderLinks = [];
  orderIds = [];
  orderMap = new Map();
  let storageKey = "orderIdArray";
  chrome.storage.local.get(storageKey, function (result) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    let orderIdArray = result[storageKey];
    //数组装换为set
    let orderIdSet = new Set(orderIdArray);

    // 可以在这里添加更多的处理逻辑
    let orderTrs = document.querySelectorAll("#orders-table > tbody > tr");
    orderTrs.forEach(function (orderTr) {
      // let orderProductDivs = orderTr.querySelectorAll(
      //   ".myo-list-orders-product-name-cell div"
      // );
      // //noInviteFlag等于true表示不用邀请，等于false表示需要申请
      // let noInviteFlag = true;
      // for (var i = 0; i < orderProductDivs.length; i++) {
      //   let orderProductDivTextContent = orderProductDivs[i].textContent;
      //   if (orderProductDivTextContent.includes("商品小计")) {
      //     if (orderProductDivTextContent !== "商品小计: US$0.00") {
      //       //需要邀请
      //       noInviteFlag = false;
      //     }
      //     break;
      //   }
      //   //退款订单号： 113-8906083-6969826
      //   //feedback差评订单 ：114-0673221-0175465
      //   //移除订单：xo3tkDO970   https://sellercentral.amazon.com/orders-v3/ref=xx_myo_dnav_xx?page=2
      // }

      let links = orderTr.querySelectorAll(".cell-body-title a");
      let attributeValue1 = "/orders-v3/order/";
      let attributeValue2 = "/gp/orders/fba-order-details.html";

      // 遍历所有找到的a标签
      links.forEach(function (link) {
        var attribute = link.getAttribute("href");
        if (
          attribute &&
          (attribute.indexOf(attributeValue1) !== -1 ||
            attribute.indexOf(attributeValue2) !== -1)
        ) {
          let orderId = link.textContent;
          orderMap.set(orderId, link);

          if (noInviteOrderIds.has(orderId)) {
            //不邀请的订单
            return;
          } else if (orderIdSet.has(orderId)) {
            //存在，添加已邀请标记
            addInvitedFlag(link, orderId);
          } else {
            //保存需要邀请的订单链接
            orderLinks.push(attribute);
            orderIds.push(orderId);
          }
        }
      });
    });
  });
}

//已经邀请
function addInvitedFlag(orderLink, orderId) {
  invitedOrderIds.add(orderId);
  let yiyaoqing = orderLink.getAttribute("yiyaoqing");
  if (yiyaoqing) {
    //已经存在【不邀】标志，不需要重复添加
    return;
  }
  let invitedSuccessfullySpan = `
    <span style="color:blue;">
        已邀
    </span>
    `;
  //orderlink添加标识，用于标记不需要邀请
  orderLink.setAttribute("yiyaoqing", "yiyaoqing");
  orderLink.insertAdjacentHTML("afterend", invitedSuccessfullySpan);
}

//不用邀请
function addNoInviteFlag(orderLink, orderId) {
  noInviteOrderIds.add(orderId);
  //不需要邀请flag
  let buyaoqingFlag = orderLink.getAttribute("buyaoqing");
  if (buyaoqingFlag) {
    //已经存在【不邀】标志，不需要重复添加
    return;
  }
  let invitedSuccessfullySpan = `
    <span style="color:red;">
        不邀
    </span>
    `;
  //orderlink添加标识，用于标记不需要邀请
  orderLink.setAttribute("buyaoqing", "buyaoqing");
  orderLink.insertAdjacentHTML("afterend", invitedSuccessfullySpan);
}

// receive message from injected script
window.addEventListener("message", async function (e) {
  let data = e.data;
  if (data.type === "noFeeOrderIds" || data.type === "refundOrderIds") {
    init();
    let noInviteOrderIdsTmp = data.data;
    if (noInviteOrderIdsTmp) {
      for (let index = 0; index < noInviteOrderIdsTmp.length; index++) {
        const orderId = noInviteOrderIdsTmp[index];
        let link = orderMap.get(orderId);
        if (!link) {
          let loopCount = 0;
          while (!link && loopCount < 5) {
            //最大延迟5秒，找不需要邀请的订单号
            loopCount++;
            await sleep(1000);
            link = orderMap.get(orderId);
          }
        }
        if (!link) {
          //如果link为空
          alert("不需要邀请单号排除异常，请刷新页面");
        }
        addNoInviteFlag(link, orderId);
      }
    }
  } else if (data.type === "badRating") {
    // if (parentTabId) {
    let badRatingOrderId = data.data;
    let rating = data.rating;
    //差评feedback
    const currentUrl = window.location.href;
    if (currentUrl.includes(badRatingOrderId)) {
      // alert("进入主要逻辑");
      // console.log(rating);
      // if (rating > 0 && rating < 5) {
      //   alert("进入小于5星逻辑");
      //   //发送不邀请消息
      //   chrome.runtime.sendMessage({
      //     action: "noInvite",
      //     orderId: badRatingOrderId,
      //     parentTabId: parentTabId,
      //   });
      // } else {
      //   //正常rating
      // }
    }
  } else if (data.type === "refreshOrder") {
    //查询订单异常，刷新。。。
    setTimeout(() => {
      //等待有刷新按钮出来后再触发邀请按钮
      let refreshButton = document.querySelector(
        "#myo-sorting-bar span[data-test-id='refresh-button'] input"
      );
      if (refreshButton) {
        //存在刷新按钮，说明下一页已经加载完毕,触发邀请按钮
        refreshButton.click();
      }
    }, 2000);
  }
  // }
  console.log("content script received:", e.data.type, e.data.data);
});

function nextPageAction(inviteCommentButton) {
  //下一页
  let nextPage = document.querySelector("#myo-layout .a-last a");
  if (nextPage) {
    console.log("自动邀请下一页");
    nextPage.click();
    setTimeout(async function () {
      while (true) {
        //等待有刷新按钮出来后再触发邀请按钮
        let refreshButton = document.querySelector(
          "#myo-sorting-bar span[data-test-id='refresh-button'] input"
        );
        if (refreshButton && orderIds.length > 0) {
          //存在刷新按钮，说明下一页已经加载完毕,触发邀请按钮
          inviteCommentButton.click();
          break;
        }
        //还可以检测下是否超时，如果超时触发刷新按钮
      }
    }, 2000);
  } else {
    alert("没有需要邀请的订单");
  }
}

// 数组差集
function difference(arr1, arr2) {
  return arr1.filter((item) => !arr2.includes(item));
}

// 定义一个 sleep 函数，接受一个延迟时间（以毫秒为单位）作为参数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
