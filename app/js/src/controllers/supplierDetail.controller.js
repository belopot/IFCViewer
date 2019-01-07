(() => {
  angular.module("app").controller("supplierDetailsCtrl", supplierDetailsCtrl);
  
  function supplierDetailsCtrl(
      $scope,
      $timeout,
      authFactory,
      $state,
      $stateParams,
      apiFactory,
      Notification,
      NgMap,
      globals,
      localStorageService,
      $location
    ) {
      let vm = this;

      const { logout,userStore } = globals;
      if (!authFactory.checkUser()) {
        logout();
      }
      vm.userData = userStore.get();

      $scope.activeClass = function (path) {
        return ($location.path() === path) ? 'active' : '';
      }

          vm.logout = () => {
            logout();
          };
          vm.supplierId = $stateParams.id;
          $scope.getSupplierDetail = () => {
            apiFactory
              .getSupplierById(vm.supplierId)
              .then(resp => {
                vm.supplierData = resp.data;
                $scope.FILEIMG=vm.supplierData.profilePic;
                console.log(vm.supplierData);
              })
            }

            $scope.getSupplierDetail();



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

        globals.getCountryCode().then(resp => {
          vm.getCountryCode = resp.data;
         
          vm.loadCountryCode = $query => {
            return new Promise((resolve, reject) => {
              resolve(resp.data);
            });
          };
        });

        vm.addMember = function(name,mail,code,phno){
          if(vm.supplierData.staff){
            if(vm.supplierData.staff.length>0){
              vm.supplierData.staff.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
  
            }
            else{
              vm.supplierData.staff=[];
              vm.supplierData.staff.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
  
            }
          }
          else{
            vm.supplierData.staff=[];
            vm.supplierData.staff.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
          }
         
        };
        $scope.deleteStaff = function(index,array){
          array.splice(index, 1);
         };

         apiFactory.listAllMaterials().then(resp => {
          vm.allMaterials = resp.data.list;
          
        });

        $scope.onChange = function (files,id) {
        
          
          if(files[0] == undefined) return;
          $scope.FILEIMG = URL.createObjectURL(files[0]);
          $scope.fileExt = files[0].name.split(".").pop();
          
          
        };

        $scope.updateSupplier = function(supplier,materials){
          console.log(supplier);
          if(typeof materials !== "undefined"){
             
            if(materials.length>0){
              if(supplier.supplies.length>0){
                materials.forEach(element=>{

                  supplier.supplies.push(element._id);
                });
              }
              else{
                vm.supplierData.supplies=[];
                materials.forEach(element=>{
                  supplier.supplies.push(element._id);
                });
              }
            }
          }

          apiFactory.updateSupplier(supplier)
          .then(resp=>{
            Notification.success("update successfull.");
            $('#updatesupplier_modal').modal('hide');
            $scope.getSupplierDetail();
          }).catch(e=>{
            Notification.error("Couldn't update supplier.");
          });

        }


      }

    })();