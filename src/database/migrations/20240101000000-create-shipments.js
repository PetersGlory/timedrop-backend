'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Shipments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending'
      },
      packageType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      dimensions: {
        type: Sequelize.JSON,
        allowNull: false
      },
      pickupAddress: {
        type: Sequelize.JSON,
        allowNull: false
      },
      deliveryAddress: {
        type: Sequelize.JSON,
        allowNull: false
      },
      scheduledPickupTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      estimatedDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      trackingNumber: {
        type: Sequelize.STRING,
        unique: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('Shipments', ['userId']);
    await queryInterface.addIndex('Shipments', ['trackingNumber']);
    await queryInterface.addIndex('Shipments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Shipments');
  }
};