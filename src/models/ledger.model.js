const mongoose = require("mongoose");
const ledgerSchema = new mongoose.Schema({
  account:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"account",
    required:[true,"Account is required for creating ledger entry"],
    index:true,
    immutable:true
  },
  amount:{
    type:Number,
    immutable:true,
    required:[true,"Amount is required for creating ledger entry"],
    min:[0,"Amount should be a positive number"]

  },
  transaction:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"transaction",
    required:[true,"Transaction is required for creating ledger entry"],
    index:true,
    immutable:true

  },
  type:{
    type:String,
    enum:{
      values:["DEBIT","CREDIT"],
      message:"Type should be either debit or credit"
  }
},

});

function preventLedgerModification(next){
  throw new Error("Ledger entries cannot be modified or deleted");
}
ledgerSchema.pre("findOneAndUpdate",preventLedgerModification);
ledgerSchema.pre("remove",preventLedgerModification);
ledgerSchema.pre("deleteOne",preventLedgerModification);
ledgerSchema.pre("deleteMany",preventLedgerModification);
ledgerSchema.pre("updateOne",preventLedgerModification);
ledgerSchema.pre("updateMany",preventLedgerModification);
ledgerSchema.pre("update",preventLedgerModification);
ledgerSchema.pre("findOneAndDelete",preventLedgerModification);


const ledgerModel = mongoose.model("ledger",ledgerSchema);
module.exports = ledgerModel;