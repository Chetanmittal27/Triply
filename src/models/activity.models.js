import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        itineraryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Itinerary",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        desc: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            required: true
        },

        onTime: {
            type: String,
            required: true
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        type: {
            type: String,
            enum: ["Sightseeing", "Food", "Transport", "Hotel", "Adventure", "Other"],
            default: "Other"
        }

    } , {timestamps: true}

);


export const Activity = mongoose.model("Activity" , activitySchema);