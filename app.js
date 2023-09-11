const express = require("express");
const app = express();
const morgan = require("morgan");

let Router = require("./router/userRouter");
let boutiqueRouter = require("./router/userBoutiqueRouter");
let designersRouter = require("./router/FDRouter");

const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(morgan("combined"));
app.use("", Router);
app.use("", boutiqueRouter);
app.use("", designersRouter);
app.use(express.json());

app.listen(8000, "0.0.0.0", () => {
    console.log("Server running...");
});
