<template>
  <div class="image-management-modal-backdrop" @click="closeModal">
    <div class="image-management-modal" @click.stop>
      <div class="modal-header">
        <h3>图片管理 - {{ script.name }}</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="modal-content">
        <!-- 图片上传区域 -->
        <div class="upload-section">
          <h4>上传新图片</h4>
          <ImageUploader 
            :scriptId="script.id"
            :scriptName="script.name"
            @upload-success="handleUploadSuccess"
          />
        </div>

        <!-- 现有图片管理 -->
        <div class="existing-images-section" v-if="images.length > 0">
          <h4>现有图片 ({{ images.length }}/3)</h4>
          <div class="images-grid">
            <div
              v-for="(image, index) in images"
              :key="image.id"
              class="image-item"
            >
              <div class="image-preview">
                <img 
                  :src="getImageUrl(image.filename)" 
                  :alt="image.title"
                  @click="previewImage(image)"
                  class="preview-img"
                />
                <div class="image-overlay">
                  <button @click="previewImage(image)" class="preview-btn">
                    👁️ 预览
                  </button>
                  <button @click="replaceImage(image)" class="replace-btn">
                    🔄 替换
                  </button>
                  <button @click="deleteImage(image)" class="delete-btn">
                    🗑️ 删除
                  </button>
                </div>
              </div>
              <div class="image-info">
                <span class="image-title">{{ image.title }}</span>
                <span class="image-date">{{ formatDate(image.uploadedAt) }}</span>
                <div class="image-order">
                  <span class="order-label">排序: {{ image.order || index + 1 }}</span>
                  <div class="order-controls">
                    <button 
                      @click="moveImage(image, 'up')" 
                      :disabled="index === 0"
                      class="order-btn"
                    >
                      ↑
                    </button>
                    <button 
                      @click="moveImage(image, 'down')" 
                      :disabled="index === images.length - 1"
                      class="order-btn"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无图片提示 -->
        <div v-else class="no-images">
          <div class="no-images-icon">📷</div>
          <p>暂无图片，请上传图片</p>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="showPreview" class="preview-modal-backdrop" @click="closePreview">
      <div class="preview-modal" @click.stop>
        <button class="preview-close-btn" @click="closePreview">&times;</button>
        <img 
          :src="getImageUrl(previewImageData.filename)" 
          :alt="previewImageData.title"
          class="preview-image"
        />
        <div class="preview-info">
          <h4>{{ previewImageData.title }}</h4>
          <p>上传时间: {{ formatDate(previewImageData.uploadedAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageUploader from "@/components/scripts/ImageUploader";
import scriptAPI from "@/utils/scriptAPI";

export default {
  name: 'ImageManagementModal',
  components: {
    ImageUploader
  },
  props: {
    script: {
      type: Object,
      required: true
    }
  },
  data() {
          return {
        images: [],
        isLoading: false,
        showPreview: false,
        previewImageData: null
      };
  },
  async mounted() {
    await this.loadImages();
  },
  methods: {
    async loadImages() {
      try {
        this.isLoading = true;
        const result = await scriptAPI.getScriptImages(this.script.id);
        if (result.success && result.data && result.data.images) {
          this.images = result.data.images;
        } else {
          this.images = [];
        }
      } catch (error) {
        console.error('加载图片失败:', error);
        this.images = [];
      } finally {
        this.isLoading = false;
      }
    },

    getImageUrl(filename) {
      return `/api/images/${this.script.id}/${filename}`;
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    handleUploadSuccess(imageData) {
      console.log('图片上传成功:', imageData);
      this.loadImages();
      this.$emit('images-updated');
    },

    previewImage(image) {
      this.previewImageData = image;
      this.showPreview = true;
    },

    closePreview() {
      this.showPreview = false;
      this.previewImageData = null;
    },

    async deleteImage(image) {
      if (!confirm(`确定要删除图片 "${image.title}" 吗？`)) {
        return;
      }

      try {
        const result = await scriptAPI.deleteScriptImage(this.script.id, image.id);
        
        if (result.success) {
          await this.loadImages();
          this.$emit('images-updated');
        } else {
          alert('删除失败: ' + (result.error || '未知错误'));
        }
      } catch (error) {
        console.error('删除图片失败:', error);
        alert('删除失败，请重试');
      }
    },

    async moveImage(image, direction) {
      const currentIndex = this.images.findIndex(img => img.id === image.id);
      if (currentIndex === -1) return;

      let newIndex;
      if (direction === 'up' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < this.images.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        return;
      }

      try {
        // 这里可以调用API来更新图片顺序
        // 暂时使用前端排序
        const newImages = [...this.images];
        const temp = newImages[currentIndex];
        newImages[currentIndex] = newImages[newIndex];
        newImages[newIndex] = temp;
        
        // 更新order字段
        newImages.forEach((img, index) => {
          img.order = index + 1;
        });
        
        this.images = newImages;
        this.$emit('images-updated');
      } catch (error) {
        console.error('移动图片失败:', error);
        alert('移动失败，请重试');
      }
    },

    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped lang="scss">
.image-management-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.image-management-modal {
  background: rgba(40, 40, 40, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  color: #fff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);

  h3 {
    margin: 0;
    color: #ffd700;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #ffd700;
    }
  }
}

.modal-content {
  padding: 20px;
}

.upload-section {
  margin-bottom: 30px;

  h4 {
    margin: 0 0 15px 0;
    color: #ffd700;
    font-size: 16px;
  }
}

.existing-images-section {
  h4 {
    margin: 0 0 15px 0;
    color: #ffd700;
    font-size: 16px;
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.image-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    transform: translateY(-2px);
  }
}

.image-preview {
  position: relative;
  height: 150px;
  overflow: hidden;

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;

    button {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s ease;

      &.preview-btn {
        background: rgba(33, 150, 243, 0.8);
        color: white;

        &:hover {
          background: rgba(33, 150, 243, 1);
        }
      }

      &.replace-btn {
        background: rgba(255, 193, 7, 0.8);
        color: #000;

        &:hover {
          background: rgba(255, 193, 7, 1);
        }
      }

      &.delete-btn {
        background: rgba(244, 67, 54, 0.8);
        color: white;

        &:hover {
          background: rgba(244, 67, 54, 1);
        }
      }
    }
  }

  &:hover .image-overlay {
    opacity: 1;
  }
}

.image-info {
  padding: 15px;

  .image-title {
    display: block;
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .image-date {
    display: block;
    color: #ccc;
    font-size: 12px;
  }

  .image-order {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .order-label {
      color: #ccc;
      font-size: 11px;
    }

    .order-controls {
      display: flex;
      gap: 4px;

      .order-btn {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.3);
          color: #ffd700;
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
    }
  }
}

.no-images {
  text-align: center;
  padding: 40px;
  color: #ccc;

  .no-images-icon {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 16px;
  }
}

// 预览模态框样式
.preview-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2100;
}

.preview-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;

  .preview-close-btn {
    position: absolute;
    top: -50px;
    right: 0;
    background: none;
    border: none;
    color: #fff;
    font-size: 32px;
    cursor: pointer;
    z-index: 2200;

    &:hover {
      color: #ffd700;
    }
  }

  .preview-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }

  .preview-info {
    margin-top: 20px;
    text-align: center;

    h4 {
      margin: 0 0 10px 0;
      color: #ffd700;
    }

    p {
      margin: 0;
      color: #ccc;
      font-size: 14px;
    }
  }
}
</style> 