const request = require('requestretry').defaults({json: true});
const { lhscans } = require('./config.json');
const cheerio = require('cheerio');

async function getMangaTitles(){
    let mangas = [];
    let response = await request({
	url: lhscans + 'manga-list.html?listType=allABC',
	method: 'GET',
	maxAttempts: 1,
	retryDelay: 5000,
	retryStrategy: request.RetryStrategies.HTTPOrNetworkError
    });
    const $ = cheerio.load(response.body);
    $(response.body).find("span a").each((index, elem) => {
	mangas.push(
	    {
		name: $(elem).text(),
		url: $(elem).attr("href")
	    });
    });
    return mangas;
}

async function printer() {
    let x = await getMangaTitles();
    console.log(x);
}

printer();
