const route = require("express").Router()
const userModel = require("../model/userModel")
const { hashPassword, compare, generateLink, verifyToken, createToken } = require("./auth");
const nodemailer = require('nodemailer')
const Token = require("../model/verification")




// generate random string
function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


route.get("/", async (req, res) => {
    const users = await userModel.find()
    res.status(200).json({ message: "all user", users })
})

// register user ( email + password)
route.post("/sign-up", async (req, res) => {

    const { firstName, lastName, email, password } = req.body;

    try {
        const user = await userModel.findOne({ email: req.body.email })

        if (!user) {

            const hashedPassword = await hashPassword(password)

            const userData = {
                firstName,
                lastName,
                email,
                password: hashedPassword
            }
            const user = await userModel.create(userData)

            const token = await new Token({
                userId: user._id,
                token: generateRandomString(10)
            }).save()

            const url = `${process.env.URL}/user/${user._id}/verify/${token.token}`

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.USER,
                    pass: process.env.PASS
                }
            });

            transporter.sendMail({
                from: process.env.USER,
                to: user.email,
                subject: "Verify Email",
                text: url
            })

            transporter.close()

            res.status(200).json({ message: "Registration successful", userData })

        } else {
            res.status(400).json({ message: "USER ALREADY EXISTS" })
        }

    } catch (error) {
        res.status(400).json({ message: "REGISTRATION FAILED", error })
    }
})

// verify email
route.get("/:id/verify/:token", async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.params.id })

        if (!user) {
            return res.status(400).json({ message: "INVALID LINK" })
        }

        const token = await Token.findOne({userId: user._id });
    
        if (!token) {
            return res.status(400).json({ message: "INVALID LINK" })
        }
       
        await userModel.findOneAndUpdate({ _id: user._id }, { status: true }, { new: true })
        await Token.deleteOne({ userId: user._id })
        res.status(200).json({ message: "EMAIL VERIFIED SUCCESSFULLY" })
    } catch (error) {
        res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})

//  user login
route.post('/login', async (req, res) => {
    try {

        let user = await userModel.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({ message: "USER DOESN'T EXIST.PLEASE CHECK YOUR EMAIL ID" })
        }


        if (await compare(req.body.password, user.password)) {

            if (!user.status) {
                let token = await Token.findOne({ userId: user._id });
                // because token will expire after an hour
                if (!token) {
                    token = await new Token({
                        userId: user._id,
                        token: generateRandomString(10)
                    }).save()
                    

                    const url = `${process.env.URL}/user/${user._id}/verify/${token.token}`
                 

                    // sending email
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASS
                        }
                    });

                    transporter.sendMail({
                        from: process.env.USER,
                        to: user.email,
                        subject: "EMAIL VERIFICATION",
                        text: url
                    })

                    transporter.close()

                }
                return res.status(400).json({ message: "AN EMAIL HAS SENT TO YOUR ACCOUNT PLEASE VERIFY" })
            }

            //create token
            let token = createToken({
                email: user.email,
                status: user.status
            })

            let userdata = ({
                email: user.email,
                status: user.status
            })

            res.status(200).json({
                message: "LOGIN SUCCESSFUL",
                token,
                userdata
            })

        } else {
            res.status(400).json({ message: "WRONG PASSWORD" })
        }
    }

    catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Internal Server Error!",
            error: error
        })
    }
})

// verify user and send reset password link
route.post("/forgot_password", async (req, res) => {

    // check the availability of user's email from database
    try {
        const user = await userModel.findOne({ email: req.body.email });

        if (user === "null") {
            return res.status(401).json({ message: "USER NOT EXIST" })
        }

        // if user exists
        const link = await generateLink(user.email)
        await userModel.findOneAndUpdate({ email: user.email }, { verification: link.verification })
        const reset_link = `${process.env.URL}/reset_password/${link.verification}/${link.token}`

        // sending mail to reset password
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER ,
                pass: process.env.PASS 
            }
        })
        const mailOption = {
            from: process.env.USER ,
            to: user.email,
            subject: 'PASSWORD RESET REQUEST',
            text: ` Hi , User \n Forgot Your Password? \n We received a reset password request from your account \n\n
                    Here is the link to reset password ${reset_link} \n Link expires in 5 minutes `
        }

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                return res.status(404).json({ message: 'something went wrong.' })
            } else {
                res.status(200).json({ message: 'mail sent successfully', info })
            }
        })
        transporter.close()

        res.status(200).json({ message: "Password reset link has sent to your email", reset_link })

    } catch (error) {
        res.status(401).json({ message: "INVALID EMAIL", error })
    }

})




// check verification code
route.post("/verify_code", async (req, res) => {
    const verificationCode = req.body.verificationCode;
    const verify = await userModel.findOne({ verification: verificationCode })
    const code = verify?.verification;
    if (verificationCode !== code) {
        return res.status(401).json({ message: "VERIFICATION CODE MISMATCH" })

    }
    res.status(200).json({ message: "VERIFICATION CODE MATCHED" })

})




// reset  password
route.patch("/reset_password/:verification/:token", async (req, res) => {
    const { verification, token } = req.params;
    const newPassword = await hashPassword(req.body.password)

    try {
        verifyToken(token) // contain payload => if verification fails it will send "invalid signature" error
        const user = await userModel.findOne({ verification: verification })
        const verificationCode = user?.verification;
        if (verificationCode !== verification) {
            return res.status(400).json({ message: "INVALID LINK" })
        }
        await userModel.findOneAndUpdate({ verification: verification }, { verification: "NULL", password: newPassword }, { new: true })
        res.status(200).json({ message: "PASSWORD CHANGED SUCCESFULLY" })
    } catch (error) {
        res.status(401).json({ message: "INVALID LINK" })
    }
})


module.exports = route;