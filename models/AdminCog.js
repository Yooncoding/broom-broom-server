const Sequelize = require("sequelize");

module.exports = class AdminCog extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        type: {
          type: Sequelize.ENUM("refund", "charge"),
          allowNull: false,
        },
        account: {
          type: Sequelize.STRING(40),
          allowNull: true,
        },
        bankName: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        amount: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("basic", "stop"),
          allowNull: false,
          defaultValue: "basic",
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "AdminCog",
        tableName: "adminCogs",
        paranoid: true,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    db.AdminCog.belongsTo(db.User, { foreignKey: "userId", targetKey: "id" });
  }
};
