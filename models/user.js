const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            immutable: true,
            default: uuidv4
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        ip_address: {
            type: String,
            trim: true,
        },
        port: {
            type: String,
            trim: true,
        },
        groups: [String]
    } 
);

module.exports = mongoose.model("User", userSchema);