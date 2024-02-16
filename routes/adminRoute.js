const express = require("express");
const admin = express();
const superAdmin = express();
const multer = require("multer");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Multer configuration for image uploads.
const storage = multer.memoryStorage(); // Use memory storage for storing images temporarily

// Multer middleware to receive multiple images.
const upload = multer({
  storage: storage,
}).fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
]);

const { protectRoute } = require("./../controllers/authController");
const {
  addNewEmployee,
  getAllEmployees,
  getEmployee,
  editEmployee,
  getEmployeeTimeIns,
} = require("../controllers/adminController");
const {
  createAdmin,
  deleteAdmin,
  getAdmins,
} = require("../controllers/superAdminController");

const { login } = require("./../controllers/authController");

const { checkNewUser } = require("../utils/validators");

admin.post("/login", login);

admin.post(
  "/create_new_employee",
  upload,
  async (req, res, next) => {
    //Check if there's a file in the request

    if (!req.files.image1 || !req.files.image2 || !req.files.image3) {
      return res
        .status(400)
        .json({ error: "image files not completely provided" });
    }

    const images = [
      req.files.image1[0].buffer,
      req.files.image2[0].buffer,
      req.files.image3[0].buffer,
    ];

    req.images = images;
    console.log(req.images);
    next();
    //
    //  try {
    //    const result = await cloudinary.uploader
    //      .upload_stream({ folder: "employee-images" }, (error, result) => {
    //        if (error) {
    //          console.error(error);
    //          return res.status(500).json({
    //            status: "INTERNAL SERVER ERROR",
    //            message: "Error uploading image to Cloudinary",
    //          });
    //        }
    //
    //        req.image = result.secure_url;
    //        next();
    //      })
    //      .end(imageBuffer);
    //  } catch (error) {
    //    console.error(error);
    //    return res.status(500).json({
    //      status: "INTERNAL SERVER ERROR",
    //      message: "Error uploading image to Cloudinary",
    //    });
    //  }
    //},
  },
  checkNewUser,
  addNewEmployee
);

admin.get("/all_employees", getAllEmployees);
admin.get("/search_employee", getEmployee);
admin.patch("/edit_employee", editEmployee);
admin.post("/employee_times", getEmployeeTimeIns);
//router.delete("/delete", deleteEmployee)

//super_admin routes
superAdmin.post("/create_admin", createAdmin);
superAdmin.delete("/delete_admin", deleteAdmin);
superAdmin.get("/get_admin", getAdmins);

module.exports = { admin, superAdmin };
