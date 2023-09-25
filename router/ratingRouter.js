const ratingController = require("../controller/ratingController");
const route = require("express-promise-router");
const router = new route();

router.post("/addRating", ratingController.addRatings)
router.post("/updateRating", ratingController.updateRatings)
router.get("/ratingList", ratingController.ratingList)


module.exports = router;
