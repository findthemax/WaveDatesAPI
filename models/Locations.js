const mongoose = require('mongoose')

const locationsSchema = new mongoose.Schema({
    locName: {
        type: String,
        required: true
    },
    county: {
        type: String,
        required: true
    },
    lat: {
        type: String,
        required: true
    },
    long: {
        type: String,
        required: true
    },
    forecastTime: {
        type: Date,
    },
    forecast: [],
}, {
    timestamps: true,
    minimize: false,
})

const Locations = mongoose.model('Locations', locationsSchema)

module.exports = Locations