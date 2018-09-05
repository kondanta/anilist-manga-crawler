const request = require('requestretry').defaults({json: true});
const { graphql_endpoint } = require("./config.json");

// let arr = [{"id": 3, "name": "Shokugeki no Soma Ettitoile - Raw", "genres": ["action", "shounen"]},
// 	   {"id": 5, "name": "Shokugeki no Soma - Raw", "genres": ["action", "shounen"]},
// 	  {"id": 7, "name": "Akagami", "genres": ["dram", "shoujo"]}]

// let name = "Shokugeki no Soma";

// String.prototype.fuzzy = function (s) {
//     var hay = this.toLowerCase(), i = 0, n = -1, l;
//     s = s.toLowerCase();
//     for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
//     return true;
// };


// let out = arr.filter(n => n.name.fuzzy(name) );
// console.log(out);


/**
 * Query for GraphQL
 */
const q = {};
q.query = `
query ($page: Int = 1, $perPage: Int = 1, $id: Int, $type: MediaType = MANGA) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(id: $id, type: $type) {
      id
      idMal
      coverImage {
        large
        medium
      }
      title {
        romaji
        english
        native
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      status
      chapters
      volumes
      isAdult
      genres
      tags {
        id
        name
        rank
        category
      }
      popularity
      staff {
        edges {
          id
          role
          node{
            name {
              first
              last
              native
            }
            image {
              large
              medium
            }
          }
        }
      }
      meanScore
      updatedAt
      isLicensed
      characters {
        edges {
          id
          node{
            image {
              large
              medium
            }
            name {
              first
              last
              native
            }
          }
        }
      }
      relations {
        edges {
          id
          node{
            bannerImage
            title {
              romaji
              english
              native
            }
            type
            status
          }
        }
      }
    }
  }
}
`;
q.variables = {};

// Define the config we'll need for our Api request

const submitQuery = (variables) => new Promise((resolve, reject) => {
  if(variables.id){
    console.log(`Crawling anime ${variables.id}`);
  }
  else if(variables.page){
    console.log(`Crawling page ${variables.page}`);
  }
  q.variables = variables;
  request({
    url: graphql_endpoint,
    body: q,
    method: 'POST',
    maxAttempts: 1,
    retryDelay: 5000,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError
  })
  .then(function (response) {
    // console.log(response.statusCode);
    if(response.body.data !== null) {
      resolve(response.body.data);
    }
    else{
      reject(response.body.errors);
    }
  })
  .catch(function(error) {
    console.log(error);
    reject(error);
  });
});
// TODO: Add database insertion

//const getDisplayTitle = (title) => title.native ? title.native : title.romaji;
const maxPerPage = 50;

const fetchAnime = (mangaID) => submitQuery({id: mangaID})
  .then(data => data.Page.media[0])
  // .then(anime => storeData(anime.id, anime)
  //   .then(() => {
  //     console.log(`Completed anime ${anime.id} (${getDisplayTitle(anime.title)})`);
  //   })
  //)
      .then(manga => console.log(manga.id, manga))
      .catch(error => console.log(error));

const fetchPage = (pageNumber) => submitQuery({page: pageNumber, perPage: maxPerPage})
  .then(data => data.Page.media)
  // .then(anime_list => anime_list.map(anime => storeData(anime.id, anime)
  //   .then(() => {console.log(`Completed anime ${anime.id} (${getDisplayTitle(anime.title)})`);})
// ))
      .then(manga_list => manga_list.map(manga => console.log(manga.id, manga)))
      .then(list => Promise.all(list))
      .catch(error => console.log(error));

const getLastPage = () => submitQuery({page: 1, perPage: maxPerPage})
  .then(data => data.Page.pageInfo.lastPage)
  .catch(error => console.log(error));

const args = process.argv.slice(2);

args.forEach((param, index) => {
  const value = args[index + 1];
  if (param === '--anime') {
    fetchAnime(parseInt(value, 10));
  }
  
  if (param === '--page') {
    const format = /^(\d+)(-)?(\d+)?$/;
    const startPage = parseInt(value.match(format)[1]);
    const fetchToEnd = value.match(format)[2] === '-';
    const endPage = fetchToEnd ? parseInt(value.match(format)[3]) : startPage;

    getLastPage()
      .then(last_page => {
        console.log(`The last page is ${last_page}`);
        return last_page;
      })
      .then(last_page => (endPage < last_page ? endPage : last_page))
      .then(last_page => Array.from(new Array(last_page + 1), (val, index) => index)
        .slice(startPage, last_page + 1)
      )
      .then(pages =>
        pages
        .reduce((result, page) => result.then(() => fetchPage(page)), Promise.resolve())
      );
  }
});
