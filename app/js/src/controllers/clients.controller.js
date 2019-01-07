(() => {
    angular.module("app").controller("clientsCtrl", clientsCtrl);

    function clientsCtrl(
        $scope,
        $timeout,
        authFactory,
        $state,
        apiFactory,
        Notification,
        NgMap,
        globals,
        localStorageService,
      ) {
        let vm = this;

        const { logout,debounce ,userStore} = globals;
    
        if (!authFactory.checkUser()) {
          logout();
        }
       
        vm.userData = userStore.get();
        vm.logout = () => {
          logout();
        };
      
        $scope.$watch('vm.clientData.clientContact.dialCode', function (value) {
          $('a.item-selected span').removeClass('glyphicon glyphicon-remove')
          $('a.item-selected span').addClass('fas fa-times mr-3')
        });

        $(".clientsList").DataTable();
        $scope.activeJustified = 0;

        vm.currentPage = 1;
    
        vm.toggleObj = {
          toggleClient: {
            clientName: false,
            phoneNo: false,
            email: false,
            primaryAdd: false,
            created: true,
          }
        };
        vm.searchText = "";
        vm.sortclients = (type, resource) => {
          /* For toggling ascending and descending order */
          vm.toggleObj[resource][type] === undefined
            ? (vm.toggleObj[resource][type] = true)
            : (vm.toggleObj[resource][type] = !vm.toggleObj[resource][type]);
          
            apiFactory
            .listAllClients({
              page: 1,
              chunk: 10,
              sort: type,
              search: vm.searchText,
              sortType: vm.toggleObj[resource][type]
            })
            .then(resp => {
            
              vm.allClients = resp.data.list;
              vm.clientCount = resp.data.total;
            
              $timeout(() => {
              
                $("#pagination").pagination({
                  items: vm.clientCount,
                  itemsOnPage: 10,
                  cssStyle: "light-theme",
                  hrefTextPrefix: "#",
                  ordering: false,
                  currentPage: 1,
                 
                  onPageClick: function(page, event) {
                    event.preventDefault();
                    apiFactory
                      .listAllClients({
                        page: page,
                        chunk: 10,
                        sort: type,
                        sortType: vm.toggleObj[type]
                      })
                      .then(resp => {
                        vm.allClients = resp.data.list;
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
        vm.searchText = "";
        const searchDebounce = debounce(250); /* Passing in the debounce rate */
        vm.searchClients = text => {
          /**
           * @param {function} fn - pass the function which you want to debounce
           * @param {Array} args - pass the arguments from the view as an array
           */
          searchDebounce(
            () => {
              apiFactory
               .listAllClients({
                page: 1,
                chunk: 10,
                search: text,
                sort: "created",
                sortType: false
              })
                .then(resp => {
                  vm.allClients = resp.data.list;
                  vm.clientCount = resp.data.total;
                 
                  $timeout(() => {
                    $("#pagination").pagination({
                      items: vm.clientCount,
                      itemsOnPage: 10,
                      cssStyle: "light-theme",
                      hrefTextPrefix: "#",
                      ordering: false,
                      currentPage: 1,
                      onPageClick: function(page, event) {
                        event.preventDefault();
                        apiFactory.listAllClients({
                          page: page,
                          chunk: 10,
                          sort: type,
                          sortType: vm.toggleObj[resource][type]
                        })
                          .then(resp => {
                            vm.allClients = resp.data.list;
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
            },
            [text]
            //[text, resource]
          );
        };

         /* Initially sort clients in descending order */
          vm.sortclients("created", "toggleClient");
        vm.dtOptions = {
            paging: false,
            info: false,
            ordering: false,
            searching: false
          };

          globals.getCountryCode().then(resp => {
            vm.getCountryCode = resp.data;
           
            vm.loadCountryCode = $query => {
              return new Promise((resolve, reject) => {
                resolve(resp.data);
              });
            };
          });
          globals.getIndustry().then(resp => {
            vm.getIndustries = resp.data;
            
            vm.loadIndustry = $query => {
              return new Promise((resolve, reject) => {
                resolve(resp.data);
              });
            };
          });
          globals.getCurrency().then(resp => {
            vm.getCurrencies = resp.data;
            
            vm.loadCurrency = $query => {
              return new Promise((resolve, reject) => {
                resolve(resp.data);
              });
            };
          });

          vm.addNewClient=function(valid,clientdata){
            var client={};
            var industries=[];
          
           
              if(clientdata===undefined||clientdata===null){
                Notification.error("Cannot save empty record");
              }
              if(clientdata.clientName===undefined){
                Notification.error("Please enter name of client");
              }else{
                client.clientName=clientdata.clientName;
              }
              if(clientdata.clientContact===undefined){
                Notification.error("Please enter phone details");
              }else{
                client.clientContact={
                  dialCode: clientdata.clientContact.dialCode[0].dialCode,
                  phoneNumber: clientdata.clientContact.phoneNumber
                 }
              }
              if(clientdata.description!=undefined){
                client.description = clientdata.description;
              }
              if(clientdata.yearFounded!=undefined){
                client.yearFounded = clientdata.yearFounded;
              }
              if(clientdata.clientWebsite!=undefined){
                client.clientWebsite = clientdata.clientWebsite;
              }
           
              if(clientdata.email!=undefined){
                client.email=clientdata.email
              }
              if(clientdata.industry!=undefined){
                clientdata.industry.forEach(element => {
                  industries.push(element.type);
                });
                client.industry=industries;
              }

              if(clientdata.clientContactPerson!=undefined){
                if(clientdata.clientContactPerson.dialCode){
                  console.log("dial code exist");
                  client.clientContactPerson={
                    firstName: clientdata.clientContactPerson.firstName, 
                    middleName: clientdata.clientContactPerson.middleName, 
                    lastName:clientdata.clientContactPerson.lastName, 
                    email: clientdata.clientContactPerson.email, 
                    mobile: {
                        dialCode: clientdata.clientContactPerson.dialCode[0].dialCode,
                        phoneNumber: clientdata.clientContactPerson.phoneNumber
                    }
                  }
                }else{
                  client.clientContactPerson={
                    firstName: clientdata.clientContactPerson.firstName, 
                    middleName: clientdata.clientContactPerson.middleName, 
                    lastName:clientdata.clientContactPerson.lastName, 
                    email: clientdata.clientContactPerson.email, 
                    mobile: {
                        phoneNumber: clientdata.clientContactPerson.phoneNumber
                    }
                  }
                }
                
              }
              if(clientdata.annualRevenue!=undefined){
                if(clientdata.annualRevenue.currencyCode){
                  client.annualRevenue = {
                    value: clientdata.annualRevenue.value,
                    currencyCode: clientdata.annualRevenue.currencyCode[0].cc
                }
              }
                else{
                  client.annualRevenue = {
                    value: clientdata.annualRevenue.value,
                   
                }
              }
            }
               
              
              if(clientdata.address2!=undefined){
                if(clientdata.address2.countryCode){
                  client.address2={
                    line1: clientdata.address2.line1, 
                    line2: clientdata.address2.line2, 
                    line3: clientdata.address2.line3,
                    city: clientdata.address2.city, 
                    postalCode: clientdata.address2.postalCode, 
                    countryCode: clientdata.address2.countryCode[0].code 
                  }
                }else{
                  client.address2={
                    line1: clientdata.address2.line1, 
                    line2: clientdata.address2.line2, 
                    line3: clientdata.address2.line3,
                    city: clientdata.address2.city, 
                    postalCode: clientdata.address2.postalCode, 
                  }
                }
               
              }
              if(clientdata.address1!=undefined){
                if(clientdata.address1.countryCode){
                  client.address1={
                    line1: clientdata.address1.line1, 
                    line2: clientdata.address1.line2, 
                    line3: clientdata.address1.line3,
                    city: clientdata.address1.city, 
                    postalCode: clientdata.address1.postalCode, 
                    countryCode: clientdata.address1.countryCode[0].code
                  }
                }else{
                  client.address1={
                    line1: clientdata.address1.line1, 
                    line2: clientdata.address1.line2, 
                    line3: clientdata.address1.line3,
                    city: clientdata.address1.city, 
                    postalCode: clientdata.address1.postalCode, 
                   
                  }
                }

              }

               apiFactory.createClient(client)
                .then(resp =>{
                  Notification.success("Issue has been saved successfully");
                  vm.clientData={};
                  $('#addClient').modal('hide')
                  vm.sortclients("created", "toggleClient");
                })
                 .catch(e=>{
                  console.log(e);
                  Notification.error("Something went wrong");
                 });

             
          };
        
      }
     

})();