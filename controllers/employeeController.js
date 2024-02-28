const catchAsync = require("./../utils/catchAsync");
const Employee = require("./../models/employeeSchema");
const { createCanvas, loadImage } = require("canvas");
const canvas = createCanvas();
const faceapi = require("face-api.js");

async function getDescriptorsFromDB(imageBuffer, id) {
  // Get all the face data from MongoDB and convert descriptors to Float32Array
  const employees = await Employee.find({ employeeId: id });

  const labeledFaceDescriptors = employees.map((employee) => {
    return new faceapi.LabeledFaceDescriptors(
      employee.label,
      employee.descriptions.map((desc) => new Float32Array(Object.values(desc)))
    );
  });
  console.log(labeledFaceDescriptors);
  // Load face matcher to find the matching face
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  // Read the image using canvas
  const img = await loadImage(imageBuffer);

  console.log("img:", img);
  console.log("mike");
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const displaySize = { width: img.width, height: img.height };
  faceapi.matchDimensions(canvas, displaySize);

  // Find matching faces
  const detections = await faceapi
    .detectAllFaces(canvas)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
  );

  return results;
}

exports.compareImage = async (req, res) => {
  const imageBuffer = req.image;

  const employeeId = req.body.employeeId;

  // Get all the face data from MongoDB and convert descriptors to Float32Array
  const employees = await Employee.find({ employeeId });

  const labeledFaceDescriptors = employees.map((employee) => {
    return new faceapi.LabeledFaceDescriptors(
      employee.label,
      employee.descriptions.map((desc) => new Float32Array(Object.values(desc)))
    );
  });

  // Load face matcher to find the matching face
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  for (let i = 0; i < req.image.length; i++) {
    const imageData = req.image[i];

    const img = await loadImage(imageData);

    console.log("img:", img);
    let temp = faceapi.createCanvasFromMedia(img);

    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(temp, displaySize);

    // Find matching faces
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    console.log("detections :", detections);

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    console.log("resizedDetections:", resizedDetections);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    return res.json({ result: results });
  }
};

exports.initEmployee = catchAsync(async (req, res, next) => {
  const employeeId = req.body.employeeId;

  const employee = await Employee.find({ employeeId: employeeId });

  if (employee.length === 0) {
    res.status(400).json({ success: "false", message: "employee not found" });
  } else {
    res.status(200).json({
      success: "true",
      name: employee[0].name,
      email: employee[0].email,
      employeeId: employee[0].employeeId,
    });
  }
});
