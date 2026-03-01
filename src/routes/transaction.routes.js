const express = require('express');
const router = express.Router();
const {authMiddleware,systemAuthMiddleware} = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');
router.post("/create",authMiddleware,transactionController.createTransaction);

//1.Create initial funds transaction from system account to user account
router.post("/system/initial-funds",systemAuthMiddleware,transactionController.createInitialFundsTransaction);

module.exports=router;
