const DualBalancePayoutService = require('../services/payout.service');

// Initialize the payout service
const payoutService = new DualBalancePayoutService();

module.exports = {
  // Middleware to authenticate user
  authenticateUser: (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.userId = userId;
    next();
  },

  /**
   * GET /api/payouts/balances
   * Get all balances (collection and settlement)
   */
  async getAllBalances(req, res) {
    try {
      const balances = await payoutService.getAllBalances();
      
      res.json({
        success: true,
        data: {
          collection: balances.collection,
          settlement: balances.settlement,
          summary: {
            total_currencies: Object.keys(balances.collection).length,
            currencies: Object.keys(balances.collection)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch balances',
        error: error.message
      });
    }
  },

  /**
   * POST /api/payouts/transfer-to-settlement
   * Transfer funds from collection to settlement balance
   */
  async transferToSettlement(req, res) {
    try {
      const { amount, currency = 'NGN' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }
      
      const result = await payoutService.transferCollectionToSettlement(amount, currency);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Transfer failed',
        error: error.message
      });
    }
  },

  /**
   * POST /api/payouts/prepare-collection
   * Move all collection balance to settlement
   */
  async prepareCollection(req, res) {
    try {
      const { currency = 'NGN' } = req.body;
      
      const result = await payoutService.prepareCollectionForPayouts(currency);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Preparation failed',
        error: error.message
      });
    }
  },

  /**
   * CRONJOB: Move all collection balance to settlement (for scheduled/automated runs)
   * This function is intended to be called by a cron job, not via HTTP.
   * Returns a result object (not an Express response).
   */
  async runPrepareCollectionCronjob(currency = 'NGN') {
    try {
      const result = await payoutService.prepareCollectionForPayouts(currency);
      if (result.success) {
        console.log(`[CRON] Collection prepared for payouts:`, result);
      } else {
        console.warn(`[CRON] No collection funds to prepare:`, result.message);
      }
      return result;
    } catch (error) {
      console.error('[CRON] Preparation failed:', error.message);
      return {
        success: false,
        message: 'Preparation failed',
        error: error.message
      };
    }
  },

  /**
   * POST /api/payouts/from-settlement
   * Initiate payout from settlement balance
   */
  async initiatePayoutFromSettlement(req, res) {
    try {
      const {
        amount,
        currency,
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      } = req.body;
      
      // Validate required fields
      if (!amount || !accountBank || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Amount, account bank, and account number are required'
        });
      }
      
      const result = await payoutService.initiatePayoutFromSettlement({
        amount,
        currency: currency || 'NGN',
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Payout from settlement failed',
        error: error.message
      });
    }
  },

  /**
   * POST /api/payouts/from-collection
   * Initiate payout from collection balance (2-step process)
   */
  async initiatePayoutFromCollection(req, res) {
    try {
      const {
        amount,
        currency,
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      } = req.body;
      
      // Validate required fields
      if (!amount || !accountBank || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Amount, account bank, and account number are required'
        });
      }
      
      const result = await payoutService.initiatePayoutFromCollection({
        amount,
        currency: currency || 'NGN',
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Payout from collection failed',
        error: error.message
      });
    }
  },

  /**
   * POST /api/payouts/smart
   * Smart payout - automatically choose best balance source
   */
  async initiateSmartPayout(req, res) {
    try {
      const {
        amount,
        currency,
        accountBank,
        accountNumber,
        beneficiaryName,
        narration,
        preferredSource = 'settlement' // 'settlement' or 'collection'
      } = req.body;
      
      // Validate required fields
      if (!amount || !accountBank || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Amount, account bank, and account number are required'
        });
      }
      
      const result = await payoutService.initiateSmartPayout({
        amount,
        currency: currency || 'NGN',
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      }, preferredSource);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Smart payout failed',
        error: error.message
      });
    }
  },

  /**
   * POST /api/payouts/initiate
   * General payout endpoint with source selection
   */
  async initiatePayout(req, res) {
    try {
      const {
        amount,
        currency,
        accountBank,
        accountNumber,
        beneficiaryName,
        narration,
        source = 'auto' // 'settlement', 'collection', or 'auto'
      } = req.body;
      
      // Validate required fields
      if (!amount || !accountBank || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Amount, account bank, and account number are required'
        });
      }
      
      const payoutData = {
        amount,
        currency: currency || 'NGN',
        accountBank,
        accountNumber,
        beneficiaryName,
        narration
      };
      
      let result;
      
      switch (source) {
        case 'settlement':
          result = await payoutService.initiatePayoutFromSettlement(payoutData);
          break;
          
        case 'collection':
          result = await payoutService.initiatePayoutFromCollection(payoutData);
          break;
          
        case 'auto':
        default:
          result = await payoutService.initiateSmartPayout(payoutData, 'settlement');
          break;
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Payout initiation failed',
        error: error.message
      });
    }
  },

  /**
   * GET /api/payouts/balance-status
   * Check if sufficient balance exists for a payout
   */
  async getBalanceStatus(req, res) {
    try {
      const { amount, currency = 'NGN', source } = req.query;
      
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required'
        });
      }
      
      const balances = await payoutService.getAllBalances();
      const settlementBalance = balances.settlement[currency]?.amount || 0;
      const collectionBalance = balances.collection[currency]?.amount || 0;
      const requiredAmount = parseFloat(amount);
      
      const status = {
        required: requiredAmount,
        currency: currency,
        settlement: {
          available: settlementBalance,
          sufficient: settlementBalance >= requiredAmount
        },
        collection: {
          available: collectionBalance,
          sufficient: collectionBalance >= requiredAmount
        },
        total_available: settlementBalance + collectionBalance,
        can_process: (settlementBalance + collectionBalance) >= requiredAmount,
        recommended_source: settlementBalance >= requiredAmount ? 'settlement' : 
                          collectionBalance >= requiredAmount ? 'collection' : 
                          'insufficient'
      };
      
      // If specific source requested
      if (source) {
        status.requested_source = source;
        status.requested_source_sufficient = 
          source === 'settlement' ? status.settlement.sufficient :
          source === 'collection' ? status.collection.sufficient : false;
      }
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Balance check failed',
        error: error.message
      });
    }
  }
};
