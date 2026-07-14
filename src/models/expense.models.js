import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        onDateTime: {
            type: Date,
            default: Date.now
        },

        category: {
            type: String,
            enum: ["Food", "Transport", "Hotel", "Shopping", "Adventure", "Other"],
            default: "Other"
        }

    } , {timestamps: true}
)


export const Expense = mongoose.model("Expense" , expenseSchema);
