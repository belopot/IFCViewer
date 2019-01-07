(() => {
  angular.module("app").controller("systemTagsCtrl", systemTagsCtrl);

  function systemTagsCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    $stateParams,
    apiFactory,
    Notification,
    NgMap,
    globals,
    localStorageService
  ) {
    let vm = this;

    const { logout, userStore, companyStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
    }
    vm.userData = userStore.get();
    vm.ID;

    vm.logout = () => {
      logout();
    };

    vm.getTags = function() {
      apiFactory
        .getAllSystemTags()
        .then(resp => {
          vm.AllTags = resp.data.data;
          console.log("taggs", vm.AllTags);
        })
        .catch(e => {});
    };

    vm.languages = ["EN", "FR"];
    vm.chosenLanguage = "EN";
    vm.getTags();
    vm.createTag = function(systemTag) {
      console.log(systemTag);
      if (systemTag == undefined) {
        Notification.error("please enter Tag name");
      } else {
        apiFactory
          .saveSystemTag(systemTag)
          .then(resp => {
            $("#tags_modal").modal("hide");
            vm.systemTag = {};
            Notification.success("new system tag added.");
            vm.getTags();
          })
          .catch(e => {
            Notification.error("something went wrong");
          });
      }
    };

    vm.deleteTag = function(id) {
      vm.ID = id;
      $("#tagdelete_modal").modal("show");
    };
    vm.deleteSystemTag = function() {
      apiFactory
        .deleteSystemTag(vm.ID)
        .then(resp => {
          $("#tagdelete_modal").modal("hide");
          Notification.success("system tag deleted successfully.");
          vm.getTags();
        })
        .catch(e => {
          Notification.error("Something went wrong");
        });
    };

    globals.getCurrency().then(resp => {
      vm.currencies = resp.data;
      vm.loadCurrencies = $query => {
        return new Promise((resolve, reject) => {
          resolve(resp.data);
        });
      };
    });

    /* Update company currency */

    vm.chosenCompanyCurrency = companyStore.get().currentCurrency.currencyCode;

    vm.changeCompanyCurrency = currency => {
      apiFactory
        .showConversionRate({
          from: companyStore.get().currentCurrency.currencyCode,
          to: currency
        })
        .then(resp => {
          return resp.data.conversionFactor;
        })
        .then(conversionFactor => {
          Notification.success(
            "Company currency has been updated successfully"
          );
          return apiFactory.changeCompanyCurrency({
            conversionFactor,
            currencyCode: currency
          });
        })
        .then(resp => {
          let updatedData = Object.assign(companyStore.get(), {
            currentCurrency: {
              currencyCode: currency
            }
          });
          companyStore.set(updatedData);
        })
        .catch(e => {
          console.log(e);
        });
    };
  }
})();
