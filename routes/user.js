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


router.get('/edit', csrfProtection,
    asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id, 10);
        const id = userId
        const User = await db.Part.findByPk(userId);

        res.render('favorites-test', {
            user,
            csrfToken: req.csrfToken(),
        });
    }));


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
                    res.redirect('/user/favorites');
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
        const name = fetchDataPoint(data, coinSymbol, 'name')
        obj['name'] = name;
        const symbol = fetchDataPoint(data, coinSymbol, 'symbol')
        obj['symbol'] = symbol;
        const price = fetchPriceData(data, coinSymbol, 'price')
        obj['price'] = price.toFixed(2);
        const market_cap = fetchPriceData(data, coinSymbol, 'market_cap')
        obj['market_cap'] = market_cap.toLocaleString('en-US').split('.')[0] //loses the decimal places on the output
        const volume_24h = fetchPriceData(data, coinSymbol, 'volume_24h')
        obj['volume_24h'] = volume_24h.toLocaleString('en-US').split('.')[0];
        const percent_change_24h = fetchPriceData(data, coinSymbol, 'percent_change_24h')
        obj['percent_change_24h'] = percent_change_24h.toFixed(2);
        const percent_change_7d = fetchPriceData(data, coinSymbol, 'percent_change_7d')
        obj['percent_change_7d'] = percent_change_7d.toFixed(2);
        coinArr.push(obj);

    })
    return await coinArr;
}

router.get('/favorites', setMarketData, csrfProtection, asyncHandler(async (req, res) => {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } });

    const coinFavoritesJSON = await user.favoriteCoins;
    const coinFavorites = await JSON.parse(coinFavoritesJSON);
    const arr = await setfavoritesObj(coinFavorites, req.marketData)

    const symbolArr = [];
    await req.marketData.forEach(coin => {
        symbolArr.push(coin["symbol"]);
    })

    res.render('favorites-test', {
        user,
        symbolArr,
        arr,
        csrfToken: req.csrfToken(),
 })
}));


const favoriteCoinValidators = [
    check('favoriteCoins')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for First Name')
        .isLength({ max: 4 })
        .withMessage('Symbol must not be more than 4 characters long'),

];

//working post route
router.post('/add-favorite-coin', setMarketData, csrfProtection, favoriteCoinValidators,
    asyncHandler(async (req, res) => {
        const userToUpdate = await db.User.findOne({ where: { id: res.locals.user.id } });

        const originalFavoriteCoins = JSON.parse(userToUpdate.favoriteCoins);
        let newCoinToAdd = req.body.favoriteCoins
        originalFavoriteCoins.push(newCoinToAdd)
        let newFavoriteCoins = originalFavoriteCoins;

        let user =  {
            emailAddress: userToUpdate.emailAddress,
            firstName: userToUpdate.firstName,
            lastName: userToUpdate.lastName,
            favoriteCoins: JSON.stringify(newFavoriteCoins)
        };

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await userToUpdate.update(user);
            res.redirect('/user/favorites');
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('user-login', {
                user,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));



router.post('/delete-favorite-coin', csrfProtection,
    asyncHandler(async (req, res) => {
        const userToUpdate = await db.User.findOne({ where: { id: res.locals.user.id } });
        const originalFavoriteCoins = JSON.parse(userToUpdate.favoriteCoins);
        let coinToDelete = req.body.symbol
        var newFavoriteCoins = originalFavoriteCoins.filter(function (f) { return f !== coinToDelete })

        console.log(coinToDelete);

        let user = {
            emailAddress: userToUpdate.emailAddress,
            firstName: userToUpdate.firstName,
            lastName: userToUpdate.lastName,
            favoriteCoins: JSON.stringify(newFavoriteCoins)
        };
        await userToUpdate.update(user);
        res.redirect('/user/favorites');
    }));

router.get('/fix-favorite-coin', csrfProtection, favoriteCoinValidators,
    asyncHandler(async (req, res) => {
        const userToUpdate = await db.User.findOne({ where: { id: res.locals.user.id } });

        let user = {
            favoriteCoins: JSON.stringify(["BTC", "ETH", "BCH"])
        };
        await userToUpdate.update(user);
        res.redirect('/user/favorites');

    }));



module.exports = router;