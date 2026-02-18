const userModel = require('../models/user.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
 const registerUser = async  (req,res)=>{
  const {email,password,name} = req.body;
  console.log(name,email,password);
  const isExists = await userModel.findOne({email:email});
  if(isExists){
    return res.status(422).json({
      message:"User already exists with email",
      status:"failed"

    })
  }
  const user =await userModel.create({
    email,password,name
  })
  const token = jwt.sign({useId:user.id}, process.env.SECRET_KEY,{
    expiresIn:"3d"
  })
  res.cookie("token",token);
  return res.status(201).json({
    message:"Account created successfully",
    status:"success",
    token,
    user,

  })
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


 
 module.exports={
  registerUser,
  loginUser,

 }