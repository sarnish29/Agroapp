const pushNotificationController = require('./pushNotificationControllers');
const express = require('express');
const router = express.Router();

router.post('/sendNotification', pushNotificationController.sendNotification);
router.post('/sendNotificationToDevice', pushNotificationController.sendNotificationToDevice);

module.exports = router;