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
  
  
// exports.boutiqueAppointment = async (boutiqueAppointmentData) => {
//     try {
//         const query = `insert `
//         const boutiqueAppointment = await BoutiqueAppointment.create(boutiqueAppointmentData)
//         return boutiqueAppointment
//     } catch (error) {
//         console.log("Error inserting boutiqie appointment : ", error)
//         return error     
//     }
// }  
