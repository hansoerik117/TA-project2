const express = require('express');

const router = express.Router();

// Controllers
const {
    signinPage,
    signinPagePost
} = require('../controllers/signinControllers');

// Routes
router.get('/', signinPage);
router.post('/', signinPagePost);

module.exports = router;