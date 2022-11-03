const express= require('express');
const bodyParser= require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const {getuserDetails}= require("../controllers/userDetailsController")
const {participantLogin}= require("../controllers/loginController")
const {orderFood, getCanteen, getMenu}= require("../controllers/canteenController")
const {verifyJwt, authorizeParticpant}= require("../middleware/verifyJwt");
const {getEvent}= require("../controllers/eventController")
const router= express.Router();

router.post('/login', urlencodedParser, participantLogin);

router.get('/getuserdetails',urlencodedParser,verifyJwt, authorizeParticpant, getuserDetails);

router.get("/getmenu", urlencodedParser, verifyJwt, authorizeParticpant, getMenu);

router.get("/getcanteen", urlencodedParser, verifyJwt, authorizeParticpant, getCanteen);

router.post("/orderfood", urlencodedParser, verifyJwt, authorizeParticpant, orderFood);

router.get("/getevent", urlencodedParser, verifyJwt, authorizeParticpant, getEvent);

module.exports = router;