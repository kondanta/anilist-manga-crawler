const request = require('requestretry').defaults({json: true});
const { lhscans } = require('./config.json');
const cheerio = require('cheerio');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

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
		url: $(elem).attr("href"),
		chapters: []
	    });
    });
    return mangas;
}

async function addChapter(){
    let mangas = await getMangaTitles();
    // Now dirty stuff starts
    await asyncForEach(mangas, async(manga, index) => {
	//console.log(manga);
	let response = await request({
	    url: lhscans + manga.url,
	    method: 'GET',
	    maxAttempts: 1,
	    retryDelay: 5000,
	    retryStrategy: request.RetryStrategies.HTTPOrNetworkError
	});
	const $ = cheerio.load(response.body);
	$(response.body).find("#list-chapters p .titleLink a")
	    .each((index, elem) => {
		mangas[index].chapters.push(
		    {
			chapterNo: $(elem).attr("title"),
			chapterUrl:  $(elem).attr("href")
		    }
		);
	    });
    });
    return mangas;
}

async function printer() {
    let x = await addChapter();
    console.log(x);
}

printer();
