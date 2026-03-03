const accModel = require('../models/account.model');

const createAccount = async (req,res)=>{
const user = req.user;
req.body.aadhaar = req.body.aadhaar.replace(/\s/g, "");
const {fullName,aadhaar,pan,phone,accountType,mpin} = req.body;
console.log("Received account creation request with data:", req.body);
if(!fullName || !aadhaar || !pan || !phone || !accountType || !mpin){
  return res.status(400).json({message:"All fields are required"});
}

const existingAadhaar = await accModel.findOne({
  aadhaar
});
if(existingAadhaar){
  return res.status(400).json({message:"An account with this Aadhaar number already exists"});
}
const existingPan = await accModel.findOne({
  pan
});
if(existingPan){
  return res.status(400).json({message:"An account with this PAN number already exists"});
}
const existingPhone = await accModel.findOne({
  phone
});
if(existingPhone){
  return res.status(400).json({message:"An account with this phone number already exists"});
}
const existingAccount = await accModel.findOne({
  user:user._id,
  status:"ACTIVE",
  type:accountType
});
if(existingAccount){
  return res.status(400).json({message:`You already have an active account of this ${accountType} type`});
}
const generateAccountNumber = () => {
  return "45" + Math.floor(1000000000 + Math.random() * 9000000000);
};
try{
const account =await accModel.create({
  user:user._id,
  fullName,
  aadhaar,
  pan,
  accountNumber: generateAccountNumber(),
  phone,
  type:accountType,
  mpin
});

return res.status(201).json(account);
}catch(err){
  console.error("Error creating account:", err);
  return res.status(500).json({message:`Failed to create account: ${err.message}`});
}
}
module.exports={
  createAccount
}