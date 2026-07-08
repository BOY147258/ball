@echo off
chcp 65001 > nul
echo ================================================
echo    C投篮训练助手 - Vercel 一键部署脚本
echo ================================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [2/3] 安装 Vercel CLI（如果尚未安装）...
npm install -g vercel --silent 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ 安装 Vercel CLI 失败，尝试继续...
)

echo.
echo [3/3] 启动 Vercel 部署...
echo.
echo 📝 请在浏览器中完成 Vercel 登录授权
echo.
vercel --prod

echo.
echo ================================================
echo    部署完成！
echo ================================================
echo.
echo 📌 下次部署只需运行: vercel --prod
echo.
pause
