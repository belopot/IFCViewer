(() => {
  angular.module("app").controller("_3dviewerCtrl", _3dviewerCtrl);

  function _3dviewerCtrl(
      $scope,
      $timeout,
      authFactory,
      $state,
      apiFactory,
      Notification,
      NgMap,
      globals,
      localStorageService,
      fileManagerFactory,
      uploadFactory
    ) {
      const {
        logout,
        userStore,
        projectStore,
        genericStore,
        breakcrumbStore
      } = globals;

      let vm = this;
      vm.fileName = "No File Choose";
      vm.rootFolders = [];
      const rootFolderStore = genericStore();
      vm.nodeObj = rootFolderStore.get();
      console.log(vm.nodeObj);

      if (!authFactory.checkUser()) {
        logout();
      }

      vm.logout = () => {
        logout();
      };

      vm.fileUpdated = (files, event) => {
        /* Refresh upload states with new files */
        let fileObj = event.target.files;

        console.log(fileObj);
        vm.fileName = fileObj[0].name;
      };

      vm.preUpload = (files, folder) => {
        fileManagerFactory
          .checkDuplicateFiles(files, folder._id)
          .then(processed => {
            if (processed.duplicates.length) {
              vm.preUploadFiles = processed;
              console.log(vm.preUploadFiles);
              alert('File Name is Exist!');
            } else {
              console.log(processed);
              vm.uploadFile(processed, projectStore.get()._id, folder);
            }
          })
          .catch(e => {
            console.log(e);
          });
      };

      vm.uploadFile = (files, projectId, folder) => {
        /* Validate duplicate files */
        if (fileManagerFactory.checkNameChange(files.duplicates)) {
          Notification.warning("File names can't be the same");
          return;
        }
        /* Collate files */
        files = [...files.duplicates, ...files.uploadFiles];
        vm.uploadState = true;
        // $("#addModal").modal("hide");
        vm.uploadViewFiles = fileManagerFactory.splitDestination(files);
        /* Categorize files */
        angular.forEach(vm.uploadViewFiles.s3, x => {
          /* Attach events and props to fileObj so that we can use them in the view */
          let uploadHandler = evaporate => {
            /* upload to s3 if value is less than 3 */
            x.pause = uploadFactory.pause.bind(evaporate, x);
            x.resume = uploadFactory.resume.bind(evaporate, x);
            x.abort = uploadFactory.abort.bind(evaporate, x);
            let addConfig = {
              name: x.name,
              file: x,
              progress: (p, stats) => {
                /* AWS progress percentage falls back sometimes due to missing fragmentation. 
                Update progress value only when it's higher than the previous value */
                x.progress =
                  x.progress > Math.round(p * 100)
                    ? x.progress
                    : Math.round(p * 100);
                /* Check completion */
                vm.completedAll = fileManagerFactory.checkUploadCompletion(
                  vm.uploadViewFiles
                );
                /* Refresh view with scope > apply */
                $timeout(() => {
                  $scope.$apply();
                });
              },
              complete: (_xhr, awsKey) => {
                x.completed = true;
                /* Refresh view with scope > apply */
                $timeout(() => {
                  $scope.$apply();
                });
                console.log("Complete!");
              }
            };
  
            evaporate.add(addConfig).then(
              function(awsObjectKey) {
                /* Success block */
                let payload = {
                  type: fileManagerFactory.resolveDestType(x),
                  projectId: projectStore.get()._id,
                  folderId: folder._id,
                  assetData: {
                    assetName: x.assetName,
                    bucket: "3dfilesdata",
                    key: `test/${x.name}`,
                    mimetype: x.type,
                    bytes: x.size,
                    planDocument: x.plan
                  }
                };
                apiFactory
                  .newFileUpload(payload)
                  .then(resp => {
                    if (folder) {
                      folder.files.push(resp.data.data);
                    }
                  })
                  .catch(e => {
                    console.log(e);
                  });
                Notification.success("File successfully uploaded");
                console.log("File successfully uploaded to:", awsObjectKey);
              },
              function(reason) {
                /* Failure block */
                x.aborted = true;
                /* Check completion */
                vm.completedAll = fileManagerFactory.checkUploadCompletion(
                  vm.uploadViewFiles
                );
                /* Refresh view with scope > apply */
                $timeout(() => {
                  $scope.$apply();
                });
                console.log("File did not upload sucessfully:", reason);
              }
            );
          };
  
          uploadFactory.start(uploadHandler);
        });
  
        if (vm.uploadViewFiles.cloudinary.length) {
          let cloudinaryPayload = {
            files: vm.uploadViewFiles.cloudinary,
            /* Send asset names separately */
            assetNames: vm.uploadViewFiles.cloudinary.map(x => x.assetName),
            projectId,
            hierarchyId: folder._id
          };
  
          apiFactory
            .uploadFileInFileManager(cloudinaryPayload)
            .then(resp => {
              vm.uploadViewFiles.cloudinary = vm.uploadViewFiles.cloudinary.map(
                x => {
                  x.completed = true;
                  return x;
                }
              );
              /* Check completion */
              vm.completedAll = fileManagerFactory.checkUploadCompletion(
                vm.uploadViewFiles
              );
              /* Refresh view with scope > apply */
              $timeout(() => {
                $scope.$apply();
              });
  
              if (folder) {
                resp.data.data.forEach(x => {
                  folder.files.push(x);
                });
              }
  
              Notification.success(resp.data.message);
            })
            .catch(e => {
              console.log(e);
            });
        }
      };
    }
    

})();