/*
 * Author: fasion
 * Created time: 2022-08-21 09:17:03
 * Last Modified by: fasion
 * Last Modified time: 2022-08-21 10:23:42
 */

// 通过ID找到按钮
const button = document.getElementById("changeColor");

// 从storage取背景色并设到按钮上
chrome.storage.sync.get("color", ({ color }) => {
  button.style.backgroundColor = color;
});

// 注册按钮点击回调函数
button.addEventListener("click", async () => {
  // 调用Chrome接口取出当前标签页
  // const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const tabs = await chrome.tabs.query({});
  if (tabs && tabs.length > 0) {
    for (let index = 0; index < tabs.length; index++) {
      tab = tabs[index];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setPageBackgroundColor,
      });
    }
  }

  // // 以当前标签页为上下文，执行setPageBackgroundColor函数
  // chrome.scripting.executeScript({
  //   target: {tabId: tab.id},
  //   function: setPageBackgroundColor,
  // });
});

// 函数将在指定标签页内执行，因此可以取得当前网页document
async function setPageBackgroundColor() {
  // let queryButtons = document.getElementsByName('waybill-query-btn');
  // alert(queryButtons);
  // console.log(queryButtons);
  // if (queryButtons && queryButtons.length > 0){
  //   alert(123);
  //   queryButtons[0].click();
  // }

  // let aTags = document.getElementsByTagName('a')
  // if (aTags && aTags.length > 0){
  //   for (let index = 0; index < aTags.length; index++) {
  //     const element = aTags[index];
  //     // 添加目标属性，使链接在新标签页中打开
  //     element.setAttribute('target', '_blank');
  //     element.click();
  //     setTimeout(() => {
  //       element.click();
  //     }, 2000);

  //     // await sleep(1000)
  //   }
  // }
  // 从storage取出背景色，并设到当前网页上
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}
