const db = require("../dbConnection")
const CategoryItem = require("../model/categoryItemModel")
const Tailor=require('../model/tailorServiceModel')


exports.getItemForTailor = async () => {
    try {
        var query = `select * from sarter__category_item_dic where parent_id in (select id from sarter__category_item_dic where parent_id=1)limit 15`
        var result = await db.query(query)
        return result[0]
    } catch (error) {
        console.log(error)
        return error
    }
}

exports.serviceDetails = async (item_id) => {
    var query = `select * from sarter__tailor_sub_category where id in(select sub_category_id from sarter__tailor_mapping where category_id =${item_id})`
    var result = await db.query(query)
    return result[0]
}


exports.getItemDetails = async (item_id) => {
    const result = await CategoryItem.findOne({ where: { id: item_id } })
    return result
}

exports.getServiceDetails = async (id) => {
    const result = await Tailor.findOne({ where: { id: id } })
    return result
}
