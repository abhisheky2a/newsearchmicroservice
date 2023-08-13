// @Author Abhishek Chakraborty
// @Date 12 Aug 2023
// @Function This React App is the front end component for the news search Microservice

// import the required libraries and files
const express = require('express');
const moment = require('moment');
const https = require('https');
const cors = require('cors');
const defaultData = require('./cache/default.json');
const configuration = require('./configs/configuration.json')

// use express framework for nodejs Server 
const app = express();
app.use(express.json());
app.use(express.static('./build/', { index: 'index.html' }));
app.use(cors())

// default health check
app.get('/healthCheck', (req, res) => {
  res.send('News Search Service is running fine!');
});


// expose newssearch API
app.post('/newssearch', async (req, res) => {
  let keyword = req.body.keyword
  let interval = req.body.interval
  let timespan = req.body.timespan

  // check for any extra white spaces
  if(keyword && keyword != null)
    keyword = keyword.trim();

  // keyword is required, throw 500 response if the search keyword is not present
  if (keyword == null) {
    return res.status(500).json({
      success: false,
      message: "keyword missing...",
    });
  }

  // keyword should not be more than one word
  if (keyword.split(' ').length > 1) {
    return res.status(500).json({
      success: false,
      message: "keyword should not be more than one word...",
    });
  }

  // default is 12 hours in case either interval or timespan is absent
  if (interval === null || timespan === null) {
    interval = 12
    timespan = hours
  }

  // define the configuration for the url and the API Key
  // In real time this should be a part of the kubernetes configuration and secrets
  let host = configuration.host
  let path = configuration.path
  const API_KEY = configuration.apikey
  path = path + "?q=" + keyword + "&apiKey=" + API_KEY

  console.log(host + path)

  let options = {
    host: host,
    path: path,
    port: 443,
    method: "GET",
    headers: {
      'User-Agent': 'PostmanRuntime/7.24.1',
      'Accept': 'application/json'
    }
  };

  let newsresult = {
    success: true,
    articles: []
  };

  function getAskedTime(timespan, interval) {
    let askedTime = "";
    // get the asked time by subsstracting the number of days, months, weeks etc. from the current time
    if (timespan === 'days') {
      askedTime = moment().utc().subtract(interval, 'days').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'weeks') {
      askedTime = moment().utc().subtract(interval, 'weeks').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'months') {
      askedTime = moment().utc().subtract(interval, 'months').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'years') {
      askedTime = moment().utc().subtract(interval, 'years').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'hours') {
      askedTime = moment().utc().subtract(interval, 'hours').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'minutes') {
      askedTime = moment().utc().subtract(interval, 'minutes').format('YYYY-MM-DDT00:00:00Z');
    }
    else if (timespan === 'seconds') {
      askedTime = moment().utc().subtract(interval, 'seconds').format('YYYY-MM-DDT00:00:00Z');
    }
    else {
      // default is 12 hours
      askedTime = moment().utc().subtract(12, 'hours').format('YYYY-MM-DDT00:00:00Z');
    }

    return askedTime;
  }

  https.get(options, function (response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    let data = '';
    // Read the data in chunks
    response.on('data', (chunk) => {
      data += chunk.toString();
    });

    // The whole response has been received
    response.on('end', () => {
      // parse the data
      data = JSON.parse(data);
      // if the response is 200 and the data is valid and http status is ok , let's proceed
      if (response.statusCode === 200 && data !== undefined && data.status == "ok") {
        let articles = [];
        let askedTime = getAskedTime(timespan, interval);
        console.log('askedTime ', askedTime)
        let askedTimestamp = new Date(askedTime).getTime();
        console.log('askedTimestamp ', askedTimestamp)
        let allArticles = JSON.stringify(data.articles)
        allArticles = JSON.parse(allArticles)

        // Iterate thorugh the new articles and take on the ones published in the mentioned duration
        for (let i = 0; i < allArticles.length; i++) {
          let articleTimestamp = new Date(allArticles[i].publishedAt).getTime();
          // take on the artickes which is within the mentioned duration
          if (articleTimestamp > askedTimestamp) {
            console.log('articleTimestamp ', articleTimestamp)
            let article = {}
            article.author = allArticles[i].author;
            article.title = allArticles[i].title;
            article.url = allArticles[i].url;
            article.publishedAt = allArticles[i].publishedAt;
            console.log(article)
            articles.push(article)
          }
          newsresult.success = true
          newsresult.articles = articles
        }
      }
      else {
        newsresult.success = false
      }
      // send the response back
      res.send(newsresult);
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
    console.log("Reading Default Data");

    // In case of error read from defaul json response.
    // In real scenerios this can be from Hazel Cache or Redis in Memory DBs
    let articles = [];
    let askedTime = getAskedTime(timespan, interval);
    console.log('askedTime ', askedTime)
    let askedTimestamp = new Date(askedTime).getTime();
    console.log('askedTimestamp ', askedTimestamp)
    let allArticles = JSON.stringify(defaultData.articles)
    allArticles = JSON.parse(allArticles)

    for (let i = 0; i < allArticles.length; i++) {
      let articleTimestamp = new Date(allArticles[i].publishedAt).getTime();
      if (articleTimestamp > askedTimestamp) {
        console.log('articleTimestamp ', articleTimestamp)
        let article = {}
        article.author = allArticles[i].author;
        article.title = allArticles[i].title;
        article.url = allArticles[i].url;
        article.publishedAt = allArticles[i].publishedAt;
        console.log(article)
        articles.push(article)
      }
      newsresult.success = true
      newsresult.articles = articles
    }
    newsresult.success = true
    res.send(newsresult);
  });

});

// expose the app to be used by other modules and to facilitate the test cases running
module.exports = app

// expose newssearch API
let port = process.env.PORT || 8080;
app.listen(port, () => console.log('News Search Service is listening on port 8080!'));
