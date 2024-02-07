const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const pug = require("pug");
const cors = require("cors");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { google } = require("googleapis");
const mongoose = require("mongoose");
const departmentRoute = require("./routes/departmentRoute");
const timeInRoute = require("./routes/timeInRoute");
const employeeAttendanceRoute = require("./routes/employeeAttendanceRoute");
const employeeRoute = require("./routes/employeeRoute");
const viewsRoute = require("./routes/viewsRoute");
//const { myCalendar } = require("./calendar");
const { initializeTimeIn } = require("./utils/helperFunctions");
const { MongoClient, ServerApiVersion } = require("mongodb");

//main app
const app = express();

//sub apps
const { admin, superAdmin } = require("./routes/adminRoute");

dotenv.config({ path: "./config.env" });

const port = app.set("port", process.env.PORT || 4040);

//cloudinary configuration
cloudinary.config({
  cloud_name: "dbg6zbtm4",
  api_key: "649721938535186",
  api_secret: "lgZrOgteHsLtLS41HywQrAI8JY0",
});

//mongoose.connect("mongodb://127.0.0.1:27017/AttendanceManager");

const uri =
  "mongodb+srv://pokohufuoma:ZzDT4rHtbSC4VSY1@cluster0.zjsj0kz.mongodb.net/Application-Manager?retryWrites=true&w=majority";

//db connection.
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

//
//app middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());




app.get("/home", (req, res, next)=>{
  return res.send("this is the home page, man")
  
})

//define app middlwares
app.use("/app/v1/departments", departmentRoute);
app.use("/app/v1/employees", employeeRoute);
app.use("/app/v1/employees/signIn", timeInRoute);
app.use("/app/v1/attendance", employeeAttendanceRoute);
app.get("/app/v1/get_event", myCalendar);
app.use("/app/v1/", viewsRoute);

app.use(["/app/v1/admin", "/app/v1/superAdmin"], admin);
app.use("/app/v1/superAdmin", superAdmin);

initializeTimeIn();

//unhandled routes
app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.errCode = 404;
  err.status = "fail!";

  next(err);
});

//error handler
app.use((err, req, res, next) => {
  const errorMessage = err.message;
  const errorStatus = err.status || "INTERNAL SERVER ERROR";
  const errorCode = err.errCode || 500;
  const stack = err.stack;
  return res
    .status(errorCode)
    .json({ status: errorStatus, message: errorMessage, stack: stack });
});

app.listen(app.get("port"), () => {
  console.log(`Server is running on port ${app.get("port")}`);
});

//create an admin interface to allow admin access and perform admin duties like: adding a new employee... editing employee details and
//create jwt tokens for the admin. that should be their method of login. there should be a super admin as well he should be able to create and delete
//admins.
//deleting an employee... as well asperforming special queries to the database... later, i can create admin layers.
