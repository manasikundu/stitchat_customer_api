const tailorService = require("../service/tailorService")
const Service = require('../service/userService')
const logService = require('../service/logService')
const db = require("../dbConnection")
const CategoryItem = require("../model/categoryItemModel")
const Tailor=require('../model/tailorServiceModel')
const OrderService = require('../service/userServiceOrderService')
const moment = require('moment')

exports.itemListForTailor = async (req, res) => {
    try {
        var items = await tailorService.getItemForTailor()
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        var validItems = []
        
        for (var i in items) {
            var itemService = await tailorService.serviceDetails(items[i].id)
            if (itemService && itemService.length !== 0) {
                validItems.push(items[i])
            }
        }
        
        if (validItems.length > 0) {
            var itemList = validItems.map(item => ({ item_id: item.id, item_name: item.name }))
            itemList.sort((a, b) => a.id - b.id)

            return res.status(200).send({ message: "Item List retrieved successfully.", HasError: false, result: itemList })
        } else {
            return res.status(500).send({ message: "Items not found.", HasError: true, result: [] })
        }

        // if (items.length > 0) {
        //     // var itemService = tailorService.serviceDetails(items.id)
        //     var itemList = items.map(item => ({ item_id: item.id, item_name: item.name }))
        //     itemList.sort((a, b) => a.id - b.id)

        //     return res.status(200).send({ message: "Item List retrieved successfully.", HasError: false, result: itemList })
        // } else {
        //     return res.status(500).send({ message: "Items not found.", HasError: true, result: [] })
        // }
    } catch (error) {
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

exports.serviceType = async (req, res) => {
    try {
        var item_id = req.query.item_id
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
    
        if (item_id) {
            var item = await tailorService.getItemDetails(item_id)
            if (item) {
                item = item.toJSON()
                var serviceDetails = await tailorService.serviceDetails(item_id)
                console.log(serviceDetails)
                var result = { ALTERED: [], REPAIRED: [] }
                if (serviceDetails.length > 0) {
                    serviceDetails.forEach(service => {
                        var service_type_name = service.service_type === 1 ? 'ALTER' : 'REPAIR'
                        var dataJson = {}
                        dataJson.item_id = item.id
                        dataJson.item_name = item.name
                        dataJson.service_id = service.id
                        dataJson.service_name = service.name
                        dataJson.service_type_id = service.service_type
                        dataJson.service_type_name = service_type_name
                        dataJson.amount = service.amount

                        result[service_type_name === 'ALTER' ? 'ALTERED' : 'REPAIRED'].push(dataJson)
                    })
                    return res.status(200).send({ message: "Item wise service retrieved successfully.", HasError: false, result: result })
                } else {
                    return res.status(200).send({ message: "Service not found.", HasError: false, result: result })
                }
            } else {
                return res.status(400).send({ message: "This item doesn't exist.Please enter a valid item id.", HasError: false })
            }
        } else {
            return res.status(400).send({ message: "Please enter a item id.", HasError: false })
        }
    } catch (error) {
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}


exports.alterationType = async (req, res) => {
    try {
        const itemsMen = await tailorService.getItemForTailorMen()
        const itemsWomen = await tailorService.getItemForTailorWomen()
        const itemsKids = await tailorService.getItemForTailorKids()
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
    
        const result = []

        // Process Men's items
        for (var item of itemsMen) {
            const { id, name } = item
            const serviceDetails = await tailorService.serviceDetails(id)
            const servicesArray = serviceDetails
                .filter(service => service.service_type === 1)
                .map(({ id: service_id, name: service_name, amount, service_type, measurement_flag }) => ({
                    service_id,
                    service_name,
                    amount,
                    service_type_id: service_type,
                    service_type_name: 'ALTER',
                    measurement_flag: measurement_flag,
                }))

            result.push({
                gender_type: 1,
                gender_type_name: 'Men',
                category_item_id: id,
                category_name: name,
                alternation_flag: item.alternation_flag,
                alternationType: servicesArray,
            })
        }

        // Process Women's items
        for (var item of itemsWomen) {
            const { id, name } = item
            const serviceDetails = await tailorService.serviceDetails(id)
            const servicesArray = serviceDetails
                .filter(service => service.service_type === 1)
                .map(({ id: service_id, name: service_name, amount, service_type, measurement_flag }) => ({
                    service_id,
                    service_name,
                    amount,
                    service_type_id: service_type,
                    service_type_name: 'ALTER',
                    measurement_flag: measurement_flag,
                }))

            result.push({
                gender_type: 2,
                gender_type_name: 'Women',
                category_item_id: id,
                category_name: name,
                alternation_flag: item.alternation_flag,
                alternationType: servicesArray,
            })
        }

        // Process Kids' items
        for (var item of itemsKids) {
            const { id, name } = item
            const serviceDetails = await tailorService.serviceDetails(id)
            const servicesArray = serviceDetails
                .filter(service => service.service_type === 1)
                .map(({ id: service_id, name: service_name, amount, service_type, measurement_flag }) => ({
                    service_id,
                    service_name,
                    amount,
                    service_type_id: service_type,
                    service_type_name: 'ALTER',
                    measurement_flag: measurement_flag,
                }))

            result.push({
                gender_type: 3,
                gender_type_name: 'Kids',
                category_item_id: id,
                category_name: name,
                alternation_flag: item.alternation_flag,
                alternationType: servicesArray,
            })
        }
        result.sort((a, b) => a.gender_type - b.gender_type || a.category_item_id - b.category_item_id)

        var currentTime = moment().format('YYYY-MM-DD HH:mm:ss')
        
        var startTimeStr = "09:00:00"
        var endTimeStr = "21:00:00"
        
        var startTime = {
            hours: parseInt(startTimeStr.split(":")[0], 10),
            minutes: parseInt(startTimeStr.split(":")[1], 10)
        }
        
        var endTime = {
            hours: parseInt(endTimeStr.split(":")[0], 10),
            minutes: parseInt(endTimeStr.split(":")[1], 10)
        }
        
        var levels = ["4 hours", "8 hours", "16 hours", "32 hours", "48 hours"]
        
        var result1 = levels.map(level => {
            const endTimeForLevel = moment(currentTime).add(parseInt(level, 10), 'hours')
            const endTimeForLevelHours = endTimeForLevel.hours()
            const endTimeForLevelMinutes = endTimeForLevel.minutes()
            const roundedMinutes = Math.round(endTimeForLevel.minutes() / 30) * 30;
            const roundedEndTime = endTimeForLevel.minutes(roundedMinutes).seconds(0);

            const selectFlag = (roundedEndTime.hours() > startTime.hours || (roundedEndTime.hours() === startTime.hours && roundedEndTime.minutes() >= startTime.minutes)) && (roundedEndTime.hours() < endTime.hours || (roundedEndTime.hours() === endTime.hours && roundedEndTime.minutes() <= endTime.minutes));

            return {
                level: level,
                // end_time: endTimeForLevel.format("YYYY-MM-DD HH:mm:ss"),
                end_time: roundedEndTime.format("YYYY-MM-DD h:mm:ss A"),
                selectflag: selectFlag
            }
        })
    
        return res.status(200).send({ message: "Alteration Type Item List retrieved successfully.", HasError: false, result, timeslot: result1})
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ HasError: false, message: 'Some error occurred.' })
    }
}
