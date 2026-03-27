# 出入库管理系统部署指南

## 系统概述

本出入库管理系统是一个基于 Node.js + Express + MySQL 的 Web 应用，用于高效管理实验及工作中使用物料的出入库流程，提供实时库存数据，并根据库存情况进行采购。

## 环境要求

### 服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+) 或 Windows Server
- **Node.js**: 16.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **MySQL**: 5.7 或更高版本

### 推荐配置
- **CPU**: 2核或更高
- **内存**: 4GB 或更高
- **存储**: 20GB 或更高
- **网络**: 稳定的互联网连接

## 部署步骤

### 1. 准备工作

#### 1.1 安装 Node.js 和 npm

**Ubuntu/Debian**:
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 和 npm
sudo apt install nodejs npm

# 检查版本
node -v
npm -v
```

**CentOS/RHEL**:
```bash
# 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 检查版本
node -v
npm -v
```

**Windows**:
从 [Node.js 官网](https://nodejs.org/) 下载并安装最新版本。

#### 1.2 安装和配置 MySQL

**Ubuntu/Debian**:
```bash
# 安装 MySQL
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 运行安全配置
sudo mysql_secure_installation
```

**CentOS/RHEL**:
```bash
# 安装 MySQL
sudo yum install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysqld

# 设置开机自启
sudo systemctl enable mysqld

# 运行安全配置
sudo mysql_secure_installation
```

**Windows**:
从 [MySQL 官网](https://dev.mysql.com/downloads/installer/) 下载并安装。

### 2. 项目部署

#### 2.1 上传项目文件

将项目文件上传到服务器的目标目录，例如 `/var/www/inventory-management-system`。

**使用 FTP/SFTP**:
通过 FileZilla 等工具上传项目文件。

**使用 Git**:
```bash
# 克隆项目（如果有 Git 仓库）
git clone https://github.com/yourusername/inventory-management-system.git
cd inventory-management-system
```

#### 2.2 安装依赖

```bash
# 进入项目目录
cd /path/to/inventory-management-system

# 安装项目依赖
npm install --production
```

#### 2.3 配置环境变量

```bash
# 复制环境变量配置文件
cp .env.example .env

# 编辑环境变量配置
nano .env
```

在 `.env` 文件中配置以下内容：

```env
# 数据库连接信息
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=inventory_management
DB_PORT=3306

# 应用配置
APP_PORT=3000
APP_SECRET=your_jwt_secret_key
APP_ENV=production

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 跨域配置
CORS_ORIGIN=*
```

#### 2.4 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户并授权
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON inventory_management.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;

# 退出 MySQL
EXIT;
```

#### 2.5 运行数据库迁移

```bash
# 运行数据库迁移
npm run db:migrate

# 初始化基础数据
npm run db:seed
```

### 3. 启动应用

#### 3.1 使用 PM2 管理进程（推荐）

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/server.js --name "inventory-system"

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 status
```

#### 3.2 直接启动（开发环境）

```bash
# 启动应用
npm start
```

### 4. 配置反向代理（可选）

如果需要通过域名访问，可以配置 Nginx 或 Apache 作为反向代理。

#### 4.1 Nginx 配置

```bash
# 安装 Nginx
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL

# 创建配置文件
sudo nano /etc/nginx/sites-available/inventory-system
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/inventory-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 4.2 配置 HTTPS（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx  # CentOS/RHEL

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 5. 访问系统

完成部署后，可以通过以下方式访问系统：

- **直接访问**: http://your-server-ip:3000
- **域名访问**: http://your-domain.com（如果配置了反向代理）
- **HTTPS 访问**: https://your-domain.com（如果配置了 SSL）

默认登录账号：
- **用户名**: admin
- **密码**: admin123

## 维护和管理

### 查看日志

```bash
# 使用 PM2 查看日志
pm2 logs inventory-system

# 或者查看应用日志文件
tail -f /path/to/inventory-management-system/logs/app.log
```

### 更新应用

```bash
# 进入项目目录
cd /path/to/inventory-management-system

# 拉取最新代码（如果使用 Git）
git pull

# 安装新依赖
npm install --production

# 运行数据库迁移（如果有更新）
npm run db:migrate

# 重启应用
pm2 restart inventory-system
```

### 备份数据

```bash
# 备份数据库
mysqldump -u root -p inventory_management > inventory_backup_$(date +%Y%m%d).sql

# 备份项目文件
tar -czvf inventory_project_$(date +%Y%m%d).tar.gz /path/to/inventory-management-system
```

### 恢复数据

```bash
# 恢复数据库
mysql -u root -p inventory_management < inventory_backup.sql

# 恢复项目文件
tar -xzvf inventory_project.tar.gz -C /path/to/
```

## 常见问题处理

### 1. 数据库连接失败

**问题**: 应用无法连接到数据库。

**解决方案**:
- 检查数据库服务是否正在运行
- 验证 `.env` 文件中的数据库配置是否正确
- 确保数据库用户有足够的权限
- 检查防火墙是否允许数据库连接

### 2. 端口被占用

**问题**: 启动应用时提示端口已被占用。

**解决方案**:
- 修改 `.env` 文件中的 `APP_PORT` 为其他可用端口
- 或者停止占用该端口的进程

```bash
# 查看占用端口的进程
lsof -i :3000

# 停止占用端口的进程
kill -9 <PID>
```

### 3. 权限问题

**问题**: 应用无法读写文件或创建目录。

**解决方案**:
- 检查文件和目录的权限
- 确保应用运行用户有足够的权限

```bash
# 设置正确的权限
chown -R www-data:www-data /path/to/inventory-management-system
chmod -R 755 /path/to/inventory-management-system
```

### 4. 内存不足

**问题**: 应用因内存不足而崩溃。

**解决方案**:
- 增加服务器内存
- 优化应用配置，减少内存使用
- 配置交换空间

```bash
# 创建交换空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 5. 登录失败

**问题**: 无法使用默认账号登录。

**解决方案**:
- 检查用户名和密码是否正确
- 验证数据库中用户表是否存在
- 检查 JWT 配置是否正确

## 性能优化建议

1. **使用连接池**: 确保数据库连接使用连接池
2. **启用缓存**: 对频繁访问的数据使用缓存
3. **优化查询**: 为常用查询添加索引
4. **使用负载均衡**: 对于高流量场景，考虑使用负载均衡
5. **定期清理**: 定期清理日志文件和临时文件

## 安全建议

1. **定期更新**: 定期更新依赖包和系统
2. **使用 HTTPS**: 始终使用 HTTPS 保护数据传输
3. **强密码策略**: 实施强密码策略
4. **定期备份**: 定期备份数据库和配置文件
5. **限制访问**: 使用防火墙限制不必要的访问
6. **监控日志**: 定期检查应用日志，及时发现异常

## 联系方式

如果在部署过程中遇到问题，请联系：
- **邮箱**: your-email@example.com
- **技术支持**: tech-support@example.com

---

**文档版本**: 1.0.0  
**最后更新**: 2024-01-01
