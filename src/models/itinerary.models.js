import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    dayNumber: { type: Number, required: true, min: 1 },
    desc: { type: String, default: "" },
    onDate: { type: Date, required: true }
}, { timestamps: true });

itinerarySchema.index({ tripId: 1, dayNumber: 1 }, { unique: true });

export const Itinerary = mongoose.model("Itinerary", itinerarySchema);
