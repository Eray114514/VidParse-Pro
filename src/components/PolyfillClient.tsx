"use client";

// 所有 Polyfill 已经在 layout.tsx 中以阻塞和外部脚本的方式注入，保证比 React 更早执行。
// 这里保留一个空组件占位，防止影响其它依赖此文件的组件。
export default function PolyfillClient() {
  return null;
}
