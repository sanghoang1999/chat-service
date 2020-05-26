const CryptoJS = require("crypto-js");

const aesWrapper = {};

aesWrapper.decrypt = (msg, key, encType) => {
  var iv = CryptoJS.enc.Hex.parse(msg.substr(0, 32));
  var encrypted = msg.substring(32);

  var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

aesWrapper.encrypt = (msg, key) => {
  var iv = CryptoJS.lib.WordArray.random(128 / 8);
  var encrypted = CryptoJS.AES.encrypt(msg, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  return iv.toString() + encrypted.toString();
};

module.exports = aesWrapper;
