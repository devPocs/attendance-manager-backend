const express = require("express");
const TimeIn = require("../models/timesInSchema");
const Employee = require("./../models/employeeSchema");
const Department = require("./../models/departmentSchema");

exports.getAllAttendance = async (req, res, next) => {
  const data = await TimeIn.find({})
    .populate({
      path: "employee",
      populate: { path: "department", model: "department" },
    })
    .sort("department");

  res.status(200).send(data);
};
