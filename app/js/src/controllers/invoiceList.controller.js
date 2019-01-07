(() => {
  angular.module("app").controller("invoiceListCtrl", invoiceListCtrl);

  function invoiceListCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    NgMap,
    Upload,
    moment,
    $location
  ) {
    /* Requiring vars */
    let vm = this;
    const { logout, userStore, debounce, projectStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }
    /* Get project list */
    vm.userData = userStore.get();
    vm.logout = () => {
      logout();
    };

    vm.todayDate = new Date();
    vm.invoiceItems = [];
    vm.createInvoiceData = {
      reference: "",
      date: vm.todayDate,
      dueDate: vm.todayDate,
      termsAndConditions: true,
      calculatedProcess: true
    };

    apiFactory
      .getProjectById(projectStore.get()._id)
      .then(resp => {
        vm.createInvoiceData.reference = resp.data.systemTag;
        return apiFactory.listAllProjectInvoice(resp.data.systemTag);
      })
      .then(getInvoiceList)
      .catch(e => {
        console.log(e);
      });

    vm.addItem = {
      quantity: 1,
      discountPercent: 0,
      taxRate: 0
    };

    vm.clients = [];
    apiFactory
      .listAllClients()
      .then(resp => {
        vm.clients = resp.data.list;
        console.log(vm.clients, "clients");
      })
      .catch(e => {
        console.log(e);
      });

    Promise.all([
      apiFactory.listAllMaterials(),
      apiFactory.listAllComboMaterials(),
      apiFactory.listAllEquipments()
    ])
      .then(resp => {
        vm.itemList = [].concat(
          resp[0].data.list,
          resp[1].data.list,
          resp[2].data.list
        );
        vm.loadFilesToAutoComplete = $query => {
          return new Promise((resolve, reject) => {
            resolve(vm.itemList);
          });
        };
      })
      .catch(e => {
        console.log(e);
      });

    vm.selectedItem = data => {
      if (data.length == 1) {
        vm.addItem.unitPrice =
          data[0].currentRate.materialCost.value +
          data[0].currentRate.rooferCost.value;
        vm.addItem.description = data[0].name;
      } else {
        Notification.error("you can add only one item at a time");
        data.splice(1, data.length - 1);
        vm.addItem.unitPrice =
          data[0].currentRate.materialCost.value +
          data[0].currentRate.rooferCost.value;
        vm.addItem.description = data[0].name;
      }
    };

    vm.priceCalculate = (qty, disc, tax) => {
      console.log(vm.addItem, "===addItem");
      if (qty != 0) {
        vm.addItem.sales = vm.addItem.quantity * vm.addItem.unitPrice;
        if (disc && disc != 0) {
          if (disc > 100) {
            Notification.error("Please Enter less than 100");
          } else {
            let discountPrice = (vm.addItem.sales * disc) / 100;
            console.log(discountPrice, "discountPrice");
            vm.addItem.sales = vm.addItem.sales - discountPrice;
            vm.addItem.discountPercent = disc;

            if (tax && tax != 0) {
              if (tax > 100) {
                Notification.error("Please Enter less than 100");
              } else {
                let taxPrice = (vm.addItem.sales * tax) / 100;
                console.log(taxPrice, "taxPrice");
                vm.addItem.sales = vm.addItem.sales + taxPrice;
                vm.addItem.taxRate = tax;
              }
            }
          }
        }
      } else {
        Notification.error("Please Enter Quantity");
      }
    };

    vm.addInvoiceItem = data => {
      vm.invoiceItems.push(data);
      vm.addItem = {
        quantity: 1,
        discountPercent: 0,
        taxRate: 0,
        unitPrice: 0,
        description: "",
        sales: 0
      };
      vm.selectedFiles = "";
    };
    vm.removeInvoiceItem = index => {
      vm.invoiceItems.splice(index, 1);
    };
    vm.createInvoice = data => {
      if (!data.client) {
        Notification.error("Please select client");
      } else if (!data.date) {
        Notification.error("Please select date");
      } else if (!data.dueDate) {
        Notification.error("Please select due date");
      } else if (!data.termsAndConditions) {
        Notification.error("Please check terms and conditions");
      } else if (!data.calculatedProcess) {
        Notification.error("Please check calculated process");
      } else if (vm.invoiceItems.length > 0) {
        var invoiceData = {
          client: data.client,
          date: moment(data.date).format(),
          dueDate: moment(data.dueDate).format(),
          projectSystemTag: data.reference,
          termsAndConditions: data.termsAndConditions,
          calculatedProcess: data.calculatedProcess,
          items: vm.invoiceItems
        };

        apiFactory
          .createInvoice(invoiceData)
          .then(resp => {
            Notification.success("Invoice created successfully");
            return apiFactory.listAllProjectInvoice(data.reference);
          })
          .then(getInvoiceList)
          .catch(e => {
            Notification.error("Something went wrong");
            console.log(e);
          });
      } else {
        Notification.error("Please add invoice Items");
      }
    };
    $scope.activeClass = function(path) {
      return $location.path() === path ? "active" : "";
    };

    function getInvoiceList(resp) {
      vm.invoiceList = resp.data.list;
      angular.forEach(vm.invoiceList, function(x) {
        let amount = 0;
        angular.forEach(x.items, function(y) {
          amount = amount + y.sales;
        });
        x.totalValue = amount;
      });
    }
  }
})();
