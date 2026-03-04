// 统一常量定义
// src/common/constants.js

export const CONFIG = {
  TIMEOUTS: {
    ELEMENT_QUERY: 30,           // 查询元素的最大轮询次数
    CONFIRMATION_WAIT: 35,       // 等待确认的轮询次数
    TAB_OPERATION: 40 * 1000,    // 标签页操作超时（毫秒）
    STORAGE_LOCK_RETRY: 15,      // 获取存储锁的重试次数
  },

  DELAYS: {
    ELEMENT_CHECK: 500,          // 元素检查间隔（毫秒）
    TAB_OPEN: 300,               // 打开标签页的延迟（毫秒）
    ORDER_POLL: 10000,           // 订单轮询间隔（毫秒）
    STORAGE_LOCK_WAIT: 1000,     // 存储锁等待间隔（毫秒）
  },

  LIMITS: {
    MIN_SEARCH_LIMIT: 15,        // API最小limit参数，用于检测分页
    MAX_STORED_ORDERS: 5000,     // 存储的最大订单数
    DEFAULT_MAX_TABS: 5,         // 默认最大并发标签页数
  },

  ORDER_DATE_RANGE: {
    MIN_DAYS: 5,                 // 最少天数
    MAX_DAYS: 30,                // 最多天数
  },

  SELECTORS: {
    CONFIRM_BUTTON: [
      '#ayb-reviews > div > kat-button[label="是"]',
      'kat-button[label*="是"]',
    ],
    SUCCESS_ALERT: '#ayb-reviews > div > kat-alert[variant="success"]',
    ERROR_DESCRIPTION: '.ayb-request-review-error-description',
    RETRY_TEXT: '.disabled-state-retry-text',
    REQUEST_REVIEW_LINK: '[data-test-id="plugin-button-requestAReview"] a',
    ORDERS_TABLE: '#orders-table > tbody > tr',
    REFRESH_BUTTON: '#myo-sorting-bar span[data-test-id="refresh-button"] input',
    NEXT_PAGE_BUTTON: '#myo-layout .a-last a',
  },

  API_PATTERNS: {
    SEARCH: '/orders-api/search?',
    REFUND_STATUS: '/orders-api/refund-status?',
    FEEDBACK: /^\/orders-api\/order\/([^/]+)\/feedback/,
  },

  MESSAGE_ACTIONS: {
    OPEN_TAB: 'openNewTab',
    CLOSE_TAB: 'closeTab',
    UPDATE_TAB: 'updateTab',
    INVITED_SUCCESSFULLY: 'invitedSuccessfully',
    INVITED_FAIL: 'invitedFail',
    OUT_OF_RANGE: 'outOfRange',
    SUB_TAB_CLOSED: 'subTabClosed',
    SUB_TAB_TIMEOUT_CLOSED: 'subTabTimeOutClosed',
    NO_INVITE: 'noInvite',
    START_INVITE: 'startInvite',
  },

  STORAGE_KEYS: {
    INVITED_ORDERS: 'orderIdArray',
    MAX_TABS: 'maxTabs',
  },

  ERROR_MESSAGES: {
    ALREADY_INVITED: '您已请求对此订单进行评论。',
    OUT_OF_DATE_RANGE: '您不能使用此功能请求在订单送达日期后5-30天范围之外的评论。',
    RETRY: '请单击此处重试',
  },
};
