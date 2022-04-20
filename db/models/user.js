'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    emailAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    hashedPassword: {
      type: DataTypes.STRING.BINARY,
      allowNull: false
    },
    hashedPassword: {
      type: DataTypes.STRING.BINARY,
      allowNull: false
    },
    portfolioCoins: {
      type: DataTypes.JSON,
      allowNull: true
    },
    favoriteCoins: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {});
  User.associate = function (models) {
    // associations can be defined here
  };
  return User;
};