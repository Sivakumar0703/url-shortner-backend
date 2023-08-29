const express = require("express")
const mongoose = require("mongoose")
const urlModel = require("./model/urlShortner")
const cors = require("cors")
require('dotenv').config();
const route  = require("./route/user")
const app = express()

mongoose.connect("mongodb+srv://SivaKumar:siVaAtlas@sivakumar.yhfef3z.mongodb.net/Url",{
    useNewUrlParser:true , useUnifiedTopology:true
})

app.use(express.json())
app.use(cors())
app.use("/user" , route)

// get all url
app.get("/" , async(req,res)=>{
    const url = await urlModel.find()
    res.status(200).json({mesage:"url shortner" , url})
})

// creating short url
app.post("/short-url" , async (req,res) => {
    
 try {
  const shortUrl = Math.random().toString(36).substring(2,7);
 await urlModel.create({fullUrl:req.body.fullUrl , shortUrl:shortUrl})
 res.status(200).json({message:"short link generated" , link:`http://localhost:8000/${shortUrl}`})
 } catch (error) {
  res.status(400).json({message:"Error in getting full url" , error})
 }
})

// redirecting
app.get("/:shortUrl" , async(req,res)=>{
 try {
  const shortUrl = await urlModel.findOne({shortUrl:req.params.shortUrl})

  if(shortUrl == "null"){
    return res.status(404).json({message:"page not found"})
  }

  shortUrl.count++
  shortUrl.save()

  res.redirect(shortUrl.fullUrl)
 } catch (error) {
  res.status(401).json({message:"Page Not found" , error})
 }
})



app.listen(8000 , ()=>console.log("❤️  server online"))