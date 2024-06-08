// /*
//  * Author: fasion
//  * Created time: 2022-08-21 09:17:03
//  * Last Modified by: fasion
//  * Last Modified time: 2022-08-21 10:23:42
//  */

// // 通过ID找到按钮
// const button = document.getElementById("changeColor");

// // 从storage取背景色并设到按钮上
// chrome.storage.sync.get("color", ({ color }) => {
//   button.style.backgroundColor = color;
// });

// // 注册按钮点击回调函数
// button.addEventListener("click", async () => {
//   // 调用Chrome接口取出当前标签页
//   // const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
//   const tabs = await chrome.tabs.query({});
//   if (tabs && tabs.length > 0) {
//     for (let index = 0; index < tabs.length; index++) {
//       tab = tabs[index];
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: setPageBackgroundColor,
//       });
//     }
//   }

//   // // 以当前标签页为上下文，执行setPageBackgroundColor函数
//   // chrome.scripting.executeScript({
//   //   target: {tabId: tab.id},
//   //   function: setPageBackgroundColor,
//   // });
// });

// // 函数将在指定标签页内执行，因此可以取得当前网页document
// async function setPageBackgroundColor() {
//   // let queryButtons = document.getElementsByName('waybill-query-btn');
//   // alert(queryButtons);
//   // console.log(queryButtons);
//   // if (queryButtons && queryButtons.length > 0){
//   //   alert(123);
//   //   queryButtons[0].click();
//   // }

//   // let aTags = document.getElementsByTagName('a')
//   // if (aTags && aTags.length > 0){
//   //   for (let index = 0; index < aTags.length; index++) {
//   //     const element = aTags[index];
//   //     // 添加目标属性，使链接在新标签页中打开
//   //     element.setAttribute('target', '_blank');
//   //     element.click();
//   //     setTimeout(() => {
//   //       element.click();
//   //     }, 2000);

//   //     // await sleep(1000)
//   //   }
//   // }
//   // 从storage取出背景色，并设到当前网页上
//   chrome.storage.sync.get("color", ({ color }) => {
//     document.body.style.backgroundColor = color;
//   });
// }
window.onload = function () {
  getMaxTabs();
  document.getElementById("submit").addEventListener("click", function (event) {
    event.preventDefault();
    // 在这里可以添加保存设置的逻辑，例如通过Ajax将设置值发送到服务器
    setMaxTabs();

    setTimeout(function () {
      window.close();
    }, 500);
  });

  document.getElementById("close").addEventListener("click", function (event) {
    event.preventDefault();
    window.close();
  });
};

function setMaxTabs() {
  var maxTabsValue = document.getElementById("maxTabs").value;
  // 这里只是简单地将值输出到控制台
  console.log("最大标签页数已设置为：" + maxTabsValue);
  chrome.storage.local.set({ maxTabs: maxTabsValue }, function () {
    if (chrome.runtime.lastError) {
      console.error("chrome.storage.local.set" + chrome.runtime.lastError);
    }
  });
}

function getMaxTabs() {
  chrome.storage.local.get("maxTabs", function (result) {
    if (chrome.runtime.lastError) {
      console.error("chrome.storage.local.get" + chrome.runtime.lastError);
      return;
    }
    console.log(JSON.stringify(result));
    let maxTabs = result.maxTabs || 5;
    document.getElementById("maxTabs").value = maxTabs;
  });
}
