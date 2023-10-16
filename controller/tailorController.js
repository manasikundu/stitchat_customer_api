const tailorService = require("../service/tailorService")

exports.itemListForTailor = async (req, res) => {
    try {
        var items = await tailorService.getItemForTailor()
        if (items.length > 0) {
            var itemList = items.map(item => ({item_id: item.id,item_name: item.name}))
            return res.status(200).send({message: "Item List retrieved successfully.",HasError: false,result: itemList})
        } else {
            return res.status(500).send({message: "Items not found.",HasError: true,result: []})
        }
    } catch (error) {
        return res.status(500).send({message: "Some error occurred.",HasError: true,error: error.message})
    }
}
