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
  currency:{
    type:String,
    required:[true,"Currency is required for creating account"],
    default:"INR"
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

  return balanceData[0]?.balance || 0;
}

const accountModel = mongoose.model("account",accountSchema);
module.exports = accountModel;