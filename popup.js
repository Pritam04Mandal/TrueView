document.addEventListener('DOMContentLoaded', function () {
  html_code = ""
  var extractButton = document.getElementById('extractButton');
  var resultDiv = document.getElementById('result');

  var users = [];
  var reviews = [];

  extractButton.addEventListener('click', async function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      // Requesting the HTML content of the current tab from the scripting file
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractHTML' }, function (response) {
        console.log('Popup received a response:', response);

        html_code = response && response.html ? response.html : '';

        // Extarcting all the classes present in HTML code
        const extractedClasses = extractClassesFromHTML(html_code);

        product_name_class = extract_product_name(extractedClasses);

        // If the current site is not supported by the extension
        if (!product_name_class) {
          resultDiv.innerHTML = `<br> <h3 id="notfound"> Oops! Sorry, TrueView does not support this site! <br><p> Please try on Flipkart, Snapdeal or Nykaa <p></h3> <br> <br>`;
          return;
        }

        // Extracting the class name of element containing reviewer name
        reviewer_name_class = extract_reviewer_name(extractedClasses);

        // Extracting the class name of element containing reviews
        review_class = extract_review(extractedClasses);

        resp = [product_name_class, reviewer_name_class, review_class];

        // Sending the class names back to scripting file, to extract the content
        chrome.tabs.sendMessage(currentTab.id, { action: 'sendProductNameClass', resp }, function (response) {

          // response containing the content of product name, user and review is received from scripting file
          product = response.product_name;
          users = response.users;
          reviews = response.reviews;

          resultDiv.innerHTML = `<br> <sub id="alert" style: "color: red; text-align: center;"> Press the button again </sub> <br> <br>
          <b>Product name:</b> ${product}`;

        });

      });


    });

    // Submitting the user and review data to a server-side endpoint (/predict) for making prediction for originality
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

    // If response correct, displaying it to user
    if (response.ok) {
      const jsonResponse = await response.json();
      var prediction = jsonResponse.prediction;
      const alert= document.getElementById('alert')
      console.log(alert)
      resultDiv.removeChild(alert)
      for (var i = 0; i < prediction.length; i++) {
        var div = document.createElement("div");
        div.innerHTML = `<hr><p><b>User:</b> ${users[i]}</p>
                          <p><b>Prediction:</b> ${prediction[i].originality_percentage.toFixed(2)} % Real</p>`;
        resultDiv.appendChild(div);
      }
      console.log(prediction);
    }
  }

  )
});

// Function to extract all class names from HTML
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

// Function to extract the class name for element containing product
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

// Function to extract the class name for element containing reviewer name
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

// Function to extract the class name for element containing review text
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