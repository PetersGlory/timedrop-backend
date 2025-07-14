const axios = require('axios');

class RateService {
  constructor() {
    this.baseRates = {
      standard: 10.00,  // Base rate for standard shipping
      express: 20.00,   // Base rate for express shipping
      priority: 30.00   // Base rate for priority shipping
    };

    this.weightMultiplier = 0.5;  // Additional cost per kg
    this.distanceMultiplier = 0.1; // Additional cost per km
  }

  async calculateDistance(origin, destination) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: `${origin.latitude},${origin.longitude}`,
          destinations: `${destination.latitude},${destination.longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK') {
        const distance = response.data.rows[0].elements[0].distance.value / 1000; // Convert to km
        return distance;
      }
      throw new Error('Unable to calculate distance');
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  }

  calculateWeightCost(weight, packageType) {
    const baseRate = this.baseRates[packageType] || this.baseRates.standard;
    return weight * this.weightMultiplier;
  }

  calculateDistanceCost(distance) {
    return distance * this.distanceMultiplier;
  }

  calculateDimensionalWeight(dimensions) {
    // Calculate dimensional weight using the formula: (L x W x H) / 5000
    const { length, width, height } = dimensions;
    return (length * width * height) / 5000;
  }

  applyDiscounts(basePrice, discountCode) {
    // Implement discount logic here
    const discounts = {
      'WELCOME10': 0.10,
      'BULK20': 0.20,
      'HOLIDAY15': 0.15
    };

    if (discountCode && discounts[discountCode]) {
      const discountAmount = basePrice * discounts[discountCode];
      return basePrice - discountAmount;
    }

    return basePrice;
  }

  async calculateShippingRate({
    packageType = 'standard',
    weight,
    dimensions,
    origin,
    destination,
    discountCode = null
  }) {
    try {
      // Get base rate for package type
      const baseRate = this.baseRates[packageType] || this.baseRates.standard;

      // Calculate dimensional weight
      const dimensionalWeight = this.calculateDimensionalWeight(dimensions);

      // Use the greater of actual weight vs dimensional weight
      const chargeableWeight = Math.max(weight, dimensionalWeight);

      // Calculate weight-based cost
      const weightCost = this.calculateWeightCost(chargeableWeight, packageType);

      // Calculate distance-based cost
      const distance = await this.calculateDistance(origin, destination);
      const distanceCost = this.calculateDistanceCost(distance);

      // Calculate total base price
      let totalPrice = baseRate + weightCost + distanceCost;

      // Apply any discounts
      totalPrice = this.applyDiscounts(totalPrice, discountCode);

      // Round to 2 decimal places
      totalPrice = Math.round(totalPrice * 100) / 100;

      return {
        success: true,
        data: {
          baseRate,
          weightCost,
          distanceCost,
          distance,
          chargeableWeight,
          totalPrice,
          currency: 'USD'
        }
      };
    } catch (error) {
      console.error('Error calculating shipping rate:', error);
      return {
        success: false,
        error: error.message || 'Error calculating shipping rate'
      };
    }
  }
}

module.exports = new RateService();