const { Schema, default: mongoose } = require("mongoose");

const verificationSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        require:true,
        ref:"user",
        unique:true
    },

    token:{
        type:String,
        require:true
    },

    createdAt:{
        type:Date,
        default:Date.now(),
        expires:3600
    }
})

module.exports = mongoose.model("token" , verificationSchema)