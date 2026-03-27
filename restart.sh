#!/bin/bash

echo "正在重启出入库管理系统..."

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "错误: PM2 未安装，请先安装 PM2: npm install -g pm2"
    exit 1
fi

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 停止现有进程
echo "停止现有进程..."
pm2 stop inventory-system 2>/dev/null || echo "未找到运行中的进程"

# 等待进程停止
sleep 2

# 启动应用
echo "启动应用..."
pm2 start server/server.js --name "inventory-system"

# 显示状态
echo ""
echo "应用已启动！"
echo "运行状态:"
pm2 status inventory-system

echo ""
echo "查看日志:"
echo "pm2 logs inventory-system"

echo ""
echo "重启成功！系统正在运行中..."