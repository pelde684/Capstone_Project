const cloudinary = require("../config/cloudinary");

// Photos are uploaded as "authenticated" (not publicly guessable);
// signed URLs are generated when an item is read.
// The team's items table has one photo column (photograph_path), so it stores the Cloudinary public_id.
exports.uploadItemPhoto = (buffer, itemId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "luggage-management/items",
        public_id: `item_${itemId}`,
        type: "authenticated",
        resource_type: "image",
        overwrite: true,
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
