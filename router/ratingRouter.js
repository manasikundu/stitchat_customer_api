const ratingController = require("../controller/ratingController");
const route = require("express-promise-router");
const router = new route();

router.post("/addAndUpdateRating", ratingController.addAndUpdateRating)
router.get("/ratingList", ratingController.ratingList)

module.exports = router;
