/**
 * ESLint 配置 - 万联驿站2.0 Web管理后台
 * 使用 ESLint 9.x 扁平配置格式
 */

import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const gitignorePath = path.resolve(__dirname, '.gitignore')

export default [
  // 包含 .gitignore 中的文件
  includeIgnoreFile(gitignorePath),

  // JS/ESLint 基础规则
  js.configs.recommended,

  // Vue 3 规则
  ...pluginVue.configs['flat/recommended'],

  // 自定义规则
  {
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'off', // 允许单词组件名
      'vue/no-v-html': 'warn', // v-html 使用警告而非错误
      'vue/no-unused-vars': 'off', // 使用 JS 的 no-unused-vars 规则代替

      // JavaScript 规则
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_', // 忽略以下划线开头的未使用参数
        varsIgnorePattern: '^_' // 忽略以下划线开头的未使用变量
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }], // 允许 console.warn 和 console.error
      'semi': ['error', 'never'], // 不使用分号
      'quotes': ['error', 'single'], // 使用单引号
      'indent': ['error', 2], // 2空格缩进
      'comma-dangle': ['error', 'never'], // 不允许尾随逗号
      'eol-last': ['error', 'always'], // 文件末尾空行
      'no-trailing-spaces': 'error' // 行尾无空格
    }
  },

  // 全局变量（浏览器环境 + Node.js）
  {
    languageOptions: {
      globals: {
        // 浏览器环境
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        // 定时器
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        // Web API
        Blob: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        XMLHttpRequest: 'readonly',
        // Node.js (用于 vite.config.js)
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    }
  }
]
