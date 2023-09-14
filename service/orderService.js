var db = require("../dbConnection");

// order list
exports.boutiqueOrder = async (user_id) => {
  try {
    var query = `SELECT
                        id,
                        booking_code,
                        boutique_id,
                        customer_id,
                        total_quantity,
                        subtotal_amount,
                        discount_amount,
                        coupon_applied_amount,
                        tax_applied_amount,
                        total_payable_amount,
                        order_status AS order_status_id,
                        first_name,
                        last_name,
                        mobile_number,
                        email_id,
                        reward_point
                        FROM
                        public.sarter__boutique_orders WHERE customer_id = ${user_id}`;
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.boutiqueAddress = async (filter) => {
  try {
    var query = `SELECT
        boutique_name,
        coutry_state,
        city,
        area,
        address,
        landmark
    FROM
        public.sarter__boutique_basic_info
        WHERE
        id IN (SELECT boutique_id FROM public.sarter__boutique_orders)`;
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.orderStatus = async () => {
  try {
    var query = `SELECT
        id,
        status AS order_status_name
    FROM
        public.sarter__order_status_dic
    WHERE
        id IN (SELECT order_status FROM public.sarter__boutique_orders)`;
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.orderDelivery = async () => {
  try {
    var query = `SELECT
        order_id,
        delivery_date
    FROM
        public.sarter__boutique_orders_items
		WHERE 
		 order_id IN (SELECT id FROM public.sarter__boutique_orders)`;

    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

// order details
exports.boutiqueOrderByOrderId = async (order_id) => {
  try {
    var query = `
      SELECT
        id,
        booking_code,
        boutique_id,
        customer_id,
        total_quantity,
        subtotal_amount,
        discount_amount,
        coupon_applied_amount,
        tax_applied_amount,
        total_payable_amount,
        order_status AS order_status_id,
        first_name,
        last_name,
        mobile_number,
        email_id,
        reward_point
      FROM
        public.sarter__boutique_orders
      WHERE
        id = ${order_id}`;

    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.getMeasurement = async (order_id) => {
  try {
    var query = `SELECT
	bo.customer_id,
    boi.category_item_dic_id,
    boi.item_name,
    bom.measurement_id,
    bom.name,
    bom.value,
    bom.uom
FROM
    public.sarter__boutique_orders_items boi
JOIN
    public.sarter__boutique_orders bo
ON
    boi.order_id = bo.id
JOIN
    public.sarter__boutique_orders_measurement bom
ON
    boi.category_item_dic_id = bom.item_id
WHERE
    bom.id = ${order_id}`
    var result = await db.query(query)
    return result[0]

  } catch (error) {
    console.log(error)
    return error
  }  
}

exports.getItemsByOrderId = async (order_id) => {
  try {
    var query = `SELECT
        item.id,
        item.name,
        material_image,
		    fabric_type
      FROM
        sarter__boutique_orders_items boi
      JOIN
        sarter__category_item_dic item
      ON
        boi.category_item_dic_id = item.id
      WHERE
        boi.order_id = ${order_id}`
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.getCategoryByItemId = async (item_id) => {
  try {
    var query = `select * from sarter__category_item_dic where id in(select parent_id from sarter__category_item_dic where id=${item_id})`
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.getItemImagesByItemId = async (item_id) => {
  try {
    var query = `
      SELECT
        image
      FROM
        sarter__category_item_images
      WHERE
        category_id = ${item_id}`;

    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

