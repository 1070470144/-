<template>
  <div class="script-ranking">
    <div class="ranking-header">
      <h2>剧本排行榜</h2>
      <div class="ranking-tabs">
        <button 
          @click="activeTab = 'usage'"
          :class="{ active: activeTab === 'usage' }"
          class="tab-btn"
        >
          使用排行
        </button>
        <button 
          @click="activeTab = 'likes'"
          :class="{ active: activeTab === 'likes' }"
          class="tab-btn"
        >
          点赞排行
        </button>
        <button 
          @click="activeTab = 'comprehensive'"
          :class="{ active: activeTab === 'comprehensive' }"
          class="tab-btn"
        >
          综合排行
        </button>
      </div>
    </div>

    <div class="ranking-content">
      <div class="ranking-list">
        <div 
          v-for="(script, index) in rankedScripts" 
          :key="script.id"
          class="ranking-item"
          :class="{ 'top-three': index < 3 }"
        >
          <div class="rank-number">
            <span class="rank">{{ index + 1 }}</span>
            <div v-if="index < 3" class="medal">
              <span v-if="index === 0" class="gold">🥇</span>
              <span v-else-if="index === 1" class="silver">🥈</span>
              <span v-else class="bronze">🥉</span>
            </div>
          </div>

          <div class="script-info">
            <div class="script-header">
              <h3 class="script-name">{{ script.name }}</h3>
              <span class="script-author">by {{ script.author || '未知' }}</span>
            </div>
            <div class="script-meta">
              <span class="category">{{ getCategoryName(script.category) }}</span>
              <span class="level">{{ script.level || 'Intermediate' }}</span>
              <span class="roles-count">{{ script.roles?.length || 0 }} 角色</span>
            </div>
            <p class="description">{{ script.description || '暂无描述' }}</p>
          </div>

          <div class="script-stats">
            <div class="stat-item">
              <span class="stat-label">使用次数</span>
              <span class="stat-value usage">{{ script.usage || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">点赞数</span>
              <span class="stat-value likes">{{ script.likes || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">综合评分</span>
              <span class="stat-value score">{{ calculateScore(script) }}</span>
            </div>
          </div>

          <div class="script-actions">
            <button @click="useScript(script.id)" class="use-btn">使用</button>
            <button @click="likeScript(script.id)" class="like-btn">
              <span v-if="script.isLiked">❤️</span>
              <span v-else>🤍</span>
            </button>
            <button @click="viewScript(script)" class="view-btn">查看</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scriptAPI from '@/utils/scriptAPI';

export default {
  name: 'ScriptRanking',
  data() {
    return {
      activeTab: 'usage',
      scripts: [],
      isLoading: false
    };
  },
  computed: {
    rankedScripts() {
      let sortedScripts = [...this.scripts];
      
      switch (this.activeTab) {
        case 'usage':
          return sortedScripts.sort((a, b) => (b.usage || 0) - (a.usage || 0));
        case 'likes':
          return sortedScripts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        case 'comprehensive':
          return sortedScripts.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
        default:
          return sortedScripts;
      }
    }
  },
  async mounted() {
    await this.loadScripts();
  },
  methods: {
    async loadScripts() {
      try {
        this.isLoading = true;
        console.log('🔍 开始加载排行榜剧本...');
        
        const result = await scriptAPI.getAllScripts();
        console.log('📄 获取到剧本数据:', result);
        
        // scriptAPI.getAllScripts() 直接返回数据对象
        if (result) {
          const allScripts = [
            ...(result.custom || []),
            ...(result.official || []),
            ...(result.templates || [])
          ];
          
          this.scripts = allScripts.map(script => ({
            ...script,
            usage: Math.floor(Math.random() * 100), // 模拟数据
            likes: Math.floor(Math.random() * 50),  // 模拟数据
            isLiked: false
          }));
          
          console.log(`✅ 成功加载 ${this.scripts.length} 个剧本到排行榜`);
        } else {
          console.error('❌ 剧本数据格式错误:', result);
          this.scripts = [];
        }
      } catch (error) {
        console.error('❌ 加载剧本错误:', error);
        this.scripts = [];
      } finally {
        this.isLoading = false;
      }
    },

    calculateScore(script) {
      const usage = script.usage || 0;
      const likes = script.likes || 0;
      return Math.round(usage * 0.6 + likes * 0.4);
    },

    async useScript(scriptId) {
      try {
        const result = await scriptAPI.useScript(scriptId);
        if (result.success) {
          const script = this.scripts.find(s => s.id === scriptId);
          if (script) {
            script.usage = (script.usage || 0) + 1;
          }
          alert('剧本使用成功！');
        }
      } catch (error) {
        console.error('使用剧本失败:', error);
      }
    },

    async likeScript(scriptId) {
      try {
        const result = await scriptAPI.toggleLike(scriptId);
        if (result.success) {
          const script = this.scripts.find(s => s.id === scriptId);
          if (script) {
            script.isLiked = !script.isLiked;
            script.likes = result.likes || script.likes;
          }
        }
      } catch (error) {
        console.error('点赞失败:', error);
      }
    },

    viewScript(script) {
      console.log('查看剧本:', script);
    },

    getCategoryName(category) {
      const categoryNames = {
        official: '官方剧本',
        custom: '自制剧本',
        mixed: '混合剧本',
        event: '节日活动',
        overseas: '海外剧本'
      };
      return categoryNames[category] || '未知分类';
    }
  }
};
</script>

<style scoped lang="scss">
.script-ranking {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    margin: 0;
    color: #fff;
    font-size: 24px;
  }
  
  .ranking-tabs {
    display: flex;
    gap: 10px;
    
    .tab-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      background: #333;
      color: #ccc;
      transition: all 0.3s ease;
      
      &.active {
        background: #4a90e2;
        color: #fff;
      }
      
      &:hover {
        background: #4a90e2;
        color: #fff;
      }
    }
  }
}

.ranking-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ranking-item {
  display: grid;
  grid-template-columns: 80px 1fr 150px 120px;
  gap: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  &.top-three {
    border: 2px solid;
    
    &:nth-child(1) {
      border-color: #ffd700;
      background: linear-gradient(135deg, #2a2a2a 0%, #3a3a2a 100%);
    }
    
    &:nth-child(2) {
      border-color: #c0c0c0;
      background: linear-gradient(135deg, #2a2a2a 0%, #2a2a3a 100%);
    }
    
    &:nth-child(3) {
      border-color: #cd7f32;
      background: linear-gradient(135deg, #2a2a2a 0%, #3a2a2a 100%);
    }
  }
  
  .rank-number {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    
    .rank {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }
    
    .medal {
      font-size: 20px;
    }
  }
  
  .script-info {
    .script-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      
      .script-name {
        margin: 0;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
      }
      
      .script-author {
        color: #4a90e2;
        font-size: 12px;
      }
    }
    
    .script-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 8px;
      
      span {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        background: #333;
        color: #ccc;
      }
    }
    
    .description {
      color: #ccc;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .script-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stat-label {
        color: #ccc;
        font-size: 11px;
      }
      
      .stat-value {
        font-weight: bold;
        font-size: 14px;
        
        &.usage {
          color: #27ae60;
        }
        
        &.likes {
          color: #e74c3c;
        }
        
        &.score {
          color: #f39c12;
        }
      }
    }
  }
  
  .script-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      
      &.use-btn {
        background: #27ae60;
        color: #fff;
        
        &:hover {
          background: #229954;
        }
      }
      
      &.like-btn {
        background: #e74c3c;
        color: #fff;
        
        &:hover {
          background: #c0392b;
        }
      }
      
      &.view-btn {
        background: #4a90e2;
        color: #fff;
        
        &:hover {
          background: #357abd;
        }
      }
    }
  }
}
</style> 