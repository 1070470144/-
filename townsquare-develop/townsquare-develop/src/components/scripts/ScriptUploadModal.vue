<template>
  <div class="upload-modal-backdrop" @click="closeModal">
    <div class="upload-modal" @click.stop>
      <div class="modal-header">
        <h3>上传剧本</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="modal-content">
        <div class="upload-section">
          <div
            class="file-drop-zone"
            @drop="handleFileDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="{ dragover: isDragOver }"
            @dragenter="isDragOver = true"
            @dragleave="isDragOver = false"
          >
            <div class="drop-zone-content">
              <div class="upload-icon">📄</div>
              <p>拖拽JSON文件到这里，或点击选择文件</p>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileSelect"
                style="display: none"
              />
              <button @click="$refs.fileInput.click()" class="select-file-btn">
                选择文件
              </button>
            </div>
          </div>

          <div v-if="selectedFile" class="file-info">
            <h4>已选择文件：</h4>
            <p>{{ selectedFile.name }}</p>
            <button @click="clearFile" class="clear-file-btn">清除</button>
          </div>
        </div>

        <div v-if="previewData" class="preview-section">
          <h4>剧本预览</h4>
          <div class="preview-form">
            <div class="form-group">
              <label>剧本名称</label>
              <input
                v-model="previewData.name"
                type="text"
                placeholder="请输入剧本名称"
              />
            </div>

            <div class="form-group">
              <label>作者</label>
              <input
                v-model="previewData.author"
                type="text"
                placeholder="请输入作者名称"
              />
            </div>

            <div class="form-group">
              <label>分类</label>
              <select v-model="previewData.category" :disabled="isLoadingCategories || !activeCategories.length">
                <option value="" disabled>{{ isLoadingCategories ? '加载分类中...' : '请选择分类' }}</option>
                <option 
                  v-for="category in activeCategories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
              <div v-if="isLoadingCategories" class="loading-text">加载分类中...</div>
              <div v-if="!isLoadingCategories && !activeCategories.length" class="error-text">暂无可用分类</div>
            </div>

            <!-- 系列选择 -->
            <div class="form-group">
              <label>剧本系列 *</label>
              <div class="series-selection">
                <div class="series-options">
                  <label class="radio-option">
                    <input 
                      type="radio" 
                      v-model="seriesOption" 
                      value="existing"
                      @change="handleSeriesOptionChange"
                    />
                    <span>选择已有系列</span>
                  </label>
                  <label class="radio-option">
                    <input 
                      type="radio" 
                      v-model="seriesOption" 
                      value="new"
                      @change="handleSeriesOptionChange"
                    />
                    <span>创建新系列</span>
                  </label>
                </div>

                <!-- 选择已有系列 -->
                <div v-if="seriesOption === 'existing'" class="existing-series">
                  <div class="search-box">
                    <input 
                      v-model="seriesSearchQuery"
                      type="text"
                      placeholder="搜索系列..."
                      @input="searchSeries"
                    />
                  </div>
                  <select v-model="selectedSeriesId" :disabled="isLoadingSeries">
                    <option value="" disabled>{{ isLoadingSeries ? '加载系列中...' : '请选择系列' }}</option>
                    <option 
                      v-for="series in filteredSeries" 
                      :key="series.id" 
                      :value="series.id"
                    >
                      {{ series.name }} ({{ series.versions?.length || 0 }}个版本)
                    </option>
                  </select>
                </div>

                <!-- 创建新系列 -->
                <div v-if="seriesOption === 'new'" class="new-series">
                  <div class="form-group">
                    <label>系列名称</label>
                    <input 
                      v-model="newSeriesName"
                      type="text"
                      placeholder="请输入系列名称"
                    />
                  </div>
                  <div class="form-group">
                    <label>系列描述</label>
                    <textarea
                      v-model="newSeriesDescription"
                      placeholder="请输入系列描述"
                    ></textarea>
                  </div>
                  <div class="form-group">
                    <label>版本号</label>
                    <input 
                      v-model="newSeriesVersion"
                      type="text"
                      placeholder="请输入版本号，如：1.0"
                    />
                  </div>
                </div>

                <!-- 版本号输入（选择已有系列时） -->
                <div v-if="seriesOption === 'existing'" class="version-input">
                  <div class="form-group">
                    <label>版本号</label>
                    <input 
                      v-model="existingSeriesVersion"
                      type="text"
                      placeholder="请输入版本号，如：2.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="previewData.description"
                placeholder="请输入剧本描述"
              ></textarea>
            </div>

            <div class="script-stats">
              <span>角色数量: {{ previewData.roles?.length || 0 }}</span>
              <span>难度: {{ previewData.level || "Intermediate" }}</span>
            </div>

            <!-- 图片上传区域 -->
            <div class="form-group">
              <label>剧本图片</label>
              <ImageUploader 
                ref="imageUploader"
                :scriptId="previewData.id"
                :scriptName="previewData.name"
                @upload-success="handleImageUploadSuccess"
              />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="cancel-btn">取消</button>
          <button
            v-if="previewData"
            @click="uploadScript"
            :disabled="isUploading"
            class="upload-btn"
          >
            {{ isUploading ? "上传中..." : "确认上传" }}
          </button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import scriptImporter from "@/utils/scriptImporter";
import scriptAPI from "@/utils/scriptAPI";
import systemAPI from "@/utils/systemAPI";
import ImageUploader from "@/components/scripts/ImageUploader";

export default {
  name: "ScriptUploadModal",
  components: {
    ImageUploader
  },
  data() {
    return {
      selectedFile: null,
      previewData: null,
      isDragOver: false,
      isUploading: false,
      error: "",
      categories: [],
      isLoadingCategories: false,
      
      // 系列相关数据
      seriesOption: 'existing', // existing, new (移除了standalone)
      seriesSearchQuery: '',
      selectedSeriesId: '',
      newSeriesName: '',
      newSeriesDescription: '',
      newSeriesVersion: '1.0',
      existingSeriesVersion: '',
      allSeries: [],
      filteredSeries: [],
      isLoadingSeries: false,
    };
  },
  methods: {
    closeModal() {
      this.$emit("close");
      this.resetForm();
    },

    resetForm() {
      this.selectedFile = null;
      this.previewData = null;
      this.isDragOver = false;
      this.isUploading = false;
      this.error = "";
      
      // 重置系列相关数据
      this.seriesOption = 'existing';
      this.seriesSearchQuery = '';
      this.selectedSeriesId = '';
      this.newSeriesName = '';
      this.newSeriesDescription = '';
      this.newSeriesVersion = '1.0';
      this.existingSeriesVersion = '';
      this.allSeries = [];
      this.filteredSeries = [];
      
      // 重新加载分类数据
      this.loadCategories();
    },

    handleFileDrop(event) {
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },

    handleFileSelect(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },

    async processFile(file) {
      try {
        this.error = "";

        if (!file.name.endsWith(".json")) {
          this.error = "请选择JSON格式的文件";
          return;
        }

        this.selectedFile = file;

        // 读取并解析文件
        const content = await this.readFileAsText(file);
        const scriptData = scriptImporter.parseScriptJSON(content);

        // 验证数据
        const validation = scriptImporter.validateScriptData(scriptData);
        if (!validation.isValid) {
          this.error = `剧本数据验证失败: ${validation.errors.join(", ")}`;
          return;
        }

        // 设置预览数据
        this.previewData = {
          ...scriptData,
          author: scriptData.author || "",
          description: scriptData.description || "",
          category: scriptData.category || (this.activeCategories.length > 0 ? this.activeCategories[0].id : ""),
        };
        
        // 确保分类已加载
        if (!this.categories.length) {
          await this.loadCategories();
        }
      } catch (error) {
        console.error("处理文件失败:", error);
        this.error = "文件解析失败，请检查文件格式";
      }
    },

    handleImageUploadSuccess(imageData) {
      console.log('图片上传成功:', imageData);
      // 可以在这里添加成功提示或其他处理
    },

    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    },

    clearFile() {
      this.selectedFile = null;
      this.previewData = null;
      this.error = "";
    },

    async loadCategories() {
      try {
        this.isLoadingCategories = true;
        const result = await systemAPI.getCategories();
        console.log('分类API返回结果:', result);
        
        if (result.success && result.data && result.data.categories) {
          this.categories = result.data.categories;
          console.log('加载分类成功:', this.categories);
        } else {
          console.error('加载分类失败:', result.error);
          // 使用默认分类
          this.categories = [
            { id: 'custom', name: '自制剧本', isActive: true },
            { id: 'official', name: '官方剧本', isActive: true },
            { id: 'mixed', name: '混合剧本', isActive: true }
          ];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
        // 如果API调用失败，使用默认分类
        this.categories = [
          { id: 'custom', name: '自制剧本', isActive: true },
          { id: 'official', name: '官方剧本', isActive: true },
          { id: 'mixed', name: '混合剧本', isActive: true }
        ];
      } finally {
        this.isLoadingCategories = false;
      }
    },

    // 系列相关方法
    async loadSeries() {
      try {
        this.isLoadingSeries = true;
        const result = await scriptAPI.getScriptSeries();
        if (result.success) {
          this.allSeries = result.data || [];
          this.filteredSeries = [...this.allSeries];
          console.log('加载系列成功:', this.allSeries);
        } else {
          console.error('加载系列失败:', result.error);
          this.allSeries = [];
          this.filteredSeries = [];
        }
      } catch (error) {
        console.error('加载系列失败:', error);
        this.allSeries = [];
        this.filteredSeries = [];
      } finally {
        this.isLoadingSeries = false;
      }
    },

    handleSeriesOptionChange() {
      console.log('系列选项改变:', this.seriesOption);
      
      // 重置相关数据
      this.selectedSeriesId = '';
      this.newSeriesName = '';
      this.newSeriesDescription = '';
      this.existingSeriesVersion = '';
      
      // 如果选择已有系列，加载系列数据
      if (this.seriesOption === 'existing') {
        this.loadSeries();
      }
    },

    searchSeries() {
      if (!this.seriesSearchQuery.trim()) {
        this.filteredSeries = [...this.allSeries];
      } else {
        const query = this.seriesSearchQuery.toLowerCase();
        this.filteredSeries = this.allSeries.filter(series => 
          series.name.toLowerCase().includes(query) ||
          series.description?.toLowerCase().includes(query)
        );
      }
    },

    async uploadScript() {
      try {
        this.isUploading = true;
        this.error = "";

        // 检查用户登录状态
        if (!this.currentUser || !this.currentUser.id) {
          this.error = "请先登录后再上传剧本";
          return;
        }

        // 验证必填字段
        if (!this.previewData.name.trim()) {
          this.error = "剧本名称不能为空";
          return;
        }
        
        if (!this.previewData.category) {
          this.error = "请选择剧本分类";
          return;
        }

        // 验证系列相关字段
        if (this.seriesOption === 'existing') {
          if (!this.selectedSeriesId) {
            this.error = "请选择系列";
            return;
          }
          if (!this.existingSeriesVersion.trim()) {
            this.error = "请输入版本号";
            return;
          }
        }

        if (this.seriesOption === 'new') {
          if (!this.newSeriesName.trim()) {
            this.error = "请输入系列名称";
            return;
          }
          if (!this.newSeriesVersion.trim()) {
            this.error = "请输入版本号";
            return;
          }
        }

        // 生成剧本ID
        const scriptId = scriptImporter.generateScriptId(this.previewData.name);
        console.log('生成的剧本ID:', scriptId);

        // 准备上传数据
        const uploadData = {
          ...this.previewData,
          id: scriptId,
          status: "pending", // 待审核状态
          userId: this.currentUser.id, // 添加用户ID
          uploadedBy: this.currentUser.username,
          uploadedAt: new Date().toISOString(),
          seriesInfo: {
            option: this.seriesOption,
            seriesId: this.selectedSeriesId,
            newSeriesName: this.newSeriesName,
            newSeriesDescription: this.newSeriesDescription,
            newSeriesVersion: this.newSeriesVersion,
            existingSeriesVersion: this.existingSeriesVersion
          }
        };

        // 上传到服务器
        const result = await scriptAPI.saveScript(uploadData);

        if (result.success) {
          // 剧本上传成功后，上传图片
          const imageUploader = this.$refs.imageUploader;
          if (imageUploader && imageUploader.previewImages.length > 0) {
            try {
              // 使用正确的剧本ID上传图片
              const files = imageUploader.previewImages.map(item => item.file);
              console.log('上传图片使用的剧本ID:', scriptId);
              const imageResult = await scriptAPI.uploadScriptImages(
                scriptId, // 使用正确的剧本ID
                files,
                this.previewData.name
              );
              
              if (imageResult.success) {
                console.log('图片上传成功:', imageResult);
              } else {
                console.error('图片上传失败:', imageResult.error);
                // 图片上传失败不影响剧本上传成功
              }
            } catch (error) {
              console.error('图片上传失败:', error);
            }
          }
          
          this.$emit("upload-success");
          this.closeModal();
        } else {
          console.error("❌ 剧本上传失败:", result.error);
          this.error = result.error || "上传失败";
        }
      } catch (error) {
        console.error("上传剧本失败:", error);
        this.error = "上传失败，请重试";
      } finally {
        this.isUploading = false;
      }
    },
  },

  computed: {
    currentUser() {
      // 从authAPI获取当前用户
      const authAPI = require("@/utils/authAPI").default;
      return authAPI.getCurrentUser();
    },
    
    activeCategories() {
      return this.categories.filter(category => category.isActive);
    },
  },
  
  async mounted() {
    await Promise.all([this.loadCategories(), this.loadSeries()]);
  },
};
</script>

<style scoped lang="scss">
.upload-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.upload-modal {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 500px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 24px;
    cursor: pointer;

    &:hover {
      color: #fff;
    }
  }

  .loading-text {
    font-size: 12px;
    color: #888;
    margin-top: 5px;
  }

  .error-text {
    font-size: 12px;
    color: #ff6b6b;
    margin-top: 5px;
  }
}

.upload-section {
  margin-bottom: 20px;
}

.file-drop-zone {
  border: 2px dashed #666;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: border-color 0.3s;
  cursor: pointer;

  &.dragover {
    border-color: #4a90e2;
    background: rgba(74, 144, 226, 0.1);
  }

  .drop-zone-content {
    .upload-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    p {
      color: #ccc;
      margin-bottom: 15px;
    }

    .select-file-btn {
      padding: 10px 20px;
      background: #4a90e2;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: #357abd;
      }
    }
  }
}

.file-info {
  margin-top: 15px;
  padding: 15px;
  background: #333;
  border-radius: 4px;

  h4 {
    margin: 0 0 10px 0;
    color: #fff;
    font-size: 14px;
  }

  p {
    margin: 0 0 10px 0;
    color: #ccc;
    font-size: 12px;
  }

  .clear-file-btn {
    padding: 5px 10px;
    background: #666;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: #555;
    }
  }
}

.preview-section {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 15px 0;
    color: #fff;
    font-size: 16px;
  }
}

.preview-form {
  .form-group {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 5px;
      color: #ccc;
      font-size: 14px;
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #333;
      color: #fff;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #666;
      }

      &::placeholder {
        color: #888;
      }
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }
  }

  .script-stats {
    display: flex;
    gap: 20px;
    margin-top: 15px;
    padding: 10px;
    background: #333;
    border-radius: 4px;

    span {
      color: #ccc;
      font-size: 12px;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;

  .cancel-btn,
  .upload-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .cancel-btn {
    background: #666;
    color: #fff;

    &:hover {
      background: #555;
    }
  }

  .upload-btn {
    background: #4a90e2;
    color: #fff;

    &:hover:not(:disabled) {
      background: #357abd;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 4px;
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
}

// 系列选择样式
.series-selection {
  .series-options {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;

    .radio-option {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      color: #ccc;
      font-size: 14px;

      input[type="radio"] {
        margin: 0;
        cursor: pointer;
      }

      span {
        cursor: pointer;
      }
    }
  }

  .existing-series,
  .new-series {
    margin-top: 10px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    .search-box {
      margin-bottom: 10px;

      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #444;
        border-radius: 4px;
        background: #333;
        color: #fff;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: #666;
        }

        &::placeholder {
          color: #888;
        }
      }
    }

    select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #333;
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #666;
      }

      option {
        background: #333;
        color: #fff;
      }
    }
  }

  .version-input {
    margin-top: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
