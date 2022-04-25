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


const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

const fetchMarketData = fetch(url, {
    method: 'GET',
    headers: {
        'X-CMC_PRO_API_KEY': '1b02cf34-2998-4adc-8c45-c43ac970e440',
        "Content-Type": "application/json"
    }
})
    .then((response) => response.json())
    .then((data) => {
        return data;
    });


const grabData = async () => {
    const a = await fetchMarketData;
    return a
};



//middleware that sets market data 
const setMarketData = async (req, res, next) => {
    marketData = await grabData();
    req.marketData = await marketData['data']
    next();
};
//fetches price datapoints: price, volume, etc
const fetchPriceData = (cryptoData, symbol, dataPointStr) => {
    let coin = '';
        cryptoData.forEach(crypto => {
            if (crypto['symbol'] === symbol) {
                coin = crypto
            }
        })
    return coin['quote']['USD'][dataPointStr];
    };

    // not used at the moment
const callPrice = async (cryptoData, symbol, dataPointStr) => {
    const a = await fetchPriceData(cryptoData, symbol, dataPointStr);
    return a;
};

// fetches datapoint other than price
const fetchDataPoint = (cryptoData, symbol, dataPointStr) => {
    dataPoint = dataPointStr;
    let coin = '';
    cryptoData.forEach(crypto => {
        if (crypto['symbol'] === symbol) {
            coin = crypto
        }
    })
    return coin[dataPointStr];
};

const setfavoritesObj = async (arr, data) => {
    let coinArr = [];
    await arr.forEach(async coinSymbol => {
        let obj = {};
        const name = await fetchDataPoint(data, coinSymbol, 'name')
        obj['name'] = name;
        const symbol = await fetchDataPoint(data, coinSymbol, 'symbol')
        obj['symbol'] = symbol;
        const price = await fetchPriceData(data, coinSymbol, 'price')
        obj['price'] = price.toFixed(2);

        coinArr.push(obj);
    })
    return await coinArr;
}
/*
const setCoinObj = async (arr, data) => {
    let obj = {};
    await arr.forEach(async coinId => {
        let price = await callPrice(data, coinId);
        obj[coinId] = price.toFixed(2);
    })
    return obj;
}
 */

router.get('/grab-coin', setMarketData, asyncHandler(async (req, res) => {
    console.log(req.marketData);
    const data = await req.marketData;
    const coinArr = ['BTC', 'ETH', 'LTC'];
    const newObj = await setCoinObj(coinArr, data);


    res.render('portfolio-test', { newObj })
}));

router.get('/favorites', setMarketData, asyncHandler(async (req, res) => {
    const arr = await setfavoritesObj(['BTC', 'ETH'], req.marketData)
    const newArr = ['hello', 'sup']
    console.log(fetchPriceData(req.marketData, 'BTC', 'price'))
    /*
    const data = await req.marketData;
    const user = await db.User.findOne({ where: { id: res.locals.user.id } });
    const favoriteArrJson = await user.favoriteCoins;
    const newObj = await setCoinPriceObj(favoriteArrJson, data);
    res.render('favorites-test', { newObj })
    */
    res.render('favorites-test', { arr })
}));

module.exports = router;