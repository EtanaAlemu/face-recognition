const dotenv = require("dotenv").config();
require("./database.config").connect();
const express = require("express");
const faceapi = require("face-api.js");
const { Canvas, Image } = require("canvas");
const fileUpload = require("express-fileupload");
faceapi.env.monkeyPatch({ Canvas, Image });

const app = express();
app.use(express.json());

app.use(fileUpload({ useTempFiles: true }));
async function LoadModels() {
  // Load the models
  // __dirname gives the root directory of the server
  await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
  await faceapi.nets.ageGenderNet.loadFromDisk(__dirname + "/models");
  await faceapi.nets.faceExpressionNet.loadFromDisk(__dirname + "/models");
}
LoadModels();

/* Routes */
const router = require("./router");
app.use(router);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running at ${port}:`);
});
