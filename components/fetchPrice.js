const fetch = require('node-fetch');

const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
const header = {
    'X-CMC_PRO_API_KEY': '1b02cf34-2998-4adc-8c45-c43ac970e440',
    "Content-Type": "application/json"
}

const fetchPrice = (coinName) => fetch(url, {
    method: 'GET',
    headers: header
})
    .then((response) => response.json())
    .then((data) => {
        // console.log(data['data'])
        let coin = {};
        data['data'].forEach(crypto => {
            // console.log(crypto)
            if (crypto['symbol'] === coinName) {
                coin = crypto
                console.log(coin['quote']['USD']['price'])
            }
        })
        return coin['quote']['USD']['price'];
    });

const printAddress = async () => {
    const a = await fetchPrice('LTC');
    console.log(a);
};

printAddress();

module.exports = {
    fetchPrice
};