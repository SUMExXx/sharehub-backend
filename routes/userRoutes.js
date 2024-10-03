const express = require('express');
const router = express.Router();
const { userRegister, userLogin, userVerifyToken, createGroup, upload, getThumbnails, updateUserDetails } = require('../controllers/userControllers');
const { storage } = require('../storage');
require('dotenv').config();

router.post('/register', userRegister);

router.post('/login', userLogin);

router.post('/userVerifyToken', userVerifyToken);

router.put('/updateUserDetails', updateUserDetails);

router.post('/createGroup', createGroup);

router.post('/upload', storage.single('image'), upload);

router.get('/getThumbnails', getThumbnails);

module.exports = router;