(() => {
    angular.module("app").controller("supplierCtrl", supplierCtrl);

    function supplierCtrl(
      $scope,
      $rootScope,
      $timeout,
      authFactory,
      $state,
      apiFactory,
      Notification,
      globals,
      fileManagerFactory,
      Upload,
      localStorageService,
      ) {
        let vm = this;
        vm.selectedMaterials=[];
        vm.members2=[];
        const { logout,debounce, userStore } = globals;
        $scope.activeJustified = 0;
     
        if (!authFactory.checkUser()) {
          logout();
        }
        /**Get all suppliersdata */
        vm.getSuppliers = (type) => {
          /* For toggling ascending and descending order */
         
            apiFactory
            .getAllSuppliers({
              page: 1,
              chunk: 10,
              sort: type,
             // search: vm.searchText,
             // sortType: vm.toggleObj[resource][type]
            })
            .then(resp => {
              // vm[resource]= resp.data.list;
              // vm[resource + "Count"] = resp.data.total;
              vm.allSuppliers = resp.data.list;
              vm.suppiersCount = resp.data.total;
              console.log("suppliers are:",vm.allSuppliers);
              $timeout(() => {
               // $scope.searchingText= false;
                $("#pagination").pagination({
                  items: vm.suppiersCount,
                  itemsOnPage: 10,
                  cssStyle: "light-theme",
                  hrefTextPrefix: "#",
                  ordering: false,
                  currentPage: 1,
                 
                  onPageClick: function(page, event) {
                    event.preventDefault();
                    apiFactory
                      .getAllSuppliers({
                        page: page,
                        chunk: 10,
                        // sort: type,
                        // sortType: vm.toggleObj[type]
                      })
                      .then(resp => {
                        vm.allSuppliers = resp.data.list;
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
        /* Initially sort issue in descending order */
       vm.getSuppliers("created");

        /**Insert Supplier functions */
        $scope.onChange = function (files) {
          
          if(files[0] == undefined) return;
          $scope.FILEIMG = URL.createObjectURL(files[0]);
          $scope.fileExt = files[0].name.split(".").pop();
          
          
        }

        globals.getCountryCode().then(resp => {
          vm.getCountryCode = resp.data;
         
          vm.loadCountryCode = $query => {
            return new Promise((resolve, reject) => {
              resolve(resp.data);
            });
          };
        });

        apiFactory.listAllMaterials().then(resp => {
          vm.allMaterials = resp.data.list;
          
        });

        vm.addMaterial = function(item){
          vm.selectedMaterials.push(item);
        
        }

        vm.addMember = function(name,mail,code,phno){
          vm.members2.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
        }

       

        vm.addSupplierNext = () => {
          if($('#home').hasClass('active')){
            console.log("home");
           $('#navigation ul li a.active').removeClass("active");
           $('#profile-tab').addClass("active");
         
           $('#home').removeClass("show");
           $('#home').removeClass("active");
          
           $('#profile').addClass("show");
           $('#profile').addClass("active");
          }
          else if($('#profile-tab').hasClass('active')){
            console.log("profile");
            $('#navigation ul li a.active').removeClass("active");
            $('#contact-tab').addClass("active");
            $('#profile').removeClass("show");
            $('#profile').removeClass("active");
            $('#contact').addClass("show");
            $('#contact').addClass("active");
          }
         
        };

        vm.addSupplierPrevious=()=>{
          if($('#profile-tab').hasClass('active')){
            console.log("home");
           $('#navigation ul li a.active').removeClass("active");
           $('#home-tab').addClass("active");
           $('#profile').removeClass("show");
           $('#profile').removeClass("active");
           $('#home').addClass("show");
           $('#home').addClass("active");
          }else 
          if($('#contact-tab').hasClass('active')){
            console.log("profile");
            $('#navigation ul li a.active').removeClass("active");
            $('#profile-tab').addClass("active");
          
            $('#contact').removeClass("show");
            $('#contact').removeClass("active");
            $('#profile').addClass("show");
            $('#profile').addClass("active");
          
          }
         
        };

        vm.openPopup=()=>{
          if($('#profile-tab').hasClass('active')){
            console.log("home");
           $('#navigation ul li a.active').removeClass("active");
           $('#home-tab').addClass("active");
           $('#profile').removeClass("show");
           $('#profile-tab').removeClass("active");
           $('#profile').removeClass("active");
           $('#home').addClass("show");
           $('#home').addClass("active");
          }else 
          if($('#contact-tab').hasClass('active')){
            console.log("profile");
            $('#navigation ul li a.active').removeClass("active");
            $('#home-tab').addClass("active");
            $('#contact-tab').removeClass("show");
            $('#contact').removeClass("show");
            $('#contact').removeClass("active");
            $('#home').addClass("show");
            $('#home').addClass("active");
          
          }
         
        };

         //delete material from list
         $scope.deleteMaterial = function(index,array){
          array.splice(index, 1);
         }
  
         $scope.deleteStaff = function(index,array){
          array.splice(index, 1);
         }

        $scope.createSupplier = function(supplier,materials){
          supplier.supplies=[];
          supplier.staff=[];
         
          if(materials.length>0){
          materials.forEach(element=>{
              supplier.supplies.push(element._id);
            });
          }
          if(vm.members2.length>0){
            vm.members2.forEach(element=>{
              supplier.staff.push(element);
            });
          }
          
           console.log("supplier",supplier);
          apiFactory
          .createNewSupplier(supplier)
          .then(resp => {
            Notification.success("Supplier has been saved successfully");
            vm.resetFields();
            vm.openPopup();
            supplier.supplies=[];
            supplier.staff=[];
           
            $('#supplier_modal').modal('hide');
            vm.getSuppliers("created");
          })
          .catch(e => {
            console.log(e);
            Notification.error("Something went wrong");
          });
          
        };
        vm.resetFields=()=>{
          vm.supplier={};
          if(vm.members2.length>0){
          while(vm.members2.length > 0) {
            vm.members2.pop();
          }
        }
        vm.selectedMaterials=[];
        $('#materialselect').val('');
        $('#materialselect').trigger('change');
          $scope.FILEIMG=undefined;
          $('#tagselect').val('[]');
          $('#membername').val('');
          $('#memberemail').val('');
          $('#memberdialCode').val('');
          $('#memberphoneNumber').val('');
        }
        

        $scope.contracts=[
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'},
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'},
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'},
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'},
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'},
          {title:'Subcontractor A',time:'Sep 25, 2018 at 4:00 PM',img:'assets/images/suppliers/tree_logo.png'}
        ]
    }

    })();