const enkashService = require('../services/enkashService');

exports.getCardBalance = async (req, res) => {
  try {
    const { cardAccountId, companyId } = req.body;
    const balance = await enkashService.getCardBalance(cardAccountId, companyId);
    res.status(200).json({ status: 'success', data: balance });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createCard = async (req, res) => {
  try {
    const cardData = await enkashService.createReloadableCard(req.body);
    res.status(201).json({ status: 'success', data: cardData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.issueReward = async (req, res) => {
  try {
    const result = await enkashService.issueRewardPoints(req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAllCards = async (req, res) => {
    try {
        const { companyId } = req.query; // Assuming filtering by company
        const cards = await enkashService.getCards(companyId || 'DEFAULT_COMPANY');
        res.status(200).json({ status: 'success', data: cards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getAllRewards = async (req, res) => {
    // Mock data for rewards reporting
    try {
        const rewards = [
            { id: 1, recipient: 'John Doe', amount: 500, date: new Date(), status: 'Credited' },
            { id: 2, recipient: 'Jane Smith', amount: 1000, date: new Date(), status: 'Pending' }
        ];
        res.status(200).json({ status: 'success', data: rewards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
