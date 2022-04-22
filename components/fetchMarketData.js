const fetch = require('node-fetch');

const url = 'https://rest.coinapi.io/v1/assets';

const fetchMarketData = fetch(url, {
    method: 'GET',
    headers: {
        'X-CoinAPI-Key': '2352E3E2-7C3C-45D5-902F-6DE153D03E5F',
        "Content-Type": "application/json"
    }
})
    .then((response) => response.json())
    .then((data) => {
        return data;
    });


const printAddress = async () => {
    const a = await fetchMarketData();
    console.log(a);
};

printAddress();

