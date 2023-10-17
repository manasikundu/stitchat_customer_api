const tailorService = require("../service/tailorService")

exports.itemListForTailor = async (req, res) => {
    try {
        var items = await tailorService.getItemForTailor()
        if (items.length > 0) {
            var itemList = items.map(item => ({ item_id: item.id, item_name: item.name }))
            return res.status(200).send({ message: "Item List retrieved successfully.", HasError: false, result: itemList })
        } else {
            return res.status(500).send({ message: "Items not found.", HasError: true, result: [] })
        }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

exports.serviceType = async (req, res) => {
    try {
        var item_id = req.query.item_id
        if (item_id) {
            var item=await tailorService.getItemDetails(item_id)
            if(item){
                item=item.toJSON()
                var serviceDetails = await tailorService.serviceDetails(item_id)
                if(serviceDetails.length>0){
                    var result = {ALTERED: [],REPAIRED: []}
                    serviceDetails.forEach(service => {
                        var service_type_name = service.service_type === 1 ? 'ALTER' : 'REPAIR'
                        var dataJson = {}
                        dataJson.item_id = item.id
                        dataJson.item_name= item.name
                        dataJson.service_id = service.id
                        dataJson.service_name = service.name
                        dataJson.service_type_id = service.service_type
                        dataJson.service_type_name = service_type_name
                        dataJson.amount = service.amount
        
                        result[service_type_name === 'ALTER' ? 'ALTERED' : 'REPAIRED'].push(dataJson)
                    })
                    return res.status(200).send({ message: "Item wise service retrieved successfully.", HasError: false,result:result })
                }else{
                    return res.status(500).send({message: "Service not found.",HasError: true,result: {}}) 
                }
            }else{
                return res.status(400).send({ message: "This item doesn't exist.Please enter a valid item id.", HasError: false })
            }
        } else {
            return res.status(400).send({ message: "Please enter a item id.", HasError: false })
        }


        // var serviceType = await tailorService.serviceType()
        // if (serviceType.length > 0) {
        //     var result = {ALTERED: [],REPAIRED: []}
        //     var itemId = await tailorService.serviceTypeItem(item_id)
        //     var itemName = await tailorService.serviceTypeItemName(item_id)
        //     for (var i in itemId) {
        //         item_id=itemId[i].category_id
        //         for (var j in itemName) {
        //             item_name=itemName[j].name
        //         }
        //     }
        //     serviceType.forEach(item => {
        //         var service_type_name = item.service_type === 1 ? 'ALTER' : 'REPAIR'
        //         var itemIdJson = {}
        //         var dataJson = {}
        //         dataJson.item_id = item_id
        //         dataJson.item_name= item_name
        //         dataJson.service_id = item.id
        //         dataJson.service_name = item.name
        //         dataJson.service_type_id = item.service_type
        //         dataJson.service_type_name = service_type_name
        //         dataJson.amount = item.amount

        //         result[service_type_name === 'ALTER' ? 'ALTERED' : 'REPAIRED'].push(dataJson)
        //     })
        //     return res.status(200).send({message: "Item wise service retrieved successfully.",HasError: false,result: result})
        // } else {
        //     return res.status(500).send({message: "Service not found.",HasError: true,result: {}})
        // }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

