// src/polyfills.js
// 1. 修复 Chrome 61 缺失的 globalThis (最常见的 React 19/Next 15 白屏元凶)
if (typeof globalThis === 'undefined') {
  Object.defineProperty(Object.prototype, '__magic__', {
    get: function() {
      return this;
    },
    configurable: true // 这很重要
  });
  // eslint-disable-next-line no-undef
  __magic__.globalThis = __magic__; // 无害的注入方式
  delete Object.prototype.__magic__;
}

// 2. 引入 core-js 的稳定特性
import 'core-js/stable';
