const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');

class DualBalancePayoutService {
    constructor() {
        this.flw = new Flutterwave(
            process.env.FLUTTERWAVE_PUBLIC_KEY,
            process.env.FLUTTERWAVE_SECRET_KEY
        );
        this.baseURL = 'https://api.flutterwave.com/v3';
    }

    /**
     * Get all available balances (both collection and settlement)
     */
    async getAllBalances() {
        try {
            const response = await axios.get(`${this.baseURL}/balances`, {
                headers: {
                    'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                const balances = response.data.data;
                
                // Organize balances by currency
                const organizedBalances = {
                    collection: {},
                    settlement: {},
                    all: balances
                };

                balances.forEach(balance => {
                    const currency = balance.currency;
                    
                    // Collection balance (ledger_balance or main balance)
                    if (balance.ledger_balance !== undefined) {
                        organizedBalances.collection[currency] = {
                            amount: balance.ledger_balance,
                            currency: currency
                        };
                    }
                    
                    // Settlement balance (available_balance or payout balance)
                    if (balance.available_balance !== undefined) {
                        organizedBalances.settlement[currency] = {
                            amount: balance.available_balance,
                            currency: currency
                        };
                    }
                });

                return organizedBalances;
            }

            throw new Error('Failed to fetch balances');
        } catch (error) {
            console.error('Error fetching balances:', error);
            throw error;
        }
    }

    /**
     * Method 2: Manual transfer between your own balances (Collection to Settlement)
     * Using direct API call since the SDK might not support this specific use case
     */
    async transferCollectionToSettlement(amount, currency = 'NGN') {
        try {
            console.log(`Attempting to transfer ${amount} ${currency} from collection to settlement`);

            // OPTION A: Try the standard transfer endpoint with your own details
            const payload = {
                account_bank: "000", // Special code for Flutterwave wallet
                account_number: process.env.FLW_MERCHANT_ID, // Your merchant ID
                amount: amount,
                narration: "Collection to Settlement Transfer",
                currency: currency,
                reference: `COL2SET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                debit_currency: currency,
                // This tells Flutterwave to do an internal wallet transfer
                beneficiary_name: "Internal Transfer"
            };

            console.log('Transfer payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(
                `${this.baseURL}/transfers`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Transfer response:', JSON.stringify(response.data, null, 2));

            if (response.data.status === 'success') {
                return {
                    success: true,
                    transferId: response.data.data.id,
                    reference: response.data.data.reference,
                    message: 'Transfer initiated successfully'
                };
            }

            throw new Error(response.data.message || 'Transfer failed');

        } catch (error) {
            console.error('Collection to settlement transfer error:', error.response?.data || error.message);
            
            // If this method fails, try the alternative approach
            return await this.alternativeBalanceTransfer(amount, currency);
        }
    }

    /**
     * Initiate payout from settlement balance (default behavior)
     */
    async initiatePayoutFromSettlement(payoutData) {
        const {
            amount,
            currency,
            accountBank,
            accountNumber,
            beneficiaryName,
            narration,
            reference
        } = payoutData;

        try {
            const transferPayload = {
                account_bank: accountBank,
                account_number: accountNumber,
                amount: amount,
                narration: narration || 'Payout from settlement balance',
                currency: currency || 'NGN',
                reference: reference || this.generateReference(),
                callback_url: `${process.env.WEBHOOK_BASE_URL}/flutterwave-webhook`,
                debit_currency: currency || 'NGN'
            };

            if (beneficiaryName) {
                transferPayload.beneficiary_name = beneficiaryName;
            }

            const response = await this.flw.Transfer.initiate(transferPayload);

            if (response.status === 'success') {
                return {
                    success: true,
                    transferId: response.data.id,
                    reference: transferPayload.reference,
                    source: 'settlement_balance',
                    data: response.data
                };
            }

            throw new Error(response.message || 'Payout failed');
        } catch (error) {
            console.error('Settlement payout error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Initiate payout from collection balance (2-step process)
     * Step 1: Transfer from collection to settlement
     * Step 2: Initiate payout from settlement
     */
    async initiatePayoutFromCollection(payoutData) {
        const {
            amount,
            currency,
            accountBank,
            accountNumber,
            beneficiaryName,
            narration
        } = payoutData;

        try {
            // Step 1: Check if sufficient balance in collection
            const balances = await this.getAllBalances();
            const collectionBalance = balances.collection[currency]?.amount || 0;

            if (collectionBalance < amount) {
                return {
                    success: false,
                    message: `Insufficient collection balance. Available: ${collectionBalance} ${currency}`
                };
            }

            console.log(`Step 1: Moving ${amount} ${currency} from collection to settlement`);

            // Step 2: Transfer from collection to settlement
            const transferResult = await this.transferCollectionToSettlement(amount, currency);

            if (!transferResult.success) {
                return {
                    success: false,
                    message: `Failed to move funds to settlement: ${transferResult.message}`
                };
            }

            // Wait a bit for the transfer to complete
            await this.sleep(3000);

            console.log('Step 2: Initiating payout from settlement balance');

            // Step 3: Initiate the actual payout
            const payoutResult = await this.initiatePayoutFromSettlement({
                amount,
                currency,
                accountBank,
                accountNumber,
                beneficiaryName,
                narration: narration || 'Payout from collection balance'
            });

            if (payoutResult.success) {
                return {
                    ...payoutResult,
                    source: 'collection_balance',
                    intermediateTransferId: transferResult.transferId
                };
            }

            return payoutResult;

        } catch (error) {
            console.error('Collection payout error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Smart payout - automatically choose best balance
     */
    async initiateSmartPayout(payoutData, preferredSource = 'settlement') {
        const { amount, currency = 'NGN' } = payoutData;

        try {
            // Get available balances
            const balances = await this.getAllBalances();
            const settlementBalance = balances.settlement[currency]?.amount || 0;
            const collectionBalance = balances.collection[currency]?.amount || 0;

            console.log(`Available balances - Settlement: ${settlementBalance}, Collection: ${collectionBalance}`);

            // Try preferred source first
            if (preferredSource === 'settlement') {
                if (settlementBalance >= amount) {
                    console.log('Using settlement balance (preferred)');
                    return await this.initiatePayoutFromSettlement(payoutData);
                } else if (collectionBalance >= amount) {
                    console.log('Settlement insufficient, using collection balance');
                    return await this.initiatePayoutFromCollection(payoutData);
                }
            } else {
                if (collectionBalance >= amount) {
                    console.log('Using collection balance (preferred)');
                    return await this.initiatePayoutFromCollection(payoutData);
                } else if (settlementBalance >= amount) {
                    console.log('Collection insufficient, using settlement balance');
                    return await this.initiatePayoutFromSettlement(payoutData);
                }
            }

            // Neither balance has sufficient funds
            return {
                success: false,
                message: `Insufficient funds. Settlement: ${settlementBalance}, Collection: ${collectionBalance}, Required: ${amount}`
            };

        } catch (error) {
            console.error('Smart payout error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Batch transfer from collection to settlement (useful for preparation)
     */
    async prepareCollectionForPayouts(currency = 'NGN') {
        try {
            const balances = await this.getAllBalances();
            const collectionAmount = balances.collection[currency]?.amount || 0;

            if (collectionAmount <= 0) {
                return {
                    success: false,
                    message: 'No funds in collection balance to transfer'
                };
            }

            console.log(`Preparing ${collectionAmount} ${currency} for payouts`);
            
            return await this.transferCollectionToSettlement(collectionAmount, currency);
        } catch (error) {
            console.error('Preparation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Alternative Method: Using balance endpoint to move funds
     * This is the MANUAL way - instructing you to do it via dashboard
     */
    async alternativeBalanceTransfer(amount, currency = 'NGN') {
        try {
            console.log('Trying alternative method...');
            
            // Get current balances to verify
            const balances = await this.getAllBalances();
            // Fix: Use balances.collection instead of balances.data, and check for undefined
            const collectionBalance = balances.collection && balances.collection[currency] && balances.collection[currency].amount >= amount
                ? { 
                    currency: currency, 
                    ledger_balance: balances.collection[currency].amount 
                  }
                : null;

            if (!collectionBalance) {
                return {
                    success: false,
                    message: `Insufficient collection balance. Available: ${collectionBalance?.ledger_balance || 0}`,
                    manual_action_required: true,
                    instructions: [
                        '1. Log into your Flutterwave dashboard',
                        '2. Go to Payments > Transfers',
                        '3. Click "New Transfer" > "Transfer to a Flutterwave account"',
                        `4. Transfer ${amount} ${currency} to your own merchant ID: ${process.env.FLW_MERCHANT_ID}`,
                        '5. This will move funds from collection to settlement balance'
                    ]
                };
            }

            // If we have the balance, provide manual instructions
            return {
                success: false,
                message: 'Automatic collection to settlement transfer not available via API',
                manual_action_required: true,
                available_balance: collectionBalance.ledger_balance,
                instructions: [
                    '⚠️ IMPORTANT: Flutterwave does not support automatic collection-to-settlement transfers via API.',
                    '',
                    'You have two options:',
                    '',
                    'OPTION 1 - Manual Transfer (Immediate):',
                    '1. Log into your Flutterwave dashboard at https://dashboard.flutterwave.com',
                    '2. Navigate to: Payments > Transfers',
                    '3. Click "New Transfer"',
                    '4. Select "Transfer to a Flutterwave account"',
                    '5. Choose your collection balance as source',
                    `6. Enter amount: ${amount} ${currency}`,
                    `7. Enter your own Merchant ID: ${process.env.FLW_MERCHANT_ID}`,
                    '8. Confirm the transfer',
                    '',
                    'OPTION 2 - Wait for Auto-Settlement:',
                    '1. Flutterwave automatically moves funds from collection to settlement',
                    '2. Settlement happens based on your configured settlement schedule',
                    '3. Check your dashboard Settings > Settlement for your schedule',
                    '4. Default is usually daily or T+1 (next business day)',
                    '',
                    'OPTION 3 - Use Settlement Balance Only:',
                    '1. Only initiate payouts from your settlement balance',
                    '2. Wait for funds to auto-settle before making withdrawals',
                    '3. This is the recommended approach'
                ]
            };

        } catch (error) {
            console.error('Alternative method error:', error);
            throw error;
        }
    }

    // Helper methods
    generateReference() {
        return `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = DualBalancePayoutService;