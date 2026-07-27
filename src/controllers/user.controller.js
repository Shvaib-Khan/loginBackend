import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{

    // try {
    //     const {name, email, password} = req.body;
    
    //     if(!name || !email || !password){
    //         return res
    //         .status(400)
    //         .json({message: "All fields are required"})
    //     }
    
    //     const existingUser = await User.findByEmail(email);
    //     if(existingUser){
    //         return res
    //         .status(409)
    //         .json({message: "Email already exist"})
    //     }
    
    //     const hashedPassword = await bcrypt.hash(password, 10)
    
    //     await User.create({
    //       name,
    //       email,
    //       password: hashedPassword
    //     });
    
    //     const createdUser = await User.findByEmail(email);
    
    //     if (!createdUser) {
    //         throw new ApiError(500, "Something went wrong while registering the user")
    //     }
    
    //     return res.status(201).json({message:"User registered successfully"}, createdUser);
    // } catch (error) {
    //     console.error(error)
    //     res
    //     .status(500)
    //     .json({message: "Internal server error"});
    // }

    //--> instead of wrapping whole code in try catch block use asyncHandler in each controller
    //--> use apiResnponse and apiError standard format

        const {name, email, password} = req.body;
    
        if(!name || !email || !password){
            throw new ApiError(400, "All fields are required")
        }
    
        const existingUser = await User.findByEmail(email);
        if(existingUser){
            throw new ApiError(409, "Email already exist")
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
    
        return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );


});

const loginUser = asyncHandler(async (req, res)=>{

    const { email, password} = req.body

    if(!email && !password){
        throw new ApiError(400, "Email and password is required")
    }

    const user = await User.findByEmail(email);

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }

    delete user.password;
    delete user.refresh_token;

    res
    .status(200)
    .json(
        new ApiResponse(200, user, "User logged in successfully")
    )

})

export {registerUser, loginUser}