const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth.middleware');
const { createAccount } = require('../controllers/account.controllers');


//post create account
//protected route
router.post("/create",authMiddleware,createAccount);


module.exports = router;