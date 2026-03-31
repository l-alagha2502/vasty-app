const Market = require('../database/models/Market');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Initialize market if empty
        const companies = [
            { companyId: 'VAST_TECH', name: 'Vast Tech', currentPrice: 100 },
            { companyId: 'VAST_MEDIA', name: 'Vast Media', currentPrice: 85 },
            { companyId: 'VAST_GLOBAL', name: 'Vast Global', currentPrice: 120 }
        ];

        for (const company of companies) {
            await Market.findOneAndUpdate(
                { companyId: company.companyId },
                { $setOnInsert: company },
                { upsert: true }
            );
        }

        // Set interval to fluctuate market prices every hour
        setInterval(async () => {
            try {
                const marketData = await Market.find({});
                
                for (const company of marketData) {
                    const volatility = (Math.random() * 0.1) - 0.05; // -5% to +5% fluctuation
                    const newPrice = Math.max(1, Math.round(company.currentPrice * (1 + volatility)));
                    
                    company.priceHistory.push(company.currentPrice);
                    if (company.priceHistory.length > 24) company.priceHistory.shift(); // Keep last 24h
                    
                    company.currentPrice = newPrice;
                    await company.save();
                }
            } catch (error) {
                console.error('[Interval: marketFluctuation] Error:', error);
            }
        }, 3600000); // 1 hour
    }
};
