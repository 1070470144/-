/**
 * 剧本初始化工具
 */
import scriptManager from './scriptManager';

// 官方剧本数据
const officialScripts = [
  {
    id: "tb",
    name: "Trouble Brewing",
    author: "The Pandemonium Institute",
    description: "Clouds roll in over Ravenswood Bluff...",
    level: "Beginner",
    roles: ["washerwoman", "librarian", "investigator", "chef", "empath"],
    isOfficial: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    version: "1.0.0"
  }
];

// 初始化剧本数据
export async function initializeScripts() {
  try {
    console.log('开始初始化剧本数据...');
    
    const initialized = localStorage.getItem('scripts_initialized');
    if (initialized) {
      console.log('剧本数据已初始化');
      return;
    }
    
    // 导入官方剧本
    for (const script of officialScripts) {
      await scriptManager.saveScript(script, 'official');
    }
    
    localStorage.setItem('scripts_initialized', 'true');
    console.log('剧本数据初始化完成！');
  } catch (error) {
    console.error('初始化剧本数据失败:', error);
  }
}

// 重置剧本数据
export async function resetScripts() {
  try {
    const keys = Object.keys(localStorage);
    const scriptKeys = keys.filter(key => key.startsWith('script_'));
    
    for (const key of scriptKeys) {
      localStorage.removeItem(key);
    }
    
    localStorage.removeItem('scripts_initialized');
    console.log('剧本数据已重置');
  } catch (error) {
    console.error('重置剧本数据失败:', error);
  }
}

export default {
  initializeScripts,
  resetScripts
}; 