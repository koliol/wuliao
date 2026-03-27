// 启动文件
const { app, initDatabase } = require('./app');
require('dotenv').config();

// 服务器端口
const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器启动成功，监听端口: ${PORT}`);
      console.log(`API文档地址: http://localhost:${PORT}/api-docs`);
      console.log(`健康检查地址: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();