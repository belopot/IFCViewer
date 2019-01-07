(() => {
    angular.module("app").factory("issuecreateFactory", issuecreateFactory);
  
    function issuecreateFactory(
      $http,
      $state,
      $location,
      localStorageService,
      globals,
      Upload,
      Notification,
      $q,
      apiFactory,
      uploadFactory,
      fileManagerFactory
    ) {
        let vm=this;
        let s3FileObjets=[];
        //const url = "https://api.staging.cloudes.eu",
       
        headers = (method, token) => {
          return {
            "Content-Type": method === "GET" ? undefined : "application/json",
            "x-access-token": token
              ? localStorageService.get("access-token")
              : undefined,
            platform: JSON.stringify({
              source: "web"
            })
          };
        },
        { progress, userStore, logout } = globals;

       return{
            getAllAtOnce : function(object,filesarray){
                console.log("OBJECT: ",object);
                console.log("ARRAY OF FILES: ", filesarray);
                console.log("ARRAY OF FILES s3: ", filesarray.s3);
                console.log("ARRAY OF FILES cloudinary: ", filesarray.cloudinary);

                  // make our own promise
                 var deferred = $q.defer();

              if(filesarray.s3.length){
                let array=filesarray.s3;
               var S3=  array.forEach( (x,i,array) => {
                   console.log(x,i);
                    //console.log("S3 FILE FOREACH MEthod as array is not null");
                    /* Attach events and props to fileObj so that we can use them in the view */
                    let uploadHandler = evaporate => {
                      /* upload to s3 if value is less than 3 */
                      x.file.pause = uploadFactory.pause.bind(evaporate, x);
                      x.file.resume = uploadFactory.resume.bind(evaporate, x);
                      x.file.abort = uploadFactory.abort.bind(evaporate, x);
                      let addConfig = {
                        name: x.file.name,
                        file: x.file,
                        progress: (p, stats) => {
                       //   console.log(p);
                          /* AWS progress percentage falls back sometimes due to missing fragmentation. 
                          Update progress value only when it's higher than the previous value */
                          x.file.progress =
                            x.file.progress > Math.round(p * 100)
                              ? x.file.progress
                              : Math.round(p * 100);
                          /* Check completion */
                          vm.completedAll = fileManagerFactory.checkUploadCompletion(
                            filesarray
                          );
                          /* Refresh view with scope > apply */
                          // $timeout(() => {
                          //   $scope.$apply();
                          // });
                        },
                        complete: (_xhr, awsKey) => {
                          x.file.completed = true;
                          /* Refresh view with scope > apply */
                          // $timeout(() => {
                          //   $scope.$apply();
                          // });
                          console.log("Complete!");
                        }
                      };
            
                      evaporate.add(addConfig).then(
                        function(awsObjectKey) {
                          /* Success block */
                          console.log(x);
                          let payload = {
                            type: fileManagerFactory.resolveDestType(x.file),
                            
                            assetData: {
                              assetName: x.file.name,
                              assetdescription:x.comment,
                              bucket: "3dfilesdata",
                              key: `test/${x.file.name}`,
                              mimetype: x.file.type,
                              bytes: x.file.size
                            }
                          };
                        //   apiFactory
                        //     .newIssues3FileUpload(payload)
                        $http({
                            url: url + "/api/newIssues3FileUpload",
                            method: "POST",
                            data: payload,
                            headers: headers("POST", true)
                          }).then(resp => {
                              console.log("s3 resp: ",resp);
                              s3FileObjets.push(resp);
                             if(i==filesarray.s3.length-1){
                               alert("alerts called");
                               console.log(i);
                               console.log("array:", x);
                             }
                             })
                            .catch(e => {
                              console.log(e);
                            });
                       //   Notification.success("File successfully uploaded");
                          //console.log("File successfully uploaded to:", awsObjectKey);
                        },
                        function(reason) {
                          /* Failure block */
                          x.aborted = true;
                          /* Check completion */
                          vm.completedAll = fileManagerFactory.checkUploadCompletion(
                            filesarray
                          );
                          /* Refresh view with scope > apply */
                          // $timeout(() => {
                          //   $scope.$apply();
                          // });
                          //console.log("File did not upload sucessfully:", reason);
                        }
                      );
                    };
            
                    uploadFactory.start(uploadHandler);
                  })
                
              }

              
              //cloudinary upload function  
                  
           
                 if (filesarray.cloudinary.length) {
                     var cloudinaryPayload = {
                       files: filesarray.cloudinary,
                     };
                    //   apiFactory
                    //   .issueImage($scope.cloudinaryPayload)
                var cloud =  Upload.upload({
                        url: url + "/api/issueImage",
                        method: "POST",
                        data: cloudinaryPayload,
                        headers: headers("POST", true)
                      })
                      .then(resp => {
                        console.log("response of cloudinary: ", resp);
                  
                        /* Check completion */
                        vm.completedAll = fileManagerFactory.checkUploadCompletion(
                          filesarray
                        );
                        
                      })
                      .catch(e => {
                        console.log(e);
                      });

                }

                // $q.all([S3, cloud]).then(function(data) {
                //     deferred.resolve({
                //         s3data: data[0],
                //         clouddata: data[1]
                //     })
                // });
        
                // return deferred.promise;



            },


            sendData:function(object,files){
              console.log(object)
              console.log(files);
            }



            // sendAll:function(object, filesarray){
            //   if(filesarray)
            // }
        }

        
    }
    


})();