const db = require("../dbConnection");
const { Op } = require("sequelize");
const BoutiqueOrder = require("../model/boutiqueOrderModel");
const Boutique = require("../model/userBoutiqueInfoModel");
const Users = require("../model/userModel");
const moment = require("moment");
const CategoryItem = require("../model/categoryItemModel");
const CategoryItemImage = require("../model/categoryItemImageModel");

// find the boutique by letter
exports.getBoutiques = async (letter) => {
  try {
    let whereClause = {};

    if (letter) {
      whereClause = {
        boutique_name: {
          [Op.iLike]: `${letter}%`,
        },
      };
    }

    whereClause.user_type_id = {
      [Op.ne]: 6,
    };

    return await Boutique.findAll({
      where: whereClause,
    });
  } catch (error) {
    return error;
  }
};

exports.searchBoutiques = async (searchQuery) => {
  try {
    let whereClause = {};

    if (searchQuery) {
      whereClause = {
        boutique_name: {
          [Op.iLike]: `%${searchQuery}%`,
        },
      };
    }

    whereClause.user_type_id = {
      [Op.ne]: 6,
    };

    return await Boutique.findAll({
      where: whereClause,
    });
  } catch (error) {
    return error;
  }
};


// sort boutique list by popolarity, newest, A-Z, Z-A, Faraway distance
exports.sortBoutiques = (boutiques, sortType) => {
  if (sortType === "5") {
    // Sort by Newest (create_on field in descending order)
    return boutiques.sort(
      (a, b) => new Date(b.create_on) - new Date(a.create_on)
    );
  } else if (sortType === "6") {
    // Sort by Popularity (order_count field from BoutiqueOrder in descending order)
    return boutiques.sort((a, b) => {
      var orderCountA = a.BoutiqueOrder ? a.BoutiqueOrder.order_count : 0;
      var orderCountB = b.BoutiqueOrder ? b.BoutiqueOrder.order_count : 0;
      return orderCountB - orderCountA;
    });
  } else if (sortType === "3") {
    // Sort A-Z (boutique_name in ascending order)
    return boutiques.sort((a, b) =>
      a.boutique_name.localeCompare(b.boutique_name)
    );
  } else if (sortType === "4") {
    // Sort Z-A (boutique_name in descending order)
    return boutiques.sort((a, b) =>
      b.boutique_name.localeCompare(a.boutique_name)
    );
  } else if (sortType === "1") {
    // Sort by NearDistance (distance in ascending order)
    return boutiques.sort((a, b) => a.distance - b.distance);
  } else if (sortType === "2") {
    // Sort by FarAwayDistance (distance in descending order)
    return boutiques.sort((a, b) => b.distance - a.distance);
  } else {
    // Default sorting (no change in order)
    return boutiques;
  }
};

// Filter boutique list by gender (men, women, kid(boy), kid(girl))
exports.filterBoutiqueListByGender = async (boutiques, filter_by_gender) => {
  // "1" for men
  if (filter_by_gender === "1") {
    return boutiques.filter(
      (boutique) => boutique.categoryType && boutique.categoryType.includes("1")
    );
    // "2" for women
  } else if (filter_by_gender === "2") {
    return boutiques.filter(
      (boutique) => boutique.categoryType && boutique.categoryType.includes("2")
    );
    // "3" for kid
  } else if (filter_by_gender === "3") {
    return boutiques.filter(
      (boutique) => boutique.categoryType && boutique.categoryType.includes("3")
    );
    // "4" for all
  } else if (filter_by_gender === "4" || filter_by_gender === null) {
    return boutiques.filter(
      (boutique) => boutique.categoryType && boutique.categoryType.includes("4")
    );
    // Default
  } else {
    return boutiques;
  }
};

// Filter boutique by category id and item id for single and multiple item
exports.filterBoutiquesByItem = async (items) => {
  try {
    var query;

    if (items.includes(',')) {
      // For multiple item query
      var itemValues = items.split(',').map((item) => item.trim()).join("', '");
      query = `
        SELECT
          bi.id,
          bi.boutique_name,
          bi.address,
          bi.boutique_logo AS image,
          bi.contact_number,
          bi."categoryType",
          bi.location_lat,
          bi.location_lng
        FROM public.sarter__boutique_basic_info bi
        JOIN public.sarter__boutique_service_dic bs ON bi.id = bs.boutique_id
        JOIN public.sarter__category_item_dic csd ON bs.service_id = csd.id
        JOIN public.sarter__category_item_dic parent_csd ON csd.parent_id = parent_csd.id
        LEFT JOIN public.sarter__category_item_images cat_img ON parent_csd.id = cat_img.category_id AND parent_csd.type = cat_img.category_type
        LEFT JOIN public.sarter__category_item_images item_img ON csd.id = item_img.category_id AND csd.type = item_img.category_type
        WHERE parent_csd.type IS NOT NULL
          AND csd.name IN ('${itemValues}')
        ORDER BY bi.id, parent_csd.id, csd.id;
      `;
    } else {
      // For a single item query
      query = `
        SELECT
          bi.id,
          bi.boutique_name,
          bi.address,
          bi.boutique_logo AS image,
          bi.contact_number,
          bi."categoryType",
          bi.location_lat,
          bi.location_lng
        FROM public.sarter__boutique_basic_info bi
        JOIN public.sarter__boutique_service_dic bs ON bi.id = bs.boutique_id
        JOIN public.sarter__category_item_dic csd ON bs.service_id = csd.id
        JOIN public.sarter__category_item_dic parent_csd ON csd.parent_id = parent_csd.id
        LEFT JOIN public.sarter__category_item_images cat_img ON parent_csd.id = cat_img.category_id AND parent_csd.type = cat_img.category_type
        LEFT JOIN public.sarter__category_item_images item_img ON csd.id = item_img.category_id AND csd.type = item_img.category_type
        WHERE parent_csd.type IS NOT NULL
          AND csd.name = '${items}'
        ORDER BY bi.id, parent_csd.id, csd.id;
      `;
    }
    var result = await db.query(query);

    return result;
  } catch (error) {
    return error;
  }
};

// added category in boutique list
exports.categoryServiceFilter = async () => {
  try {
    var query = `SELECT
    parent_csd.type AS parent_category_id,
    parent_csd.name AS parent_category_name,
    cat_img.image AS category_image,
    csd.id AS item_id,
    csd.name AS item_name,
    item_img.image AS item_image
    FROM public.sarter__category_item_dic csd
    JOIN public.sarter__category_item_dic parent_csd ON csd.parent_id = parent_csd.id
    LEFT JOIN public.sarter__category_item_images cat_img ON parent_csd.id = cat_img.category_id
     AND parent_csd.type = cat_img.category_type
    LEFT JOIN public.sarter__category_item_images item_img ON csd.id = item_img.category_id
     AND csd.type = item_img.category_type
    WHERE parent_csd.type IS NOT NULL
    ORDER BY parent_csd.id, csd.id`;

    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log("error : ", error);
    return error;
  }
};


exports.getBoutiqueById=async(id)=>{
  const result=await Boutique.findOne({where:{id:id}})
  return result.toJSON()
}