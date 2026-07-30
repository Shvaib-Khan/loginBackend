import { redisClient } from "../config/redis.js";

const USER_CACHE_PREFIX = "user:"

const cacheUserProfile  = async (user)=>{

    const key = `${USER_CACHE_PREFIX}${user.id}`

    redisClient.set(
        key,
        JSON.stringify(user),
        {
            EX: 7200
        }
    )

}

const getCachedUserProfile = async (userId) =>{

    const key = `${USER_CACHE_PREFIX}${userId}`
    const user = await redisClient.get(key)
    return user? JSON.parse(user) : null

}


export {cacheUserProfile, getCachedUserProfile}