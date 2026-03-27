// 物料分类模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: '分类名称不能为空'
      },
      len: {
        args: [1, 50],
        msg: '分类名称长度必须在1-50个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.STRING(200),
    validate: {
      len: {
        args: [0, 200],
        msg: '分类描述长度不能超过200个字符'
      }
    }
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: '父分类ID，用于创建层级分类',
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_parent_id',
      fields: ['parent_id']
    },
    {
      name: 'idx_status',
      fields: ['status']
    }
  ],
  hooks: {
    // 创建前钩子
    beforeCreate: (category) => {
      console.log('创建分类:', category.name);
    },
    // 更新前钩子
    beforeUpdate: (category) => {
      console.log('更新分类:', category.name);
    }
  }
});

// 定义自关联关系
Category.hasMany(Category, { 
  as: 'children', 
  foreignKey: 'parent_id',
  onDelete: 'SET NULL'
});
Category.belongsTo(Category, { 
  as: 'parent', 
  foreignKey: 'parent_id'
});

module.exports = Category;