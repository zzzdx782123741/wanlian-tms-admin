<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-box">
      <!-- Logo 和标题 -->
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#667eea">
            <Van />
          </el-icon>
        </div>
        <h1>万联驿站 2.0</h1>
        <p>商用车后市场服务管理平台</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            clearable
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            clearable
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 测试账号快捷选择（测试环境显示，生产环境隐藏） -->
      <div v-if="isDev" class="test-accounts">
        <el-divider content-position="center">
          <span style="font-size: 12px; color: #909399;">测试账号快捷登录</span>
        </el-divider>
        <div class="account-buttons">
          <el-button
            size="small"
            type="primary"
            @click="fillAccount('admin', 'Admin@123')"
          >
            平台运营
          </el-button>
          <el-button
            size="small"
            @click="fillAccount('fleet001', 'Fleet@123')"
          >
            车队管理
          </el-button>
          <el-button
            size="small"
            type="success"
            @click="fillAccount('store001', 'Store@123')"
          >
            门店管理
          </el-button>
          <el-button
            size="small"
            @click="fillAccount('tech001', 'Tech@123')"
          >
            门店技师
          </el-button>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="login-footer">
        <p>建议使用 Chrome 浏览器以获得最佳体验</p>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <p>&copy; 2026 万联驿站. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Van } from '@element-plus/icons-vue'
import { login, testLogin } from '@/api/auth'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

// 判断是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 填充测试账号
const fillAccount = (username, password) => {
  loginForm.value.username = username
  loginForm.value.password = password
  ElMessage.success(`已填充测试账号：${username}`)
}

// 登录
const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    // 开发环境使用测试登录，生产环境使用正式登录
    const loginApi = isDev.value ? testLogin : login

    const response = await loginApi({
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    if (response.success) {
      const { token, user } = response.data

      // 保存登录信息
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(user))
      localStorage.setItem('role', user.role?.type)

      console.log('登录成功，用户信息:', {
        username: user.username,
        nickname: user.nickname,
        role: user.role?.type,
        fleetName: user.fleetInfo?.fleetName,
        storeName: user.storeInfo?.storeName
      })

      ElMessage.success('登录成功！')

      // 跳转到首页
      setTimeout(async () => {
        try {
          await router.push('/dashboard')
        } catch (navError) {
          console.error('路由跳转失败，尝试强制刷新:', navError)
          window.location.assign('/dashboard')
        }
      }, 500)
    } else {
      ElMessage.error(response.message || '登录失败，请检查用户名和密码')
    }
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error.response?.data?.message || '网络错误，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);

    &.circle-1 {
      width: 500px;
      height: 500px;
      top: -200px;
      left: -200px;
      animation: float 8s ease-in-out infinite;
    }

    &.circle-2 {
      width: 300px;
      height: 300px;
      bottom: -100px;
      right: -100px;
      animation: float 10s ease-in-out infinite 2s;
    }

    &.circle-3 {
      width: 200px;
      height: 200px;
      top: 50%;
      right: 20%;
      animation: float 12s ease-in-out infinite 4s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.login-box {
  position: relative;
  width: 420px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
    letter-spacing: 1px;
  }

  p {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  margin-bottom: 20px;

  :deep(.el-input__wrapper) {
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    }
  }

  :deep(.el-input__prefix) {
    font-size: 18px;
    color: #909399;
  }

  .login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    margin-top: 16px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.test-accounts {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  :deep(.el-divider__text) {
    background-color: transparent;
  }

  .account-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;

    .el-button {
      flex: 1;
      min-width: calc(50% - 4px);
    }
  }
}

.login-footer {
  text-align: center;

  p {
    font-size: 12px;
    color: #909399;
    margin: 0;
  }
}

.copyright {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;

  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    text-align: center;
  }
}
</style>
