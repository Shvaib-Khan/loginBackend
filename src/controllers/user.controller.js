import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const registerUser = async (req, res)=>{

    try {
        const {name, email, password} = req.body;
    
        if(!name || !email || !password){
            return res
            .status(400)
            .json({message: "All fields are required"})
        }
    
        const existingUser = await User.findByEmail(email);
        if(existingUser){
            return res
            .status(409)
            .json({message: "Email already exist"})
        }
    
        const hashedPassword = await bcrypt.hash(password, 10)
    
        await User.create({
          name,
          email,
          password: hashedPassword
        });
    
        const createdUser = await User.findByEmail(email);
    
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }
    
        return res.status(201).json({message:"User registered successfully"}, createdUser);
    } catch (error) {
        console.error(error)
        res
        .status(500)
        .json({message: "Internal server error"});
    }

}

export {registerUser}