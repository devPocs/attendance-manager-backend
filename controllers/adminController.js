const mongoose = require("mongoose");
const Employee = require("../models/employeeSchema");
const Department = require("../models/departmentSchema");
const TimeIn = require("../models/timesInSchema");
const niv = require("node-input-validator");
const { generateEmployeeId } = require("../utils/helperFunctions");
const nodemailer = require("nodemailer");
const catchAsync = require("../utils/catchAsync");
const { createCanvas, loadImage } = require("canvas");
const canvas = createCanvas();
const fileUpload = require("express-fileupload");
const faceapi = require("face-api.js");

const blobUtil = require("blob-util");

// setup the nodemailer options. take this to the config file later.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pokoh.ufuoma@gmail.com",
    pass: "utnttwkysvdscyis",
  },
});

exports.addNewEmployee = async (req, res, next) => {
  const { name, email, department, role, gender, label } = req.body;

  const descriptions = [];

  try {
    // Loop through the images
    for (let i = 0; i < req.images.length; i++) {
      const imageData = req.images[i];

      const image = await loadImage(imageData);
      // Create a canvas with the same dimensions as the image
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      // Draw the image on the canvas
      ctx.drawImage(image, 0, 0);

      // Read each face and save the face descriptions in the descriptions array

      const detections = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

      descriptions.push(detections.descriptor);
    }

    // Create a new employee document with the given description, and other details and save it in DB
    const newEmployee = await Employee.create({
      name: name,
      email: email,
      department: department,
      role: role,
      gender: gender,
      label: label,
      descriptions: descriptions,
    });

    if (newEmployee) {
      const mailOptions = {
        from: "pokoh.ufuoma@gmail.com",
        to: email,
        subject: "New Employee",
        text: `Hello, ${name},\n\nYou have been onboarded. Your employee id is: ${newEmployee.employeeId}\n\nPls, be sure to keep this safe and you would need it to enable you to sign in.\n\nThanks and warm regards.`,

        html: `<h2>Hello, ${name},</h2> 
        <p>You have been onboarded. Your employee id is: <strong>${newEmployee.employeeId}</strong></p>
        <p>Pls, be sure to keep this safe, and you would need it to enable you to sign in.</p>
        <p>Thanks and warm regards.</p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res
            .status(500)
            .json({
              message:
                "Error sending email! or email already exists! Check email!",
            });
        } else {
          return res.status(200).json({ message: "Email sent successfully" });
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "INTERNAL SERVER ERROR",
      message: "Error processing images or saving to the database",
    });
  }
};

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
    return res.json({ statusCode: 200, message: "edited!" });
  }
};

/*exports.removeEmployee = async (req, res, next) => {}
	--- this api, when called should be able to remove the employee from the list of employees and remove his time in details from the time in 
	array.

*/

exports.getEmployeeTimeIns = catchAsync(async (req, res, next) => {
  const employeeId = req.body.employeeId;
  console.log(employeeId);

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
