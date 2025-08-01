<template>
  <div class="script-management-panel">
    <!-- 管理面板头部 -->
    <div class="panel-header">
      <h2>剧本管理</h2>
      <div class="header-actions">
        <button @click="refreshData" class="action-btn refresh-btn">
          🔄 刷新
        </button>
        <button @click="showUploadModal = true" class="action-btn upload-btn">
          📤 上传剧本
        </button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filters-section">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索剧本名称或作者..."
          @input="debounceSearch"
        />
      </div>
      
      <div class="filter-options">
        <select v-model="statusFilter" @change="filterScripts">
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
        
        <select v-model="categoryFilter" @change="filterScripts">
          <option value="all">全部分类</option>
          <option 
            v-for="category in categories" 
            :key="category.id" 
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        
        <select v-model="seriesFilter" @change="filterScripts">
          <option value="all">全部系列</option>
          <option value="standalone">独立剧本</option>
          <option 
            v-for="series in seriesList" 
            :key="series.id" 
            :value="series.id"
          >
            {{ series.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 剧本列表 -->
    <div class="scripts-container">
      <div class="scripts-grid">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <!-- 空状态 -->
        <div v-if="!isLoading && filteredScripts.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>暂无剧本</h3>
          <p>没有找到符合条件的剧本</p>
        </div>

        <!-- 剧本卡片 -->
        <div
          v-for="script in filteredScripts"
          :key="script.id"
          class="script-card"
        >
          <!-- 图片轮播 -->
          <div class="script-card-images" v-if="script.images && script.images.length > 0">
            <ImageCarousel 
              :images="script.images"
              :scriptId="script.id"
              :autoPlay="true"
              :interval="4000"
            />
          </div>

          <div class="script-card-content">
            <div class="script-header">
              <h3 class="script-name">{{ script.name }}</h3>
              <div class="script-meta">
                <span class="author">作者: {{ script.author || '未知' }}</span>
                <span class="category">{{ getCategoryName(script.category) }}</span>
                <span :class="['status', `status-${script.status}`]">
                  {{ getStatusText(script.status) }}
                </span>
              </div>
            </div>

            <div class="script-info" v-if="!script.images || script.images.length === 0">
              <p class="description">{{ script.description || '暂无描述' }}</p>
              <div class="stats">
                <span class="roles">{{ script.roles?.length || 0 }} 个角色</span>
                <span class="level">{{ script.level || 'Intermediate' }}</span>
              </div>
            </div>

            <!-- 系列信息 -->
            <div v-if="script.series" class="series-info">
              <span class="series-name">{{ script.series.name }}</span>
              <span class="version">v{{ script.version }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="script-actions">
              <button @click="viewScript(script)" class="action-btn view-btn">
                👁️ 查看详情
              </button>
              
              <button @click="editScript(script)" class="action-btn edit-btn">
                ✏️ 编辑
              </button>
              
              <button @click="deleteScript(script)" class="action-btn delete-btn">
                🗑️ 删除
              </button>
              
              <!-- 状态显示 -->
              <div class="status-display">
                <span class="status-badge" :class="script.status">
                  {{ getStatusText(script.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 剧本详情模态框 -->
    <ScriptDetailModal
      v-if="showDetailModal"
      :show="showDetailModal"
      :scriptId="selectedScript ? selectedScript.id : ''"
      @close="closeDetailModal"
      @switch-version="switchToVersion"
    />

    <!-- 剧本编辑模态框 -->
    <ScriptEditModal
      v-if="showEditModal"
      :show="showEditModal"
      :script="selectedScript"
      @close="closeEditModal"
      @save="handleScriptSave"
    />

    <!-- 上传模态框 -->
    <ScriptUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script>
import ImageCarousel from './ImageCarousel.vue'
import ScriptDetailModal from './ScriptDetailModal.vue'
import ScriptEditModal from './ScriptEditModal.vue'
import ScriptUploadModal from './ScriptUploadModal.vue'
import scriptAPI from '@/utils/scriptAPI'
import systemAPI from '@/utils/systemAPI'

export default {
  name: 'ScriptManagementPanel',
  components: {
    ImageCarousel,
    ScriptDetailModal,
    ScriptEditModal,
    ScriptUploadModal
  },
  data() {
    return {
      scripts: [],
      filteredScripts: [],
      categories: [],
      seriesList: [],
      searchQuery: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      seriesFilter: 'all',
      isLoading: false,
      searchTimer: null,
      
      // 模态框状态
      showDetailModal: false,
      showEditModal: false,
      showUploadModal: false,
      selectedScript: null
    }
  },
  computed: {
    // 状态文本映射
    statusTextMap() {
      return {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      }
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        this.isLoading = true
        
        // 并行加载数据
        const [scriptsResult, categoriesResult, seriesResult, statusResult] = await Promise.all([
          scriptAPI.getAllScripts(),
          systemAPI.getCategories(),
          scriptAPI.getScriptSeries(),
          scriptAPI.getAllStatus()
        ])
        
        if (scriptsResult.success) {
          // 服务器返回的是扁平化的剧本数组，剧本管理显示所有用户上传的剧本
          const scripts = scriptsResult.data.scripts || []
          // 只显示用户上传的剧本（custom和official类型）
          this.scripts = scripts.filter(script => 
            script.type === 'custom' || script.type === 'official'
          )
        }
        
        if (categoriesResult.success) {
          this.categories = categoriesResult.data.categories || []
        }
        
        if (seriesResult.success) {
          this.seriesList = seriesResult.data || []
        }
        
        // 合并状态信息
        if (statusResult.success) {
          const statusData = statusResult.data || {}
          console.log('状态数据:', statusData)
          console.log('状态数据类型:', typeof statusData)
          console.log('状态数据键:', Object.keys(statusData))
          
          this.scripts = this.scripts.map(script => {
            // 查找剧本状态
            let status = 'pending' // 默认状态
            let reviewNote = ''
            
            // 在系列中查找
            for (const seriesId in statusData.series) {
              const series = statusData.series[seriesId]
              if (series.versions && series.versions[script.id]) {
                status = series.versions[script.id].status
                reviewNote = series.versions[script.id].reviewNote || ''
                break
              }
            }
            
            // 在独立剧本中查找
            if (statusData.standalone && statusData.standalone[script.id]) {
              status = statusData.standalone[script.id].status
              reviewNote = statusData.standalone[script.id].reviewNote || ''
            }
            
            console.log(`剧本 ${script.id} 状态:`, { status, reviewNote })
            
            return {
              ...script,
              status,
              reviewNote
            }
          })
        } else {
          console.error('获取状态失败:', statusResult)
        }
        
        this.filterScripts()
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    filterScripts() {
      let filtered = [...this.scripts]
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(script => 
          script.name.toLowerCase().includes(query) ||
          (script.author && script.author.toLowerCase().includes(query))
        )
      }
      
      // 状态过滤
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(script => script.status === this.statusFilter)
      }
      
      // 分类过滤
      if (this.categoryFilter !== 'all') {
        filtered = filtered.filter(script => script.category === this.categoryFilter)
      }
      
      // 系列过滤
      if (this.seriesFilter !== 'all') {
        if (this.seriesFilter === 'standalone') {
          filtered = filtered.filter(script => !script.series)
        } else {
          filtered = filtered.filter(script => script.series && script.series.id === this.seriesFilter)
        }
      }
      
      this.filteredScripts = filtered
    },
    
    debounceSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.filterScripts()
      }, 300)
    },
    
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    },
    
    getStatusText(status) {
      return this.statusTextMap[status] || '未知状态'
    },
    
    // 剧本操作
    viewScript(script) {
      this.selectedScript = script
      this.showDetailModal = true
    },
    
    editScript(script) {
      console.log('编辑剧本:', script)
      this.selectedScript = script
      this.showEditModal = true
      console.log('selectedScript已设置:', this.selectedScript)
    },
    
    async deleteScript(script) {
      if (!confirm(`确定要删除剧本"${script.name}"吗？此操作不可恢复。`)) {
        return
      }
      
      try {
        // 从剧本数据中获取type，默认为custom
        const scriptType = script.type || 'custom'
        console.log(`删除剧本: id=${script.id}, type=${scriptType}`)
        
        const result = await scriptAPI.deleteScript(script.id, scriptType)
        if (result.success) {
          this.scripts = this.scripts.filter(s => s.id !== script.id)
          this.filterScripts()
          alert('剧本删除成功')
        } else {
          alert(`删除失败: ${result.error}`)
        }
      } catch (error) {
        console.error('删除剧本失败:', error)
        alert('删除剧本失败')
      }
    },
    

    
    // 模态框控制
    closeDetailModal() {
      this.showDetailModal = false
      this.selectedScript = null
    },
    
    closeEditModal() {
      this.showEditModal = false
      this.selectedScript = null
    },
    
    async handleScriptSave(updatedScript) {
      try {
        const result = await scriptAPI.updateScript(updatedScript.id, updatedScript)
        if (result.success) {
          // 重新加载数据以确保状态同步
          await this.loadData()
          this.closeEditModal()
          alert('剧本更新成功')
        } else {
          alert(`更新失败: ${result.error}`)
        }
      } catch (error) {
        console.error('更新剧本失败:', error)
        alert('更新剧本失败')
      }
    },
    
    async handleUploadSuccess() {
      this.showUploadModal = false
      await this.loadData()
    },
    
    switchToVersion(scriptId) {
      this.selectedScript = { id: scriptId }
      this.refreshData()
    },
    
    refreshData() {
      this.loadData()
    }
  }
}
</script>

<style scoped>
.script-management-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.panel-header h2 {
  color: #ffd700;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.filter-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-options select {
  padding: 8px 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  min-width: 120px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-options select:hover {
  border-color: rgba(255, 215, 0, 0.5);
  background: rgba(0, 0, 0, 0.7);
}

.filter-options select:focus {
  outline: none;
  border-color: rgba(255, 215, 0, 0.8);
  background: rgba(0, 0, 0, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
}

.filter-options select option {
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 8px 12px;
}

.filter-options select option:hover {
  background: rgba(255, 215, 0, 0.2);
}

.scripts-container {
  margin-top: 20px;
}

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.script-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.script-card:hover {
  border-color: rgba(255, 215, 0, 0.4);
  transform: translateY(-2px);
}

.script-card-images {
  height: 200px;
  overflow: hidden;
}

.script-card-content {
  padding: 15px;
}

.script-header {
  margin-bottom: 10px;
}

.script-name {
  color: #ffd700;
  margin: 0 0 8px 0;
  font-size: 18px;
}

.script-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #ccc;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.status-pending {
  background: #ff9800;
  color: #fff;
}

.status-approved {
  background: #4caf50;
  color: #fff;
}

.status-rejected {
  background: #f44336;
  color: #fff;
}

.script-info {
  margin-bottom: 10px;
}

.description {
  color: #ccc;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.series-info {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.series-name {
  color: #ffd700;
}

.version {
  color: #ccc;
}

.script-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
}

.view-btn:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.edit-btn:hover {
  background: rgba(33, 150, 243, 0.2);
  border-color: rgba(33, 150, 243, 0.5);
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.5);
}

.status-display {
  margin-top: 10px;
  
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    
    &.pending {
      background: rgba(243, 156, 18, 0.2);
      color: #f39c12;
    }
    
    &.approved {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
    }
    
    &.rejected {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
    }
  }
}

.loading-state, .empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #ccc;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-top: 3px solid #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-state h3 {
  color: #ffd700;
  margin-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }
  
  .scripts-grid {
    grid-template-columns: 1fr;
  }
  
  .script-actions {
    flex-direction: column;
  }
  
  .status-actions {
    flex-direction: column;
  }
}
</style> 