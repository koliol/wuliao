// 主应用文件
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { testConnection } = require('./config/db');
const { sequelize } = require('./config/db');
const path = require('path');

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet());

// CORS中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));

// 解析URL编码请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  
  // 数据库错误
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      code: 500,
      message: '数据库操作错误'
    });
  }
  
  // 验证错误
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      code: 400,
      message: messages.join(', ')
    });
  }
  
  // 默认错误
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

// 初始化数据库
const initDatabase = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 自动迁移数据库表
    await sequelize.sync({ alter: true });
    console.log('数据库迁移完成');
    
    // 创建默认管理员用户（如果不存在）
    const { User } = require('./models');
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@example.com',
        role: 'admin',
        status: 1
      });
      console.log('默认管理员用户创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

module.exports = {
  app,
  initDatabase
};