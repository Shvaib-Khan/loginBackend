import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import options from "../constants.js";

const generateAccessAndRefereshTokens = async(user) =>{
    try {
        
        const accessToken = User.generateAccessToken(user)
        const refreshToken = User.generateRefreshToken(user)

        User.saveRefreshToken(user.id, refreshToken)
        

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user)

    const loggedInUser = await User.findByEmail(email)

    delete loggedInUser.password;
    delete loggedInUser.refresh_token;

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const currentUser = asyncHandler(async(req,res)=>{

    res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))

})

const logoutUser = asyncHandler(async(req, res) => {

    const user = req.user    
    if (user) {
        await User.removeRefreshToken(user.id);
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?.id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refresh_token) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {registerUser, loginUser, logoutUser, currentUser, refreshAccessToken}