const mongoose = require("mongoose");
const Employee = require("../models/employeeSchema");
const Department = require("../models/departmentSchema");
const TimeIn = require("../models/timesInSchema");
const niv = require("node-input-validator");
const { generateEmployeeId } = require("../utils/helperFunctions");
const nodemailer = require("nodemailer");
const catchAsync = require("../utils/catchAsync");
const canvas = require("canvas");
const fileUpload = require("express-fileupload");
const faceapi = require("face-api.js");

//setup the nodemailer options. take this to the config file later.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pokoh.ufuoma@gmail.com",
    pass: "utnttwkysvdscyis",
  },
});

exports.addNewEmployee = catchAsync(async (req, res, next) => {
  const { name, email, department, role, gender } = req.body;

  //note that the images are stored in req.images

  const descriptions = [];
  // Loop through the images
  for (let i = 0; i < req.images.length; i++) {
    const img = await canvas.loadImage(req.images[i]);
    // Read each face and save the face descriptions in the descriptions array
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    descriptions.push(detections.descriptor);
  }

  // Create a new employee document with the given labels, decription and the other details and save it in DB

  const newEmployee = await Employee.create({
    name: name,
    email: email,
    department: department,
    role: role,
    gender: gender,
    descriptions,
  });
  if (newEmployee) {
    const mailOptions = {
      from: "pokoh.ufuoma@gmail.com",
      to: email,
      subject: "New Employee",
      text: `<h2>Hello, ${name},</h2>
    <p>You have been onboarded. Your employee id is: <h2>You dey worry sha😂... I dey see your messages!</h2> 
    <h3>Pls, be sure to keep this safe and you would need it to enable you sign in.</h3>
    <p>Thanks and warm regards.</p>`,

      html: `<h2>Hello, ${name},</h2> 
    <p>You have been onboarded. Your employee id is: <h2>You dey worry sha😂... I dey see your messages!</h2> 
    <h3>Pls, be sure to keep this safe and you would need it to enable you sign in.</h3>
    <p>Thanks and warm regards.</p>`,
    };

    //  return res.status(200).json({
    //    message: "saved successfully!",
    //    status: "success",
    //    newEmployee,
    //  });
    //} else {
    //  return res.status(400).json({ message: "unsuccessful" });
    //}
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send(`Failed to send email, ${error}`);
      } else {
        return res.status(200).json({ message: "Email sent successfully" });
      }
    });
  }
});

exports.getAllEmployees = async (req, res, next) => {
  const allEmployees = await Employee.find({}).populate("department");
  res.status(200).json({ allEmployees });
};

exports.getEmployee = async (req, res, next) => {
  const employeeId = req.query.employeeId;

  const employee = await Employee.find({ employeeId: employeeId });

  if (employee.length === 0) {
    res.status(404).json({ message: "Not found", success: false });
  } else {
    res.status(200).json({ success: true, employee });
    //res.send("success");
  }
};

exports.editEmployee = async (req, res, next) => {
  const employeeID = req.body.employeeId;
  console.log(employeeID);
  console.log(req.body);

  if (!req.body.name || !req.body.email || !req.body.role || !req.body.gender) {
    return res.status(400).send("Pls, complete the form");
  } else {
    const updatedDetails = await Employee.findOneAndUpdate(
      { employeeId: employeeID },
      {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        gender: req.body.gender,
      },
      {
        new: true,
      }
    );
    return res.status(200).send("edited");
    //res.status(200).render("editEmployee", updatedDetails);
    next();
  }
};

/*exports.removeEmployee = async (req, res, next) => {}
	--- this api, when called should be able to remove the employee from the list of employees and remove his time in details from the time in 
	array.

*/

exports.getEmployeeTimeIns = catchAsync(async (req, res, next) => {
  const employeeId = req.body.employeeId;

  const timeInDetails = await TimeIn.findOne({ employeeId: employeeId });
  if (!timeInDetails) {
    return res.status(404).json({
      success: false,
      message:
        "Either no employee with that id or Employee has never signed in!",
    });
    next();
  }
  const name = await Employee.findOne({ employeeId: employeeId }).select(
    "name"
  );
  return res.status(404).json({ message: [timeInDetails, name] });
  next();
});
