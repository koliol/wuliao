// 模型索引文件
const User = require('./User');
const Category = require('./Category');
const Material = require('./Material');
const Warehouse = require('./Warehouse');
const Inventory = require('./Inventory');
const Transaction = require('./Transaction');
const Backup = require('./Backup');

// 定义模型关系
Category.hasMany(Material, { foreignKey: 'category_id' });
Material.hasMany(Inventory, { foreignKey: 'material_id' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });
Material.hasMany(Transaction, { foreignKey: 'material_id' });
Warehouse.hasMany(Transaction, { foreignKey: 'from_warehouse_id' });
Warehouse.hasMany(Transaction, { foreignKey: 'to_warehouse_id' });
User.hasMany(Transaction, { foreignKey: 'operator_id' });
User.hasMany(Backup, { foreignKey: 'created_by' });

// 关联查询
Material.belongsTo(Category, { foreignKey: 'category_id' });
Inventory.belongsTo(Material, { foreignKey: 'material_id' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
Transaction.belongsTo(Material, { foreignKey: 'material_id' });
Transaction.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
Transaction.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
Transaction.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

module.exports = {
  User,
  Category,
  Material,
  Warehouse,
  Inventory,
  Transaction,
  Backup
};