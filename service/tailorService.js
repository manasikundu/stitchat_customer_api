const db = require("../dbConnection")
const CategoryItem = require("../model/categoryItemModel")


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

// exports.serviceType = async () => {
//     try {
//         var query = `select * from sarter__tailor_sub_category`
//         var result = await db.query(query)
//         return result[0]
//     } catch (error) {
//         console.log(error)
//         return error  
//     }
// }

exports.serviceDetails     = async (item_id) => {
        var query = `select * from sarter__tailor_sub_category where id in(select sub_category_id from sarter__tailor_mapping where category_id =${item_id})`
        // var query = `SELECT stsc.*, stm.category_id
        // FROM sarter__tailor_sub_category stsc, sarter__tailor_mapping stm
        // WHERE stsc.id = stm.sub_category_id
        // AND stm.category_id = ${item_id}`
        var result = await db.query(query)
        return result[0]
}

// exports.serviceTypeItemName = async (item_id) => {
//     try {
//         var query = `select * from sarter__category_item_dic where id=${item_id}`
//         var result = await db.query(query)
//         return result[0]
//     } catch (error) {
//         console.log(error)
//         return error  
//     }
// }



exports.getItemDetails=async(item_id)=>{
  const result=await CategoryItem.findOne({where:{id:item_id}})
  return result
}
