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
          break;
        }
        await sleep(1000);
      }
      if (!requestAReviewLink) {
        //发送邀请失败事件
        chrome.runtime.sendMessage({
          action: "invitedFail",
          orderId: message.orderId,
          parentTabId: message.parentTabId,
        });
      }
    } else if (message.action === "invitedSuccessfully") {
      let orderLink = orderMap.get(message.orderId);
      if (orderLink) {
        //bug：当前页发出的邀请，还没有响应回来时，手动点击下一页，会导致invitedOrderIds size一直大于finalinvItedOrderIdSet size
        //修改：当前页存在该订单号，才记录到当前已邀请集合
        addInvitedFlag(orderLink, message.orderId);
      }
    } else if (message.action == "subTabClosed") {
      if (subTabNum > 0) {
        subTabNum--;
      }
      console.log("邀请成功，tab数减1");
    } else if (message.action == "subTabTimeOutClosed") {
      if (subTabNum > 0) {
        subTabNum--;
      }
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
        <div class="a-row" style="margin-bottom:10px">
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
        // let notCurrentPageOrderIdSet = Array.from(noInviteOrderIds).filter(
        //   (item) => !orderMap.get(item)
        // );

        // notCurrentPageOrderIdSet.forEach((item) => {
        //   //删除非当前页的订单号id
        //   noInviteOrderIds.delete(item);
        // });

        let finalinvitedOrderIdSet = new Set();
        while (true) {
          console.log(orderIds);
          let orderId = orderIds.shift();
          if (!orderId) {
            //没有获取到订单号，等待一会儿，因为存在超时邀请的订单号还没返回状态
            await sleep(10 * 1000);
          } else {
            if (noInviteOrderIds.has(orderId)) {
              //不邀请，跳过
              continue;
            }
            if (invitedOrderIds.has(orderId)) {
              //已经邀请，跳过
              continue;
            }
            finalinvitedOrderIdSet.add(orderId);
          }
          // console.log(
          //   `当前页需要邀请数量：${finalinvitedOrderIdSet.size}，已经邀请数量：${invitedOrderIds.size}`
          // );
          console.log(
            `当前页需要总数：${orderMap.size}，不邀请数量：${noInviteOrderIds.size}`
          );
          //当前页需要邀请数量=当前页单号数量-不需要邀请数量
          let needInviteOrderIdSize = orderMap.size - noInviteOrderIds.size;
          console.log(
            `当前页需要邀请数量：${needInviteOrderIdSize}，已经邀请数量：${invitedOrderIds.size}`
          );
          //todo 次数直接用  orderMap.size可能比较合适
          if (
            !orderId &&
            needInviteOrderIdSize > invitedOrderIds.size &&
            invitedOrderIds.size > 0
          ) {
            //invitedOrderIds.size是变化的
            //没有获取到订单号，但是需要邀请的数量大于已经邀请的数量，等待继续
            //存在超时邀请的订单号还没返回状态
            alert("存在没有邀请的订单，请重新点击邀请评论按钮");
            //重新检测订单是否邀请
            let finalinvItedOrderIdArray = Array.from(finalinvitedOrderIdSet);
            finalinvItedOrderIdArray.forEach((item) => {
              if (!invitedOrderIds.has(item)) {
                //没邀请，重新加入邀请队列
                orderIds.push(item);
              }
            });
            continue;
          } else if (
            !orderId &&
            needInviteOrderIdSize == invitedOrderIds.size
          ) {
            //todo 此处有问题，当某一页邀请一部分后，刷新页面重新邀请时，invitedOrderIds初始化为档期那也已经邀请部分，当finalinvItedOrderIdSet递增到等于已经邀请数量时，直接跳到下一页
            //下一页
            nextPageAction(inviteCommentButton);
            break;
          }
          if (!orderId) {
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
                    orderId: orderId,
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
            if (orderId) {
              alert(`没找到${orderId}元素，点击刷新按钮重试`);
            }
            refreshButton();
            continue;
          }
        }
      });
    }
  }, 2000);
};

function init() {
  // orderLinks = [];
  // orderIds = [];
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
      // 113-4936078-5081004
      // xo4qbGo795
      // S01-6059960-6334868

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

          if (orderIdSet.has(orderId)) {
            //存在，添加已邀请标记
            addInvitedFlag(link, orderId);
          }
        }
      });
    });
  });
}

//已经邀请
function addInvitedFlag(orderLink, orderId) {
  if (noInviteOrderIds.has(orderId)) {
    // 页面显示id为xo4qbGo795，但实际order id为S01-6059960-6334868，导致被邀请的单，进入到邀请队列
    // https://sellercentral.amazon.com/orders-v3/ref=xx_myo_dnav_xx?sort=order_date_desc&date-range=1714114800000-1714201199000&page=2
    return;
  }
  invitedOrderIds.add(orderId);
  if (orderLink) {
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
}

//不用邀请
async function batchAddNoInviteFlag(noInviteOrderIdsTmp) {
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
}

//不用邀请
function addNoInviteFlag(orderLink, orderId) {
  noInviteOrderIds.add(orderId);
  if (orderLink) {
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
}

//什么时候清空？？？
let noInviteAmazonOrderIds = new Set();
// receive message from injected script
window.addEventListener("message", async function (e) {
  let data = e.data;
  if (data.type === "limit") {
    let limit = data.data;
    if (limit <= 15) {
      //当前页第一次请求订单明细，清空邀请状态
      invitedOrderIds = new Set();
      orderIds = [];
      noInviteAmazonOrderIds = new Set();
      noInviteOrderIds = new Set();
    }
  } else if (data.type === "refundOrderIds") {
    init();
    let orderIdArray = data.orderIdArray;
    let noInviteOrderIdsTmp = data.data;
    batchAddNoInviteFlag(noInviteOrderIdsTmp);
    let needInviteOrderIdArray = difference(orderIdArray, noInviteOrderIdsTmp);
    needInviteOrderIdArray.forEach((orderId) => {
      if (noInviteAmazonOrderIds.has(orderId)) {
        return;
      }
      orderIds.push(orderId);
    });
  } else if (data.type === "noFeeOrderIds") {
    init();
    // refund-status是用的是amazonOrderId
    let noFeeAmazonOrderIds = data.noFeeAmazonOrderIds;
    noInviteAmazonOrderIds = new Set(noFeeAmazonOrderIds);

    //页面显示的是sellerOrderId
    let noInviteOrderIdsTmp = data.data;
    batchAddNoInviteFlag(noInviteOrderIdsTmp);
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
      //刷新
      refreshButton();
    }, 2000);
  }
});

function nextPageAction(inviteCommentButton) {
  //下一页
  let nextPage = document.querySelector("#myo-layout .a-last a");
  if (nextPage) {
    //翻页后，清空已经邀请
    invitedOrderIds = new Set();
    orderIds = [];
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
        sleep(2000);
      }
    }, 1000 * 10);
  } else {
    alert("没有需要邀请的订单");
  }
}

//点击刷新按钮
function refreshButton() {
  //等待有刷新按钮出来后再触发邀请按钮
  let refreshButton = document.querySelector(
    "#myo-sorting-bar span[data-test-id='refresh-button'] input"
  );
  if (refreshButton) {
    //存在刷新按钮，说明下一页已经加载完毕,触发邀请按钮
    refreshButton.click();
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
