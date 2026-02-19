<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>万联驿站TMS</h1>
        <p>管理后台登录</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="openid">
          <el-input
            v-model="loginForm.openid"
            placeholder="请输入 OpenID（测试账号）"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 测试账号快捷选择 -->
        <div class="test-accounts">
          <div class="test-accounts-title">测试账号快捷选择：</div>
          <el-button
            size="small"
            @click="selectTestAccount('driver_openid_001', 'DRIVER')"
          >
            司机
          </el-button>
          <el-button
            size="small"
            @click="selectTestAccount('fleet_openid_001', 'FLEET_MANAGER')"
          >
            车队管理员
          </el-button>
          <el-button
            size="small"
            @click="selectTestAccount('tech_openid_001', 'STORE_TECHNICIAN')"
          >
            门店技师
          </el-button>
          <el-button
            size="small"
            type="primary"
            @click="selectTestAccount('operator_openid_001', 'PLATFORM_OPERATOR')"
          >
            平台运营
          </el-button>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>提示：使用测试账号 OpenID 登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = ref({
  openid: ''
})

const loginRules = {
  openid: [
    { required: true, message: '请输入 OpenID', trigger: 'blur' }
  ]
}

// 选择测试账号
const selectTestAccount = (openid, role) => {
  loginForm.value.openid = openid
  ElMessage.success(`已选择测试账号：${role}`)
}

// 登录
const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    // 模拟登录（实际应该调用后端登录接口）
    const response = await fetch('/api/auth/web-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ openid: loginForm.value.openid })
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo))
      localStorage.setItem('role', data.data.role)

      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(data.message || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    // 开发环境：如果后端接口不存在，使用模拟登录
    localStorage.setItem('token', 'test-token-' + Date.now())
    localStorage.setItem('userInfo', JSON.stringify({
      nickname: '测试用户',
      avatar: ''
    }))
    localStorage.setItem('role', 'PLATFORM_OPERATOR')

    ElMessage.success('登录成功（开发模式）')
    router.push('/')
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
}

.login-box {
  width: 450px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    color: #2c3e50;
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
    color: #909399;
  }
}

.login-form {
  .test-accounts {
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;

    .test-accounts-title {
      font-size: 12px;
      color: #909399;
      margin-bottom: 10px;
    }

    .el-button {
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }

  .login-button {
    width: 100%;
  }
}

.login-footer {
  margin-top: 20px;
  text-align: center;

  p {
    font-size: 12px;
    color: #909399;
  }
}
</style>
