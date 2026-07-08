# 🚀 GitHub 上传指南

## 方法一：手动上传（推荐小白）

### 步骤 1：下载并上传文件

1. 打开 GitHub 仓库页面：
   ```
   https://github.com/new
   ```

2. 创建新仓库：
   - **Repository name**: `c-shot-trainer`
   - **Description**: `C投篮训练助手 - AI篮球投篮分析工具`
   - **选择**: Public（公开）
   - **不要勾选**: Initialize this repository with a README

3. 上传文件：
   - 点击 "uploading an existing file"
   - 拖拽 `shot-trainer` 文件夹中的**所有文件**到上传区域
   - 点击 "Commit changes"

### 步骤 2：启用 GitHub Pages

1. 进入仓库的 **Settings** 页面
2. 左侧菜单找到 **Pages**
3. **Source** 下拉选择: `Deploy from a branch`
4. **Branch** 下拉选择: `main`
5. 点击 **Save**

### 步骤 3：等待部署

等待 1-2 分钟，然后访问：
```
https://BOY147258.github.io/c-shot-trainer/
```

---

## 方法二：使用 Git 命令行

### 步骤 1：打开项目文件夹

在文件资源管理器中打开：
```
D:\谷歌浏览器下载内容\2024.3.1onedrive\OneDrive\桌面\workspace\shot-trainer
```

### 步骤 2：右键打开 Git Bash

在文件夹空白处 **右键** → **Git Bash Here**

### 步骤 3：执行以下命令

```bash
# 1. 检查 Git 状态（应该显示已初始化）
git status

# 2. 配置用户名（改成你的GitHub用户名）
git config user.name "你的GitHub用户名"
git config user.email "你的邮箱"

# 3. 提交代码
git add .
git commit -m "✨ C投篮训练助手 v1.0.0"

# 4. 添加远程仓库
git remote add origin https://github.com/BOY147258/c-shot-trainer.git

# 5. 推送代码（会要求登录GitHub）
git push -u origin main
```

---

## 方法三：使用桌面应用

### 下载 GitHub Desktop

1. 访问 https://desktop.github.com/ 下载安装
2. 登录你的 GitHub 账号
3. **File** → **Add Local Repository**
4. 选择 `shot-trainer` 文件夹
5. **Publish repository** 即可

---

## ✅ 验证部署成功

部署后访问以下地址测试：

| 平台 | 地址 |
|------|------|
| **GitHub Pages** | https://BOY147258.github.io/c-shot-trainer/ |
| **Vercel** | https://c-shot-trainer.vercel.app/ |

---

## 📱 手机端访问

部署成功后，用手机浏览器打开上述地址即可使用！

**注意**: 手机需要 HTTPS 连接，所以必须通过上述部署方式，不能直接打开本地文件。

---

## ❓ 常见问题

### Q: 推送时提示需要登录？
A: 在弹出的浏览器窗口中登录 GitHub 即可

### Q: GitHub Pages 404 错误？
A: 等待 2-5 分钟让部署完成

### Q: 想修改项目名称？
A: Settings → Repository name 修改后，URL 也会变化
