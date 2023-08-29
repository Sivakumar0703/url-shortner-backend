const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretkey = process.env.SECRET_KEY;


// function to hash password
const hashPassword = async(password)=>{
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt);
    return hashedPassword
}

// compare hashed password
const compare = async(password , hashedPassword)=>{
    return await bcrypt.compare(password , hashedPassword)
}

// generate Link
const generateLink = async(email)=>{
const payload = {email:email}
const verification = Math.random().toString(36).substring(2,7); // generate verification string
    const token = jwt.sign(payload , secretkey , {expiresIn:"5m"})
    return {token:token , verification:verification}

}

// token generation
const createToken = (payload) => { 
    let token =  jwt.sign(payload, secretkey)
    return token
}

// verify token
const verifyToken = (token)=>{
    return jwt.verify(token , secretkey);
}



module.exports = {hashPassword , compare , generateLink , verifyToken , createToken}