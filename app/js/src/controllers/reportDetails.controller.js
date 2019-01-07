(() => {
    angular.module("app").controller("reportDetailCtrl", reportDetailCtrl);

    function reportDetailCtrl(
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
        $scope.image1="../assets/images/reportimgs/rep.jpg";
        $scope.image2="../assets/images/reportimgs/file.jpg";
        const { logout } = globals;
        $scope.reportObj={};
        $scope.shwCommentSection=false;
        $scope.ReportIssue={};
        $scope.issueToAdd=[];
        $scope.models = {
          selected: null,
         
        };
        if (!authFactory.checkUser()) {
          logout();
        }


        vm.logout = () => {
          logout();
        };

        $scope.exportToPdf = function(){
          var img = new Image();
          img.src="../assets/images/reportimgs/rep.jpg";
          var img1 = new Image();
          img1.src="../assets/images/reportimgs/file.jpg";
        var doc = new jsPDF('p');
        var options = { 'background': '#fff' };
        doc.addImage(img, 'png', 15, 20, 90, 90);
        doc.addImage(img1,'png',110,20,90,90);
      
      doc.autoTable({
        html: '#statictable',
        
        margin: {top: 120},
        pageBreak: 'auto', // 'auto', 'avoid' or 'always'
        tableWidth: 'auto', // 'auto', 'wrap' or a number,
        showHeader: 'everyPage', // 'everyPage', 'firstPage', 'never', 
       
    });

        doc.setFontSize(25);
        doc.text(20, 150, 'Comments');
        doc.setFontSize(10);
        doc.setFont("helvetica");
       
        doc.text(20, 160, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor');
        doc.text(20,170,'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco');
        // doc.addHTML($('#pdfid1')[0],15,15, options, function() {
        doc.text(20,180,' laboris nisi ut aliquip ex ea commodo consequat.');
        //   doc.autoTable({
        //     head: [['Name', 'Email', 'Country']],
        //     body: [
        //         ['David', 'david@example.com', 'Sweden'],
        //         ['Castille', 'castille@example.com', 'Norway'],
        //         // ...
        //     ]
        // });
          doc.save("column8.pdf");
        // });
       
          // var options = {
          //   pagesplit: true //include this in your code
          // };
          // var doc = new jsPDF('p', 'pt', 'a4')
          // doc.addHTML($('#pdfid'),options, {
            
          //   'background': '#fff',
          // }, function() {
          //   doc.save('sample-file.pdf');
          // });
      
        }

        /* Project picker load functionality */

            let enabled = true,
            chunkSize = 5;
            vm.issueSearch = "";
            vm.enableLazyLoad = false;
            vm.sortParams = {
            field: "created",
            type: false
          };

        // $scope.openReportPick = function(){
        //   vm.enableLazyLoad = true;
        //   apiFactory
        //     .listAllIssues({
        //       search: vm.issueSearch,
        //       chunk: chunkSize,
        //       page: 1,
        //       sort: vm.sortParams.field,
        //       sortType: vm.sortParams.type
        //     })
        //     .then(resp => {
        //       vm.issuePickerData = resp.data.list;
    
        //       $timeout(() => {
        //         // Open in the next event loop
        //         $("#chooseIssueModal").modal("show");
        //       });
        //     })
        //     .catch(e => {
        //       console.log(e);
        //     });
        // }
      
        $scope.openReportPicker = function(){
        
          vm.enableLazyLoad = true;
          apiFactory
            .listAllIssues({
              search: vm.issueSearch,
              chunk: chunkSize,
              page: 1,
              sort: vm.sortParams.field,
              sortType: vm.sortParams.type
            })
            .then(resp => {
             
              vm.issuePickerData=[];
              if($scope.issueToAdd.length>0){
              
                $scope.issueToAdd.forEach(element=>{
                resp.data.list.forEach((resdata,index)=>{
                    if(element._id==resdata._id){
                      
                      resp.data.list.splice(index, 1);
                    }else{
                      console.log("false");
                     
                    }
                  })
                })
              }else{
             
              }
                $timeout(() => {
                // Open in the next event loop
                vm.issuePickerData = resp.data.list;
                $("#listissuesmodal").modal("hide");
                $("#chooseIssueModal").modal("show");
                $scope.EditMode=false;
              });
            })
            .catch(e => {
              console.log(e);
            });
        }
        $("#chooseIssueModal").on("hide.bs.modal", function() {
          vm.enableLazyLoad = false;
        });

        vm.closeIssuePicker = () => {
          $("#chooseIssueModal").modal("hide");
          vm.issueSearch = "";
        };

        $scope.addMore = () => {
          console.log("calling add more");
          if (enabled) {
            enabled = false;
            $timeout(() => {
              enabled = true;
            }, 500);
            chunkSize += 5;
            apiFactory
              .listAllIssues({
                search: vm.issueSearch,
                chunk: chunkSize,
                page: 1,
                sort: vm.sortParams.field,
                sortType: vm.sortParams.type
              })
              .then(resp => {
              // vm.issuePickerData = resp.data.list;
          
              vm.issuePickerData=[];
              if($scope.issueToAdd.length>0){
               
                $scope.issueToAdd.forEach(element=>{
             
                  resp.data.list.forEach((resdata,index)=>{
                    if(element._id==resdata._id){
                      resp.data.list.splice(index,1)
                    }else{
                     
                    }
                  })
                })
              }else{
               
              }
              $timeout(() => {
                // Open in the next event loop
                vm.issuePickerData = resp.data.list;
               
              });
              })
              .catch(e => {
                console.log(e);
              });
          }
        };

         /* Function to search projects */
    vm.searchIssues = text => {
      console.log("serchtext", text);
      apiFactory
        .listAllIssues({
          search: vm.issueSearch,
          chunk: chunkSize,
          page: 1,
          sort: vm.sortParams.field,
          sortType: vm.sortParams.type
        })
        .then(resp => {
          vm.issuePickerData = resp.data.list;
        })
        .catch(e => {
          console.log(e);
        });
       };


       //Add remark button in report-remarks page form
       $scope.remarkData=[];
       $scope.addRemark = function(title,value){
        if(title!=undefined||value!=undefined){
          $scope.remarkData.push({Title:title, Value:value});
          $('#remarktitle').val("");
          $('#remarkvalue').val("");
         
        }
      
       },

       vm.chooseIssues = function(issue,index,array){
        //$scope.currentReport={};
         if(issue){
          // console.log("iSSUE",issue);
          // console.log("index",index);
          // console.log("ARRAY",array);
          array.splice(index, 1);
          $scope.issueToAdd.push(issue);
          $("#chooseIssueModal").modal("hide");
          $("#listissuesmodal").modal("show");
        }
        else{
          Notification.error("No selection");
        }
       }

        
       vm.addToListIssuePicker = function(){
        $("#chooseIssueModal").modal("hide");
        $("#listissuesmodal").modal("show");
       }

       $scope.sendIssueToPdf = function(){
        $("#listissuesmodal").modal("hide");
        $scope.shwCommentSection=true;
       }
      // vm.chooseIssues = function(issue){
      //   $scope.currentReport={};
      //   if(issue){
      //     var parentElement = angular.element( document.querySelector( '.panel' ) );
      //     var tobeClonedElement = angular.element( document.querySelector( '.child' ) );
      //     parentElement.append(tobeClonedElement.clone());
      //     $scope.issueToAdd.push(issue);
      //    // $("#chooseIssueModal").modal("hide");
      //    if($scope.issueToAdd.length>=0){
      //     $scope.issueToAdd.forEach(oneissue => {
      //       if(_.isEqual(oneissue, issue)){
      //         console.log("equal");
      //         $scope.currentReport=issue;
      //       }else{
      //         console.log("not equal");
      //       }
      //     });
      //    }
         
      //   }
      //   else{
      //     Notification.error("No selection");
      //   }
        
      //  }
    //Load Modals
      $scope.coverPageModal = function(){
        $("#coverpagemodal").modal("show");
      }
      $scope.aboutUsModal = function(){
        $("#aboutusmodal").modal("show");
      }
      $scope.projectMetaModal = function(){
        $("#projectmetamodal").modal("show");
      }
      $scope.reportremarkModal = function(){
        $("#reportremarkmodal").modal("show");
      }
      //new issue listing model
      $scope.listIssueModelClick = function(){
        $("#listissuesmodal").modal("show");
      }

      //set object for modals
      $scope.setReportObj = function(object){
        console.log(object);
        $scope.ReportIssue.title = object.title;
        $scope.ReportIssue.description = object.description;
        $scope.ReportIssue.companyName = object.companyName;
        $scope.ReportIssue.email = object.email;
        $scope.ReportIssue.website = object.website;
        $scope.ReportIssue.phone = object.phone;
        $scope.ReportIssue.projectName = object.projectName;
        $scope.ReportIssue.serialNo = object.serialNo;
        $scope.ReportIssue.enterprise = object.enterprise;
        if($scope.issueToAdd.length>0){
          $scope.ReportIssue.issueToAdd = $scope.issueToAdd;
        }
        if($scope.remarkData.length>0){
          $scope.ReportIssue.remarkData=$scope.remarkData;
        }
        $scope.ReportIssue.authorName=object.authorName;
        $scope.ReportIssue.remarkDate=object.remarkDate;

        $("#coverpagemodal").modal("hide");
        $("#aboutusmodal").modal("hide");
        $("#projectmetamodal").modal("hide");
        $("#reportremarkmodal").modal("hide");
        $("#chooseIssueModal").modal("hide"); 
      }

      $scope.EditMode=false;
      $scope.EditIssueData=function(){
        $scope.EditMode=true;
      }

      $scope.removeFromIssueList=function(index,array){
        array.splice(index, 1);
        console.log($scope.issueToAdd); 
      }
     
     
     
    }
})();