(() => {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Content Script received a message:', request);
    if (request.action === 'extractHTML') {
      var htmlContent = document.documentElement.outerHTML;
      sendResponse({ html: htmlContent });
    }
    return true;
  });
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendProductNameClass') {
      const product_name_class = request.resp[0];
      const reviewer_name_class = request.resp[1];
      const review__class = request.resp[2];
      var users =[];
      var reviews = [];
      const product = document.querySelector('.' + product_name_class);

      console.log('Product name:', product.textContent);
      const reviewer = document.querySelectorAll('.' + reviewer_name_class);
      reviewer.forEach(element => {

        if (reviewer_name_class==="fdbk-container__details__info__username"){
          users.push(element.textContent.substring(0,5));
        }else{
          users.push(element.textContent);
        }
        // console.log('Customer:', modifiedText);
      });

      const review = document.querySelectorAll('.' + review__class);
      review.forEach(element => {
        if (review__class==="user-review"){
          const startIndex = element.textContent.indexOf("Verified Buyer");
          reviews.push(startIndex !== -1 ? element.textContent.slice(startIndex + "Verified Buyer".length).trim() : element.textContent);
        }else{
          reviews.push(element.textContent);
        }
        // console.log('Review:', modifiedText);
      });

      sendResponse({ received: true,product_name: product.textContent,users: users,reviews: reviews });
    }
  });

})();