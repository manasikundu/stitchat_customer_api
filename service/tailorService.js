const db = require("../dbConnection")
const CategoryItem = require("../model/categoryItemModel")
const Tailor=require('../model/tailorServiceModel')
const { Op, Sequelize } = require("sequelize");


exports.getItemForTailor = async () => {
    try {
        var query = `SELECT DISTINCT ON (name) *
        FROM sarter__category_item_dic 
        WHERE parent_id IN (
            SELECT id 
            FROM sarter__category_item_dic 
            WHERE parent_id IN (1, 12))`
        // var query = `SELECT DISTINCT * 
        // FROM sarter__category_item_dic 
        // WHERE parent_id IN (
        //     SELECT id 
        //     FROM sarter__category_item_dic 
        //     WHERE parent_id IN (1, 12)
        // )`
        var result = await db.query(query)
        return result[0]
    } catch (error) {
        console.log(error)
        return error
    }
}

exports.getItem = async () => {
    try {
        const parentResults = await CategoryItem.findAll({
            attributes: ['id'],
            where: {
                parent_id: {
                    [Sequelize.Op.in]: [1, 12]
                }
            }
        })

        if (!Array.isArray(parentResults)) {
            return ('Parent results is not an array');
        }

        const parentIds = parentResults.map(parent => parent.id);

        const result = await CategoryItem.findAll({
            attributes: [
              [Sequelize.fn('DISTINCT', Sequelize.col('name')), 'name'],
              'id', 
              'parent_id',
            ],
            where: {
              parent_id: {
                [Sequelize.Op.in]: parentIds,
              },
            },
            order: [['name', 'ASC']],
          });

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
};


// exports.getItem = async () => {
//     try {
//         const parentResults = await CategoryItem.findAll({
//             attributes: ['id'],
//             where: {
//                 parent_id: {
//                     [Sequelize.Op.in]: [1, 12]
//                 }
//             }
//         });

//         if (!Array.isArray(parentResults)) {
//             return ('Parent results is not an array');
//         }

//         const parentIds = parentResults.map(parent => parent.id);
//         console.log(parentIds)

//         const result = await CategoryItem.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('name')), 'name']],
//             where: {
//                 parent_id: {
//                     [Sequelize.Op.in]: parentIds
//                 }
//             },
//             order: [['name', 'ASC']],
//             include: [{
//                 model: CategoryItem,
//                 as: 'Children',
//                 required: true,
//                 include: [{
//                     model: CategoryItem,
//                     as: 'Children',
//                     required: true
//                 }]
//             }]
//         });

//         return result;
//     } catch (error) {
//         console.error(error);
//         return error;
//     }
// };

exports.getItemForTailorMen = async () => {
    try {
        var query = `SELECT DISTINCT ON (name) *
        FROM sarter__category_item_dic 
        WHERE parent_id IN (
            SELECT id 
            FROM sarter__category_item_dic 
            WHERE parent_id=1)`
        // var query = `SELECT * FROM sarter__category_item_dic WHERE parent_id IN (SELECT id FROM sarter__category_item_dic WHERE parent_id=1)`     
        var result = await db.query(query)
        return result[0]
    } catch (error) {
        console.log(error)
        return error
    }
}
exports.getItemForTailorWomen = async () => {
    try {
        var query = `SELECT DISTINCT ON (name) *
        FROM sarter__category_item_dic 
        WHERE parent_id IN (
            SELECT id 
            FROM sarter__category_item_dic 
            WHERE parent_id=12)`

        // var query = `SELECT * FROM sarter__category_item_dic WHERE parent_id IN (SELECT id FROM sarter__category_item_dic WHERE parent_id=12)`
        var result = await db.query(query)
        return result[0]
    } catch (error) {
        console.log(error)
        return error
    }
}
exports.getItemForTailorKids = async () => {
    try {
        var query = `SELECT DISTINCT ON (name) * FROM sarter__category_item_dic WHERE parent_id IN (SELECT id FROM sarter__category_item_dic WHERE parent_id in (1, 12)) and type in (2, 3)`
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


exports.getServiceName = async (id) => {
    const result = await Tailor.findOne({ where: { id: id } })
    return result
}

exports.getItemList = async () => {
    try {
        const catArray = { '1': 'Men', '12': 'Women' };
        const detail = [];

        for (var [k1, v1] of Object.entries(catArray)) {
            const genderType = k1 === '1' ? 1 : k1 === '12' ? 2 : 3;
            const genderTypeName = k1 === '1' ? 'Men' : k1 === '12' ? 'Women' : 'Kids';
            
            const categoryItems = await db.query(`
                SELECT
                    tc.id AS category_item_id,
                    tc.name AS category_name,
                    tsc.id AS service_id,
                    tsc.name AS service_name,
                    tsc.amount,
                    tsc.service_type AS service_type_id,
                    'Alter' AS service_type_name,
                    ${genderType} AS gender_type,
                    '${genderTypeName}' AS gender_type_name
                FROM
                    sarter__category_item_dic cid
                JOIN
                    sarter__category_item_dic tc ON cid.id = tc.parent_id
                LEFT JOIN
                    sarter__tailor_mapping tm ON tc.id = tm.sub_category_id
                LEFT JOIN
                    sarter__tailor_sub_category tsc ON tm.sub_category_id = tsc.id AND tsc.service_type = 1
                WHERE
                    cid.parent_id = ${k1} AND
                    tc.status = 1
            `);

            if (categoryItems && categoryItems.length > 0) {
                detail.push(...categoryItems);
            }
        }
        const rows = detail.map(result => result.rows).flat();
        data = rows.filter(item => item !== undefined);
        return data;

        // return detail;
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching category items');
    }
};