// 分类管理控制器
const { Category } = require('../models');
const { Sequelize } = require('sequelize');

// 获取分类列表
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = '' } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (keyword) {
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${keyword}%` } },
        { description: { [Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (status !== '') {
      where.status = parseInt(status);
    }
    
    // 查询分类列表
    const { count, rows } = await Category.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });
    
    const categories = rows.map(category => {
      const data = category.toJSON();
      return {
        ...data,
        parent_name: data.parent?.name || null,
        parent: undefined
      };
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        items: categories
      }
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 创建分类
const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id, sort_order, status } = req.body;
    
    // 参数验证
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '分类名称不能为空'
      });
    }
    
    // 检查名称是否已存在
    const existingCategory = await Category.findOne({
      where: { name }
    });
    
    if (existingCategory) {
      return res.status(400).json({
        code: 400,
        message: '分类名称已存在'
      });
    }
    
    // 检查父分类是否存在
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (!parentCategory || parentCategory.status === 0) {
        return res.status(400).json({
          code: 400,
          message: '父分类不存在或已禁用'
        });
      }
    }
    
    // 创建分类
    const category = await Category.create({
      name,
      description,
      parent_id,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1,
      created_by: req.userId,
      updated_by: req.userId
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: category
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 更新分类
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, sort_order, status } = req.body;
    
    // 查找分类
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在'
      });
    }
    
    // 检查名称是否已被其他分类使用
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          code: 400,
          message: '分类名称已被其他分类使用'
        });
      }
    }
    
    // 检查父分类是否存在
    if (parent_id !== undefined && parent_id !== category.parent_id) {
      if (parent_id) {
        const parentCategory = await Category.findByPk(parent_id);
        if (!parentCategory || parentCategory.status === 0) {
          return res.status(400).json({
            code: 400,
            message: '父分类不存在或已禁用'
          });
        }
        
        // 检查是否形成循环引用
        if (parent_id === id) {
          return res.status(400).json({
            code: 400,
            message: '不能将自己设置为父分类'
          });
        }
        
        // 检查是否形成循环引用
        const checkCircular = async (currentId, targetId) => {
          const current = await Category.findByPk(currentId);
          if (!current || !current.parent_id) return false;
          if (current.parent_id === targetId) return true;
          return await checkCircular(current.parent_id, targetId);
        };
        
        if (await checkCircular(parent_id, id)) {
          return res.status(400).json({
            code: 400,
            message: '不能形成循环分类结构'
          });
        }
      }
    }
    
    // 更新分类信息
    await category.update({
      name,
      description,
      parent_id,
      sort_order,
      status,
      updated_by: req.userId
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: category
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 删除分类
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找分类
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在'
      });
    }
    
    // 检查是否有子分类
    const children = await Category.count({
      where: { parent_id: id }
    });
    
    if (children > 0) {
      return res.status(400).json({
        code: 400,
        message: '该分类下还有子分类，不能删除'
      });
    }
    
    // 检查是否有物料使用该分类
    const { Material } = require('../models');
    const materialCount = await Material.count({
      where: { category_id: id }
    });
    
    if (materialCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该分类下还有物料，不能删除'
      });
    }
    
    // 删除分类
    await category.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取分类树
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description', 'parent_id', 'sort_order'],
      where: {
        status: 1
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    
    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item.toJSON(),
          children: buildTree(items, item.id)
        }));
    };
    
    const tree = buildTree(categories);
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: tree
    });
  } catch (error) {
    console.error('获取分类树错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
};
};