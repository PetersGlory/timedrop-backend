const { isPast } = require('date-fns');

// Example: Replace this with your actual data source or database query
const markets = [
  // { id: 1, endDate: '2024-06-10T12:00:00Z' },
  // { id: 2, endDate: '2024-06-11T15:30:00Z' },
];

// Function to check all markets
function checkMarkets() {
  markets.forEach(market => {
    if (isPast(new Date(market.endDate))) {
      // Handle the market that has passed its end date
      console.log(`Market ${market.id} has ended.`);
      // You can add your logic here, e.g., update status in DB
    }
  });
}

// Run every 30 seconds
setInterval(checkMarkets, 30 * 1000);
