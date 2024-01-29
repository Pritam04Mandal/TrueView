document.addEventListener('DOMContentLoaded', function () {
  html_code = ""
  var extractButton = document.getElementById('extractButton');
  var resultDiv = document.getElementById('result');

  var users = [];
  var reviews = [];

  extractButton.addEventListener('click', async function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractHTML' }, function (response) {
        console.log('Popup received a response:', response);

        html_code = response && response.html ? response.html : '';

        const extractedClasses = extractClassesFromHTML(html_code);

        product_name_class = extract_product_name(extractedClasses);

        if (!product_name_class) {
          resultDiv.innerHTML = `<br> <h3 id="notfound"> Oops! Sorry, TrueView does not support this site! <br><p> Please try on Flipkart, Snapdeal or Nykaa <p></h3> <br> <br>`;
          return;
        }

        reviewer_name_class = extract_reviewer_name(extractedClasses);

        review_class = extract_review(extractedClasses);

        resp = [product_name_class, reviewer_name_class, review_class];
        chrome.tabs.sendMessage(currentTab.id, { action: 'sendProductNameClass', resp }, function (response) {

          product = response.product_name;
          users = response.users;
          reviews = response.reviews;

          resultDiv.innerHTML = `<br> <sub id="alert" style: "color: red; text-align: center;"> Press the button again </sub> <br> <br>
          <b>Product name:</b> ${product}`;

        });

      });


    });

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        users: users,
        reviews: reviews
      })
    })
    if (response.ok) {
      const jsonResponse = await response.json();
      var prediction = jsonResponse.prediction;
      const alert= document.getElementById('alert')
      console.log(alert)
      resultDiv.removeChild(alert)
      for (var i = 0; i < prediction.length; i++) {
        var div = document.createElement("div");
        div.innerHTML = `<hr><p><b>User:</b> ${users[i]}</p>
                          <p><b>Prediction:</b> ${prediction[i].originality_percentage} % Real</p>`;
        resultDiv.appendChild(div);
      }
      console.log(prediction);
    }
  }

  )
});

function extractClassesFromHTML(htmlString) {

  const tempElement = document.createElement('div');
  tempElement.innerHTML = htmlString;

  const allClasses = [];
  const elements = tempElement.getElementsByTagName('*');

  for (const element of elements) {
    const elementClasses = String(element.className).split(' ');
    allClasses.push(...elementClasses);
  }
  const uniqueClasses = [...new Set(allClasses)];
  console.log(uniqueClasses);
  return uniqueClasses;
}

function extract_product_name(allClasses) {
  pnames_class = ["B_NuCI", "x-item-title__mainTitle", "pdp-e-i-head", "css-1gc4x7i"]
  res = ""
  pnames_class.forEach(element => {
    console.log(element)
    if (allClasses.includes(element)) {
      res = element;
      return;
    }
  });
  return res;
}
function extract_reviewer_name(allClasses) {
  pnames_class = ["_2V5EHH", "x-review-section__author", "_reviewUserName", "css-amd8cf"]
  res = ""
  pnames_class.forEach(element => {
    console.log(element)
    if (allClasses.includes(element)) {
      res = element;
      return;
    }
  });
  return res;
}
function extract_review(allClasses) {
  pnames_class = ["t-ZTKy", "x-review-section__content", "user-review", "css-1n0nrdk"]
  res = ""
  pnames_class.forEach(element => {
    console.log(element)
    if (allClasses.includes(element)) {
      res = element;
      return;
    }
  });
  return res;
}