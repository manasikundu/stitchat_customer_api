const db = require("../dbConnection")

exports.getItemForTailor = async () => {
    try {
        var query = `select * from sarter__category_item_dic where parent_id in (select id from sarter__category_item_dic where parent_id=1)limit 10`
        var result = await db.query(query)
        return result[0]
    } catch (error) {
        console.log(error)
        return error  
    }
}