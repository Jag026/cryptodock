const fetch = require('node-fetch');

const url = 'https://rest.coinapi.io/v1/assets';
const header = {
    'X-CoinAPI-Key': 'DF8B9104-DDF2-4D58-A4BF-8B6717B7D530',
    "Content-Type": "application/json"
}

const fetchPrice = (coinName) => fetch(url, {
    method: 'GET',
    headers: header
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

const printAddress = async () => {
    const a = await fetchPrice('Litecoin');
    console.log(a);
};

printAddress();

module.exports = {
    fetchPrice
};