import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        destination: {
            type: String,
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],

        coverPhoto: {
            type: String,
            default: ""
        },

        budgetLimit:{
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["Not Started" , "In Progress" , "Completed"],
            default: "Not Started"
        },

        threeDayReminderSentAt: { type: Date, default: null },

        shareLink: {
            type: String,
            unique: true,
            sparse: true,                     // enforces unique on documents where this field has some value , ignore null values
            default: null
        }

    },{timestamps: true}
);


export const Trip = mongoose.model("Trip" , tripSchema);
