const mongoose = require("mongoose");
const blacklistSchema = new mongoose.Schema({
  token:{
    type:String,
    required:[true,"Token is required for blacklisting"],
    unique:true,
  },
  blacklistedAt:{
    type:Date,
    required:[true,"Blacklisted date is required for blacklisting"],
    default:Date.now
  }
},{
  timestamps:true
});
blacklistSchema.index({createdAt:1},{expireAfterSeconds:60*60*24});//expire after 24 hours
const blacklistModel = mongoose.model("blacklist",blacklistSchema);
module.exports = blacklistModel;