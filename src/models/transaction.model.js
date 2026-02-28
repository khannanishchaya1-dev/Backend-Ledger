const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
fromAccount:{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'account',
  required: [true,"From account is required for creating transaction"],
  index:true
},
toAccount:{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'account',
  required: [true,"To account is required for creating transaction"],
  index:true
},
amount:{
  type: Number,
  required: [true,"Amount is required for creating transaction"],
  min:[0,"Amount should be a positive number"]
},
description:{
  type: String,
  required: false
},
status:{
  type:String,
  enum:{
    values:["PENDING","COMPLETED","FAILED"],
    message:"Status should be either pending, completed or failed"

  },
  default:"PENDING"
},
idempotencyKey:{
  type:String,
  required:[true,"Idempotency key is required for creating transaction"],
  unique:true,
  index:true,
}
},{
  timestamps:true
});

const transactionModel = mongoose.model("transaction",transactionSchema);
module.exports = transactionModel;