const express = require('express');
const appController = require('../controllers/appController')
const AppRoutes = express.Router()
const auth = require('../middlewares/auth')

AppRoutes.get('/isRegisteredBefore/:deviceId/:hDeviceId', appController.isRegistredBefore)
AppRoutes.post('/registerNewUser', auth, appController.registerNewUser)
AppRoutes.post('/validateAuthToken', appController.validateAuthToken)
AppRoutes.get('/sendNewAuthToken', appController.sendNewAuthToken)
AppRoutes.post('/saveUserInformation', auth, appController.saveUserInformation)
AppRoutes.delete('/deleteAccount', auth, appController.deleteAccount)
AppRoutes.get('/restoreAccount', auth, appController.deleteAccount)



module.exports = AppRoutes