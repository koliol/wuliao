// 备份恢复控制器
const { Backup, User } = require('../models');
const { sequelize } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 备份目录
const BACKUP_DIR = path.join(__dirname, '../../backups');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 获取备份列表
const getBackups = async (req, res) => {
  try {
    const backups = await Backup.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'name'],
        as: 'creator'
      }]
    });
    
    const backupList = backups.map(backup => {
      const data = backup.toJSON();
      return {
        ...data,
        creator_name: data.creator?.name || '',
        size_formatted: formatFileSize(data.size),
        creator: undefined
      };
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: backupList
    });
  } catch (error) {
    console.error('获取备份列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 创建备份
const createBackup = async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    const userId = req.userId;
    
    // 创建备份记录
    const backup = await Backup.create({
      filename: '',
      filepath: '',
      size: 0,
      type,
      status: 'pending',
      created_by: userId
    });
    
    // 异步执行备份
    createBackupAsync(backup.id, type, userId)
      .then(result => {
        console.log('备份成功:', result);
      })
      .catch(error => {
        console.error('备份失败:', error);
      });
    
    return res.json({
      code: 200,
      message: '备份任务已创建，正在后台执行',
      data: {
        id: backup.id,
        type: backup.type,
        status: backup.status,
        created_at: backup.created_at
      }
    });
  } catch (error) {
    console.error('创建备份任务错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 异步创建备份
const createBackupAsync = async (backupId, type, userId) => {
  try {
    // 更新备份状态为执行中
    await Backup.update({
      status: 'executing'
    }, {
      where: { id: backupId }
    });
    
    // 生成备份文件名
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    const filename = `backup_${type}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // 获取数据库配置
    const config = sequelize.config;
    
    // 构建mysqldump命令
    const cmd = `mysqldump -h ${config.host} -P ${config.port} -u ${config.username} ${config.password ? `-p"${config.password}"` : ''} ${config.database} > "${filepath}"`;
    
    // 执行备份命令
    await execAsync(cmd);
    
    // 获取文件大小
    const stats = fs.statSync(filepath);
    
    // 更新备份记录
    await Backup.update({
      filename,
      filepath,
      size: stats.size,
      status: 'completed'
    }, {
      where: { id: backupId }
    });
    
    return {
      id: backupId,
      filename,
      size: stats.size
    };
  } catch (error) {
    // 更新备份状态为失败
    await Backup.update({
      status: 'failed'
    }, {
      where: { id: backupId }
    });
    
    throw error;
  }
};

// 恢复数据
const restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找备份记录
    const backup = await Backup.findByPk(id);
    
    if (!backup) {
      return res.status(404).json({
        code: 404,
        message: '备份文件不存在'
      });
    }
    
    if (backup.status !== 'completed') {
      return res.status(400).json({
        code: 400,
        message: '备份文件未完成，不能恢复'
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(backup.filepath)) {
      return res.status(404).json({
        code: 404,
        message: '备份文件不存在'
      });
    }
    
    // 异步执行恢复
    restoreBackupAsync(backup.id, backup.filepath)
      .then(result => {
        console.log('恢复成功:', result);
      })
      .catch(error => {
        console.error('恢复失败:', error);
      });
    
    return res.json({
      code: 200,
      message: '恢复任务已创建，正在后台执行',
      data: {
        task_id: `RT${Date.now()}`,
        backup_id: backup.id,
        status: 'pending',
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('创建恢复任务错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 异步恢复数据
const restoreBackupAsync = async (backupId, filepath) => {
  try {
    // 获取数据库配置
    const config = sequelize.config;
    
    // 构建mysql命令
    const cmd = `mysql -h ${config.host} -P ${config.port} -u ${config.username} ${config.password ? `-p"${config.password}"` : ''} ${config.database} < "${filepath}"`;
    
    // 执行恢复命令
    await execAsync(cmd);
    
    return {
      backup_id: backupId,
      status: 'completed'
    };
  } catch (error) {
    console.error('恢复数据失败:', error);
    throw error;
  }
};

// 删除备份
const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找备份记录
    const backup = await Backup.findByPk(id);
    
    if (!backup) {
      return res.status(404).json({
        code: 404,
        message: '备份文件不存在'
      });
    }
    
    // 删除文件
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath);
    }
    
    // 删除备份记录
    await backup.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除备份错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup
};