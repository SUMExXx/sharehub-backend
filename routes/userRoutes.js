const express = require('express');
const router = express.Router();
const { userRegister, userLogin, userVerifyToken, createGroup, upload, getThumbnails, updateUserDetails, getGroups, joinGroup, getImageDetails, imageReceivedAcknowledgement, getImage } = require('../controllers/userControllers');
const { storage } = require('../storage');
require('dotenv').config();

router.post('/register', userRegister);

router.post('/login', userLogin);

router.post('/userVerifyToken', userVerifyToken);

router.put('/updateUserDetails', updateUserDetails);

router.post('/createGroup', createGroup);

router.post('/upload', storage.single('image'), upload); //'image' is the name of the body parameter for file

router.post('/getThumbnails', getThumbnails);

router.post('/getGroups', getGroups);

router.post('/joinGroup', joinGroup);

router.post('/getImageDetails', getImageDetails);

router.post('/getImage', getImage);

router.post('/imageReceivedAcknowledgement', imageReceivedAcknowledgement)

module.exports = router;