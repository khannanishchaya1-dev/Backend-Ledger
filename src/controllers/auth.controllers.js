const userModel = require('../models/user.models');
const bcrypt = require('bcryptjs');
const emailService = require('../services/email.services');
const accountModel = require('../models/account.model');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklist.model');
 const registerUser = async  (req,res)=>{
  const {email,password,name,address} = req.body;

  
  
  const isExists = await userModel.findOne({email:email});
  if(isExists){
    return res.status(422).json({
      message:"User already exists with email",
      status:"failed"

    })
  }
  const user =await userModel.create({
    email,password,name,address
  })
  console.log("User created:", user);
  const token = jwt.sign({userId:user._id}, process.env.SECRET_KEY,{
    expiresIn:"3d"
  })
  res.cookie("token",token);
   res.status(201).json({
    message:"Account created successfully",
    status:"success",
    token,
    user,

  })
  await emailService.sendRegistrationEmail(user.email,user.name);
  return;
};

const loginUser = async (req,res)=>{
const {email,password} = req.body;
const user = await userModel.findOne({email:email}).select("+password");
console.log(user);
if(!user){
  return res.status(404).json({
    message:"User not found",
    status:"failed"
  })
}
const isMatch = await user.comparePassword(password);
if(!isMatch){
  return res.status(401).json({
    message:"Invalid credentials",
    status:"failed"
  })
}
const token = jwt.sign({userId:user.id}, process.env.SECRET_KEY,{
  expiresIn:"3d"
})
res.cookie("token",token);
return res.status(200).json({
  message:"Login successful",
  status:"success",
  token,
  user
})
  };

  async function getUserAccount(req,res){
  const user = req.user;
  const account = await accountModel.find({user:user._id});
  if(account.length === 0){
    return res.status(404).json({
      message:"No account found for user"
    })
  }
  const accountData = await Promise.all(account.map(async (acc) => {
const accObject = acc.toObject();
const balance = await acc.getBalance();
return {
  ...accObject,
balance
}
  }));
  console.log("User accounts with balance:", accountData);

  return res.status(200).json({
    message:"User account retrieved successfully",
    account: accountData
  })
}

async function fetchBalance(req,res){
  const user = req.user;
  console.log(`User ${user._id} is fetching balance for account ${req.params.accountId}`);
  
  const {accountId}= req.params;
  console.log(`Fetching balance for account ID: ${accountId} and user ID: ${user._id}`);
  const account = await accountModel.findOne({_id:accountId,user:user._id});
  if(!account){
    return res.status(404).json({
      message:"Account not found"
    })
  }
  const balance = await account.getBalance();
  console.log(`Calculated balance for account ID ${accountId}: ${balance}`);
  return res.status(200).json({
    message:"Account balance retrieved successfully",
    balance:balance
  })
}
async function logout(req,res){
  const token = req.cookies.token || req.header("Authorization").split(" ")[1];
  if(!token){
    return res.status(400).json({
      message:"Already logged out or token not provided"
    })
  }
  res.clearCookie("token");
  await blacklistModel.create({token});
  return res.status(200).json({
    message:"Logout successful"
  })
  
}
 module.exports={
  registerUser,
  loginUser,
  getUserAccount,
  fetchBalance,
  logout
}