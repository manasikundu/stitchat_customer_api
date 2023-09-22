const ratingController = require("../controller/ratingController");
const route = require("express-promise-router");
const router = new route();

router.post("/addRating", ratingController.addRatings);

module.exports = router;
