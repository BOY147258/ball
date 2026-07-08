# 🏀 C投篮训练助手 - C Shot Trainer

> AI 驱动的篮球投篮训练工具，实时检测进球、统计命中率、投篮热力图分析

[English](README_EN.md) | 简体中文

---

## ✨ 功能特点

| 功能 | 描述 |
|------|------|
| 🎯 **AI投篮检测** | 使用 TensorFlow.js + COCO-SSD 智能检测篮球轨迹 |
| 🧍 **姿态检测** | MediaPipe Pose 实时追踪投篮动作 |
| 📊 **实时统计** | 命中数/投篮数/命中率 实时更新 |
| 📈 **投篮热力图** | Canvas 可视化投篮点分布（绿勾=命中，红叉=未命中） |
| ⏱️ **练习计时** | 自动记录练习时长 |
| 📥 **数据导出** | 支持导出 JSON 格式详细数据 |
| 📱 **响应式设计** | 支持手机和电脑浏览器 |
| 🔒 **隐私安全** | 所有处理在本地完成，数据不上传 |

---

## 🚀 快速开始

### 在线使用（推荐）

直接访问部署好的在线版本：
- **Vercel**: `https://c-shot-trainer.vercel.app/`
- **GitHub Pages**: `https://BOY147258.github.io/c-shot-trainer/`

### 本地运行

```bash
# 方法1: Python 简易服务器
cd shot-trainer
python -m http.server 8000
# 访问 http://localhost:8000

# 方法2: 使用 VS Code Live Server 插件
# 右键 index.html → Open with Live Server

# 方法3: Node.js
npx serve .
```

---

## 📖 使用教程

### 1. 打开应用

在浏览器中打开 `index.html`（推荐使用 Chrome/Edge/Safari）

### 2. 加载 AI 模型

首次使用会自动加载 AI 模型（约 10-15MB），请保持网络连接

### 3. 开启摄像头

点击「开启摄像头」按钮，允许浏览器访问摄像头权限

### 4. 标记篮筐位置

点击「标记篮筐位置」，然后在视频画面中点击篮筐的中心点

### 5. 开始投篮练习

- 系统会自动识别投篮动作
- 检测到投篮后会弹出确认窗口，请确认命中或未命中
- 实时查看统计数据和热力图

### 6. 查看分析

- **左侧统计面板**：投篮数、命中率、连胜数
- **投篮热力图**：查看投篮点分布，分析投篮区域强弱

### 7. 导出数据

点击「导出数据」下载 JSON 格式的详细记录

---

## 📷 摄像头设置建议

| 设置项 | 建议值 | 说明 |
|--------|--------|------|
| **拍摄角度** | 侧面45度 | 能同时看到投手和篮筐 |
| **拍摄距离** | 3-5米 | 确保投篮区域在画面内 |
| **架设高度** | 1-1.5米 | 与投篮者视线平齐 |
| **光线条件** | 光线充足 | 避免逆光，推荐阴天或室内 |
| **篮球颜色** | 标准橙色 | AI 检测效果最佳 |

---

## 🛠️ 技术架构

### 前端技术

- **HTML5 + CSS3 + Vanilla JavaScript** - 无需框架
- **TensorFlow.js** + **COCO-SSD** - 篮球检测
- **MediaPipe Pose** - 人体姿态追踪
- **Canvas API** - 热力图绘制
- **Chart.js** - 统计图表

### AI 检测流程

```
摄像头视频流
    ↓
┌─────────────────┐
│  TensorFlow.js  │ → 检测篮球位置
│    COCO-SSD     │
└─────────────────┘
    ↓
┌─────────────────┐
│  MediaPipe Pose │ → 检测人体姿态
│   33个关键点    │
└─────────────────┘
    ↓
┌─────────────────┐
│   投篮状态机    │ → 分析投篮动作
│ (IDLE→SHOOTING) │
└─────────────────┘
    ↓
┌─────────────────┐
│   进球判定      │ → 轨迹穿过篮筐
└─────────────────┘
    ↓
📊 统计数据更新
🗺️ 热力图更新
```

### 模块结构

```
js/
├── detection.js       # AI 模型检测（球 + 人体姿态）
├── shotAnalyzer.js    # 投篮状态机分析
├── courtMapper.js     # 坐标映射（屏幕→场地）
├── statistics.js      # 数据统计和导出
├── visualization.js   # 可视化（饼图 + 热力图）
├── videoProcessor.js  # 视频帧处理循环
└── app.js             # 主应用程序
```

---

## 🌐 部署指南

### Vercel 部署（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd shot-trainer
vercel --prod
```

### Netlify 部署

1. 访问 https://app.netlify.com/drop
2. 拖拽 `shot-trainer` 文件夹
3. 完成部署！

### GitHub Pages 部署

```bash
# 1. Fork 或克隆本仓库
git clone https://github.com/BOY147258/c-shot-trainer.git
cd c-shot-trainer

# 2. 推送代码到 GitHub
git push origin main

# 3. 启用 GitHub Pages
# Settings → Pages → Source: main branch → Save
```

### 一键部署脚本

```bash
# Windows
.\deploy-vercel.bat

# Mac/Linux
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

---

## 📱 手机端使用

### 重要提示

手机浏览器访问摄像头需要 **HTTPS** 连接！

### 解决方案

| 方法 | 说明 |
|------|------|
| **部署到 Vercel** | 自动获得 HTTPS 地址 ✅ |
| **部署到 Netlify** | 自动获得 HTTPS 地址 ✅ |
| **使用 ngrok** | 本地 HTTPS 穿透 |

### ngrok 本地穿透

```bash
# 安装 ngrok
npm install -g ngrok

# 启动本地服务器
python -m http.server 8000

# 另开终端，运行 ngrok
ngrok http 8000

# 使用 ngrok 提供的 HTTPS 地址访问
```

---

## 🔧 配置选项

### 调整检测灵敏度

编辑 `js/shotAnalyzer.js` 中的参数：

```javascript
const TIMEOUT = {
    PREPARING: 3000,    // 准备状态超时（毫秒）
    BALL_IN_AIR: 5000,  // 球在空中超时
    EVALUATING: 1000    // 评估状态超时
};
```

### 修改 AI 模型

编辑 `js/detection.js`：

```javascript
// 使用不同精度的模型
cocoModel = await cocoSsd.load({
    base: 'lite_mobilenet_v2'  // 轻量快速
    // 或 'mobilenet_v2'        // 更高精度
    // 或 'resnet50'            // 最高精度（较慢）
});
```

---

## 📝 更新日志

### v1.0.0 (2024-07-08)
- ✨ 首次发布
- 🎯 AI 篮球检测（COCO-SSD）
- 🧍 人体姿态追踪（MediaPipe Pose）
- 📊 实时投篮统计
- 🗺️ 投篮热力图
- ⏱️ 练习计时器
- 📥 数据导出功能

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [TensorFlow.js](https://www.tensorflow.org/js) - 机器学习框架
- [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) - 物体检测模型
- [MediaPipe](https://google.github.io/mediapipe/) - 人体姿态检测
- [Chart.js](https://www.chartjs.org/) - 统计图表库

---

## 📞 联系作者

- **GitHub**: [BOY147258](https://github.com/BOY147258)
- **项目地址**: https://github.com/BOY147258/c-shot-trainer

---

**🏀 祝你的投篮训练越来越进步！**
