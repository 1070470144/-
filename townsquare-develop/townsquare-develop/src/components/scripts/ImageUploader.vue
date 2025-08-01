<template>
  <div class="image-uploader">
    <!-- 上传区域 -->
    <div class="upload-area">
      <div
        class="upload-zone"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        :class="{ dragover: isDragOver }"
        @dragenter="isDragOver = true"
        @dragleave="isDragOver = false"
      >
        <div class="upload-content">
          <div class="upload-icon">📷</div>
          <p>拖拽图片到这里，或点击选择图片</p>
          <p class="upload-hint">支持 JPG、PNG 格式，单张 2-5MB，最多 3 张</p>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            @change="handleFileSelect"
            style="display: none"
          />
          <button @click="$refs.fileInput.click()" class="select-btn">
            选择图片
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览区域 -->
    <div v-if="previewImages.length > 0" class="preview-area">
      <h4>已选择的图片 ({{ previewImages.length }}/3)</h4>
      <div class="preview-grid">
        <div
          v-for="(image, index) in previewImages"
          :key="index"
          class="preview-item"
        >
          <img :src="image.url" :alt="image.name" class="preview-image" />
          <div class="preview-info">
            <span class="preview-name">{{ image.name }}</span>
            <span class="preview-size">{{ formatFileSize(image.size) }}</span>
          </div>
          <button @click="removeImage(index)" class="remove-btn">×</button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 上传进度 -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <span class="progress-text">上传中... {{ uploadProgress }}%</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageUploader',
  props: {
    scriptId: {
      type: String,
      required: true
    },
    scriptName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      previewImages: [],
      isDragOver: false,
      error: '',
      isUploading: false,
      uploadProgress: 0
    };
  },
  methods: {
    handleDrop(event) {
      this.isDragOver = false;
      const files = Array.from(event.dataTransfer.files);
      this.processFiles(files);
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.processFiles(files);
    },

    processFiles(files) {
      this.error = '';
      
      // 检查文件数量
      if (this.previewImages.length + files.length > 3) {
        this.error = '最多只能选择 3 张图片';
        return;
      }

      files.forEach(file => {
        // 检查文件类型
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          this.error = '只支持 JPG 和 PNG 格式的图片';
          return;
        }

        // 检查文件大小
        if (file.size < 2 * 1024 * 1024 || file.size > 5 * 1024 * 1024) {
          this.error = '图片大小必须在 2-5MB 之间';
          return;
        }

        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImages.push({
            file: file,
            name: file.name,
            size: file.size,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    },

    removeImage(index) {
      this.previewImages.splice(index, 1);
      this.error = '';
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async uploadImages() {
      if (this.previewImages.length === 0) {
        return { success: false, error: '请选择图片' };
      }

      this.isUploading = true;
      this.uploadProgress = 0;
      this.error = '';

      try {
        const files = this.previewImages.map(item => item.file);
        const scriptAPI = require('@/utils/scriptAPI').default;
        
        const result = await scriptAPI.uploadScriptImages(
          this.scriptId, 
          files, 
          this.scriptName
        );

        if (result.success) {
          this.previewImages = [];
          this.$emit('upload-success', result.data);
          return result;
        } else {
          this.error = result.error || '上传失败';
          return result;
        }
      } catch (error) {
        console.error('上传图片失败:', error);
        this.error = '上传失败，请重试';
        return { success: false, error: error.message };
      } finally {
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    },

    clearImages() {
      this.previewImages = [];
      this.error = '';
    }
  }
};
</script>

<style scoped lang="scss">
.image-uploader {
  width: 100%;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);

  &.dragover {
    border-color: rgba(255, 215, 0, 0.8);
    background: rgba(255, 215, 0, 0.1);
  }

  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 255, 255, 0.05);
  }
}

.upload-content {
  .upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.7;
  }

  p {
    color: #ccc;
    margin-bottom: 10px;
    
    &.upload-hint {
      font-size: 12px;
      color: #888;
      margin-bottom: 15px;
    }
  }

  .select-btn {
    padding: 10px 20px;
    background: rgba(255, 215, 0, 0.8);
    color: #000;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 215, 0, 1);
    }
  }
}

.preview-area {
  margin-top: 20px;

  h4 {
    margin: 0 0 15px 0;
    color: #ccc;
    font-size: 14px;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.preview-info {
  padding: 10px;
  background: rgba(0, 0, 0, 0.8);

  .preview-name {
    display: block;
    color: #fff;
    font-size: 12px;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-size {
    display: block;
    color: #ccc;
    font-size: 10px;
  }
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.8);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(244, 67, 54, 1);
  }
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 4px;
  color: #ff6b6b;
  font-size: 14px;
}

.upload-progress {
  margin-top: 15px;

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.8), rgba(255, 215, 0, 1));
    transition: width 0.3s ease;
  }

  .progress-text {
    color: #ccc;
    font-size: 12px;
  }
}
</style> 