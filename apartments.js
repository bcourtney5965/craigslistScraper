const jquery = require('jquery')
const Promise = require('bluebird');
const fs = require("fs");
const readFile = Promise.promisify(fs.readFile);
const Nightmare = require('nightmare');
const nightmare = Nightmare();
const json2csv = require('json2csv');
const _ = require('lodash');

// go to CL - enter your own preferences and then past here
const links = ['https://sfbay.craigslist.org/search/sby/apa?bundleDuplicates=1&search_distance=4&postal=95131&min_price=900&max_price=1500&availabilityMode=1&no_smoking=1']

// visits the url and gets all apartments posted that day
nightmare.goto(links[0])
  // waits until specified element has loaded
  .wait('.result-info span.result-price')
  .evaluate(function () {
    // create an array to hold all apartments
    const apartments = [];

    // loop over all that apartments we get back
    $('.result-info').each(function () {
      const apartment = {};

      // current apartment
      const that = $(this);

      // loop over the elements in current apartment
      that.children('time').each(function () {
        // grab the date
        apartment["date"] = $(this).attr("datetime");
      })

      // loop over the elements in current apartment
      that.children('a').each(function () {
        // grab the link
        apartment["link"] = `https://sfbay.craigslist.org${$(this).attr("href")}`;

        // grab the title
        apartment["title"] = $(this).text();
      })

      // loop over the elements in current apartment
      that.find('.result-price').each(function () {
        // grab the price
        apartment["price"] = $(this).text();
      })
      apartments.push(apartment);
    })
    // this passes data from Electron process to nodejs process
    return apartments
  })
  // end electron process
  .end()
  // enter nodejs process
  .then(function (craigslistData) {
    // future .csv fields
    const fields = ['date', 'title', 'price', 'link'];
    // console.log('craigslistData = ', craigslistData);

    // console.log(`Array.isArray(craigslistData) =`, Array.isArray(craigslistData));
    
    // get previously stored data from file
    readFile('apartments.json', 'utf-8')
      .then(text => {
        // reformat data
        // console.log(`should be false Array.isArray(text) = `, Array.isArray(text));
        return JSON.parse(text);
      })
      .then(fileData => {
        // console.log('should be true Array.isArray(fileData) =', Array.isArray(fileData))
        


        // only add apartments to our file data
        // that weren't already added
        let j;
        for (let i = 0; i < craigslistData.length; i++) {
          let curCraigslistEl = craigslistData[i];
          let isAlreadyThere = false;
          for (j = 0; j < fileData.length; j++) {
            let curfileData = fileData[i];
            if (_.isEqual(curCraigslistEl, curfileData)) {
              isAlreadyThere = true;
              break;
            }
          }
          if (!isAlreadyThere) {
            fileData.push(curCraigslistEl);
          }
        }

        // reformat in prep. for file storage
        fileData = JSON.stringify(fileData);
        // write revised fileData to apartments.json
        fs.writeFile('apartments.json', fileData, (err) => {
          if (err) {
            console.log(`err in fs.writeFile = `, err);
          }
          console.log('Revised data written to JSON file.');

          // Delete old .CSV file if exists
          fs.unlinkSync(`${__dirname}/apartments.csv`)
          // create csv file
          const csv = json2csv({ data: JSON.parse(fileData), fields: fields });
          fs.writeFile('apartments.csv', csv, function(err) {
            if (err) {
              console.log('error writing to .CSV file');
              throw err;
            }
            console.log('CSV file saved');
          });
        })
        return fileData;
      })
      .catch(e => {
        console.log(e);
      })

    // print each apartment to the console in a neat format
    // for (apartment in data) {
    //   console.log(craigslistData[apartment].title);
    //   // craigslistData[apartment].link = `https://sfbay.craigslist.org${result[apartment].link}`
    //   console.log(data[apartment].date);
    //   console.log(data[apartment].price);
    //   console.log(data[apartment].link);
    //   console.log("\n")
    // }
    // console.log('data = ', data);

  })



//price