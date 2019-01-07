(() => {
  angular.module("app").factory("authFactory", authFactory);

  function authFactory($http, $location, localStorageService) {
    return {
      checkUser: () => {
        const token = localStorageService.get("access-token");
        if (token && token != "") {
          return true;
        } else {
          return false;
        }
      },
      checkPrivilege: (type, subType) => {
        let { privilege } = localStorageService.get("userData");
        let { privileges } = localStorageService.get("companyData");

        if (privilege <= privileges[type][subType]) {
          return true;
        } else {
          return false;
        }
      }
    };
  }
})();
