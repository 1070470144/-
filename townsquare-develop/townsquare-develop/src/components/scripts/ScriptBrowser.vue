<template>
  <div class="script-browser-backdrop" @click="closeBrowser">
    <div class="script-browser-modal" @click.stop>
      <div class="script-header">
        <h2>剧本浏览</h2>
        <button @click="closeBrowser" class="close-btn">×</button>
      </div>

      <div class="script-tabs">
        <button
          @click="switchTab('all')"
          :class="{ active: currentTab === 'all' }"
          class="tab-btn"
        >
          全部剧本
        </button>
        <button
          v-if="isLoggedIn"
          @click="switchTab('my')"
          :class="{ active: currentTab === 'my' }"
          class="tab-btn"
        >
          我的上传
        </button>
        <button
          v-if="isLoggedIn && isAdmin"
          @click="switchTab('admin')"
          :class="{ active: currentTab === 'admin' }"
          class="tab-btn admin-tab"
        >
          <span class="admin-icon">⚙️</span>
          管理员
        </button>
      </div>

      <div class="script-content">
        <!-- 非管理员标签页显示搜索过滤器和剧本列表 -->
        <div v-if="currentTab !== 'admin'">
          <div class="content-header">
            <div class="search-filters">
              <div class="search-box">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索剧本..."
                  @input="debounceSearch"
                />
              </div>

              <div class="filter-options">
                <select v-model="selectedCategory" @change="filterScripts" :disabled="isLoadingCategories">
                  <option value="all">全部分类</option>
                  <option 
                    v-for="category in activeCategories" 
                    :key="category.id" 
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>

                <select v-model="sortBy" @change="filterScripts">
                  <option value="name">按名称</option>
                  <option value="likes">按点赞</option>
                  <option value="usage">按使用</option>
                  <option value="date">按日期</option>
                </select>
              </div>
            </div>

            <div class="header-actions">
              <button @click="showRanking = true" class="action-btn ranking-btn">
                排行榜
              </button>
              <button
                v-if="isLoggedIn"
                @click="showUploadModal = true"
                class="action-btn upload-btn"
              >
                上传剧本
              </button>
              <button
                @click="showLoginModal = true"
                v-if="!isLoggedIn"
                class="action-btn login-btn"
              >
                登录
              </button>
              <div v-else class="user-info">
                <span class="username" :class="{ 'admin-user': isAdmin }">
                  {{ currentUser.username }}
                  <span v-if="isAdmin" class="admin-badge">管理员</span>
                </span>
                <button @click="logout" class="action-btn logout-btn">
                  登出
                </button>
              </div>
            </div>
          </div>

          <!-- 剧本列表 -->
          <div class="scripts-container">
            <div class="scripts-grid" :key="currentTab">
              <!-- 骨架屏 - 只在首次加载时显示 -->
              <ScriptSkeleton v-if="isLoading" :count="6" />

              <!-- 标签页切换时的轻量加载指示 -->
              <div v-if="isTabLoading" class="tab-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>

              <!-- 剧本卡片 -->
              <div
                v-for="script in scripts"
                :key="script.id"
                class="script-card"
                @click="viewScript(script)"
              >
                <!-- 图片轮播区域 -->
                <div class="script-card-images" v-if="script.images && script.images.length > 0">
                  <ImageCarousel 
                    :images="script.images"
                    :scriptId="script.id"
                    :autoPlay="true"
                    :interval="4000"
                  />
                </div>

                <div class="script-card-header">
                  <h3>{{ script.name }}</h3>
                  <div class="script-meta">
                    <span class="author">{{ script.author || "未知作者" }}</span>
                    <span class="category">{{
                      getCategoryName(script.category)
                    }}</span>
                    <!-- 审核状态显示 -->
                    <span
                      v-if="currentTab === 'my'"
                      :class="['status', `status-${script.status}`]"
                    >
                      {{ getStatusText(script.status) }}
                    </span>
                    <!-- 拒绝原因显示 -->
                    <div v-if="currentTab === 'my' && script.status === 'rejected' && script.reviewNote" class="reject-reason">
                      <span class="reason-label">拒绝原因:</span>
                      <span class="reason-text">{{ script.reviewNote }}</span>
                    </div>
                  </div>
                </div>

                <div class="script-card-info" v-if="!script.images || script.images.length === 0">
                  <p class="description">
                    {{ script.description || "暂无描述" }}
                  </p>
                  <div class="stats">
                    <span class="roles"
                      >{{ script.roles?.length || 0 }} 个角色</span
                    >
                    <span class="level">{{
                      script.level || "Intermediate"
                    }}</span>
                  </div>
                </div>

                <div class="script-card-actions">
                  <button
                    @click.stop="useScript(script)"
                    class="action-btn use-btn"
                    :disabled="script.status !== 'approved'"
                  >
                    {{ script.status === "approved" ? "使用剧本" : "等待审核" }}
                  </button>
                  <button
                    v-if="isLoggedIn && script.status === 'approved'"
                    @click.stop="toggleLike(script)"
                    class="action-btn like-btn"
                    :class="{ liked: script.isLiked }"
                  >
                    ❤️ {{ script.likes || 0 }}
                  </button>
                  <!-- 我的上传标签页显示图片管理按钮 -->
                  <button
                    v-if="currentTab === 'my'"
                    @click.stop="manageImages(script)"
                    class="action-btn image-btn"
                  >
                    图片管理
                  </button>
                </div>
              </div>

              <!-- 加载更多按钮 -->
              <div v-if="hasMore && !isLoadingMore" class="load-more">
                <button @click="loadMore" class="load-more-btn">
                  加载更多
                </button>
              </div>

              <!-- 没有更多数据提示 -->
              <div v-if="!hasMore && scripts.length > 0" class="no-more">
                没有更多剧本了
              </div>

              <!-- 空状态 -->
              <div v-if="scripts.length === 0 && !isLoading && !isTabLoading" class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>暂无剧本</h3>
                <p v-if="currentTab === 'all'">还没有剧本，快来上传第一个吧！</p>
                <p v-else-if="currentTab === 'my'">您还没有上传过剧本</p>
                <button
                  v-if="currentTab === 'all' && isLoggedIn"
                  @click="showUploadModal = true"
                  class="upload-btn"
                >
                  上传剧本
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理员标签页显示管理员面板 -->
        <div v-if="currentTab === 'admin'">
          <EmbeddedAdminPanel />
        </div>
      </div>

      <!-- 登录模态框 -->
      <LoginModal
        v-if="showLoginModal"
        @close="showLoginModal = false"
        @login-success="handleLoginSuccess"
        @register-success="handleRegisterSuccess"
      />

      <!-- 上传模态框 -->
      <ScriptUploadModal
        v-if="showUploadModal"
        @close="showUploadModal = false"
        @upload-success="handleUploadSuccess"
      />

      <!-- 排行榜模态框 -->
      <div
        v-if="showRanking"
        class="ranking-modal-backdrop"
        @click="showRanking = false"
      >
        <div class="ranking-modal" @click.stop>
          <div class="modal-header">
            <h3>剧本排行榜</h3>
            <button @click="showRanking = false" class="close-btn">
              &times;
            </button>
          </div>
          <div class="modal-content">
            <ScriptRanking />
          </div>
        </div>
      </div>

      <!-- 图片管理模态框 -->
      <ImageManagementModal
        v-if="showImageManagementModal && selectedScriptForImageManagement"
        :script="selectedScriptForImageManagement"
        @close="closeImageManagementModal"
        @images-updated="handleImagesUpdated"
      />

      <!-- 剧本详情模态框 -->
      <ScriptDetailModal
        v-if="showDetailModal"
        :show="showDetailModal"
        :scriptId="selectedScript ? selectedScript.id : ''"
        @close="closeDetailModal"
        @switch-version="switchToVersion"
      />
    </div>
  </div>
</template>

<script>
import LoginModal from "@/components/auth/LoginModal";
import ScriptUploadModal from "@/components/scripts/ScriptUploadModal";
import ScriptRanking from "@/components/scripts/ScriptRanking";
import ScriptSkeleton from "@/components/scripts/ScriptSkeleton";
import EmbeddedAdminPanel from "@/components/scripts/EmbeddedAdminPanel";
import ScriptDetailModal from "@/components/scripts/ScriptDetailModal";
import authAPI from "@/utils/authAPI";
import scriptAPI from "@/utils/scriptAPI";
import systemAPI from "@/utils/systemAPI";
import ImageCarousel from "@/components/scripts/ImageCarousel";
import ImageManagementModal from "@/components/scripts/ImageManagementModal";

export default {
  name: "ScriptBrowser",
  components: {
    LoginModal,
    ScriptUploadModal,
    ScriptRanking,
    ScriptSkeleton,
    EmbeddedAdminPanel,
    ScriptDetailModal,
    ImageCarousel,
    ImageManagementModal,
  },
  data() {
    return {
      scripts: [],
      filteredScripts: [],
      searchQuery: "",
      selectedCategory: "all",
      sortBy: "name",
      currentPage: 1,
      itemsPerPage: 20,
      showLoginModal: false,
      showUploadModal: false,
      showRanking: false,
      showImageManagementModal: false,
      selectedScriptForImageManagement: null,
      showDetailModal: false,
      selectedScript: null,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      pagination: null,
      filters: null,
      searchTimer: null,
      currentTab: "all", // 当前标签页
      isTabLoading: false, // 标签页切换时的加载状态
      cachedScripts: {
        // 缓存不同标签页的数据
        all: [],
        my: [],
      },
      // 添加响应式状态
      isLoggedIn: authAPI.isLoggedIn(),
      currentUser: authAPI.getCurrentUser(),
      categories: [],
      isLoadingCategories: false,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredScripts.length / this.itemsPerPage);
    },
    isAdmin() {
      return this.currentUser && this.currentUser.role === "admin";
    },
    // 检查当前标签页是否需要管理员权限
    requiresAdminPermission() {
      return this.currentTab === "admin";
    },
    // 检查当前标签页是否需要登录
    requiresLogin() {
      return this.currentTab === "my" || this.currentTab === "admin";
    },
    activeCategories() {
      return this.categories.filter(category => category.isActive);
    },
  },
  async mounted() {
    // 清除缓存
    this.clearCache();
    
    // 初始化响应式状态
    this.isLoggedIn = authAPI.isLoggedIn();
    this.currentUser = authAPI.getCurrentUser();

    await this.loadCategories();
    await this.loadScripts();

    // 使用authAPI的监听机制
    this.authListener = (user, token) => {
      this.handleAuthStateChange(user, token);
    };

    authAPI.addListener(this.authListener);
  },

  beforeDestroy() {
    // 清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    // 移除authAPI监听器
    if (this.authListener) {
      authAPI.removeListener(this.authListener);
    }
  },
  methods: {
    async loadScripts(reset = true) {
      try {
        if (reset) {
          // 只在首次加载时显示骨架屏
          if (this.scripts.length === 0) {
            this.isLoading = true;
          } else {
            this.isTabLoading = true;
          }
          this.currentPage = 1;
          // 延迟清空scripts，避免闪烁
          if (this.scripts.length > 0) {
            setTimeout(() => {
              this.scripts = [];
            }, 50);
          } else {
            this.scripts = [];
          }
        } else {
          this.isLoadingMore = true;
        }

        const params = {
          page: this.currentPage,
          limit: this.itemsPerPage,
          category: this.selectedCategory,
          search: this.searchQuery,
          sortBy: this.sortBy,
          status: this.currentTab === "all" ? "approved" : "all", // 全部剧本只显示已审核的
          userId: this.currentTab === "my" ? this.currentUser?.id : "", // 我的上传显示用户自己的
        };

        const result = await scriptAPI.getAllScripts(params);

        if (result && result.data && result.data.scripts) {
          let scripts = result.data.scripts;
          
          // 加载每个剧本的图片数据
          if (reset) {
            await this.loadScriptImages(scripts);
            this.scripts = scripts;
            // 缓存当前标签页的数据
            this.cachedScripts[this.currentTab] = [...scripts];
          } else {
            await this.loadScriptImages(result.data.scripts);
            this.scripts = [...this.scripts, ...result.data.scripts];
            // 更新缓存
            this.cachedScripts[this.currentTab] = [...this.scripts];
          }

          this.pagination = result.data.pagination;
          this.filters = result.data.filters;
          this.hasMore = result.data.pagination.hasNext;
        } else if (result && result.scripts) {
          // 兼容旧的数据结构
          let scripts = result.scripts;
          
          // 加载每个剧本的图片数据
          if (reset) {
            await this.loadScriptImages(scripts);
            this.scripts = scripts;
            this.cachedScripts[this.currentTab] = [...scripts];
          } else {
            await this.loadScriptImages(result.scripts);
            this.scripts = [...this.scripts, ...result.scripts];
            this.cachedScripts[this.currentTab] = [...this.scripts];
          }

          this.pagination = result.pagination;
          this.filters = result.filters;
          this.hasMore = result.pagination.hasNext;
        } else {
          if (reset) {
            this.scripts = [];
            this.cachedScripts[this.currentTab] = [];
          }
        }
      } catch (error) {
        if (reset) {
          this.scripts = [];
          this.cachedScripts[this.currentTab] = [];
        }
      } finally {
        this.isLoading = false;
        this.isLoadingMore = false;
        this.isTabLoading = false;
      }
    },

    async loadScriptImages(scripts) {
      // 并行加载所有剧本的图片数据
      const imagePromises = scripts.map(async (script) => {
        try {
          const result = await scriptAPI.getScriptImages(script.id);
          if (result.success && result.data && result.data.images) {
            script.images = result.data.images;
          } else {
            script.images = [];
          }
        } catch (error) {
          console.error(`加载剧本 ${script.id} 的图片失败:`, error);
          script.images = [];
        }
      });

      await Promise.all(imagePromises);
    },

    manageImages(script) {
      // 打开图片管理模态框
      this.selectedScriptForImageManagement = script;
      this.showImageManagementModal = true;
    },

    closeImageManagementModal() {
      this.showImageManagementModal = false;
      this.selectedScriptForImageManagement = null;
    },

    handleImagesUpdated() {
      // 图片更新后刷新当前剧本列表
      this.loadScripts();
    },

    closeDetailModal() {
      this.showDetailModal = false;
      this.selectedScript = null;
    },

    switchToVersion(scriptId) {
      // 切换到新版本的剧本
      this.selectedScript = { id: scriptId };
      this.refreshData();
    },

    async loadCategories() {
      try {
        this.isLoadingCategories = true;
        const result = await systemAPI.getCategories();
        if (result.success) {
          this.categories = result.data.categories || [];
        } else {
          console.error('加载分类失败:', result.error);
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      } finally {
        this.isLoadingCategories = false;
      }
    },

    async filterScripts() {
      // 重置分页并重新加载
      this.currentPage = 1;
      this.scripts = [];
      await this.loadScripts(true);
    },

    debounceSearch() {
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      // 设置新的定时器，500ms后执行搜索
      this.searchTimer = setTimeout(() => {
        this.filterScripts();
      }, 500);
    },

    async switchTab(tab) {
      if (this.currentTab === tab) return;

      // 验证访问权限
      if (!this.validateTabAccess(tab)) {
        return;
      }

      // 管理员标签页不需要加载剧本数据
      if (tab === "admin") {
        this.currentTab = tab;
        return;
      }

      // 强制清除缓存，重新加载数据
      this.cachedScripts[tab] = [];
      
      this.currentTab = tab;
      this.currentPage = 1;
      this.scripts = [];
      await this.loadScripts(true);
    },
    
    clearCache() {
      this.cachedScripts = {
        all: [],
        my: [],
        admin: []
      };
      
      // 清除本地存储缓存
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('script_detail_')) {
            localStorage.removeItem(key)
          }
        })
        console.log('已清除所有缓存')
      } catch (error) {
        console.error('清除缓存失败:', error)
      }
    },

    async loadMore() {
      if (this.isLoadingMore || !this.hasMore) return;

      this.currentPage++;
      await this.loadScripts(false);
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    viewScript(script) {
      // 查看剧本详情
      this.selectedScript = script;
      this.showDetailModal = true;
    },

    async useScript(script) {
      try {
        // 记录使用次数
        await scriptAPI.useScript(script.id);

        // 跳转到游戏页面
        this.$router.push({
          name: "game",
          query: { script: script.id },
        });
      } catch (error) {
        console.error("使用剧本失败:", error);
      }
    },

    async toggleLike(script) {
      if (!this.canPerformAction("like")) {
        this.showLoginModal = true;
        return;
      }

      try {
        const result = await scriptAPI.toggleLike(script.id);
        if (result.success) {
          script.isLiked = !script.isLiked;
          script.likes = result.likes;
        }
      } catch (error) {
        console.error("点赞失败:", error);
      }
    },

    async handleLoginSuccess(user) {
      // 先更新响应式数据
      this.isLoggedIn = true;
      this.currentUser = user;

      // 等待DOM更新完成
      await this.$nextTick();

      // 关闭模态框
      this.showLoginModal = false;

      // 等待模态框关闭动画完成后再刷新数据
      setTimeout(() => {
        this.refreshData();
      }, 150); // 给模态框关闭动画留出时间
    },

    async handleRegisterSuccess(user) {
      // 先更新响应式数据
      this.isLoggedIn = true;
      this.currentUser = user;

      // 等待DOM更新完成
      await this.$nextTick();

      // 关闭模态框
      this.showLoginModal = false;

      // 等待模态框关闭动画完成后再刷新数据
      setTimeout(() => {
        this.refreshData();
      }, 150); // 给模态框关闭动画留出时间
    },

    async handleUploadSuccess() {
      this.showUploadModal = false;

      // 上传成功后自动切换到"我的上传"标签
      if (this.isLoggedIn) {
        await this.switchTab("my");
      } else {
        await this.loadScripts();
      }
    },

    async logout() {
      await authAPI.logout();

      // 更新响应式数据
      this.isLoggedIn = false;
      this.currentUser = null;

      // 退出后刷新数据
      this.$nextTick(() => {
        this.refreshData();
      });
    },

    closeBrowser() {
      this.$emit("close");
    },

    getCategoryName(category) {
      const categoryNames = {
        official: "官方剧本",
        custom: "自制剧本",
        mixed: "混合剧本",
        event: "节日活动",
        overseas: "海外剧本",
      };
      return categoryNames[category] || "未知分类";
    },

    getStatusText(status) {
      const statusNames = {
        pending: "待审核",
        approved: "已通过",
        rejected: "已拒绝",
      };
      return statusNames[status] || "未知状态";
    },

    handleAuthStateChange(user, token) {
      console.log("🔄 认证状态变化:", {
        userId: user?.id,
        isLoggedIn: !!token,
        role: user?.role,
      });

      // 保存旧的登录状态用于比较
      const wasLoggedIn = this.isLoggedIn;
      const wasAdmin = this.isAdmin;

      // 更新响应式数据
      this.isLoggedIn = !!token;
      this.currentUser = user;

      // 强制更新组件以确保响应式数据变化
      this.$forceUpdate();

      // 检查登录状态是否发生变化
      const isNowLoggedIn = !!token;
      const isNowAdmin = this.isAdmin;

      if (wasLoggedIn !== isNowLoggedIn || wasAdmin !== isNowAdmin) {
        // 如果用户登出且当前在需要登录的标签页，切换到全部剧本
        if (!isNowLoggedIn && this.requiresLogin) {
          this.currentTab = "all";
        }

        // 如果用户权限变化且当前在管理员标签页但无权限，切换到全部剧本
        if (this.currentTab === "admin" && !isNowAdmin) {
          this.currentTab = "all";
        }

        this.refreshData();
      }
    },

    // 验证用户是否有权限访问当前标签页
    validateTabAccess(tab) {
      // 检查登录权限
      if ((tab === "my" || tab === "admin") && !this.isLoggedIn) {
        this.showErrorMessage("请先登录后再访问此功能");
        this.showLoginModal = true;
        return false;
      }

      // 检查管理员权限
      if (tab === "admin" && !this.isAdmin) {
        this.showErrorMessage("需要管理员权限才能访问此功能");
        return false;
      }

      return true;
    },

    // 检查当前用户是否有权限执行操作
    canPerformAction(action) {
      switch (action) {
        case "upload":
          return this.isLoggedIn;
        case "like":
          return this.isLoggedIn;
        case "admin":
          return this.isAdmin;
        default:
          return true;
      }
    },

    // 显示用户友好的错误消息
    showErrorMessage(message, type = "error") {
      const alertClass = type === "error" ? "error-alert" : "success-alert";
      const alert = document.createElement("div");
      alert.className = `user-alert ${alertClass}`;
      alert.textContent = message;

      document.body.appendChild(alert);

      // 3秒后自动移除
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 3000);
    },

    // 显示成功消息
    showSuccessMessage(message) {
      this.showErrorMessage(message, "success");
    },

    async refreshData() {
      // 如果当前在需要登录的标签页且用户未登录，切换到"全部剧本"
      if (this.requiresLogin && !this.isLoggedIn) {
        this.currentTab = "all";
      }

      // 如果当前在管理员标签页且用户无管理员权限，切换到"全部剧本"
      if (this.requiresAdminPermission && !this.isAdmin) {
        this.currentTab = "all";
      }

      // 管理员标签页不需要加载剧本数据
      if (this.currentTab === "admin") {
        return;
      }

      // 重新加载分类和当前标签页数据
      this.currentPage = 1;

      try {
        await this.loadCategories();
        await this.loadScripts(true);
      } catch (error) {
        console.error("❌ 刷新剧本数据失败:", error);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.script-browser-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.script-browser-modal {
  position: relative;
  width: 90vw;
  max-width: 1200px;
  height: 85vh;
  background: linear-gradient(
    135deg,
    rgba(20, 20, 20, 0.95),
    rgba(40, 40, 40, 0.95)
  );
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Papyrus", serif;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 215, 0, 0.05) 50%,
      transparent 70%
    );
    pointer-events: none;
  }

  .script-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background: linear-gradient(
      90deg,
      rgba(255, 215, 0, 0.1),
      rgba(255, 215, 0, 0.05)
    );
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);

    h2 {
      color: #ffd700;
      margin: 0;
      font-size: 24px;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }

    .close-btn {
      background: none;
      border: none;
      color: #ffd700;
      font-size: 24px;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 215, 0, 0.1);
        transform: scale(1.1);
      }
    }
  }

  .script-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);

    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      padding: 15px 20px;
      font-family: "Papyrus", serif;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        color: #ffd700;
        background: rgba(255, 215, 0, 0.05);
      }

      &.active {
        color: #ffd700;
        background: rgba(255, 215, 0, 0.1);

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ffd700, rgba(255, 215, 0, 0.6));
        }
      }
    }
  }

  .script-content {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.02);

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 215, 0, 0.3);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 215, 0, 0.5);
      }
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding: 20px 0;
      border-bottom: 1px solid rgba(255, 215, 0, 0.2);

      .search-filters {
        display: flex;
        gap: 15px;
        align-items: center;

        .search-box {
          input {
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
            width: 250px;

            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }

            &:focus {
              outline: none;
              border-color: #ffd700;
              box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
          }
        }

        .filter-options {
          display: flex;
          gap: 10px;

          select {
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;

            &:focus {
              outline: none;
              border-color: #ffd700;
            }

            option {
              background: #2a2a2a;
              color: #fff;
            }
          }
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;

        .action-btn {
          background: rgba(255, 215, 0, 0.15);
          border: 1px solid rgba(255, 215, 0, 0.4);
          color: #ffd700;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-family: "Papyrus", serif;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

          &:hover {
            background: rgba(255, 215, 0, 0.25);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          &:active {
            transform: translateY(0);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0; // 允许flex项目收缩

          .username {
            color: #ffd700;
            font-size: 14px;
            font-weight: bold;
            min-width: 0; // 允许文本收缩
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 150px; // 限制最大宽度
          }

          .logout-btn {
            flex-shrink: 0; // 防止按钮收缩
          }
        }
      }
    }
  }

  .scripts-container {
    .scripts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .script-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1);
        border-color: rgba(255, 215, 0, 0.4);
      }

      .script-card-images {
        margin-bottom: 15px;
        border-radius: 8px;
        overflow: hidden;
      }

      .script-card-header {
        margin-bottom: 15px;

        h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 18px;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }

        .script-meta {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);

          .author {
            color: #4a90e2;
          }

          .category {
            color: #ffd700;
          }

          .status {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 3px;

            &.status-pending {
              background: #ffa500;
              color: #000;
            }

            &.status-approved {
              background: #4caf50;
              color: #fff;
            }

            &.status-rejected {
              background: #f44336;
              color: #fff;
            }
          }
          
          .reject-reason {
            margin-top: 8px;
            padding: 8px;
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            border-radius: 4px;
            
            .reason-label {
              font-size: 11px;
              color: #e74c3c;
              font-weight: bold;
              margin-right: 5px;
            }
            
            .reason-text {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              line-height: 1.3;
            }
          }
        }
      }

      .script-card-info {
        margin-bottom: 15px;

        .description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 10px;
        }

        .stats {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);

          .roles {
            color: #4a90e2;
          }

          .level {
            color: #ffd700;
          }
        }
      }

      .script-card-actions {
        display: flex;
        gap: 10px;
        align-items: center;

        .action-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;

          &.use-btn {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.4);
            color: #4caf50;

            &:hover {
              background: rgba(76, 175, 80, 0.3);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }

          &.like-btn {
            background: rgba(255, 215, 0, 0.15);
            border: 1px solid rgba(255, 215, 0, 0.3);
            color: #ffd700;

            &:hover {
              background: rgba(255, 215, 0, 0.25);
            }

            &.liked {
              background: rgba(255, 215, 0, 0.3);
              color: white;
            }

            .like-count {
              margin-left: 5px;
              font-weight: bold;
            }
          }

          &.image-btn {
            background: rgba(255, 193, 7, 0.2);
            border: 1px solid rgba(255, 193, 7, 0.4);
            color: #ffc107;

            &:hover {
              background: rgba(255, 193, 7, 0.3);
            }
          }
        }

        .login-tip,
        .status-tip {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .load-more {
      text-align: center;
      margin-top: 30px;

      .load-more-btn {
        background: rgba(255, 215, 0, 0.15);
        border: 1px solid rgba(255, 215, 0, 0.4);
        color: #ffd700;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-family: "Papyrus", serif;
        font-size: 14px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 215, 0, 0.25);
          color: white;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .no-more {
      text-align: center;
      margin-top: 30px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
    }

    .empty-state {
      text-align: center;
      margin-top: 50px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 16px;
    }
  }

  .tab-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 215, 0, 0.3);
      border-top: 2px solid #ffd700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to,
.fade-leave {
  opacity: 1;
  transform: translateY(0);
}

.ranking-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.ranking-modal {
  background: linear-gradient(
    135deg,
    rgba(20, 20, 20, 0.95),
    rgba(40, 40, 40, 0.95)
  );
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  padding: 20px;
  min-width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #ffd700;
      font-size: 18px;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }

    .close-btn {
      background: none;
      border: none;
      color: #ffd700;
      font-size: 24px;
      cursor: pointer;

      &:hover {
        color: white;
      }
    }
  }

  .modal-content {
    max-height: calc(90vh - 80px);
    overflow-y: auto;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

.admin-content-area {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.admin-tab {
  position: relative;

  .admin-icon {
    margin-right: 5px;
    font-size: 12px;
  }

  &::before {
    content: "";
    position: absolute;
    top: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    background: #ffd700;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.2),
      rgba(255, 215, 0, 0.1)
    );
    border: 1px solid rgba(255, 215, 0, 0.4);
  }
}

.admin-user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  .admin-badge {
    background: #ffd700;
    color: #000;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
}

.user-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  font-family: "Papyrus", serif;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;

  &.error-alert {
    background: rgba(220, 53, 69, 0.9);
    color: white;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  &.success-alert {
    background: rgba(40, 167, 69, 0.9);
    color: white;
    border: 1px solid rgba(40, 167, 69, 0.3);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
