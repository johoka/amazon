// Storage工具 - 将回调式改为Promise式
// src/common/storage.js

/**
 * 统一的存储工具类，将chrome.storage API转换为Promise
 */
class StorageUtil {
  /**
   * 从本地存储获取值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>}
   */
  static async get(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Storage get error for key "${key}":`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key] ?? defaultValue);
        }
      });
    });
  }

  /**
   * 获取多个值
   * @param {string[]} keys - 存储键数组
   * @returns {Promise<Object>}
   */
  static async getMultiple(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 设置值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Storage set error for key "${key}":`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 设置多个值
   * @param {Object} items - 键值对对象
   * @returns {Promise<void>}
   */
  static async setMultiple(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 删除值
   * @param {string|string[]} keys - 要删除的键
   * @returns {Promise<void>}
   */
  static async remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清空所有存储
   * @returns {Promise<void>}
   */
  static async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUtil;
}
