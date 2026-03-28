// 物料管理控制器
const { Material, Inventory, Category } = require('../models');
const { Sequelize } = require('sequelize');

// 获取物料列表
const getMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', category = '' } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (keyword) {
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${keyword}%` } },
        { specification: { [Sequelize.Op.like]: `%${keyword}%` } },
        { id: { [Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (category) {
      where.category_id = parseInt(category);
    }
    
    // 查询物料列表
    const { count, rows } = await Material.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          where: { status: 1 }
        }
      ]
    });
    
    // 获取每个物料的总库存
    const materialsWithStock = await Promise.all(rows.map(async (material) => {
      const inventory = await Inventory.findOne({
        where: { material_id: material.id },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_stock']]
      });
      
      return {
        ...material.toJSON(),
        total_stock: inventory?.get('total_stock') || 0
      };
    }));
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        items: materialsWithStock
      }
    });
  } catch (error) {
    console.error('获取物料列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 创建物料
const createMaterial = async (req, res) => {
  try {
    const { name, category_id, specification, unit, manufacturer, barcode, sku, sn, min_stock, remark } = req.body;
    
    // 参数验证
    if (!name || !category_id || !unit) {
      return res.status(400).json({
        code: 400,
        message: '物料名称、分类和单位不能为空'
      });
    }
    
    // 检查分类是否存在
    const category = await Category.findByPk(category_id);
    if (!category || category.status === 0) {
      return res.status(400).json({
        code: 400,
        message: '所选分类不存在或已禁用'
      });
    }
    
    // 生成物料编号
    const lastMaterial = await Material.findOne({
      order: [['id', 'DESC']]
    });
    
    let newId;
    if (lastMaterial) {
      const lastId = parseInt(lastMaterial.id.substring(1));
      newId = 'M' + String(lastId + 1).padStart(3, '0');
    } else {
      newId = 'M001';
    }
    
    // 检查条码是否已存在
    if (barcode) {
      const existingBarcode = await Material.findOne({
        where: { barcode }
      });
      
      if (existingBarcode) {
        return res.status(400).json({
          code: 400,
          message: '条码已存在'
        });
      }
    }
    
    // 检查货号是否已存在
    if (sku) {
      const existingSku = await Material.findOne({
        where: { sku }
      });
      
      if (existingSku) {
        return res.status(400).json({
          code: 400,
          message: '货号已存在'
        });
      }
    }
    
    // 检查SN号是否已存在
    if (sn) {
      const existingSn = await Material.findOne({
        where: { sn }
      });
      
      if (existingSn) {
        return res.status(400).json({
          code: 400,
          message: 'SN号已存在'
        });
      }
    }
    
    // 创建物料
    const material = await Material.create({
      id: newId,
      name,
      category_id,
      specification,
      unit,
      manufacturer,
      barcode,
      sku,
      sn,
      min_stock,
      remark,
      created_by: req.userId,
      updated_by: req.userId
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: material
    });
  } catch (error) {
    console.error('创建物料错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 更新物料
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, specification, unit, manufacturer, barcode, sku, sn, min_stock, remark } = req.body;
    
    // 查找物料
    const material = await Material.findByPk(id);
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在'
      });
    }
    
    // 检查分类是否存在
    if (category_id && category_id !== material.category_id) {
      const category = await Category.findByPk(category_id);
      if (!category || category.status === 0) {
        return res.status(400).json({
          code: 400,
          message: '所选分类不存在或已禁用'
        });
      }
    }
    
    // 检查条码是否已被其他物料使用
    if (barcode && barcode !== material.barcode) {
      const existingBarcode = await Material.findOne({
        where: {
          barcode,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingBarcode) {
        return res.status(400).json({
          code: 400,
          message: '条码已被其他物料使用'
        });
      }
    }
    
    // 检查货号是否已被其他物料使用
    if (sku && sku !== material.sku) {
      const existingSku = await Material.findOne({
        where: {
          sku,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingSku) {
        return res.status(400).json({
          code: 400,
          message: '货号已被其他物料使用'
        });
      }
    }
    
    // 检查SN号是否已被其他物料使用
    if (sn && sn !== material.sn) {
      const existingSn = await Material.findOne({
        where: {
          sn,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingSn) {
        return res.status(400).json({
          code: 400,
          message: 'SN号已被其他物料使用'
        });
      }
    }
    
    // 更新物料信息
    await material.update({
      name,
      category_id,
      specification,
      unit,
      manufacturer,
      barcode,
      sku,
      sn,
      min_stock,
      remark,
      updated_by: req.userId
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: material
    });
  } catch (error) {
    console.error('更新物料错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 删除物料
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找物料
    const material = await Material.findByPk(id);
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在'
      });
    }
    
    // 检查是否有库存
    const inventory = await Inventory.findOne({
      where: { material_id: id }
    });
    
    if (inventory && inventory.quantity > 0) {
      return res.status(400).json({
        code: 400,
        message: '该物料还有库存，不能删除'
      });
    }
    
    // 删除物料
    await material.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除物料错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取物料分类
const getMaterialCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description', 'parent_id', 'sort_order'],
      where: {
        status: 1
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: categories
    });
  } catch (error) {
    console.error('获取物料分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories
};