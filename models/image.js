const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const imageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            immutable: true,
            default: uuidv4
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        extension: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: Number,
            required: true,
        },
        thumbnailUrl: {
            type: String,
            required: true,
            trim: true,
        },
        publicId: {
            type: String,
            required: true,
            trim: true,
        },
        owner: {
            type: String,
            required: true,
            trim: true,
        },
        providers: [String],
    } 
);

module.exports = mongoose.model("Image", imageSchema);