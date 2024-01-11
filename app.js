const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require('cors')

const Router = require("./router/userRouter");
const boutiqueRouter = require("./router/userBoutiqueRouter");
const designersRouter = require("./router/FDRouter");
const orderRouter = require("./router/orderRouter")
const ratingRouter = require("./router/ratingRouter")
const boutiqueAppointmentRouter = require("./router/boutiqueAppointmentRouter")
const tailorRouter = require("./router/tailorRouter")
const UserServiceCart = require("./router/userServiceCartRouter")
const userServiceOrder = require("./router/userServiceOrderRouter")
const videoInquire = require("./router/videoEnquireRouter")
const coupon = require("./router/couponRouter")
const ShowroomRequest = require('./router/showroomRequestRouter')
const showroomserviceOrder=require('./router/showroomServiceOrderRouter')

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use(bodyParser.json());
// app.use(morgan("combined"));

app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization");
    next();
});
app.use("", Router);
app.use("", boutiqueRouter);
app.use("", designersRouter);
app.use("", orderRouter)
app.use("", ratingRouter)
app.use("", boutiqueAppointmentRouter)
app.use("", tailorRouter)
app.use("", UserServiceCart)
app.use("", userServiceOrder)
app.use("", videoInquire)
app.use("", coupon)
app.use("", ShowroomRequest)
app.use("", showroomserviceOrder)


const port = 8000
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
