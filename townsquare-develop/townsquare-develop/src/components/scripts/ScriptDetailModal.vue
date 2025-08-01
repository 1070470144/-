<template>
  <div v-if="show" class="script-detail-backdrop" @click="closeModal">
    <div class="script-detail-modal" @click.stop>
      <!-- 关闭按钮 -->
      <button @click="closeModal" class="close-btn">×</button>
      
      <!-- 图片轮播区域 -->
      <div class="images-section" v-if="scriptImages.length > 0">
        <ImageCarousel 
          :images="scriptImages"
          :scriptId="scriptId"
          :autoPlay="true"
          :interval="4000"
        />
      </div>

      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="currentTab = tab.key"
          :class="['tab-btn', { active: currentTab === tab.key }]"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 基本信息 -->
        <div v-if="currentTab === 'basic'" class="tab-panel">
          <div class="basic-info">
            <div class="script-header">
              <h2 class="script-name">{{ scriptData.name }}</h2>
              <div class="script-meta">
                <span class="author">作者: {{ scriptData.author || '未知' }}</span>
                <span class="level">难度: {{ scriptData.level || 'Intermediate' }}</span>
              </div>
            </div>
            
            <div class="script-description" v-if="scriptData.description">
              <h3>剧本介绍</h3>
              <p>{{ scriptData.description }}</p>
            </div>
          </div>
        </div>

        <!-- 角色数据 -->
        <div v-if="currentTab === 'roles'" class="tab-panel">
          <div class="roles-section">
            <div v-for="team in roleTeams" :key="team.key" class="role-team">
              <h3 class="team-title">{{ team.name }}</h3>
              <div class="roles-grid">
                <div 
                  v-for="role in team.roles" 
                  :key="role.id" 
                  class="role-card"
                >
                  <div class="role-header">
                    <img 
                      v-if="role.image" 
                      :src="role.image" 
                      :alt="role.name"
                      class="role-icon"
                    />
                    <h4 class="role-name">{{ role.name }}</h4>
                  </div>
                  <div class="role-ability">
                    <p>{{ role.ability }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 游戏规则 -->
        <div v-if="currentTab === 'rules'" class="tab-panel">
          <div class="rules-section">
            <div class="night-order">
              <h3>夜晚行动顺序</h3>
              <div class="order-lists">
                <div class="first-night">
                  <h4>首夜</h4>
                  <ol>
                    <li v-for="role in firstNightRoles" :key="role.id">
                      {{ role.name }} - {{ role.firstNightReminder }}
                    </li>
                  </ol>
                </div>
                <div class="other-nights">
                  <h4>其他夜晚</h4>
                  <ol>
                    <li v-for="role in otherNightRoles" :key="role.id">
                      {{ role.name }} - {{ role.otherNightReminder }}
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系列版本 -->
        <div v-if="currentTab === 'series'" class="tab-panel">
          <div class="series-section">
            <h3>系列版本</h3>
            <div class="series-list" v-if="seriesVersions.length > 0">
              <div 
                v-for="version in seriesVersions" 
                :key="version.id"
                class="version-item"
                :class="{ 'current': version.id === scriptId }"
                @click="switchToVersion(version)"
              >
                <div class="version-info">
                  <h4>{{ version.name }}</h4>
                  <span class="version-number">v{{ version.version }}</span>
                </div>
                <div class="version-status">
                  <span v-if="version.id === scriptId" class="current-badge">当前版本</span>
                </div>
              </div>
            </div>
            <div v-else class="no-series">
              <p>此剧本不属于任何系列</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="downloadImages" class="action-btn download-btn">
          📥 下载图片
        </button>
        <button @click="useScript" class="action-btn use-btn">
          🎮 使用剧本
        </button>
      </div>

      <!-- 图片下载选择模态框 -->
      <div v-if="showDownloadModal" class="download-modal-backdrop" @click="closeDownloadModal">
        <div class="download-modal" @click.stop>
          <div class="modal-header">
            <h3>选择要下载的图片</h3>
            <button @click="closeDownloadModal" class="close-btn">×</button>
          </div>
          <div class="modal-content">
            <div class="download-options">
              <label class="select-all">
                <input 
                  type="checkbox" 
                  v-model="selectAllImages"
                />
                全选
              </label>
            </div>
            <div class="image-list">
              <div 
                v-for="(image, index) in scriptImages" 
                :key="image.id"
                class="image-item"
              >
                <label class="image-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectedImages"
                    :value="image.id"
                  />
                  <span class="image-name">{{ image.title || `图片 ${index + 1}` }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeDownloadModal" class="cancel-btn">取消</button>
            <button @click="confirmDownload" class="confirm-btn" :disabled="isDownloading">
              {{ isDownloading ? '下载中...' : '下载选中图片' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 下载进度模态框 -->
      <div v-if="showProgressModal" class="progress-modal-backdrop">
        <div class="progress-modal" @click.stop>
          <div class="modal-header">
            <h3>下载进度</h3>
          </div>
          <div class="modal-content">
            <div class="progress-info">
              <p>正在下载 {{ downloadedCount }}/{{ totalCount }} 张图片</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <p class="current-file">{{ currentFileName }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageCarousel from './ImageCarousel.vue'
import scriptAPI from '@/utils/scriptAPI'

export default {
  name: 'ScriptDetailModal',
  components: {
    ImageCarousel
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    scriptId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      currentTab: 'basic',
      scriptData: {},
      scriptImages: [],
      seriesVersions: [],
      isLoading: false,
      
      // 角色类型映射
      roleTeamMap: {
        'townsfolk': '镇民',
        'outsider': '外来者',
        'minion': '爪牙',
        'demon': '恶魔',
        'fabled': '传奇角色',
        'traveler': '旅行者'
      },
      
      tabs: [
        { key: 'basic', name: '基本信息' },
        { key: 'roles', name: '角色数据' },
        { key: 'rules', name: '游戏规则' },
        { key: 'series', name: '系列版本' }
      ],

      // 图片下载相关
      showDownloadModal: false,
      selectedImages: [],
      isDownloading: false,
      downloadedCount: 0,
      totalCount: 0,
      progressPercent: 0,
      currentFileName: '',
      showProgressModal: false,
    }
  },
  computed: {
    roleTeams() {
      if (!this.scriptData.roleDetails) return []
      
      const teams = {}
      this.scriptData.roleDetails.forEach(role => {
        const teamKey = role.team || 'unknown'
        if (!teams[teamKey]) {
          teams[teamKey] = {
            key: teamKey,
            name: this.roleTeamMap[teamKey] || '其他',
            roles: []
          }
        }
        teams[teamKey].roles.push(role)
      })
      
      return Object.values(teams)
    },
    
    firstNightRoles() {
      if (!this.scriptData.roleDetails) return []
      return this.scriptData.roleDetails
        .filter(role => role.firstNight > 0)
        .sort((a, b) => a.firstNight - b.firstNight)
    },
    
    otherNightRoles() {
      if (!this.scriptData.roleDetails) return []
      return this.scriptData.roleDetails
        .filter(role => role.otherNight > 0)
        .sort((a, b) => a.otherNight - b.otherNight)
    },
    
    // 监听selectedImages变化，自动更新selectAllImages状态
    selectAllImages: {
      get() {
        return this.scriptImages.length > 0 && this.selectedImages.length === this.scriptImages.length
      },
      set(value) {
        if (value) {
          this.selectedImages = this.scriptImages.map(img => img.id)
        } else {
          this.selectedImages = []
        }
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal && this.scriptId) {
        this.loadScriptData()
      }
    },
    scriptId(newVal) {
      if (newVal && this.show) {
        this.loadScriptData()
      }
    }
  },
  methods: {
    async loadScriptData() {
      if (!this.scriptId) {
        console.log('scriptId为空，不加载数据')
        return
      }
      try {
        this.isLoading = true
        
        // 检查缓存
        const cachedData = this.getCachedData()
        if (cachedData) {
          this.scriptData = cachedData.scriptData || {}
          this.scriptImages = cachedData.scriptImages || []
          this.seriesVersions = cachedData.seriesVersions || []
        }
        
        // 并行加载剧本数据、图片、系列
        const [scriptResult, imagesResult, allSeriesResult] = await Promise.all([
          scriptAPI.getScriptById(this.scriptId),
          scriptAPI.getScriptImages(this.scriptId),
          scriptAPI.getScriptSeries() // 获取所有系列
        ])
        
        if (scriptResult.success) {
          this.scriptData = scriptResult.data
        }
        
        if (imagesResult.success) {
          this.scriptImages = imagesResult.data || []
        }
        
        // 查找当前剧本所属系列及所有版本
        if (allSeriesResult.success) {
          let found = false
          for (const series of allSeriesResult.data) {
            const version = (series.versions || []).find(v => v.id === this.scriptId)
            if (version) {
              this.seriesVersions = series.versions
              found = true
              break
            }
          }
          if (!found) {
            this.seriesVersions = []
          }
        }
        
        // 缓存数据
        this.cacheData()
        
      } catch (error) {
        console.error('加载剧本数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 缓存相关方法
    getCachedData() {
      try {
        const cacheKey = `script_detail_${this.scriptId}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          // 检查缓存是否过期（24小时）
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            return data
          }
        }
      } catch (error) {
        console.error('读取缓存失败:', error)
      }
      return null
    },
    
    cacheData() {
      try {
        const cacheKey = `script_detail_${this.scriptId}`
        const cacheData = {
          scriptData: this.scriptData,
          scriptImages: this.scriptImages,
          seriesVersions: this.seriesVersions,
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      } catch (error) {
        console.error('缓存数据失败:', error)
      }
    },
    
    clearCache() {
      try {
        // 清除所有剧本详情缓存
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('script_detail_')) {
            localStorage.removeItem(key)
          }
        })
        console.log('已清除剧本详情缓存')
      } catch (error) {
        console.error('清除缓存失败:', error)
      }
    },
    
    switchToVersion(version) {
      if (version.id === this.scriptId) return
      this.$emit('switch-version', version.id)
    },
    
    downloadImages() {
      if (this.scriptImages.length === 0) {
        alert('此剧本没有图片可下载')
        return
      }
      
      // 默认全选所有图片
      this.selectedImages = this.scriptImages.map(img => img.id)
      this.selectAllImages = true
      this.showDownloadModal = true
    },
    
    useScript() {
      alert('使用功能开发中...')
    },
    
    closeModal() {
      this.$emit('close')
    },

    // 图片下载模态框相关方法

    async confirmDownload() {
      if (this.selectedImages.length === 0) {
        alert('请至少选择一张图片进行下载')
        return
      }

      this.isDownloading = true
      this.downloadedCount = 0
      this.totalCount = this.selectedImages.length
      this.progressPercent = 0
      this.showProgressModal = true

      for (const imageId of this.selectedImages) {
        try {
          const image = this.scriptImages.find(img => img.id === imageId)
          if (!image) continue

          this.currentFileName = image.title || `图片 ${this.downloadedCount + 1}`
          
          // 构建图片URL
          const imageUrl = `${window.location.origin}/api/images/${this.scriptId}/${image.filename}`
          
          const result = await scriptAPI.downloadImage(imageUrl)
          if (result.success) {
            this.downloadedCount++
            this.progressPercent = (this.downloadedCount / this.totalCount) * 100
          } else {
            console.error('下载图片失败:', result.error)
            alert(`下载图片失败: ${result.error}`)
            this.downloadedCount++ // 继续尝试下载其他图片
            this.progressPercent = (this.downloadedCount / this.totalCount) * 100
          }
        } catch (error) {
          console.error('下载图片失败:', error)
          alert('下载图片失败，请检查网络或图片链接')
          this.downloadedCount++ // 继续尝试下载其他图片
          this.progressPercent = (this.downloadedCount / this.totalCount) * 100
        }
      }

      this.isDownloading = false
      this.showProgressModal = false
      alert('所有选中图片下载完成！')
    },

    closeDownloadModal() {
      this.showDownloadModal = false
    },

    closeProgressModal() {
      this.showProgressModal = false
    }
  }
}
</script>

<style scoped>
.script-detail-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.script-detail-modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.images-section {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.tabs-nav {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  padding: 0 20px;
}

.tab-btn {
  background: none;
  border: none;
  color: #ccc;
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  font-size: 14px;
}

.tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: #ffd700;
  border-bottom-color: #ffd700;
}

.tab-content {
  padding: 20px;
}

.tab-panel {
  min-height: 400px;
}

/* 基本信息样式 */
.basic-info {
  color: #fff;
}

.script-header {
  margin-bottom: 20px;
}

.script-name {
  font-size: 24px;
  margin: 0 0 10px 0;
  color: #ffd700;
}

.script-meta {
  display: flex;
  gap: 20px;
  color: #ccc;
  font-size: 14px;
}

.script-description {
  margin-top: 20px;
}

.script-description h3 {
  color: #ffd700;
  margin-bottom: 10px;
}

.script-description p {
  line-height: 1.6;
  color: #ccc;
}

/* 角色数据样式 */
.roles-section {
  color: #fff;
}

.role-team {
  margin-bottom: 30px;
}

.team-title {
  color: #ffd700;
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.role-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}

.role-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.4);
}

.role-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.role-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.role-name {
  color: #ffd700;
  margin: 0;
  font-size: 16px;
}

.role-ability {
  margin-bottom: 10px;
}

.role-ability p {
  color: #ccc;
  line-height: 1.5;
  margin: 0;
}

/* 游戏规则样式 */
.rules-section {
  color: #fff;
}

.night-order {
  margin-bottom: 30px;
}

.night-order h3 {
  color: #ffd700;
  margin-bottom: 15px;
}

.order-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.first-night, .other-nights {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.first-night h4, .other-nights h4 {
  color: #ffd700;
  margin-bottom: 10px;
}

.first-night ol, .other-nights ol {
  color: #ccc;
  line-height: 1.6;
  padding-left: 20px;
}

/* 系列版本样式 */
.series-section {
  color: #fff;
}

.series-section h3 {
  color: #ffd700;
  margin-bottom: 15px;
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.version-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.4);
}

.version-item.current {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.version-info h4 {
  color: #ffd700;
  margin: 0 0 5px 0;
}

.version-number {
  color: #ccc;
  font-size: 14px;
}

.version-status {
  display: flex;
  gap: 10px;
}

.current-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.no-series {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.action-btn {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.action-btn:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

.download-btn {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.3);
}

.download-btn:hover {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

/* 图片下载模态框样式 */
.download-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.download-modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  color: #ffd700;
  margin: 0;
}

.modal-content {
  padding: 20px;
}

.download-options {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.select-all {
  display: flex;
  align-items: center;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
}

.select-all input {
  margin-right: 8px;
  transform: scale(1.2);
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-checkbox input {
  transform: scale(1.2);
}

.image-name {
  color: #ccc;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.cancel-btn, .confirm-btn {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.cancel-btn:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

.confirm-btn:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

.confirm-btn:disabled {
  background: rgba(255, 215, 0, 0.1);
  color: #ccc;
  border-color: rgba(255, 215, 0, 0.2);
  cursor: not-allowed;
}

/* 下载进度模态框样式 */
.progress-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
}

.progress-modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.progress-info {
  padding: 20px;
  text-align: center;
  color: #fff;
}

.progress-info p {
  margin-bottom: 10px;
  font-size: 16px;
}

.progress-bar {
  height: 10px;
  background: #333;
  border-radius: 5px;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ffd700;
  border-radius: 5px;
  transition: width 0.3s ease-in-out;
}

.current-file {
  font-size: 14px;
  color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .script-detail-modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .tabs-nav {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    padding: 10px 15px;
    font-size: 12px;
  }
  
  .roles-grid {
    grid-template-columns: 1fr;
  }
  
  .order-lists {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style> 