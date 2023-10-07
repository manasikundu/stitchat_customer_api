const BoutiqueAppointment = require('../model/boutiqueAppointmentModel')
const BoutiqueWeeklySchedule = require('../model/boutiqueWeeklyScheduleModel')
const db = require('../dbConnection')

exports.boutiqueWeeklySchedule = async (boutique_id) => {
    try {
        const boutiqueSchedules = await BoutiqueWeeklySchedule.findAll({ attributes: ["week_day", "start_time", "end_time", "check_availability"],
        where: {
          boutique_id: boutique_id,
        },
        raw: true,});
        return boutiqueSchedules;
    } catch (error) {
        console.error("Error listing Boutique week Schedules:", error);
        return error
    }
}

exports.checkAvailability = async (boutique_id, start_time, end_time, appointment_date) => {
    try {
      const query = `
        SELECT * FROM sarter__boutique_appointment
        WHERE boutique_id = ${boutique_id}
        AND start_time = '${start_time}'
        AND end_time = '${end_time}'
        AND appointment_date = '${appointment_date}';
      `;
  
      const result = await db.query(query);
  
      return result[0]; // Assuming you're interested in the first result (if any)
    } catch (error) {
      console.log(error);
      return error;
    }
  };

exports.boutiqueAppointment = async (boutiqueAppointmentData) => {
    try {
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        boutiqueAppointmentData.created_at = formattedDate;
        var bookAppointment = await BoutiqueAppointment.create(boutiqueAppointmentData);
        // var appointment_code =
        //   "STAFA" + appointmentData.customer_id + appointmentData.user_id + bookAppointment.id;
        // await bookAppointment.update({ appointment_code });
        return bookAppointment;
    } catch (error) {
      console.error(error);
      return error;
    }
}

exports.itemInBoutiqueSlot = async (boutique_id) => {
    try {
      var query = `SELECT
      bi.id AS boutique_id,
      bi.boutique_name,
      csd.id AS item_id,
      csd.name AS item_name,
      item_img.image AS item_image
  FROM public.sarter__boutique_basic_info bi
  JOIN public.sarter__boutique_service_dic bs ON bi.id = bs.boutique_id
  JOIN public.sarter__category_item_dic csd ON bs.service_id = csd.id
  LEFT JOIN public.sarter__category_item_images item_img ON csd.id = item_img.category_id AND csd.type = item_img.category_type
  WHERE bi.id = ${boutique_id}`;
  
      var result = await db.query(query);
      return result[0];
    } catch (error) {
      console.log("error : ", error);
      return error;
    }
};
  
  
