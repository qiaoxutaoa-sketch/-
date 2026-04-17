<template>
  <div class="v7-login-container">
    <div class="glow-orb orb-primary"></div>
    <div class="glow-orb orb-secondary"></div>
    <div class="glow-orb orb-accent"></div>

    <div class="glass-panel login-box">
      <div class="login-header">
        <div class="logo-circle">
          <img src="../assets/logo.png" alt="Logo" class="logo-img" />
        </div>
        <h2 class="sys-title">青九教务<span>系统</span></h2>
        <p class="sys-subtitle">请输入您的管理身份以访问工作台</p>
      </div>

      <el-form label-position="top" class="aurora-form">
        <el-form-item>
          <div class="input-wrapper">
            <el-icon class="input-icon"><User /></el-icon>
            <input 
              type="text" 
              v-model="username" 
              placeholder="管理员账号 / 手机号" 
              class="aurora-input" 
            />
          </div>
        </el-form-item>
        
        <el-form-item>
          <div class="input-wrapper">
            <el-icon class="input-icon"><Lock /></el-icon>
            <input 
              :type="passwordVisible ? 'text' : 'password'" 
              v-model="password" 
              placeholder="安全密钥" 
              class="aurora-input" 
            />
            <el-icon class="eye-icon" @click="passwordVisible = !passwordVisible">
              <View v-if="!passwordVisible"/>
              <Hide v-else />
            </el-icon>
          </div>
        </el-form-item>

        <div class="form-actions">
          <el-checkbox v-model="rememberMe" class="aurora-check">记住此设备</el-checkbox>
          <a href="#" class="forgot-link">找回密码</a>
        </div>

        <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
          {{ loading ? '正在验证身份...' : '登录系统' }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'

const router = useRouter()
const username = ref('16678702390')
const password = ref('123456')
const passwordVisible = ref(false)
const rememberMe = ref(true)
const loading = ref(false)

const handleLogin = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    router.push('/dashboard')
  }, 800)
}
</script>

<style scoped lang="scss">
.v7-login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  /* 依托于全局的初雪底色，本地叠加更亮的模糊光球 */
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.15; /* 白昼环境透明度大幅度减低，只保留微弱光晕 */
  animation: orb-float 15s infinite ease-in-out alternate;

  &.orb-primary {
    width: 600px; height: 600px;
    background: var(--aurora-primary);
    top: -200px; left: -200px;
  }
  &.orb-secondary {
    width: 500px; height: 500px;
    background: var(--aurora-secondary);
    bottom: -100px; right: -100px;
    animation-delay: -5s;
  }
  &.orb-accent {
    width: 400px; height: 400px;
    background: var(--aurora-accent);
    top: 30%; left: 60%;
    animation-delay: -7s;
  }
}

@keyframes orb-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(100px, 100px) scale(1.2); }
}

.login-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  
  /* 白昼登录框增强边缘质感 */
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05), inset 0 2px 5px rgba(255, 255, 255, 1);
  background: rgba(255,255,255,0.7) !important;
}

.login-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .logo-circle {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.05);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12);

    .logo-img { width: 44px; height: 44px; border-radius: 8px; }
  }

  .sys-title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: var(--text-hero);
    letter-spacing: -0.01em;

    span {
      font-weight: 400;
      color: var(--aurora-primary);
    }
  }

  .sys-subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }
}

.aurora-form {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .input-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;

    .input-icon {
      position: absolute;
      left: 16px;
      font-size: 18px;
      color: var(--text-muted);
      z-index: 1;
    }

    .eye-icon {
      position: absolute;
      right: 16px;
      font-size: 18px;
      color: var(--text-muted);
      cursor: pointer;
      z-index: 1;
      &:hover { color: var(--text-primary); }
    }

    .aurora-input {
      width: 100%;
      height: 56px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: var(--radius-sm);
      padding: 0 48px;
      font-size: 15px;
      color: var(--text-hero);
      outline: none;
      transition: all 0.3s ease;
      font-family: var(--font-family-sans);

      &::placeholder { color: var(--text-muted); }
      
      &:focus {
        border-color: var(--aurora-primary);
        background: #fff;
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        
        ~ .input-icon { color: var(--aurora-primary); }
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0 24px;

    .aurora-check {
      :deep(.el-checkbox__label) { color: var(--text-secondary); }
      :deep(.el-checkbox__inner) {
        background: #fff;
        border-color: rgba(0,0,0,0.1);
      }
      :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
        background: var(--aurora-primary);
        border-color: var(--aurora-primary);
        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
      }
    }

    .forgot-link {
      font-size: 13px;
      color: var(--aurora-primary);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
      
      &:hover { color: #818cf8; }
    }
  }

  .login-btn {
    width: 100%;
    height: 56px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    border-radius: var(--radius-sm);
  }
}
</style>
