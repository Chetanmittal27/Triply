import mongoose from "mongoose";
import {DB_NAME} from "../contants.js";

import dotenv from "dotenv";
dotenv.config();


const ConnectDB = async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);        // Returns a promise
        console.log("MONGODB Connected Successfully");
        console.log("Host " , mongoose.connection.host);
        console.log("Database Name " , mongoose.connection.name);
    }
    catch(error){
        console.log("ERROR: Database Connection Failed" , error);
        process.exit(1);                                                          // Stops the app is connection failed
    }
};


export default ConnectDB;