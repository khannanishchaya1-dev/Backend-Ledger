const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:{
    type:String,
    required:[true,"Email is Required for creating account"],
    trim:true,
    lowercase:true,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid Email Address"],
unique:[true,"Account already exists"],

  },
  name:{
    type:String,
    required:[true,"Namee is Required for creating Account"],


  },
  password:{
    type:String,
    required:[true,"Password is required for creating account"],
    minLength:[6,"Password should be more than 6 characters"],
    select:false

  },
  systemUser:{
    type:Boolean,
    default:false,
    immutable:true,
    select:false,
  }

  },{
    timestamps:true
  }
)
userSchema.pre("save", async function(next){
  if(!this.isModified("password")){
return;
  }
  const hash = await bcrypt.hash(this.password,8);
  this.password=hash;
  return;

})
userSchema.methods.comparePassword = async function(password){
 return await bcrypt.compare(password,this.password);
}
const userModel = mongoose.model("user",userSchema);
module.exports = userModel;