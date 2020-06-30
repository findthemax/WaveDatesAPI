const express = require('express')
const router = express.Router();
const { check, validationResult } = require('express-validator')
const Locations = require('../models/Locations')
const locationData = require('../config/locationData')
const axios = require('axios')
const moment = require('moment')
const {openWeatherAPIKey, OWOneCallURL, DistMatrixURL, googleMapAPIKey} = require('../config/default')


//  @route  GET /locations
//  @desc   takes a lat long and returns 60 results with weather data
//  access  public
router.post('/', [
    check('customerLat')
        .not().isEmpty().withMessage(`Please provide a latitude`),
    check('customerLong')
        .not().isEmpty().withMessage(`Please provide a longitude`),
    check('driveTime')
        .not().isEmpty().withMessage(`Please provide a drive time option`)
], async (req, res) => {

    try {

        const errors = validationResult(req)

        if(!errors.isEmpty()) {
            // console.log(errors.array());
            return res.status(400).json({ errors: errors.array() })
        }

        let {customerLat, customerLong, driveTime} = req.body


        let locations = await Locations.find().lean()

        if(locations.length < 1) {
            for (let index = 0; index < locationData.length; index++) {
                const loc = locationData[index]
                const location = new Locations(loc)
                await location.save()
            }
        }

        //firstly get all the locations and find the nearest by great circle distance. Limit to 60 in order to preserve api calls (within a minute)
        let newLocations = locations.map(location => {
            let radlat1 = Math.PI * customerLat/180
            let radlat2 = Math.PI * location.lat/180
            let theta = customerLong-location.long
            let radtheta = Math.PI * theta/180
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist)
            dist = dist * 180/Math.PI
            dist = dist * 60 * 1.1515
            location.distance = dist

            return location
        })

        newLocations = newLocations.sort((a, b) => (a.distance > b.distance) ? 1 : -1)
        newLocations = newLocations.slice(0,60)

        // for (let index = 0; index < newLocations.length; index++) {
        if(driveTime) {
            for (let index = 0; index < newLocations.length; index++) {
                const location = newLocations[index]
                let matrixData = await axios.get(`${DistMatrixURL}origins=${customerLat},${customerLong}&destinations=${location.lat},${location.long}&units=imperial&key=${googleMapAPIKey}`)
                location.travelTime = matrixData.data.rows[0].elements[0].status === 'OK' ? Math.round(matrixData.data.rows[0].elements[0].duration.value/60) : false
            }
        }

        res.json(newLocations)


    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

//  @route  GET /weather and data
//  @desc   takes a location, skillLevel and time time and returns the forecast and quality
//  access  public
router.post('/weather', [
    check('locationId')
        .not().isEmpty().withMessage(`Please provide a location`),
], async (req, res) => {

    try {

        const errors = validationResult(req)

        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const {locationId} = req.body

        let location = await Locations.findById(locationId).lean()


        if(!location.forecastTime || moment(location.forecastTime).isBefore(moment().subtract(12, 'hours'))) {
            let wxData = await axios.get(`${OWOneCallURL}lat=${location.lat}&lon=${location.long}&exclude=minutely,daily,current&appid=${openWeatherAPIKey}`)
            location.forecast = wxData.data.hourly
            await Locations.findByIdAndUpdate(location._id, {forecast: wxData.data.hourly, forecastTime: Date.now()}, {useFindAndModify: false})
        }

        res.json(location)


    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})




module.exports = router