// (function (xhr) {
//   var XHR = XMLHttpRequest.prototype;

//   var open = XHR.open;
//   var send = XHR.send;

//   XHR.open = function (method, url) {
//     this._method = method;
//     this._url = url;
//     return open.apply(this, arguments);
//   };

//   XHR.send = function (postData) {
//     console.log("xhr request:", this._method, this._url, postData);
//     this.addEventListener("load", function () {
//       window.postMessage({ type: "xhr", data: this.response }, "*"); // 将响应发送到 content script
//     });
//     return send.apply(this, arguments);
//   };
// })(XMLHttpRequest);

(function () {
  let origFetch = window.fetch;
  window.fetch = async function (...args) {
    console.log("fetch request:", args);
    let requestUrl = args[0];
    // 获取URL中的参数
    const url = new URL("https://sellercentral.amazon.com" + requestUrl);
    const params = new URLSearchParams(url.search);
    // feedback链接正则表达式,https://sellercentral.amazon.com/orders-api/order/114-0673221-0175465/feedback?orderId=114-0673221-0175465&orderDate=1711852235672&orderStatus=PaymentComplete&blob2=AAAAAAAAAAALSU8Ptmc94pWIhwFFmkppKgAAAAAAAABqWtBgWI2OfA5NCP6QhzPGrLV6D5m1jLNc2jNCpGrSw+sHF5c5V831f5k=
    const feedbackRegex = /^\/orders-api\/order\/([^/]+)\/feedback/;
    // 使用正则表达式的 exec 方法来提取订单号
    const feedbackMatch = feedbackRegex.exec(requestUrl);
    //判断url
    let isSearchOrderUrl = requestUrl.includes("/orders-api/search?");
    let isRefundStatusUrl = requestUrl.includes("/orders-api/refund-status?");
    let isFeedBackUrl = feedbackMatch;

    if (isSearchOrderUrl) {
      let limit = params.get("limit");
      if (limit <= 15) {
        window.postMessage({ type: "limit", data: limit }, "*");
      }
    }

    const response = await origFetch(...args).catch((error) => {
      console.error(requestUrl);
      window.postMessage({ type: "errorMsg", data: requestUrl }, "*");
      if (isSearchOrderUrl || isRefundStatusUrl) {
        //订单查询或退款状态查询失败，发送事件
        window.postMessage({ type: "refreshOrder", data: {} }, "*");
      }
    });
    console.log(response);
    if (isSearchOrderUrl) {
      //查询所有订单
      response
        .clone()
        .json()
        .then((data) => {
          let noFeeAmazonOrderIds = [];
          let noFeeOrderIds = [];
          let orders = data.orders;
          for (let index = 0; index < orders.length; index++) {
            const order = orders[index];
            let orderItems = order.orderItems;
            //todo 暂时只获取第一个商品
            let orderItem = orderItems[0];
            //付款金额对象
            let unitPrice = orderItem.unitPrice;
            if (unitPrice && unitPrice.Amount > 0) {
              //费用不为0的单
            } else {
              //没有费用或费用为0的单
              let amazonOrderId = order.amazonOrderId;
              noFeeAmazonOrderIds.push(amazonOrderId);
              let sellerOrderId = order.sellerOrderId;
              noFeeOrderIds.push(sellerOrderId);
            }
          }
          window.postMessage(
            {
              type: "noFeeOrderIds",
              data: noFeeOrderIds,
              noFeeAmazonOrderIds: noFeeAmazonOrderIds,
            },
            "*"
          ); // send to content script
        })
        .catch((err) => console.error(err));
    } else if (isRefundStatusUrl) {
      // 将参数放入数组中
      const orderIdArray = params.get("orderId").split(",");

      //查询退款订单
      response
        .clone()
        .json()
        .then((data) => {
          let refundOrderIds = [];
          let refundSummaryList = data.refundSummaryList;
          for (let index = 0; index < refundSummaryList.length; index++) {
            const refundOrder = refundSummaryList[index];
            const refundOrderId = refundOrder.OrderId;
            refundOrderIds.push(refundOrderId);
          }
          window.postMessage(
            {
              type: "refundOrderIds",
              data: refundOrderIds,
              orderIdArray: orderIdArray,
            },
            "*"
          ); // send to content script
        })
        .catch((err) => console.error(err));
    } else if (isFeedBackUrl) {
      //feedback
      response
        .clone()
        .json()
        .then((data) => {
          // 如果匹配成功，match[1] 将包含订单号
          const orderId = feedbackMatch[1];
          let buyerNumericRating = data.buyerNumericRating;
          //feedback星，低于5星不邀请
          window.postMessage(
            { type: "badRating", data: orderId, rating: buyerNumericRating },
            "*"
          ); // send to content script
        })
        .catch((err) => console.error(err));
    }

    return response;
  };
})();
