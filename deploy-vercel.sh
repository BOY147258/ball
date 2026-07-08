#!/bin/bash

# ================================================
#    C投篮训练助手 - Vercel 一键部署脚本
# ================================================

echo "================================================"
echo "   C投篮训练助手 - Vercel 一键部署脚本"
echo "================================================"
echo ""

cd "$(dirname "$0")"

echo "[1/3] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装: https://nodejs.org/"
    read -p "按 Enter 键退出..."
    exit 1
fi
echo "✅ Node.js 已安装 ($(node --version))"

echo ""
echo "[2/3] 安装 Vercel CLI（如果尚未安装）..."
npm install -g vercel

echo ""
echo "[3/3] 启动 Vercel 部署..."
echo ""
echo "📝 请在浏览器中完成 Vercel 登录授权"
echo ""

vercel --prod

echo ""
echo "================================================"
echo "   部署完成！"
echo "================================================"
echo ""
echo "📌 下次部署只需运行: vercel --prod"
echo ""
