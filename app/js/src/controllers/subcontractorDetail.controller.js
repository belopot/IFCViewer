(() => {
    angular.module("app").controller("subcontractorDetailCtrl", subcontractorDetailCtrl);

    function subcontractorDetailCtrl(
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
      ) {
        let vm = this;
       

        const { logout,userStore } = globals;
        if (!authFactory.checkUser()) {
            logout();
          }
          vm.userData = userStore.get();

  
          vm.logout = () => {
            logout();
          };
          vm.subcontractorId = $stateParams.id;
          $scope.getSubcontractorDetail = () => {
            apiFactory
              .getSubcontractorById(vm.subcontractorId)
              .then(resp => {
                vm.subcontractorData = resp.data;
                $scope.FILEIMG=vm.subcontractorData.profilePic;
                // vm.editSubcontractor = angular.copy(vm.subcontractorData);
                $('#editdial').select2('data', {id: vm.editSubcontractor.contact.dialCode});
                console.log(vm.subcontractorData);
              })
            }

            $scope.getSubcontractorDetail();

            vm.editSubcontractorNext = () => {
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
           
    
            vm.editSubcontractorPrevious=()=>{
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

            //get all list of system tags
         vm.getTags =function(){
          apiFactory
               .getAllSystemTags().then(resp=>{
                  vm.AllTags = resp.data.list;
                  console.log(vm.AllTags);
               }).catch(e=>{

               });
         
        };
        vm.getTags();

            

            globals.getCountryCode().then(resp => {
              vm.getCountryCode = resp.data;
             
              vm.loadCountryCode = $query => {
                return new Promise((resolve, reject) => {
                  resolve(resp.data);
                });
              };
            });

            vm.addMember = function(name,mail,code,phno){
              vm.subcontractorData.staff.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
            };
            $scope.deleteStaff = function(index,array){
              array.splice(index, 1);
             };

             $scope.onChange = function (files) {
          
              if(files[0] == undefined) return;
              $scope.FILEIMG = URL.createObjectURL(files[0]);
              $scope.fileExt = files[0].name.split(".").pop();
              
              
            };

            $scope.updateSubcontractor = function(subcontractor,attributes){
              console.log(subcontractor);
              console.log(attributes);
            if(typeof attributes !== "undefined"){
             
              if(attributes.length>0){
                if(subcontractor.attributes.length>0){
                  attributes.forEach(element=>{

                    subcontractor.attributes.push(element._id);
                  });
                }
                else{
                  subcontractor.attributes=[];
                  attributes.forEach(element=>{
                    subcontractor.attributes.push(element._id);
                  });
                }
              }
            }
            console.log("after change: ",subcontractor);

              apiFactory.updateSubcontractor(subcontractor)
                      .then(resp=>{
                        Notification.success("update successfull.");
                        $('#update_modal').modal('hide');
                        $scope.getSubcontractorDetail();
                      }).catch(e=>{
                        Notification.error("Couldn't update subcontractor.");
                      });
             }
    
      }

    })();