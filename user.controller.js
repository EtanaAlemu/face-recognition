const User = require("./user.model");
const canvas = require("canvas");
const faceapi = require("face-api.js");

exports.train = async (req, res) => {
  const File1 = req.files.File1.tempFilePath;
  const File2 = req.files.File2.tempFilePath;
  const File3 = req.files.File3.tempFilePath;
  const label = req.body.label;
  let result = await uploadLabeledImages([File1, File2, File3], label);
  if (result) {
    res.json({ message: "Face data stored successfully" });
  } else {
    res.json({ message: "Something went wrong, please try again." });
  }
};
exports.test = async (req, res) => {
  try {
    const File1 = req.files.File1.tempFilePath;
    let result = await getDescriptorsFromDB(File1);
    res.json({ result });
  } catch (err) {
    res.status(400).send({ error: err });
  }
};

async function uploadLabeledImages(images, label) {
  try {
    const descriptions = [];
    // Loop through the images
    for (let i = 0; i < images.length; i++) {
      const img = await canvas.loadImage(images[i]);
      // Read each face and save the face descriptions in the descriptions array
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptions.push(detections.descriptor);
    }

    // Create a new face document with the given label and save it in DB
    const createFace = new FaceModel({
      label: label,
      descriptions: descriptions,
    });
    await createFace.save();
    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getDescriptorsFromDB(image) {
  // Get all the face data from mongodb and loop through each of them to read the data

  let users = await User.find();

  for (i = 0; i < users.length; i++) {
    // Change the face data descriptors from Objects to Float32Array type
    for (j = 0; j < users[i].descriptions.length; j++) {
      users[i].descriptions[j] = new Float32Array(
        Object.values(users[i].descriptions[j])
      );
    }

    // Turn the DB face docs to
    users[i] = new faceapi.LabeledFaceDescriptors(
      users[i].label,
      users[i].descriptions
    );
  }

  console.log(users);

  // Load face matcher to find the matching face
  const faceMatcher = new faceapi.FaceMatcher(users, 0.6);

  // Read the image using canvas or other method
  const img = await canvas.loadImage(image);
  let temp = faceapi.createCanvasFromMedia(img);
  // Process the image for the model
  const displaySize = { width: img.width, height: img.height };
  faceapi.matchDimensions(temp, displaySize);

  // Find matching faces
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
  );
  console.log(results);
  return results;
}
