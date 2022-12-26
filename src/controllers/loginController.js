const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const ApiError = require("../utils/ApiError");
const volunteerData = require("../models/member");
const userData = require("../models/user");
const canteenData = require("../models/canteen");
const logger = require("../utils/logger");

// Code for registering user
const adminRegister = async (req, res, next) => {
  try {
    const {
      role,
      email,
      name,
      membershipId
    } = req.body;
    let password = req.body.password;
    password = await bcrypt.hash(password, 10).then((hash) => hash);
    const data = await volunteerData.create({
      password,
      email,
      membershipId,
      role,
      name,
    });
    if (Boolean(data)) {
      res.status(200).send({
        message: "Account has been created"
      });
      logger.info("Admin account created Successfully");
    }
  } catch (error) {
    logger.error("Admin,  register catch error===> %o", error);
    if (error.keyPattern.email) {
      error = new ApiError(httpStatus.CONFLICT, "Duplicate Email was found");
    } else if (error.keyPattern.membershipId) {
      error = new ApiError(httpStatus.CONFLICT, "Duplicate Membership Id");
    }
    next(error);
  }
}

const canteenRegister = async (req, res, next) => {
  try {
    const {
      canteenName,
      ownerName,
      phoneNo,
      email
    } = req.body;
    let password = req.body.password;
    password = await bcrypt.hash(password, 10).then((hash) => hash);
    const data = await canteenData.create({
      password: password,
      email: email,
      canteenName: canteenName,
      ownerName: ownerName,
      phoneNo: phoneNo
    });
    if (Boolean(data)) {
      res.send({
        message: "Account has been created"
      });
      logger.info("Canteen account created Successfully");
    }
  } catch (error) {
    logger.error("Canteen,  register catch error===> %o", error);
    if (error.keyPattern.canteenName) {
      error = new ApiError(httpStatus.CONFLICT, "Duplicate Canteen Name");
    } else if (error.keyPattern.email) {
      error = new ApiError(httpStatus.CONFLICT, "Duplicate Email was found");
    } else if (error.keyPattern.phoneNo) {
      error = new ApiError(httpStatus.CONFLICT, "Duplicate Phone Number was found");
    }
    next(error);
  }
}

// Code for login system

const adminLogin = async (req, res, next) => {
  try {
    const membershipId = req.body.membershipId;
    const password = req.body.password;
    const admin = await volunteerData.findOne({
      membershipId: membershipId,
    });
    if ((admin)) {
      let isPasswordMatch = await bcrypt.compare(
        password,
        admin.password);
      if (!isPasswordMatch) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "The password does not match with the Membership Id");
      } else {
        let accessToken = jwt.sign({
            id: admin._id,
            role: admin.role,
            membershipId: admin.membershipId,
          },
          process.env.ACCESSSECRET, {
            expiresIn: 14400000
          });
        let refreshToken = jwt.sign({
            membershipId: admin.membershipId,
          },
          process.env.REFRESHSECRET);
        res.status(200).send({
          accessToken: accessToken,
          refreshToken: refreshToken,
          role: admin.role,
        });
        logger.info(`Admin has been loggedIn Successfully `)
      }
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Wrong Membership Id');
    }
  } catch (error) {
    logger.error("Admin login catch error===> %o", error);
    next(error);
  }
}

const canteenLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const canteenUser = await canteenData.findOne({
      email: email,
    });
    if (Boolean(canteenUser)) {
      let isPasswordMatch = await bcrypt.compare(
        password,
        canteenUser.password);
      if (!isPasswordMatch) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect Password");
      } else {
        let accessToken = jwt.sign({
            id: canteenUser._id,
            email: canteenUser.email,
          },
          process.env.ACCESSSECRET, {
            expiresIn: 14400000
          });
        let refreshToken = jwt.sign({
            phoneNo: canteenUser.phoneNo,
          },
          process.env.REFRESHSECRET);

        res.status(200).send({
          accessToken: accessToken,
          refreshToken: refreshToken
        });
        logger.info("canteen user has successfully loggedIn");

      }
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Wrong Email Address");
    }
  } catch (err) {
    logger.error("error in catch==>%o", err)
    next(err);
  }
}

const participantLogin = async (req, res, next) => {
  try {
    const {
      email,
      regId
    } = req.body;
    const participant = await userData.findOne({
      regId: regId,
    });
    if (Boolean(participant)) {
      if (participant.email == email) {
        let accessToken = jwt.sign({
            id: participant._id,
            regId: participant.regId,
          },
          process.env.ACCESSSECRET, {
            expiresIn: 14400000
          });
        let refreshToken = jwt.sign({
            regId: participant.regId,
          },
          process.env.REFRESHSECRET);

        logger.info("Participant has successfully LoggedIn")
        res.status(200).send({
          accessToken: accessToken,
          refreshToken: refreshToken
        });
      } else {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Wrong Email Address")
      }
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Oops, it seems you are not particpant of the Event. or Check your registration Id");
    }
  } catch (err) {
    logger.error("participant login error in catch ===> %o", err);
    next(err);
  }
}


// get JWT token from Refresh token

const getAdminJwtToken = async (req, res, next) => {
  try {
    const membershipId = req.body.membershipId;
    let refreshToken;
    if (req.headers.authorization == undefined || null == req.headers.authorization) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Refresh Token are undefined or null');
    } else if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
      refreshToken = req.headers.authorization.split(" ")[1];
      if (membershipId == undefined || membershipId == 0 || membershipId.length == 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'MembershipId are undefined or null');
      } else {
        jwt.verify(refreshToken, process.env.REFRESHSECRET, async function (error, decoded) {
          if (error) {
            error = new ApiError(httpStatus.UNAUTHORIZED, error.message);
            next(error);
          } else {
            if (decoded.membershipId == membershipId) {
              const admin = await volunteerData.findOne({
                membershipId: membershipId,
              });
              let accessToken = jwt.sign({
                  id: admin._id,
                  role: admin.role,
                  membershipId: admin.membershipId,
                },
                process.env.ACCESSSECRET, {
                  expiresIn: 60 * 60
                });
              res.status(200).send({
                accessToken: accessToken,
                refreshToken: refreshToken
              });
              logger.info("Admin Refresh token generated Successfully");
            } else {
              next(new ApiError(httpStatus.UNAUTHORIZED, 'You membership Id does not matched with token'));
            }
          }
        })

      }
    }
  } catch (error) {
    logger.error("Admin refresh jwt token catch error==> %o", error);
    next(error);
  }
}

const getParticipantJwtToken = async (req, res, next) => {
  try {
    const regId = req.body.regId;
    let refreshToken;
    if (req.headers.authorization == undefined || null == req.headers.authorization) {
      throw new ApiError(httpStatus.NOT_FOUND, "Refresh Token not found");
    } else if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
      refreshToken = req.headers.authorization.split(" ")[1];
      if (regId == undefined || regId.length == 0 || regId == 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Registration is undefined or null');
      } else {
        jwt.verify(refreshToken, process.env.REFRESHSECRET, async function (error, decoded) {
          if (error) {
            error = new ApiError(httpStatus.UNAUTHORIZED, error.message);
            next(error);
          } else {
            if (decoded.regId == regId) {
              const participant = await userData.findOne({
                regId: regId,
              });
              let accessToken = jwt.sign({
                  id: participant._id,
                  regId: participant.regId,
                },
                process.env.ACCESSSECRET, {
                  expiresIn: 60 * 60
                });
              res.status(200).send({
                accessToken: accessToken,
                refreshToken: refreshToken
              });
              logger.info("Participant Refresh token generated Successfully");
            } else {
              next(new ApiError(httpStatus.UNAUTHORIZED, "You reg Id does not matched."));
            }
          }
        })

      }
    }
  } catch (error) {
    logger.error("Refresh token, Participant jwt token catch error==> %o", error);
    next(error);
  }
}

const getCanteenJwtToken = async (req, res, next) => {
  try {
    const phoneNo = req.body.phoneNo;
    let refreshToken;

    if (req.headers.authorization == undefined || null == req.headers.authorization) {
      logger.error("Refresh token, Canteen refresh Token undefined or null ");
      throw new ApiError(httpStatus.NOT_FOUND, "Please enter Refresh Token");
    } else if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
      refreshToken = req.headers.authorization.split(" ")[1];
      if (phoneNo == undefined || phoneNo == 0 || phoneNo.toString().length == 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Phone Number is undefined or null");
      } else if (phoneNo.toString().length !== 10) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please Enter phone Number of 10 digits');
      } else {
        jwt.verify(refreshToken, process.env.REFRESHSECRET, async function (error, decoded) {
          if (error) {
            error = new ApiError(httpStatus.UNAUTHORIZED, error.message);
            next(error);
          } else {
            if (decoded.phoneNo == phoneNo) {
              logger.debug("Refresh token, Canteen phoneNo matched");
              const canteenUser = await canteenData.findOne({
                phoneNo: phoneNo,
              });
              let accessToken = jwt.sign({
                  _id: canteenUser._id,
                  email: canteenUser.email,
                },
                process.env.ACCESSSECRET, {
                  expiresIn: 60 * 60
                });
              res.status(200).send({
                accessToken: accessToken,
                refreshToken: refreshToken
              });
              logger.info("Canteen Refresh token generated Successfully");
            } else {
              next(new ApiError(httpStatus.UNAUTHORIZED, 'Your phone Number does not matched.'));
            }
          }
        })
      }
    }
  } catch (error) {
    logger.error("canteen refresh token catch %o", error);
    next(error);
  }
}

module.exports = {
  adminRegister,
  adminLogin,
  getAdminJwtToken,
  canteenLogin,
  getCanteenJwtToken,
  participantLogin,
  getParticipantJwtToken,
  canteenRegister

}