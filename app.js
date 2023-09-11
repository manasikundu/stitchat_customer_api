const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require('cors')

let Router = require("./router/userRouter");
let boutiqueRouter = require("./router/userBoutiqueRouter");
let designersRouter = require("./router/FDRouter");

const bodyParser = require("body-parser");
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
const port=9000
app.listen(port,() => {
    console.log(`Server running on port ${port}`);
});
