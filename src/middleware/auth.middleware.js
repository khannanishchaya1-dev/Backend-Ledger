const userModel = require('../models/user.models');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklist.model');

const authMiddleware = async (req,res,next)=>{

    const token = req.cookies.token || req.header("Authorization").split(" ")[1];
    if(!token){
      return res.status(401).json({
        message:"Unauthorized Access"
      })
    }
    const blacklistedToken = await blacklistModel.findOne({token});
    if(blacklistedToken){
      return res.status(401).json({
        message:"Token has been blacklisted. Please login again."
      })
    }
    try {
      const decoded = jwt.verify(token,process.env.SECRET_KEY);
      console.log(decoded);
      const user = await userModel.findById(decoded.userId);
      console.log(`user is ${user}`);
      req.user = user;
      return next();
    }catch(error){
      res.status(401).json({
        token,
        message:"Invalid Token"
      })
    }
  }

  const systemAuthMiddleware = async (req,res,next)=>{
    const token = req.cookies.token || req.header("Authorization").split(" ")[1];
    if(!token){
      return res.status(401).json({
        message:"Unauthorized Access"
      })
    }

    const blacklistedToken = await blacklistModel.findOne({token});
    if(blacklistedToken){
      return res.status(401).json({
        message:"Token has been blacklisted. Please login again."
      })
    } 
    
    try {
      const decoded = jwt.verify(token,process.env.SECRET_KEY);
      console.log(decoded);
      const user = await userModel.findById(decoded.userId).select("+systemUser");
      console.log(`user is ${user}`);
      if(!user.systemUser){
        return res.status(403).json({
          message:"Forbidden Access"
        })
      }
      req.user = user;
      return next();
}catch(error){
  res.status(401).json({
    token,
    message:"Invalid Token"
  })
}
}
  module.exports = {
    authMiddleware,
    systemAuthMiddleware
  }