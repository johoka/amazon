// 元素等待工具 - 健壮地等待DOM元素
// src/utils/elementWaiter.js

/**
 * 元素等待工具类
 * 提供健壮的DOM元素查询功能，支持超时和备选选择器
 */
class ElementWaiter {
  /**
   * 等待单个元素出现
   * @param {string} selector - CSS选择器
   * @param {number} timeout - 超时时间（毫秒）
   * @param {number} checkInterval - 检查间隔（毫秒）
   * @returns {Promise<HTMLElement>}
   * @throws {Error} 元素未找到时抛出错误
   */
  async waitForElement(selector, timeout = 30000, checkInterval = 500) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`[ElementWaiter] 找到元素: ${selector}`);
        return element;
      }
      await this.sleep(checkInterval);
    }

    throw new Error(`元素未找到（超时${timeout}ms）: ${selector}`);
  }

  /**
   * 等待多个选择器中的任意一个出现
   * @param {string[]} selectors - CSS选择器数组
   * @param {number} timeout - 超时时间（毫秒）
   * @param {number} checkInterval - 检查间隔（毫秒）
   * @returns {Promise<{element: HTMLElement, selector: string}>}
   * @throws {Error} 所有选择器都未找到时抛出错误
   */
  async waitForAnyElement(selectors, timeout = 30000, checkInterval = 500) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`[ElementWaiter] 找到元素（使用选择器）: ${selector}`);
          return { element, selector };
        }
      }
      await this.sleep(checkInterval);
    }

    throw new Error(
      `元素未找到（超时${timeout}ms），已尝试的选择器: ${selectors.join(', ')}`
    );
  }

  /**
   * 等待元素消失（例如：等待加载动画结束）
   * @param {string} selector - CSS选择器
   * @param {number} timeout - 超时时间（毫秒）
   * @param {number} checkInterval - 检查间隔（毫秒）
   * @returns {Promise<void>}
   * @throws {Error} 超时时抛出错误
   */
  async waitForElementToDisappear(selector, timeout = 30000, checkInterval = 500) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (!element) {
        console.log(`[ElementWaiter] 元素已消失: ${selector}`);
        return;
      }
      await this.sleep(checkInterval);
    }

    throw new Error(`元素未消失（超时${timeout}ms）: ${selector}`);
  }

  /**
   * 等待文本出现在元素中
   * @param {string} selector - CSS选择器
   * @param {string} text - 要查找的文本
   * @param {number} timeout - 超时时间（毫秒）
   * @param {number} checkInterval - 检查间隔（毫秒）
   * @returns {Promise<HTMLElement>}
   * @throws {Error} 文本未找到时抛出错误
   */
  async waitForElementWithText(selector, text, timeout = 30000, checkInterval = 500) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.textContent.includes(text)) {
          console.log(`[ElementWaiter] 找到包含"${text}"的元素: ${selector}`);
          return element;
        }
      }
      await this.sleep(checkInterval);
    }

    throw new Error(`未找到包含"${text}"的元素（超时${timeout}ms）: ${selector}`);
  }

  /**
   * 辅助睡眠函数
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 创建单例实例
const elementWaiter = new ElementWaiter();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ElementWaiter, elementWaiter };
}
