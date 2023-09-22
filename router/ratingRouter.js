const ratingController = require("../controller/ratingController");
const route = require("express-promise-router");
const router = new route();

router.post("/rating", ratingController.addRatings);

module.exports = router;
