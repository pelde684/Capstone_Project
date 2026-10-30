const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

// Up to 4 photos per item (meeting 9). Photos are uploaded as "authenticated" (not publicly guessable);
// signed URLs are generated when an item is read. The database stores only the Cloudinary public_id.
exports.MAX_PHOTOS = 4;

// Every upload gets its own name, so a replaced photo never shows an old cached image.
exports.uploadItemPhoto = (buffer, itemId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "luggage-management/items",
        public_id: `item_${itemId}_${crypto.randomBytes(5).toString("hex")}`,
        type: "authenticated",
        resource_type: "image",
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

exports.signedPhotoUrl = (publicId) =>
  publicId
    ? cloudinary.url(publicId, { type: "authenticated", sign_url: true, secure: true, resource_type: "image" })
    : null;

exports.destroyPhoto = (publicId) =>
  cloudinary.uploader.destroy(publicId, { type: "authenticated", resource_type: "image" });
