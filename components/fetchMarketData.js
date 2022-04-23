const fetch = require('node-fetch');

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


const printAddress = async () => {
    const a = await fetchMarketData;
    console.log(a);
};

printAddress();