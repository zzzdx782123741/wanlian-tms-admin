# 万联驿站TMS - Web管理后台

## 技术栈

- Vue 3
- Vite
- Element Plus
- Vue Router
- Pinia
- Axios
- ECharts

## 安装依赖

```bash
cd web-admin
npm install
```

## 运行开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

## 构建生产版本

```bash
npm run build
```

## 功能模块

### 平台运营
- 首页仪表盘
- 车队管理
- 门店管理
- 订单监控

### 车队管理
- 首页仪表盘
- 车辆管理
- 订单管理（审批、支付）
- 账户管理（充值、交易记录）

## 测试账号

在登录页面可以使用快捷选择按钮选择测试角色：

- 司机：driver_openid_001
- 车队管理员：fleet_openid_001
- 门店技师：tech_openid_001
- 平台运营：operator_openid_001

## 开发说明

1. Web 后台通过代理访问后端 API（已配置在 vite.config.js）
2. 登录后根据角色显示不同的菜单
3. 部分功能仍在开发中
