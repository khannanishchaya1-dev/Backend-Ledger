const accModel = require('../models/account.model');

const createAccount = async (req,res)=>{
const user = req.user;
const account =await accModel.create({
  user:user._id,

});
res.status(201).json(account);
}
module.exports={
  createAccount
}