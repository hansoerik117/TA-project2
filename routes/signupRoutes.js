const express = require('express');

const router = express.Router();

// Controllers
const {
    signupPage,
    signupPagePost
} = require('../controllers/signupControllers');

// Routes
router.get('/', signupPage);
router.post('/', signupPagePost);

module.exports = router;