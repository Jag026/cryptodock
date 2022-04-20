'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [
      {
        emailAddress: 'bb@baggins.com',
        firstName: 'Bilbo',
        lastName: 'Baggins',
        hashedPassword: bcrypt.hashSync('Password1!', 10),
        portfolioCoins: '{"BTC": "100"}',
        favoriteCoins: '["BTC", "ETH"]',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};