const { AsyncResource } = require("node:async_hooks");
const multer = require("multer");
const HttpError = require("../utils/httpError");

// Keep uploads in memory: the face service gets the bytes directly and the
// photo is written to disk only after a registration succeeds.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new HttpError(400, "Only image files are allowed."));
  },
});

// Reading the file happens outside the request's context, so it is carried across here.
const single = (field) => {
  const read = upload.single(field);
  return (req, res, next) => read(req, res, AsyncResource.bind(next));
};

module.exports = { single };
