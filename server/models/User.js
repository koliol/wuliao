// 用户模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: '用户名不能为空'
      },
      len: {
        args: [3, 50],
        msg: '用户名长度必须在3-50个字符之间'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '密码不能为空'
      },
      len: {
        args: [6, 255],
        msg: '密码长度必须在6-255个字符之间'
      }
    },
    // 密码加密
    set(value) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      this.setDataValue('password', hash);
    }
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    validate: {
      isEmail: {
        msg: '邮箱格式不正确'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'operator', 'viewer'),
    allowNull: false,
    defaultValue: 'operator'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '姓名不能为空'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0:禁用, 1:启用'
  },
  last_login_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // 创建前钩子
    beforeCreate: (user) => {
      console.log('创建用户:', user.username);
    },
    // 更新前钩子
    beforeUpdate: (user) => {
      console.log('更新用户:', user.username);
    }
  }
});

// 验证密码
User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// 获取用户权限
User.prototype.getPermissions = async function() {
  // 根据用户角色返回相应权限
  const permissions = {
    admin: [
      'user:view', 'user:create', 'user:edit', 'user:delete', 'user:reset_password',
      'material:view', 'material:create', 'material:edit', 'material:delete', 'material:import', 'material:export',
      'warehouse:view', 'warehouse:create', 'warehouse:edit', 'warehouse:delete',
      'inventory:view', 'inventory:adjust', 'inventory:export',
      'transaction:inbound', 'transaction:outbound', 'transaction:transfer', 'transaction:view', 'transaction:export',
      'report:view', 'report:export',
      'system:backup', 'system:restore', 'system:setting'
    ],
    manager: [
      'material:view', 'material:create', 'material:edit', 'material:delete', 'material:import', 'material:export',
      'warehouse:view', 'warehouse:create', 'warehouse:edit', 'warehouse:delete',
      'inventory:view', 'inventory:adjust', 'inventory:export',
      'transaction:inbound', 'transaction:outbound', 'transaction:transfer', 'transaction:view', 'transaction:export',
      'report:view', 'report:export'
    ],
    operator: [
      'material:view',
      'warehouse:view',
      'inventory:view',
      'transaction:inbound', 'transaction:outbound', 'transaction:transfer', 'transaction:view'
    ],
    viewer: [
      'material:view',
      'warehouse:view',
      'inventory:view',
      'transaction:view',
      'report:view'
    ]
  };
  
  return permissions[this.role] || [];
};

module.exports = User;