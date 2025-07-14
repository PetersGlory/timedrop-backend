'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" LIMIT 5;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.warn('No users found for creating demo shipments');
      return;
    }

    const shipments = [];
    const packageTypes = ['standard', 'express', 'priority'];
    const statuses = ['pending', 'picked_up', 'in_transit', 'delivered'];

    for (let i = 0; i < 20; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const scheduledPickupTime = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      const estimatedDeliveryTime = new Date(scheduledPickupTime.getTime() + 3 * 24 * 60 * 60 * 1000);

      shipments.push({
        id: Sequelize.literal('uuid_generate_v4()'),
        userId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        packageType: packageTypes[Math.floor(Math.random() * packageTypes.length)],
        weight: (Math.random() * 20 + 1).toFixed(2),
        dimensions: {
          length: Math.floor(Math.random() * 50 + 10),
          width: Math.floor(Math.random() * 40 + 10),
          height: Math.floor(Math.random() * 30 + 10)
        },
        pickupAddress: {
          street: '123 Pickup St',
          city: 'Pickup City',
          state: 'PS',
          zipCode: '12345',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060
        },
        deliveryAddress: {
          street: '456 Delivery Ave',
          city: 'Delivery City',
          state: 'DS',
          zipCode: '67890',
          country: 'USA',
          latitude: 34.0522,
          longitude: -118.2437
        },
        scheduledPickupTime,
        estimatedDeliveryTime,
        trackingNumber: `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        price: (Math.random() * 100 + 50).toFixed(2),
        notes: 'Demo shipment for testing',
        images: [
          'https://example.com/demo-image-1.jpg',
          'https://example.com/demo-image-2.jpg'
        ],
        createdAt,
        updatedAt: createdAt
      });
    }

    await queryInterface.bulkInsert('Shipments', shipments);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Shipments', null, {});
  }
};