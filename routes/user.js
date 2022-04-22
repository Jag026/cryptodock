const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const db = require('../db/models');
const { csrfProtection, asyncHandler } = require('./utils');
const { loginUser, logoutUser } = require('../auth');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/login-index', csrfProtection, asyncHandler(async (req, res) => { 
    const user = await db.User.findOne({ where: { id: res.locals.user.id } });
    const coinPortfolioJSON = await user.portfolioCoins;
    const coinPortfolio = await JSON.parse(JSON.stringify(coinPortfolioJSON)); 
    // console.log(coinPortfolio);
    res.render('login-index', {
        title: 'Register',
        user,
        coinPortfolio,
        csrfToken: req.csrfToken(),
    });
}));

router.get('/register', csrfProtection, (req, res) => {
    const user = db.User.build();
    res.render('user-register', {
        title: 'Register',
        user,
        csrfToken: req.csrfToken(),
    });
});

const userValidators = [
    check('firstName')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for First Name')
        .isLength({ max: 50 })
        .withMessage('First Name must not be more than 50 characters long'),
    check('lastName')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Last Name')
        .isLength({ max: 50 })
        .withMessage('Last Name must not be more than 50 characters long'),
    check('emailAddress')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Email Address')
        .isLength({ max: 255 })
        .withMessage('Email Address must not be more than 255 characters long')
        .isEmail()
        .withMessage('Email Address is not a valid email')
        .custom((value) => {
            return db.User.findOne({ where: { emailAddress: value } })
                .then((user) => {
                    if (user) {
                        return Promise.reject('The provided Email Address is already in use by another account');
                    }
                });
        }),
    check('password')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Password')
        .isLength({ max: 50 })
        .withMessage('Password must not be more than 50 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, 'g')
        .withMessage('Password must contain at least 1 lowercase letter, uppercase letter, number, and special character (i.e. "!@#$%^&*")'),
    check('confirmPassword')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Confirm Password')
        .isLength({ max: 50 })
        .withMessage('Confirm Password must not be more than 50 characters long')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Confirm Password does not match Password');
            }
            return true;
        })
];

router.post('/register', csrfProtection, userValidators,
    asyncHandler(async (req, res) => {
        const {
            emailAddress,
            firstName,
            lastName,
            password,
        } = req.body;

        const user = db.User.build({
            emailAddress,
            firstName,
            lastName,
        });

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.hashedPassword = hashedPassword;
            await user.save();
            loginUser(req, res, user);
            res.redirect('/user/login-index');
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('user-register', {
                title: 'Register',
                user,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.get('/login', csrfProtection, (req, res) => {
    res.render('user-login', {
        title: 'Login',
        csrfToken: req.csrfToken(),
    });
});

const loginValidators = [
    check('emailAddress')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Email Address'),
    check('password')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Password'),
];

router.post('/login', csrfProtection, loginValidators,
    asyncHandler(async (req, res) => {
        const {
            emailAddress,
            password,
        } = req.body;

        let errors = [];
        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            // Attempt to get the user by their email address.
            const user = await db.User.findOne({ where: { emailAddress } });

            if (user !== null) {
                // If the user exists then compare their password
                // to the provided password.
                const passwordMatch = await bcrypt.compare(password, user.hashedPassword.toString());

                if (passwordMatch) {
                    // If the password hashes match, then login the user
                    // and redirect them to the default route.
                    loginUser(req, res, user);
                    res.redirect('/user/login-index');
                }
            }

            // Otherwise display an error message to the user.
            errors.push('Login failed for the provided email address and password');
        } else {
            errors = validatorErrors.array().map((error) => error.msg);
        }

        res.render('user/login', {
            title: 'Errors',
            user,
            emailAddress,
            errors,
            csrfToken: req.csrfToken(),
        });
    }));

router.post('/logout', (req, res) => {
    logoutUser(req, res);
    res.redirect('/user/login');
});


const url = 'https://rest.coinapi.io/v1/assets';

const fetchMarketData = fetch(url, {
    method: 'GET',
    headers: {
        'X-CoinAPI-Key': 'DF8B9104-DDF2-4D58-A4BF-8B6717B7D530',
        "Content-Type": "application/json"
    }
})
    .then((response) => response.json())
    .then((data) => {
        return data;
    });

//middleware that sets market data 
const setMarketData = (req, res, next) => {
    req.marketData = fetchMarketData;
    next();
};

/*
async function fetchPrice(cryptoData, coinName) {
    const data = await cryptoData;
    data.forEach((crypto) => {
        if (crypto['name'] === coinName) {
            return crypto['price_usd'];
        }
    })
}



const fetchPrice = (coinName) => fetch(url, {
    method: 'GET',
    headers: {
        'X-CoinAPI-Key': 'DF8B9104-DDF2-4D58-A4BF-8B6717B7D530',
        "Content-Type": "application/json"
    }
})
    .then((response) => response.json())
    .then((data) => {
        let coin = {};
        data.forEach(crypto => {
            // console.log(user['name'])
            if (crypto['name'] === coinName) {
                coin = crypto
            }
        })
        return coin['price_usd'];
    });

    */
const fetchPrice = (cryptoData, coinName) => {
    let coin = '';
        cryptoData.forEach(crypto => {
            // console.log(user['name'])
            if (crypto['name'] === coinName) {
                coin = crypto
            }
        })
        return coin['price_usd'];
    };

const callPrice = async (cryptoData, coinName) => {
    const a = await fetchPrice(cryptoData, coinName);
    return a;
};

const setCoinPriceObj = async (arr, data) => {
    let obj = {};
    await arr.forEach(coinName => {
        price = callPrice(data, coinName);
        obj[coinName] = price;
    })
    return obj;
}
router.get('/grab-coin', setMarketData, asyncHandler(async (req, res) => {
    const data = await req.marketData;
    const coinArr = ['Bitcoin', 'Ethereum', 'Litecoin'];
    const newObj = await setCoinPriceObj(coinArr, data);
    console.log(newObj);
    /*
    const data = await req.marketData;
    const coinArr = ['Bitcoin', 'Ethereum', 'Litecoin'];
    price = await callPrice(data, 'Bitcoin');
    */

    res.render('portfolio-test', { newObj })
}));

module.exports = router;