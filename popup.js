document.addEventListener('DOMContentLoaded', function () {
  html_code=""
  var extractButton = document.getElementById('extractButton');
  var resultDiv = document.getElementById('result');

  var users =[];
  var reviews =[];

  extractButton.addEventListener('click', async function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractHTML' }, function (response) {
        console.log('Popup received a response:', response);

        html_code = response && response.html ? response.html : '';

        const extractedClasses = extractClassesFromHTML(html_code);
      
        product_name_class= extract_product_name(extractedClasses);
        // resultDiv.innerText=product_name_class;
        reviewer_name_class= extract_reviewer_name(extractedClasses);
        // resultDiv.innerText+=" "+reviewer_name_class;
        review_class= extract_review(extractedClasses);
        // resultDiv.innerText+=" "+review_class;

        resp= [product_name_class, reviewer_name_class, review_class];
        chrome.tabs.sendMessage(currentTab.id, { action: 'sendProductNameClass', resp}, function (response) {
          console.log('Product name class sent to content script:');
          // resultDiv.textContent += response.received ? response.product_name: 'Error';

          users = response.users;
          reviews = response.reviews;

          // var hello = JSON.parse(response)
          // resultDiv.innerText = hello.received;
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
        // resultDiv.textContent = (jsonResponse.prediction);
        var prediction = jsonResponse.prediction;
        for (var i = 0; i < prediction.length; i++) {
          var node = document.createElement("p");
          node.textContent = "Users: " + users[i] +  " Prediction: " + prediction[i].originality_percentage + "% Real";
          resultDiv.appendChild(node);
        }
        console.log(prediction);
      }
    }

)  });

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

function  extract_product_name(allClasses){
  pnames_class=["B_NuCI", "x-item-title__mainTitle", "pdp-e-i-head", "css-1gc4x7i"]
  res=""
    pnames_class.forEach(element => {
      console.log(element)
      if (allClasses.includes(element)){
        res=element;
        return;
      }
    });
    return res;
}
function  extract_reviewer_name(allClasses){
  pnames_class=["_2V5EHH", "fdbk-container__details__info__username", "_reviewUserName", "css-amd8cf"]
  res=""
    pnames_class.forEach(element => {
      console.log(element)
      if (allClasses.includes(element)){
        res=element;
        return;
      }
    });
    return res;
}
function  extract_review(allClasses){
  pnames_class=["t-ZTKy", "fdbk-container__details__comment", "user-review", "css-1n0nrdk"]
  res=""
    pnames_class.forEach(element => {
      console.log(element)
      if (allClasses.includes(element)){
        res=element;
        return;
      }
    });
    return res;
}