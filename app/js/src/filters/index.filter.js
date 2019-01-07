(() => {
  /* Currenty convertor */
  angular.module("app").filter("convertCurrency", convertCurrency);

  function convertCurrency() {
    return function(input, conversionRate) {
      if (!input) {
        return 0;
      } else {
        return input * conversionRate;
      }
    };
  }

  /* Round number */

  angular.module("app").filter("roundNum", roundNum);

  function roundNum() {
    return function(input, place) {
      if (!input) {
        return 0;
      } else {
        return Number(input).toFixed(place);
      }
    };
  }

  /* Round number */

  angular.module("app").filter("roundNumb", roundNumb);

  function roundNumb() {
    return function(input, place) {
      if (!input) {
        return "";
      } else {
        return Number(input).toFixed(place);
      }
    };
  }

  /* Fetch thumbnail */

  angular.module("app").filter("fetchThumbnail", fetchThumbnail);

  function fetchThumbnail() {
    return function(input) {
      if (!input) return;
      return /cloudinary/.test(input.secure_url)
        ? input.secure_url.replace(/\.pdf/, ".png")
        : input.thumbnail;
    };
  }

  /* Parse typing members */

  angular.module("app").filter("parseTypingMembers", parseTypingMembers);

  function parseTypingMembers() {
    return function(input) {
      if (!input || !input.length) {
        return;
      }
      if (input.length > 1) {
        return `${input.length} people are typing..`;
      } else {
        return `${input[0].nickname} is typing..`;
      }
    };
  }

  /*sum of columns*/
  angular.module("app").filter("sumOfColumn", sumOfColumn);

  function sumOfColumn() {
    return function(collection, column) {
      var total = 0;

      collection.forEach(function(item) {
        total += parseInt(item[column]);
      });

      return total;
    };
  }

  /*Autocomplete filter */
  angular.module("app").filter("searchFor", searchFor);

  function searchFor() {
    // All filters must return a function. The first parameter
    // is the data that is to be filtered, and the second is an
    // argument that may be passed with a colon (searchFor:searchString)

    return function(arr, searchString) {
      if (!searchString) {
        return arr;
      }

      var result = [];

      searchString = searchString.toLowerCase();

      // Using the forEach helper method to loop through the array
      angular.forEach(arr, function(item) {
        if (item.name.toLowerCase().indexOf(searchString) !== -1) {
          result.push(item);
        } else {
          result.push(searchString);
        }
      });

      return result;
    };
  }
})();
