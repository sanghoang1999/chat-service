const AWS = require("aws-sdk");

const aws = {};
aws.uploadToS3 = (file, fileName) => {
  let s3bucket = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET,
    Bucket: process.env.BUCKET_NAME,
  });
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      Body: file,
    };
    const stored = s3bucket.upload(params).promise();
    return stored;
  } catch (error) {
    console.log(error);
  }
};
function getBase64Image(imgData) {
  return imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
}
aws.uploadImage = (image) => {
  var guess = image.match(/^data:image\/(png|jpeg|);base64,/)[1];
  var ext = "";
  switch (guess) {
    case "png":
      ext = ".png";
      break;
    case "jpeg":
      ext = ".jpg";
      break;
    default:
      ext = ".bin";
      break;
  }
  let data = getBase64Image(image);
  let base64Data = new Buffer(data, "base64");
  var savedFilename = Date.now() + ext;
  return aws.uploadToS3(base64Data, savedFilename);
};
module.exports = aws;
