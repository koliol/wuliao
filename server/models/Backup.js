// 备份模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Backup = sequelize.define('Backup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文件大小(字节)'
  },
  type: {
    type: DataTypes.ENUM('full', 'incremental'),
    allowNull: false,
    defaultValue: 'full',
    comment: 'full:全量备份, incremental:增量备份'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'pending:等待中, completed:已完成, failed:失败'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'backups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Backup;