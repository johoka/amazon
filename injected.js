// inject injected script
var s = document.createElement("script");
s.src = chrome.runtime.getURL("resources/js/injectedAjax.js");
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

// receive message from injected script
window.addEventListener("message", async function (e) {
  let type = e.data.type;
  let data = e.data.data;
  if (type == "errorMsg") {
    console.error("content script received", type, data);
  } else {
    console.log("content script received:", type, data);
  }
});
