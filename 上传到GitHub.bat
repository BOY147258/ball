@echo off
chcp 65001 > nul
echo.
echo ================================================
echo    C投篮训练助手 - GitHub 上传脚本
echo ================================================
echo.

cd /d "%~dp0"

echo [1/5] 检查 Git 是否安装...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Git，请先安装: https://git-scm.com/
    pause
    exit /b 1
)
echo ✅ Git 已安装

echo.
echo [2/5] 初始化 Git 仓库...
if not exist ".git" (
    git init
)
echo ✅ Git 仓库已初始化

echo.
echo [3/5] 配置 Git（请修改为你的用户名和邮箱）...
set /p username=请输入你的GitHub用户名:
git config user.name "%username%"
git config user.email "%username%@github.com"

echo.
echo [4/5] 添加文件并提交...
git add .
git commit -m "✨ C投篮训练助手 v1.0.0 - AI篮球投篮分析工具"

echo.
echo [5/5] 创建远程仓库并推送...
echo.
echo 📝 请先在 GitHub 上创建空仓库:
echo    1. 访问 https://github.com/new
echo    2. Repository name 输入: c-shot-trainer
echo    3. 选择 Public
echo    4. 点击 Create repository
echo.
echo    不要勾选任何初始化选项！
echo.
set /p repourl=请粘贴创建的仓库地址（类似 https://github.com/用户名/c-shot-trainer.git）:

git remote add origin %repourl%
git branch -M main
git push -u origin main

echo.
echo ================================================
echo    🎉 上传完成！
echo ================================================
echo.
echo 📌 接下来启用 GitHub Pages:
echo    1. 打开仓库页面
echo    2. 进入 Settings
echo    3. 找到 Pages 菜单
echo    4. Source 选择 "main branch"
echo    5. 点击 Save
echo.
echo 📌 部署到 Vercel（可选）:
echo    运行: vercel --prod
echo.
pause
