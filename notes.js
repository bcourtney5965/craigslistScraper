var apartments = [];
$('.hdrlnk').each(function () {
  item = {}
  item["title"] = $(this).text()
  item["link"] = $(this).attr("href")

  // create a apartment object with title and link, then push to the 'apartments' array
  apartments.push(item)
})
$('.result-info > *').each(function () {
  var item = {};

})

// get apartments
// if not in apartments.json add it

// want date
// price
// title
