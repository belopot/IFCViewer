(() => {
  angular.module("app").controller("equipmentCtrl", equipmentCtrl);

  function equipmentCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    Upload,
    NgMap
  ) {
    /* Requiring vars */

    $scope.equipment = [
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Car",
        tag: "NR. 99"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Car",
        tag: "NR. 99"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Car",
        tag: "NR. 99"
      },
      {
        img: "/assets/images/equipment.png",
        title: "Equipment ABC",
        subtitle: "EQ - 1234",
        work: "Worker ID",
        tag: "NNS1 - Kim Mosegaard"
      }
    ];
    $scope.img_upload = [
      { img: "/assets/images/equipment3.png" },
      { img: "/assets/images/equipment3.png" },
      { img: "/assets/images/equipment3.png" }
    ];
    $scope.equipdocuments = [
      { img: "/assets/images/pdf.png", type: "Document_1.pdf" },
      { img: "/assets/images/pdf.png", type: "Document_2.pdf" },
      { img: "/assets/images/pdf.png", type: "Document_3.pdf" }
    ];

    let vm = this;
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    vm.inputFiles = [];
    vm.uploadFiles = [];

    $(".payrollMenu").hide();
    /* Get project list */

    vm.userData = userStore.get();

    vm.logout = () => {
      logout();
    };

    /**Google Map */
    vm.gmap = {
      url:
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU&libraries=places",
      markers: [],
      styles: [],
      center: "41,-87",
      zoom: 3
    };
    let gAryLocation = [];

    vm.placeMarker = function(map) {
      const placeData = this.getPlace().geometry.location;
      vm.gmap.markers = [[placeData.lat(), placeData.lng()]];
      vm.gmap.zoom = 15;
      vm.gmap.center = `${placeData.lat()},${placeData.lng()}`;
      // vm.event.location =  [placeData.lat(), placeData.lng()]
      gAryLocation = [placeData.lat(), placeData.lng()];
    };
    NgMap.getMap().then(map => {
      vm.map = map;
      map.setOptions({
        styles: vm.gmap.styles,
        disableDefaultUI: true,
        zoomControl: true,
        zoom: 1,
        center: {
          lat: 0,
          lng: 0
        }
      });
    });

    $(".materialList").DataTable();
    apiFactory
      .listAllEquipments()
      .then(resp => {
        vm.equipment = resp.data.list;
      })
      .catch(e => {
        console.log(e);
      });

    /* Data table setup **************************/
    vm.dtOptions = {
      paging: false,
      info: false,
      ordering: false
    };
    $(".equipmentList").DataTable();

    $scope.activeJustified = 0;

    vm.currentPage = 1;

    vm.toggleObj = {
      systemTag: true,
      materialCost: false,
      rooferCost: false,
      createdAt: false,
      name: false
    };
    vm.searchText = "";
    vm.sortEquipment = type => {
      /* For toggling ascending and descending order */
      vm.toggleObj[type] === undefined
        ? (vm.toggleObj[type] = true)
        : (vm.toggleObj[type] = !vm.toggleObj[type]);

      apiFactory
        .listAllEquipments({
          page: 1,
          chunk: 10,
          sort: type,
          search: vm.searchText,
          sortType: vm.toggleObj[type]
        })
        .then(resp => {
          vm.equipment = resp.data.list;
          console.log(vm.equipment);
          vm.equipmentCount = resp.data.total;
          $timeout(() => {
            $("#equipmentPagination").pagination({
              items: vm.equipmentCount,
              itemsOnPage: 10,
              cssStyle: "light-theme",
              hrefTextPrefix: "#",
              ordering: false,
              currentPage: 1,
              onPageClick: function(page, event) {
                event.preventDefault();
                apiFactory
                  .listAllEquipments({
                    page: page,
                    chunk: 10,
                    sort: type,
                    sortType: vm.toggleObj[type]
                  })
                  .then(resp => {
                    vm.equipment = resp.data.list;
                  })
                  .catch(e => {
                    console.log(e);
                  });
              }
            });
          });
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.searchEquipment = text => {
      apiFactory
        .listAllEquipments({
          page: 1,
          chunk: 10,
          search: text,
          sort: "createdDate",
          sortType: false
        })
        .then(resp => {
          vm.equipment = resp.data.list;
          vm.equipmentCount = resp.data.total;
          $timeout(() => {
            $("#equipmentPagination").pagination({
              items: vm.equipmentCount,
              itemsOnPage: 10,
              cssStyle: "light-theme",
              hrefTextPrefix: "#",
              ordering: false,
              currentPage: 1,
              onPageClick: function(page, event) {
                event.preventDefault();
                apiFactory
                  .listAllEquipments({
                    page: page,
                    chunk: 10,
                    sort: type,
                    sortType: vm.toggleObj[type]
                  })
                  .then(resp => {
                    vm.equipment = resp.data.list;
                  })
                  .catch(e => {
                    console.log(e);
                  });
              }
            });
          });
        })
        .catch(e => {
          console.log(e);
        });
    };

    /* Initially getting the values of material and combo materials */
    vm.sortEquipment("createdAt");
    /* End of  Data table setup **********************/

    /* Add material functionality */

    vm.addEquipment = {
      conversionFactor: 1
    };

    vm.tabSettings = {
      disable: true
    };
    apiFactory
      .getCompanyById(vm.userData.companyId)
      .then(resp => {
        vm.companyData = resp.data;
        vm.addEquipment.currency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        vm.companyCurrency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        console.log(vm.addEquipment.currency);
        $("#currency")
          .val(vm.addEquipment.currency)
          .trigger("change.select2");
      })
      .then(e => {
        console.log(e);
      });

    vm.Equipment = {};
    vm.showConversionRate = (from, to) => {
      $(".loader").show();
      let currencyData = {
        from,
        to
      };
      if (from && to) {
        apiFactory
          .showConversionRate(currencyData)
          .then(resp => {
            vm.Equipment.conversionFactor = resp.data.conversionFactor;

            $timeout(function() {
              $(".loader").hide();
            }, 500);
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.mUnits = globals.mUnits;

    globals.getCurrency().then(resp => {
      vm.currencies = resp.data;
    });

    vm.tabStyle = () => {
      if (
        vm.addMaterial.materialName !== undefined &&
        vm.addMaterial.materialName !== " "
      ) {
        if (
          vm.addMaterial.materialUnit !== undefined &&
          vm.addMaterial.materialUnit !== " "
        ) {
          if (
            vm.addMaterial.currency !== undefined &&
            vm.addMaterial.currency !== ""
          ) {
            if (
              vm.addMaterial.conversionFactor !== undefined &&
              vm.addMaterial.conversionFactor !== ""
            ) {
              $("uib-tab-heading.info i.fa").attr(
                "style",
                "display: inline-block !important; color: #3cbdaa"
              );
              $("uib-tab-heading.info .number").hide();
              $(".btn-success.next").attr("disabled", false);
            } else {
              $("uib-tab-heading.info i.fa").attr(
                "style",
                "display: none !important; color: #3cbdaa"
              );
              $("uib-tab-heading.info .number").show();
              $(".btn-success.next").attr("disabled", true);
            }
          } else {
            $("uib-tab-heading.info i.fa").attr(
              "style",
              "display: none !important; color: #3cbdaa"
            );
            $("uib-tab-heading.info .number").show();
            $(".btn-success.next").attr("disabled", true);
          }
        } else {
          $("uib-tab-heading.info i.fa").attr(
            "style",
            "display: none !important; color: #3cbdaa"
          );
          $("uib-tab-heading.info .number").show();
          $(".btn-success.next").attr("disabled", true);
        }
      } else {
        $("uib-tab-heading.info i.fa").attr(
          "style",
          "display: none !important; color: #3cbdaa"
        );
        $("uib-tab-heading.info .number").show();
        $(".btn-success.next").attr("disabled", true);
      }
    };

    vm.addMaterialNext = () => {
      if (
        vm.addMaterial.materialName == undefined ||
        vm.addMaterial.materialName == " "
      ) {
        Notification.error("Please enter material name");
        return;
      }

      if (
        vm.addMaterial.materialUnit == undefined ||
        vm.addMaterial.materialUnit == " "
      ) {
        Notification.error("Please select material Unit");
        return;
      }

      if (
        vm.addMaterial.currency == undefined ||
        vm.addMaterial.currency == " "
      ) {
        Notification.error("Please select Currency");
        return;
      }

      $scope.activeJustified = 1;
    };

    vm.changeCost = (cost, conversionRate) => {
      return cost * conversionRate;
    };

    vm.fileUpdated = (files, event, modal) => {
      console.log(vm.inputImg);
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function (x, index) {
        x.description = "";
        if (modal == "image") {
          if (vm.uploadImg.length == 0) {
            vm.uploadImg.push(x);
          } else {
            let duplicateImg = false;
            angular.forEach(vm.uploadImg, function (y) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              vm.uploadImg.push(x);
            } else {
              Notification.error("File name already exist");
            }
          }
        } else {
          if (vm.uploadFiles.length == 0) {
            if (/image/.test(x.type)) {
              vm.uploadImg.push(x);
            } else {
              vm.uploadFiles.push(x);
            }
          } else {
            let duplicateImg = false;
            angular.forEach([].concat(vm.uploadFiles, vm.uploadImg), function (
              y
            ) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              if (/image/.test(x.type)) {
                vm.uploadImg.push(x);
              } else {
                vm.uploadFiles.push(x);
              }
            } else {
              Notification.error("File name already exist");
            }
          }
        }
      });
      console.log(vm.uploadImg);
    };

    vm.addMaterialDetails = () => {
      var formData = {
        name: vm.addMaterial.materialName,
        unit: vm.addMaterial.materialUnit,
        equipmentCosts: {
          value: vm.changeCost(
            vm.addMaterial.equipmentCostValue,
            vm.addMaterial.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        rooferCost: {
          value: vm.changeCost(
            vm.addMaterial.rooferCostValue,
            vm.addMaterial.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        files: vm.inputFiles
      };

      apiFactory
        .createEquipment(formData)
        .then(resp => {
          $("#addEquipments").modal("hide");
          Notification.success(resp.data.message);
          vm.sortEquipment("createdAt");

          vm.addMaterial = {
            conversionFactor: 1
          };
        })
        .catch(e => {
          console.log(e);
        });
    };

    // image and file upload funtion -start
    vm.uploadImg = [];
    vm.uploadFiles = [];
    vm.fileUpdated = (files, event, modal) => {
      console.log(vm.inputImg);
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function(x, index) {
        x.description = "";
        if (modal == "image") {
          if (vm.uploadImg.length == 0) {
            vm.uploadImg.push(x);
          } else {
            let duplicateImg = false;
            angular.forEach(vm.uploadImg, function(y) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              vm.uploadImg.push(x);
            } else {
              Notification.error("File name already exist");
            }
          }
        } else {
          if (vm.uploadFiles.length == 0) {
            if (/image/.test(x.type)) {
              vm.uploadImg.push(x);
            } else {
              vm.uploadFiles.push(x);
            }
          } else {
            let duplicateImg = false;
            angular.forEach([].concat(vm.uploadFiles, vm.uploadImg), function(
              y
            ) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              if (/image/.test(x.type)) {
                vm.uploadImg.push(x);
              } else {
                vm.uploadFiles.push(x);
              }
            } else {
              Notification.error("File name already exist");
            }
          }
        }
      });
      console.log(vm.uploadImg);
    };
    vm.descriptionPopover = (indexVal, type) => {
      $scope.fileType = type;
      $scope.fileIndex = indexVal;
    };
    vm.addDescription = (index, data) => {
      if ($scope.fileType == "image") {
        vm.uploadImg[index].description = data;
        $("#closePopoverImg_" + index).trigger("click");
      } else {
        vm.uploadFiles[index].description = data;
        $("#closePopoverFile_" + index).trigger("click");
      }
    };
    vm.deleteFile = (indexVal, type) => {
      if (type == "image") {
        vm.uploadImg.splice(indexVal, 1);
      } else {
        vm.uploadFiles.splice(indexVal, 1);
      }
    };
    // image and file upload function -end

    // Add Equpment -start
    vm.addNewEquipment = function(Equipments) {
      let files = ($scope.imgAndFiles = [].concat(
        vm.uploadImg,
        vm.uploadFiles
      ));
      console.log("Equipments: ", Equipments);
      var formData = {
        name: Equipments.name,
        unit: Equipments.unit,
        files: files,
        equipmentCost: {
          value: vm.changeCost(
            Equipments.equipmentCost,
            Equipments.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        workers: Equipments.workers,
        rooferCost: {
          value: vm.changeCost(
            Equipments.rooferCost,
            Equipments.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        location: gAryLocation
      };
      console.log(formData);
      $("#equipment_modal").modal("hide");
      apiFactory
        .updateEquipmentById(formData)
        .then(resp => {
          Notification.success(resp.data.message);
          vm.sortEquipment("createdAt");
        })
        .catch(e => {
          console.log(e);
        });
    };
    // add equipment -end
    let gAryCompanyMembers = [];
    apiFactory
      .getAllMembersInCurrentCompany(vm.userData.companyId)
      .then(data1 => {
        console.log(data1);
        gAryCompanyMembers = data1.data.data;
        vm.companyMembers = gAryCompanyMembers;
      })
      .catch(err => {
        console.log(err);
        Notification.error(err.data.message);
      });
  }
})();
