(() => {
  angular.module("app").controller("createInvoiceCtrl", createInvoiceCtrl);

  function createInvoiceCtrl(
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
      calculatedProcess: true,
      items: [
        {
          description: "",
          quantity: "",
          unitPrice: "",
          discountPercent: "",
          taxRate: "",
          sales: ""
        },
        {
          description: "",
          quantity: "",
          unitPrice: "",
          discountPercent: "",
          taxRate: "",
          sales: ""
        },
        {
          description: "",
          quantity: "",
          unitPrice: "",
          discountPercent: "",
          taxRate: "",
          sales: ""
        },
        {
          description: "",
          quantity: "",
          unitPrice: "",
          discountPercent: "",
          taxRate: "",
          sales: ""
        }
      ]
    };

    apiFactory
      .listAllProjects()
      .then(resp => {
        vm.projectList = resp.data;
        /* Initially load the first project as default */
        /* const selectedProject = projectStore.get();

        vm.selectedProject = selectedProject._id; */
      })
      .catch(e => {
        console.log(e);
      });
    vm.getAllStaffs = id => {
      console.log(id);
      apiFactory
        .listAllStaffs(id)
        .then(resp => {
          console.log(resp.data);
          vm.staffsList = resp.data.data.staff;
          vm.staffsList.push({
            _id: id,
            email: vm.createInvoiceData.client.email
          });
          console.log(vm.staffsList);
        })
        .catch(e => {
          console.log(e);
        });
    };
    if (projectStore.get()) {
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
    }

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

    vm.selectedItem = (data, index) => {
      console.log(data);
      console.log(index);
      let lBooleanCheckIsArray = Array.isArray(data);
      console.log(lBooleanCheckIsArray);

      if (!!lBooleanCheckIsArray) {
        if (data.length == 1) {
          vm.createInvoiceData.items[index].unitPrice = !!data[0].currentRate
            ? data[0].currentRate.materialCost.value +
              data[0].currentRate.rooferCost.value
            : 1;
          //vm.invoiceItemsAry[index].description = data[0].name;
        } else if (data.length > 1) {
          Notification.error("you can add only one item at a time");
          data.splice(1, data.length - 1);
          vm.createInvoiceData.items[index].unitPrice = !!data[0].currentRate
            ? data[0].currentRate.materialCost.value +
              data[0].currentRate.rooferCost.value
            : 1;
          //vm.invoiceItemsAry[index].description = data[0].name;
        }
      }
    };

    vm.priceCalculate = (qty, disc, tax, index) => {
      console.log(vm.createInvoiceData.items);
      if (qty != 0) {
        vm.createInvoiceData.items[index].sales =
          vm.createInvoiceData.items[index].quantity *
          vm.createInvoiceData.items[index].unitPrice;

        console.log("Sales" + vm.createInvoiceData.items[index].sales);
        console.log("total sales" + vm.createInvoiceData.totalSales);
        if (disc && disc != 0) {
          if (disc > 100) {
            Notification.error("Please Enter less than 100");
          } else {
            let discountPrice =
              (vm.createInvoiceData.items[index].sales * disc) / 100;
            console.log(discountPrice, "discountPrice");
            vm.createInvoiceData.items[index].sales =
              vm.createInvoiceData.items[index].sales - discountPrice;
            vm.createInvoiceData.items[index].discountPercent = disc;

            if (tax && tax != 0) {
              if (tax > 100) {
                Notification.error("Please Enter less than 100");
              } else {
                let taxPrice =
                  (vm.createInvoiceData.items[index].sales * tax) / 100;
                console.log(taxPrice, "taxPrice");
                vm.createInvoiceData.items[index].sales =
                  vm.createInvoiceData.items[index].sales + taxPrice;
                vm.createInvoiceData.items[index].taxRate = tax;
                vm.createInvoiceData.totalTax = _.sumBy(
                  vm.createInvoiceData.items,
                  function(o) {
                    return o.taxRate;
                  }
                );
                console.log(vm.createInvoiceData.totalTax);
              }
            }
          }
        }

        vm.createInvoiceData.totalSales = _.sumBy(
          vm.createInvoiceData.items,
          function(o) {
            return o.sales;
          }
        );
      } else {
        Notification.error("Please Enter Quantity");
      }
    };

    vm.createInvoiceData.grandTotal = function() {
      return parseFloat(this.totalSales) + parseFloat(this.totalTax);
    };

    vm.addInvoiceItem = data => {
      vm.invoiceItems.push(data);
      vm.addItem = {
        description: "",
        quantity: "",
        unitPrice: "",
        discountPercent: "",
        taxRate: "",
        sales: ""
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
      } else if (data.items.length > 0) {
        var invoiceData = {
          client: data.client._id,
          date: moment(data.date).format(),
          dueDate: moment(data.dueDate).format(),
          projectSystemTag: data.reference,
          termsAndConditions: data.termsAndConditions,
          calculatedProcess: data.calculatedProcess,
          items: data.items,
          email: data.client.email
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

    vm.addInvoiceRow = () => {
      vm.createInvoiceData.items.push({
        description: "",
        quantity: "",
        unitPrice: "",
        discountPercent: "",
        taxRate: "",
        sales: ""
      });
    };

    vm.removeInvoiceRow = index => {
      vm.createInvoiceData.totalSales =
        vm.createInvoiceData.totalSales -
        vm.createInvoiceData.items[index].sales;
      vm.createInvoiceData.totalTax =
        vm.createInvoiceData.totalTax -
        vm.createInvoiceData.items[index].taxRate;
      vm.createInvoiceData.items.splice(index, 1);
      if (vm.createInvoiceData.items.length < 4) {
        let lIntNoOfRows = 4 - vm.createInvoiceData.items.length;
        for (let v = 0; v < lIntNoOfRows; v++) {
          vm.addInvoiceRow();
        }
      }
    };
  }
})();
