const userModel = require('../models/user.models');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req,res,next)=>{

    const token = req.cookies.token || req.header("Authorization").split(" ")[1];
    if(!token){
      return res.status(401).json({
        message:"Unauthorized Access"
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
  module.exports = authMiddleware;