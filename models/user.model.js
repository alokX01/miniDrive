const mongoose  = require('mongoose')

// user schema: signup/login me jo data chahiye wahi fields yahan define hain
const userSchema = new mongoose.Schema({
    username:{
      type:String,
      required:true,
      // trim/lowercase se duplicate aur messy input issue kam hota hai
      trim:true,
      lowercase:true,
      unique:true,
      minlength:[3,'Username must be atleast of 3 characters long']
    },
    email:{
       type:String,
       required:true,
       trim:true,
       lowercase:true,
       unique:true,
       minlength:[5,'Username must be atleast of 5 characters long']
    },
    password:{
      type:String,
      required:true,
      trim:true,
      minlength:[8,'Username must be atleast of 8 characters long']
    }
})

const user = mongoose.model('user',userSchema)

module.exports = user;
