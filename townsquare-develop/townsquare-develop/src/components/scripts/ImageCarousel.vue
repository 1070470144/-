<template>
  <div class="image-carousel">
    <!-- 轮播容器 -->
    <div class="carousel-container" v-if="sortedImages.length > 0">
      <!-- 图片显示区域 -->
      <div class="image-container">
        <transition name="fade" mode="out-in">
          <img
            :key="currentIndex"
            :src="currentImageUrl"
            :alt="currentImage.title"
            @click="openFullscreen"
            class="carousel-image"
          />
        </transition>
        
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
    <div v-if="showFullscreen" class="fullscreen-modal" @click="closeFullscreen">
      <div class="fullscreen-content" @click.stop>
        <button class="close-btn" @click="closeFullscreen">×</button>
        <div class="fullscreen-image-container">
          <img
            :src="currentImageUrl"
            :alt="currentImage.title"
            class="fullscreen-image"
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
  name: 'ImageCarousel',
  props: {
    images: {
      type: Array,
      default: () => []
    },
    scriptId: {
      type: String,
      required: true
    },
    autoPlay: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 3000
    }
  },
  data() {
    return {
      currentIndex: 0,
      showFullscreen: false,
      autoPlayTimer: null
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
      if (!this.currentImage) return '';
      return `/api/images/${this.scriptId}/${this.currentImage.filename}`;
    }
  },
  watch: {
    images: {
      handler() {
        this.currentIndex = 0;
        this.startAutoPlay();
      },
      immediate: true
    }
  },
  mounted() {
    this.startAutoPlay();
  },
  beforeDestroy() {
    this.stopAutoPlay();
  },
  methods: {
    next() {
      if (this.currentIndex < this.sortedImages.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }
    },
    previous() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.sortedImages.length - 1;
      }
    },
    goTo(index) {
      this.currentIndex = index;
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
    }
  }
};
</script>

<style scoped lang="scss">
.image-carousel {
  position: relative;
  width: 100%;
  height: 200px;
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
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
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

// 过渡动画
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style> 