const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const imageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            trim: true,
            immutable: true,
            default: uuidv4
        },
        name: {
            type: String,
            trim: true,
        },
        extension: {
            type: String,
            trim: true,
        },
        size: {
            type: Number,
        },
        thumbnailUrl: {
            type: String,
            trim: true,
        },
        publicId: {
            type: String,
            trim: true,
        },
        owner: {
            type: String,
            trim: true,
        },
        providers: [String],
    } 
);

module.exports = mongoose.model("Image", imageSchema);