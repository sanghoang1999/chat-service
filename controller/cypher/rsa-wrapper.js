const path = require("path");
const rsaWrapper = {};
const fs = require("fs");
const NodeRsa = require("node-rsa");
const crypto = require("crypto");

rsaWrapper.generateKey = () => {
  // let key = new NodeRsa();
  // key.generateKeyPair(1024, 65537);
  const key = new NodeRsa({ b: 1024 });
  key.setOptions({ encryptionScheme: "pkcs1" });
  let privateKey = key.exportKey("private");
  let publicKey = key.exportKey("public");
  payload = {
    privateKey,
    publicKey,
  };
  return payload;
};

rsaWrapper.decrypt = (payload) => {
  let enc = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(payload, "base64")
  );
  return enc.toString();
};

module.exports = rsaWrapper;
