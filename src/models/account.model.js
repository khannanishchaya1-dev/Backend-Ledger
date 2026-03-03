const mongoose = require('mongoose');
const LedgerModel = require('./ledger.model');
const accountSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, "Account must be associated with a user"],
    index:true

  },
  status:{
    type:String,
    enum:{
      values:["ACTIVE","FROZEN","CLOSED"],
      message:"Status should be either active, frozen or closed"
    },
    default:"ACTIVE"
  },
  fullName:{
    type:String,
    required:[true,"Full name is required for creating account"]
  },
  aadhaar:{
    type:String,
    required:[true,"Adhaar number is required for creating account"],
    unique:true,
    match:[/^\d{12}$/,"Adhaar number should be 12 digits"]
  },
  pan:{
    type:String,
    required:[true,"PAN number is required for creating account"],
    unique:true,
    match:[/^[A-Z]{5}\d{4}[A-Z]$/,"Invalid PAN number format"]
  },
  phone:{
    type:String,
    required:[true,"Phone number is required for creating account"],
    unique:true,
    match:[/^\d{10}$/,"Phone number should be 10 digits"]
  },
  type:{
    type:String,
    enum:{
      values:["Savings","Current"],
      message:"Account type should be either savings or current"
    },
    required:[true,"Account type is required for creating account"]
  },
  
  currency:{
    type:String,
    required:[true,"Currency is required for creating account"],
    default:"INR"
  },
  mpin:{
    type:String,
    required:[true,"MPIN is required for creating account"],
  },
  accountNumber:{
    type:String,
    required:[true,"Account number is required for creating account"],
    unique:true,
    match:[/^45\d{10}$/,"Account number should start with 45 followed by 10 digits"]
  } 
},{
  timestamps:true
});
accountSchema.index({ user: 1,status:1 });//compound index
accountSchema.methods.getBalance = async function () {
  const balanceData = await LedgerModel.aggregate([
    { $match: { account  : this._id}},
    { $group: { _id: null, totalDebit:{$sum:{
      $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
    }}
    , totalCredit:{$sum:{
      $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
    }} }
   },
   {
    $project: {
      balance: { $subtract: ["$totalCredit", "$totalDebit"] }
    }
  }
  ])

  const balance = balanceData[0]?.balance || 0;

  // Return rounded to 2 decimal places
  return Number(balance.toFixed(2));

 
}

const accountModel = mongoose.model("account",accountSchema);
module.exports = accountModel;