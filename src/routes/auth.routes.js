const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');
const {authMiddleware} = require('../middleware/auth.middleware');

router.post("/register",authController.registerUser);
router.post("/login",authController.loginUser);
router.get("/get-user-accounts",authMiddleware,authController.getUserAccount);
router.get("/fetch-balance/:accountId",authMiddleware,authController.fetchBalance);




module.exports=router;