import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        url: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ["pdf" , "image"],
            required: true
        },

        size: {
            type: Number,
            default: 0
        },


    } , {timestamps: true}
);


export const File = mongoose.model("File" , fileSchema);