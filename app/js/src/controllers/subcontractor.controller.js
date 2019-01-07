(() => {
    angular.module("app").controller("subcontractorCtrl", subcontractorCtrl);

    function subcontractorCtrl(
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

        vm.selectedMaterials=[];
        vm.members2=[];
        const { logout,debounce, userStore } = globals;
        if (!authFactory.checkUser()) {
          logout();
        }

          /**Get all suppliersdata */
          vm.getSubcontractors = (type) => {
            /* For toggling ascending and descending order */
           
              apiFactory
              .getAllSubcontractors({
                page: 1,
                chunk: 10,
                sort: type,
               // search: vm.searchText,
               // sortType: vm.toggleObj[resource][type]
              })
              .then(resp => {
                // vm[resource]= resp.data.list;
                // vm[resource + "Count"] = resp.data.total;
                vm.allSubcontractor = resp.data.list;
                vm.subcontractorsCount = resp.data.total;
                console.log("suppliers are:",vm.allSubcontractor);
                $timeout(() => {
                 // $scope.searchingText= false;
                  $("#pagination").pagination({
                    items: vm.subcontractorsCount,
                    itemsOnPage: 10,
                    cssStyle: "light-theme",
                    hrefTextPrefix: "#",
                    ordering: false,
                    currentPage: 1,
                   
                    onPageClick: function(page, event) {
                      event.preventDefault();
                      apiFactory
                        .getAllSubcontractors({
                          page: page,
                          chunk: 10,
                           sort: type,
                          // sortType: vm.toggleObj[type]
                        })
                        .then(resp => {
                          vm.allSubcontractor = resp.data.list;
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
         vm.getSubcontractors("created");

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

         //next and previous button functions
         vm.addSubcontractorNext = () => {
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
       

        vm.addSubcontractorPrevious=()=>{
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

        /**Insert functions */
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

        vm.addMember = function(name,mail,code,phno){
          vm.members2.push({name:name,email:mail,contact:{dialCode:code,phoneNumber:phno}});
        }

     
        vm.addnewtagmodel=function(){
          $('#sub-contractor_modal').modal('hide');
          $('#tagadd_modal').modal('show');
        }
        


        $scope.createSubcontractor = function(subcontractor,attribute){
          subcontractor.attributes=[];
          subcontractor.staff=[];
          if(attribute.length>0){
            attribute.forEach(element=>{
              subcontractor.attributes.push(element._id);
            });
          }
          if(vm.members2.length>0){
            vm.members2.forEach(element=>{
              subcontractor.staff.push(element);
            });
          }
          console.log("subcontractor",subcontractor);
          apiFactory
          .createNewSubcontractor(subcontractor)
          .then(resp => {
            Notification.success("Sub-contractor saved successfully");
            vm.resetFields();
            vm.openPopup();
           
            subcontractor.attributes=[];
            $('#sub-contractor_modal').modal('hide');
            vm.getSubcontractors("created");
          })
          .catch(e => {
            console.log(e);
            Notification.error("Something went wrong");
          });
          
        },
        vm.resetFields=()=>{
          vm.subcontractor={};
          if(vm.members2.length>0){
          while(vm.members2.length > 0) {
            vm.members2.pop();
          }
        }
          
          $('#tagselect').val('');
          $('#tagselect').trigger('change');
          $scope.FILEIMG=undefined;
          $('#tagselect').val('[]');
          $('#membername').val('');
          $('#memberemail').val('');
          $('#memberdialCode').val('');
          $('#memberphoneNumber').val('');
        }

        vm.createSystemTag=function(systemTag){
          console.log(systemTag);
         if(systemTag==undefined){
            Notification.error("please enter Tag name"); 
         }
         else{
             apiFactory.saveSystemTag(systemTag)
              .then(resp=>{
                 $('#tagadd_modal').modal('hide');
                 $('#sub-contractor_modal').modal('show');
                 vm.systemTag={};
                 Notification.success("new system tag added.");
                 vm.getTags();
                 
              }).catch(e=>{
                 Notification.error("something went wrong");
              });
         }
       };

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