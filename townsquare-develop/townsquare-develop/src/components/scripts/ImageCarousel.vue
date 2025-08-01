<template>
  <div class="image-carousel">
    <!-- 轮播容器 -->
    <div class="carousel-container" v-if="sortedImages.length > 0">
      <!-- 图片显示区域 -->
      <div class="image-container">
        <div v-if="isImageLoading" class="image-loading">
          <div class="loading-spinner"></div>
          <p>加载图片中...</p>
        </div>
        <img
          :key="`${scriptId}_${currentImage.filename}_${currentIndex}`"
          :src="currentImageUrl"
          :alt="currentImage.title"
          :class="['carousel-image', { 'clickable': enableClick }]"
          @click="enableClick ? openFullscreen() : null"
          @load="onImageLoad"
          @error="onImageError"
          v-if="!isImageLoading"
        />

        <!-- 图片标题 -->
        <div class="image-title" v-if="currentImage">
          {{ currentImage.title }}
        </div>

        <!-- 控制按钮 -->
        <div class="carousel-controls" v-if="sortedImages.length > 1">
          <button
            @click="previous"
            class="control-btn prev-btn"
            :disabled="currentIndex === 0"
          >
            ‹
          </button>
          <button
            @click="next"
            class="control-btn next-btn"
            :disabled="currentIndex === sortedImages.length - 1"
          >
            ›
          </button>
        </div>

        <!-- 指示器 -->
        <div class="carousel-indicators" v-if="sortedImages.length > 1">
          <span
            v-for="(image, index) in sortedImages"
            :key="index"
            @click="goTo(index)"
            :class="['indicator', { active: index === currentIndex }]"
          ></span>
        </div>
      </div>
    </div>

    <!-- 无图片时的占位符 -->
    <div v-else class="no-images">
      <div class="placeholder-icon">📷</div>
      <p>暂无图片</p>
    </div>

    <!-- 全屏预览模态框 -->
    <div
      v-if="showFullscreen"
      class="fullscreen-modal"
      @click="closeFullscreen"
    >
      <div class="fullscreen-content" @click.stop>
        <button class="close-btn" @click="closeFullscreen">×</button>
        <div class="fullscreen-image-container">
          <img
            :key="`fullscreen_${scriptId}_${currentImage.filename}_${currentIndex}`"
            :src="currentImageUrl"
            :alt="currentImage.title"
            class="fullscreen-image"
            @load="onFullscreenImageLoad"
            @error="onFullscreenImageError"
          />
          <div class="fullscreen-title">{{ currentImage.title }}</div>
        </div>
        <div class="fullscreen-controls" v-if="sortedImages.length > 1">
          <button @click="previous" class="control-btn prev-btn">‹</button>
          <button @click="next" class="control-btn next-btn">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageCarousel",
  props: {
    images: {
      type: Array,
      default: () => [],
    },
    scriptId: {
      type: String,
      required: true,
    },
    autoPlay: {
      type: Boolean,
      default: true,
    },
    interval: {
      type: Number,
      default: 3000,
    },
    enableClick: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      currentIndex: 0,
      showFullscreen: false,
      autoPlayTimer: null,
      isFullscreenImageLoading: true,
      isFullscreenImageError: false,
      preloadedImages: new Set(),
      isImageLoading: true, // Added for image loading state
      urlCache: new Map(), // Added for URL caching
      switchDebounceTimer: null,
      imageLoadTimeout: null
    };
  },
  computed: {
    sortedImages() {
      // 按order字段排序，如果没有order则按数组索引
      return [...this.images].sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
      });
    },
    currentImage() {
      return this.sortedImages[this.currentIndex] || null;
    },
    currentImageUrl() {
      if (!this.currentImage) return "";
      return this.getCachedImageUrl(this.currentImage.filename);
    },
  },
  watch: {
    images: {
      handler() {
        this.currentIndex = 0;
        this.startAutoPlay();
        this.preloadAllImages();
        
        // 延迟检查当前图片是否已预加载
        this.$nextTick(() => {
          setTimeout(() => {
            this.checkAndUpdateLoadingState();
          }, 100);
        });
      },
      immediate: true,
    },
  },
  mounted() {
    this.startAutoPlay();
    this.preloadAllImages();
    
    // 延迟检查预加载状态，确保预加载有机会完成
    this.$nextTick(() => {
      setTimeout(() => {
        this.checkAndUpdateLoadingState();
      }, 100);
    });
  },
  beforeDestroy() {
    this.stopAutoPlay();
    if (this.switchDebounceTimer) {
      clearTimeout(this.switchDebounceTimer);
      this.switchDebounceTimer = null;
    }
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
      this.imageLoadTimeout = null;
    }
  },
  methods: {
    next() {
      if (this.switchDebounceTimer) return;

      if (this.currentIndex < this.sortedImages.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }
      
      // 检查图片是否已预加载
      if (!this.checkAndUpdateLoadingState()) {
        this.isImageLoading = true;
        // 设置5秒超时，避免一直显示加载状态
        this.imageLoadTimeout = setTimeout(() => {
          this.isImageLoading = false;
          this.imageLoadTimeout = null;
        }, 5000);
      }

      // 防抖：300ms内不允许再次切换
      this.switchDebounceTimer = setTimeout(() => {
        this.switchDebounceTimer = null;
      }, 300);
    },
    previous() {
      if (this.switchDebounceTimer) return;

      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.sortedImages.length - 1;
      }
      
      // 检查图片是否已预加载
      if (!this.checkAndUpdateLoadingState()) {
        this.isImageLoading = true;
        // 设置5秒超时，避免一直显示加载状态
        this.imageLoadTimeout = setTimeout(() => {
          this.isImageLoading = false;
          this.imageLoadTimeout = null;
        }, 5000);
      }

      // 防抖：300ms内不允许再次切换
      this.switchDebounceTimer = setTimeout(() => {
        this.switchDebounceTimer = null;
      }, 300);
    },
    goTo(index) {
      if (this.switchDebounceTimer) return;

      this.currentIndex = index;
      
      // 检查图片是否已预加载
      if (!this.checkAndUpdateLoadingState()) {
        this.isImageLoading = true;
        // 设置5秒超时，避免一直显示加载状态
        this.imageLoadTimeout = setTimeout(() => {
          this.isImageLoading = false;
          this.imageLoadTimeout = null;
        }, 5000);
      }

      // 防抖：300ms内不允许再次切换
      this.switchDebounceTimer = setTimeout(() => {
        this.switchDebounceTimer = null;
      }, 300);
    },
    startAutoPlay() {
      if (this.autoPlay && this.sortedImages.length > 1) {
        this.stopAutoPlay();
        this.autoPlayTimer = setInterval(() => {
          this.next();
        }, this.interval);
      }
    },
    stopAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    },
    openFullscreen() {
      this.showFullscreen = true;
      this.stopAutoPlay();
    },
    closeFullscreen() {
      this.showFullscreen = false;
      this.startAutoPlay();
    },
    onImageLoad() {
      console.log('图片加载成功:', this.currentImage.filename);
      this.isImageLoading = false; // Set loading to false on successful load
      if (this.imageLoadTimeout) {
        clearTimeout(this.imageLoadTimeout);
        this.imageLoadTimeout = null;
      }
      // 只在组件初始化时启动自动播放，避免频繁重启
      if (this.autoPlay && !this.autoPlayTimer) {
        this.startAutoPlay();
      }
    },
    onImageError() {
      console.log('图片加载失败:', this.currentImage.filename);
      this.isImageLoading = false; // Set loading to false on error
      if (this.imageLoadTimeout) {
        clearTimeout(this.imageLoadTimeout);
        this.imageLoadTimeout = null;
      }
      // 图片加载失败，停止自动播放
      this.stopAutoPlay();
    },
    onFullscreenImageLoad() {
      this.isFullscreenImageLoading = false;
      this.isFullscreenImageError = false;
    },
    onFullscreenImageError() {
      this.isFullscreenImageLoading = false;
      this.isFullscreenImageError = true;
    },
    preloadImage(imageUrl) {
      if (this.preloadedImages.has(imageUrl)) return;

      const img = new Image();
      img.onload = () => {
        console.log('图片预加载成功:', imageUrl);
        this.preloadedImages.add(imageUrl);
        
        // 预加载成功后，检查并更新当前图片的加载状态
        this.checkAndUpdateLoadingState();
      };
      img.onerror = () => {
        console.log('图片预加载失败:', imageUrl);
      };
      img.src = imageUrl;
    },
    preloadAllImages() {
      this.sortedImages.forEach((image) => {
        const imageUrl = `http://localhost:8081/api/images/${this.scriptId}/${image.filename}`;
        this.preloadImage(imageUrl);
      });
    },
    getCachedImageUrl(filename) {
      const cacheKey = `${this.scriptId}_${filename}`;
      if (!this.urlCache) {
        this.urlCache = new Map();
      }
      if (!this.urlCache.has(cacheKey)) {
        const imageUrl = `http://localhost:8081/api/images/${this.scriptId}/${filename}`;
        console.log('生成图片URL:', imageUrl);
        this.urlCache.set(cacheKey, imageUrl);
      }
      return this.urlCache.get(cacheKey);
    },
    checkAndUpdateLoadingState() {
      if (this.currentImage) {
        const currentImageUrl = this.getCachedImageUrl(this.currentImage.filename);
        if (this.preloadedImages.has(currentImageUrl)) {
          console.log('检查到图片已预加载，更新加载状态');
          this.isImageLoading = false;
          return true;
        }
      }
      return false;
    },
  },
};
</script>

<style scoped lang="scss">
.image-carousel {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.carousel-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  cursor: default;
  transition: none;
  will-change: auto;
  backface-visibility: hidden;
  transform: translateZ(0);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.carousel-image.clickable {
  cursor: pointer;
}

.image-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  padding: 20px 15px 10px;
  font-size: 14px;
  text-align: center;
}

.carousel-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  pointer-events: none;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.8);
    color: #000;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.8);
  }

  &.active {
    background: rgba(255, 215, 0, 1);
  }
}

.no-images {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// 全屏预览样式
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fullscreen-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  z-index: 10000;

  &:hover {
    color: #ffd700;
  }
}

.fullscreen-image-container {
  position: relative;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  object-position: center;
  will-change: auto;
  transition: none;
  backface-visibility: hidden;
  transform: translateZ(0);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.fullscreen-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: #fff;
  padding: 20px;
  text-align: center;
  font-size: 16px;
}

.fullscreen-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;

  .control-btn {
    width: 60px;
    height: 60px;
    font-size: 24px;
    pointer-events: auto;
  }
}

// New styles for loading indicator
.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 10;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
 