const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Image = require('../models/image').schema;

const groupSchema = new mongoose.Schema(
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
        },
        desc: {
            type: String,
            trim: true,
        },
        members: [String],
        images: [Image],
        admin: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        }
    } 
);

module.exports = mongoose.model("Group", groupSchema);