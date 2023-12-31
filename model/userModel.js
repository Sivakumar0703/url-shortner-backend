const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    firstName:{
        type:String,
        require:true
    },

    lastName:{
        type:String,
        require:true 
    },

    email:{
        type:String,
        require:true 
    },

    password:{
        type:String,
        require:true     
    },

    status:{
        type:Boolean,
        require:true ,
        default: false
    },

    verification:{
        type:String,
        require:true,
        default:"NULL"
    }

   

})

module.exports = mongoose.model("users" , userSchema)