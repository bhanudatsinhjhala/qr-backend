const tmp = require('tmp');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const httpStatus = require("http-status");

const ApiError = require("../utils/ApiError")
const logger = require("../utils/logger");

const multerUpload = async (req, res, next) => {
    let fileName = "";
    let storage = multer.diskStorage({
        destination: function (req, file, callback) {

            tmp.dir(function _tempDirCreated(err, dirPath, cleanupCallback) {
                if (err) {
                    logger.debug(err);
                }

                console.log('Dir: ', dirPath);
                req.dirPath = dirPath;
                callback(null, dirPath);
            });
        },
        filename: function (req, file, callback) {
            fileName = file.fieldname + "-" + req.query.eventId + Date.now() + path.extname(file.originalname);
            logger.info("filename of uploadSheet===> %s", fileName);
            callback(null, fileName);
        },
    });

    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname);
            if (ext !== '.xlsx') {
                return callback(new Error('Only Excel sheets are allowed'))
            }
            callback(null, true)
        },
    }).single("sheet");
    upload(req, res, async function (err) {
        if (err) {
            next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
        } else {
            req.fileName = fileName;
            next();
        }
    })
}
module.exports = multerUpload;