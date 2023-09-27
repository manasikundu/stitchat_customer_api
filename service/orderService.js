const db = require("../dbConnection");
const Users = require("../model/userModel");

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
    console.log(result[0])
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
        delivery_date,
        deliver_time
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
        created_at,
        bill_image,
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
    var query = `SELECT *
    FROM
        public.sarter__boutique_orders bo
    JOIN
        public.sarter__boutique_orders_items boi
    ON
        bo.id = boi.order_id
    JOIN
        public.sarter__boutique_orders_measurement bom
    ON
        boi.id = bom.item_id
    WHERE
        bo.id = ${order_id}`    
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }  
};

exports.getItemsByOrderId = async (order_id) => {
  try {
    var query = `SELECT
        boi.id,
        boi.category_item_dic_id,
        boi.unit_price,
        order_id,
        item.name,
        material_received,
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

exports.customerType=async(order_id)=>{
  var query = `SELECT u.user_type_id
  FROM public.sarter__users u
  INNER JOIN public.sarter__boutique_orders o ON u.id = o.customer_id
  WHERE o.id = ${order_id}`
  var result = await db.query(query)
  return result[0]
}

exports.categoryType=async(order_id)=>{
  var query = `SELECT *
  FROM
      public.sarter__boutique_service_dic s
  JOIN
      public.sarter__boutique_orders o
  ON
      s.boutique_id = o.boutique_id
  WHERE
      o.id = ${order_id}`
  var result = await db.query(query)
  return result[0]
}

// cancel order
exports.orderCancel = async (order_id) => {
  try {
    var query = `UPDATE public.sarter__boutique_orders AS o
    SET "order_status" = s.id
    FROM public.sarter__order_status_dic AS s
    WHERE o.id = ${order_id} AND s.status = 'Order Cancelled'`
    var result = await db.query(query); 
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
}  

exports.itemCancel = async (order_id) => {
  try {
    var query = `UPDATE public.sarter__boutique_orders_items AS i
    SET status = s.status, status_id = 8
    FROM public.sarter__order_status_dic AS s
    WHERE i.order_id = ${order_id} AND s.status = 'Order Cancelled'`
    var result = await db.query(query); 
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
}
