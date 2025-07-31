<template>
  <div class="login-modal-backdrop" @click="closeModal">
    <div class="login-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isLogin ? '登录' : '注册' }}</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-content">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              placeholder="请输入用户名"
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="请输入密码"
            />
          </div>
          
          <div v-if="!isLogin" class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              placeholder="请再次输入密码"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="submit-btn">
              {{ isLogin ? '登录' : '注册' }}
            </button>
            <button type="button" class="switch-btn" @click="switchMode">
              {{ isLogin ? '没有账号？注册' : '已有账号？登录' }}
            </button>
          </div>
        </form>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import authAPI from '@/utils/authAPI';

export default {
  name: 'LoginModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLogin: true,
      form: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      error: ''
    };
  },
  methods: {
    closeModal() {
      this.$emit('close');
      this.resetForm();
    },
    
    switchMode() {
      this.isLogin = !this.isLogin;
      this.error = '';
      this.resetForm();
    },
    
    resetForm() {
      this.form = {
        username: '',
        password: '',
        confirmPassword: ''
      };
      this.error = '';
    },
    
    async handleSubmit() {
      try {
        this.error = '';
        
        if (!this.isLogin && this.form.password !== this.form.confirmPassword) {
          this.error = '两次输入的密码不一致';
          return;
        }
        
        if (this.isLogin) {
          // 登录
          const result = await authAPI.login(this.form.username, this.form.password);
          if (result.success) {
            this.$emit('login-success', result.user);
            this.closeModal();
          } else {
            this.error = result.error || '登录失败';
          }
        } else {
          // 注册
          const result = await authAPI.register(this.form.username, this.form.password);
          if (result.success) {
            this.$emit('register-success', result.user);
            this.closeModal();
          } else {
            this.error = result.error || '注册失败';
          }
        }
      } catch (error) {
        console.error('认证错误:', error);
        this.error = '操作失败，请重试';
      }
    }
  }
};
</script>

<style scoped lang="scss">
.login-modal-backdrop {
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

.login-modal {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  max-width: 400px;
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
}

.form-group {
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    color: #ccc;
    font-size: 14px;
  }
  
  input {
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
}

.form-actions {
  margin-top: 20px;
  
  .submit-btn {
    width: 100%;
    padding: 12px;
    background: #4a90e2;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 10px;
    
    &:hover {
      background: #357abd;
    }
  }
  
  .switch-btn {
    width: 100%;
    padding: 8px;
    background: none;
    color: #4a90e2;
    border: 1px solid #4a90e2;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    
    &:hover {
      background: rgba(74, 144, 226, 0.1);
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
</style> 