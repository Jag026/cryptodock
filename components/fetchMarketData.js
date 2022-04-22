const fetch = require('node-fetch');

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


const printAddress = async () => {
    const a = await fetchMarketData;
    console.log(a);
};

printAddress();

