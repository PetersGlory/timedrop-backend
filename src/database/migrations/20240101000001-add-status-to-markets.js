'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Markets', 'status', {
      type: Sequelize.ENUM('Open', 'closed', 'archieve'),
      defaultValue: 'Open',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Markets', 'status');
  }
};
