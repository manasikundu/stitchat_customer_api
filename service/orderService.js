var db = require("../dbConnection");

// order list
exports.boutiqueOrder = async (filter) => {
  try {
    var query = `SELECT
                        id,
                        booking_code,
                        boutique_id,
                        customer_id,
                        total_quantity,
                        subtotal_amount,
                        total_payable_amount,
                        order_status AS order_status_id
                        FROM
                        public.sarter__boutique_orders`;
    var conditions = [];
    if (filter) {
      if (filter.id) {
        conditions.push(`id = ${filter.id}`);
      }
      if (filter.boutique_id) {
        conditions.push(`boutique_id = ${filter.boutique_id}`);
      }
      if (filter.booking_code) {
        conditions.push(`booking_code = '${filter.booking_code}'`);
      }
      if (filter.customer_id) {
        conditions.push(`customer_id = ${filter.customer_id}`);
      }
      if (filter.order_status_id) {
        conditions.push(`order_status = ${filter.order_status_id}`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
    }
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

exports.orderStatus = async (filter) => {
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
