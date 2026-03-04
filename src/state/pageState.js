// 页面状态管理 - 统一管理订单页面的所有状态
// src/state/pageState.js

/**
 * 页面状态管理类
 * 集中管理订单页面的所有状态，避免全局变量污染
 */
class PageState {
  constructor() {
    this.reset();
  }

  /**
   * 重置页面状态（切换页面时调用）
   */
  reset() {
    this.orderMap = new Map();           // orderId -> DOM element
    this.invitedOrderIds = new Set();    // 本页已邀请订单
    this.excludedOrderIds = new Set();   // 本页排除订单（范围外、退款等）
    this.pendingOrderIds = [];           // 待邀请队列
    this.activeTabCount = 0;             // 当前打开的标签页数
  }

  /**
   * 添加订单
   * @param {string} orderId - 订单ID
   * @param {HTMLElement} element - 订单对应的DOM元素
   */
  addOrder(orderId, element) {
    this.orderMap.set(orderId, element);
  }

  /**
   * 标记订单为已邀请
   * @param {string} orderId - 订单ID
   */
  markAsInvited(orderId) {
    this.invitedOrderIds.add(orderId);
  }

  /**
   * 标记订单为排除（不邀请）
   * @param {string} orderId - 订单ID
   */
  markAsExcluded(orderId) {
    this.excludedOrderIds.add(orderId);
  }

  /**
   * 将订单加入邀请队列
   * @param {string} orderId - 订单ID
   */
  enqueueOrder(orderId) {
    // 只添加未邀请且未排除的订单
    if (!this.invitedOrderIds.has(orderId) && !this.excludedOrderIds.has(orderId)) {
      this.pendingOrderIds.push(orderId);
    }
  }

  /**
   * 从队列中取出下一个订单
   * @returns {string|undefined} 订单ID或undefined
   */
  getNextOrder() {
    return this.pendingOrderIds.shift();
  }

  /**
   * 增加标签页计数
   */
  incrementTabCount() {
    this.activeTabCount++;
  }

  /**
   * 减少标签页计数
   */
  decrementTabCount() {
    this.activeTabCount = Math.max(0, this.activeTabCount - 1);
  }

  /**
   * 检查是否可以打开新标签页
   * @param {number} maxTabs - 最大并发标签页数
   * @returns {boolean}
   */
  canOpenNewTab(maxTabs) {
    return this.activeTabCount < maxTabs;
  }

  /**
   * 获取DOM元素
   * @param {string} orderId - 订单ID
   * @returns {HTMLElement|undefined}
   */
  getOrderElement(orderId) {
    return this.orderMap.get(orderId);
  }

  /**
   * 检查订单是否已邀请
   * @param {string} orderId - 订单ID
   * @returns {boolean}
   */
  isInvited(orderId) {
    return this.invitedOrderIds.has(orderId);
  }

  /**
   * 检查订单是否被排除
   * @param {string} orderId - 订单ID
   * @returns {boolean}
   */
  isExcluded(orderId) {
    return this.excludedOrderIds.has(orderId);
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      totalOrders: this.orderMap.size,
      invitedCount: this.invitedOrderIds.size,
      excludedCount: this.excludedOrderIds.size,
      pendingCount: this.pendingOrderIds.length,
      activeTabCount: this.activeTabCount,
      progressPercentage: this.orderMap.size > 0
        ? ((this.invitedOrderIds.size + this.excludedOrderIds.size) / this.orderMap.size * 100).toFixed(2)
        : 0,
    };
  }

  /**
   * 用于调试的状态快照
   * @returns {Object}
   */
  toJSON() {
    return {
      orderMapSize: this.orderMap.size,
      invitedOrderIds: Array.from(this.invitedOrderIds),
      excludedOrderIds: Array.from(this.excludedOrderIds),
      pendingOrderIds: this.pendingOrderIds,
      activeTabCount: this.activeTabCount,
    };
  }

  /**
   * 输出调试信息
   */
  logStats() {
    const stats = this.getStats();
    console.log('[PageState] 订单统计:', stats);
    console.log('[PageState] 进度:', `${stats.invitedCount + stats.excludedCount}/${stats.totalOrders}`);
  }
}

// 创建单例实例
const pageState = new PageState();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageState, pageState };
}
