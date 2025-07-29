import enUS from "./en-US";
import zhCN from "./zh-CN";

const messages = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

// 获取用户语言
function getUserLanguage() {
  const language = window.navigator.userLanguage || window.navigator.language;
  return language.startsWith("zh") ? "zh-CN" : "en-US";
}

// 获取当前语言
function getCurrentLanguage() {
  const userStorage = require("../utils/userStorage").default;
  return userStorage.getItem("language") || getUserLanguage();
}

// 设置语言
function setLanguage(lang) {
  const userStorage = require("../utils/userStorage").default;
  userStorage.setItem("language", lang);
  window.location.reload();
}

// 获取翻译文本
function t(key, params = {}, lang = getCurrentLanguage()) {
  const keys = key.split(".");
  let value = messages[lang] || messages["en-US"];

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      // 如果找不到翻译，返回英文
      value = messages["en-US"];
      for (const k2 of keys) {
        if (value && value[k2]) {
          value = value[k2];
        } else {
          return key; // 如果英文也找不到，返回原始key
        }
      }
    }
  }

  // 如果value是字符串且有参数，进行参数替换
  if (typeof value === "string" && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] || match;
    });
  }

  return value;
}

export default {
  t,
  setLanguage,
  getCurrentLanguage,
  getUserLanguage,
  messages,
};
