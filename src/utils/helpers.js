// 通用工具函数
// src/utils/helpers.js

/**
 * 延迟函数 - 用于异步等待
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 数组差集 - 返回在arr1中但不在arr2中的元素
 * @param {Array} arr1 - 原数组
 * @param {Array} arr2 - 差集数组
 * @returns {Array}
 */
function difference(arr1, arr2) {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**
 * 数组交集 - 返回在两个数组中都存在的元素
 * @param {Array} arr1 - 数组1
 * @param {Array} arr2 - 数组2
 * @returns {Array}
 */
function intersection(arr1, arr2) {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

/**
 * 获取URL参数
 * @param {string} name - 参数名称
 * @param {string} url - URL（可选，默认为当前URL）
 * @returns {string|null}
 */
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sleep,
    difference,
    intersection,
    getParameterByName,
  };
}
