const mongoose = require("mongoose")

const urlShortnerSchema = new mongoose.Schema({

    fullUrl:{
        type:String,
        require:true
    },

    shortUrl:{
        type:String,
        require:true 
    },

    count:{
        type:Number,
        require:true,
        default: 0
    },

    createdAt:{
        type:String,
        require:true,
        default:new Date().toISOString().slice(0,10)
    }

})

module.exports = mongoose.model("links" , urlShortnerSchema)