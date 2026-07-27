import { dbConnection } from "../config/db.js";

// const connectDB = ()=>{
//     try {
//         const connectionInstance = dbConnection.connect((err)=>{
//             if(err){
//                 console.log("MySQL connection failed while connecting ", err.message)
//                 process.exit(1);
//             }
//             console.log("Connected to MYSQL server successfully!!")
//         })
//     } catch (error) {
//         console.log("Connection failed !!", error.message)
//     }
// }






// const connectDB = () => {
//     return new Promise((resolve, reject) => {
//         dbConnection.connect((err) => {
//             if (err) {
//                 return reject(new Error(`MySQL connection failed: ${err.message}`));
//             }


//             console.log("Connected to MySQL server successfully");
//             resolve();
//         });
//     });
// };


// const connectWithRetry = async () => {
//     while (true) {
//         try {
//             await connectDB();
//             break; // Exit loop when connection succeeds
//         } catch (error) {
//             console.log(error.message);
//             console.log("MySQL is not ready. Retrying in 3 seconds...");
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// };




const connectWithRetry = async () => {
    while (true) {
        try {
           
            const connection = await dbConnection.getConnection();
           
            console.log("Connected to MySQL server successfully");
           
            connection.release();
            break;
           
        } catch (error) {
            console.log(`MySQL connection failed: ${error.message}`);
            console.log("MySQL is not ready. Retrying in 3 seconds...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};


export { connectWithRetry };
