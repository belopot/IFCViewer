(() => {
  angular.module("app").controller("fileManagerCtrl", fileManagerCtrl);

  function fileManagerCtrl(
    $scope,
    $http,
    $window,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    fileManagerFactory,
    uploadFactory
  ) {
    /* Requiring vars */
    $scope.navtab = [
      {
        title: "Sub Folder A",
        target: "tabpane1"
      },
      {
        title: "Sub Folder B",
        target: "tabpane2"
      },
      {
        title: "Sub Folder C",
        target: "tabpane3"
      },
      {
        title: "Sub Folder D",
        target: "tabpane4"
      },
      {
        title: "Sub Folder E",
        target: "tabpane5"
      }
    ];

    let vm = this;
    const {
      logout,
      userStore,
      projectStore,
      genericStore,
      breakcrumbStore
    } = globals;
    const { clipBoard } = fileManagerFactory;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    /* Get project list */
    vm.userData = userStore.get();
    vm.logout = () => {
      logout();
    };

    apiFactory
      .listAllProjects()
      .then(resp => {
        vm.projectList = resp.data;
        /* Initially load the first project as default */
        const selectedProject = projectStore.get();

        vm.selectedProject = selectedProject._id;

        vm.getPrimaryFolders(selectedProject);
        /* Set backup folders */
      })
      .catch(e => {
        console.log(e);
      });

    vm.rootFolders = [];

    vm.backupFolders = projectStore.get().backupFolders;

    vm.windowItems = {
      folderData: "",
      folders: [],
      files: []
    };

    vm.resolveAssetIcon = assetObj => {
      let assetFormat = assetObj.format.trim(),
        icon;

      if (/jp*g/.test(assetFormat)) {
        icon = "jpg";
      } else if (/png/.test(assetFormat)) {
        icon = "png";
      } else if (/pdf/.test(assetFormat)) {
        icon = "pdf";
      }
      return icon;
    };
    vm.showTree = false;
    vm.getPrimaryFolders = (selectedProject, list) => {
      if (list) {
        /* Filtering through the list of proj if param is a string */
        projectStore.set(
          list.filter(x => {
            if (x._id === selectedProject) {
              return true;
            }
            return false;
          })[0]
        );
      } else {
        projectStore.set(selectedProject);
      }

      vm.backupFolders = projectStore.get().backupFolders;

      Promise.all([
        apiFactory.getHierarchy(projectStore.get()._id),
        apiFactory.viewProjectAssets(projectStore.get()._id)
      ])
        .then(resp => {
          vm.showTree = true;
          vm.rootFolders = resp[0].data.data.hierarchies;
          vm.projectFiles = resp[1].data.data;
          vm.loadFilesToAutoComplete = $query => {
            return new Promise((resolve, reject) => {
              resolve(vm.projectFiles);
            });
          };
        })
        .catch(e => {
          console.log(e);
        });
    };

    // vm.selectedProject = "5afd4520d08d4b3859fe9bd6";
    // vm.getPrimaryFolders(vm.selectedProject);

    vm.getFolder = id => {
      apiFactory
        .getHierarchyChildren(id)
        .then(resp => {
          console.log(resp.data);
        })
        .catch(e => {
          console.log(e);
        });
    };

    /* Storing the file path in a store due to limitations in the plugin */

    const fileDestination = genericStore();

    vm.treeOptions = {
      accept: function(source, dest, destIndex) {
        if (source.file) {
          fileDestination.store(dest);
          return false;
        }
        return true;
      },
      dragStop: function(event) {
        let { source, dest } = event;
        /* Exclusive for files */
        if (source.nodeScope.file) {
          /* Step 1:  Get the dest value from the external store and append to dest */
          let destination = fileDestination.get();
          if (!destination.$nodeScope) {
            /* Return for invalid drags */
            return;
          }
          let payload = {
            assetId: source.nodeScope.file._id,
            sourceId: source.nodeScope.$parent.$nodeScope.$modelValue._id,
            destId: destination.$nodeScope.$modelValue._id
          };
          /* Step 2: Sync with backend but don't wait for the response  */
          apiFactory
            .moveAssets(payload)
            .then(resp => {
              Notification.success(resp.data.message);
            })
            .catch(e => {
              console.log(e);
            });

          if (destination.$nodeScope.$modelValue.files) {
            destination.$nodeScope.$modelValue.files.push(
              source.nodeScope.file
            );
          } else {
            destination.$nodeScope.$modelValue.files = [source.nodeScope.file];
          }

          /* Step 3: Remove the file from the source folder */
          source.nodeScope.$parent.$nodeScope.$modelValue.files = source.nodeScope.$parent.$nodeScope.$modelValue.files.filter(
            x => x._id !== source.nodeScope.file._id
          );
        }
      },
      dropped: function(event) {
        let { source, dest } = event;
        let payload;

        /* For moving folders */

        if (
          dest.nodesScope.$nodeScope === null &&
          source.nodeScope.$parentNodeScope === null
        ) {
          /* Ignore same level drags */
          return;
        } else if (
          dest.nodesScope.$nodeScope === null &&
          source.nodeScope.$parentNodeScope !== null
        ) {
          /* Dragging to root */
          payload = {
            type: 1,
            hierarchyId: source.nodeScope.$modelValue._id,
            parentId: source.nodeScope.$parentNodeScope.$modelValue._id,
            projectId: projectStore.get()._id
          };
        } else if (
          dest.nodesScope.$nodeScope !== null &&
          source.nodeScope.$parentNodeScope === null
        ) {
          /* Dragging from root */
          payload = {
            type: 2,
            hierarchyId: source.nodeScope.$modelValue._id,
            projectId: projectStore.get()._id,
            destId: dest.nodesScope.$nodeScope.$modelValue._id
          };
        } else {
          /* Dragging between sub folders */
          payload = {
            type: 3,
            hierarchyId: source.nodeScope.$modelValue._id,
            parentId: source.nodeScope.$parentNodeScope.$modelValue._id,
            destId: dest.nodesScope.$nodeScope.$modelValue._id
          };
        }

        apiFactory
          .dragMoveNodes(payload)
          .then(resp => {
            Notification.success(resp.data.message);
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    const rootFolderStore = genericStore();

    vm.setRootFolder = obj => {
      rootFolderStore.store(obj);
    };

    /* add modal settings */
    vm.addModalActiveTab = 0;
    $("#addModal").on("hide.bs.modal", function() {
      vm.fileNames = [];
      vm.addModalActiveTab = 0;
    });

    vm.addPrimaryFolder = (name, projectId) => {
      if (vm.folderName == "" || vm.folderName == null) {
        Notification.warning("Folder name can't be empty");
        return;
      }
      let payload = {
        name: name,
        isParent: true,
        projectId: projectId
      };
      const nodeObj = rootFolderStore.get();
      $("#addModal").modal("hide");
      apiFactory
        .addHierarchy(payload)
        .then(resp => {
          nodeObj.$nodesScope.$modelValue.push(resp.data.data);
          Notification.success(resp.data.message);
          console.log("rootfolder", rootFolderStore.get());
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.openAddModal = (source, obj) => {
      vm.addModalSource = source;
      vm.nodeObj = obj;
      $("#addModal").modal("show");
    };

    vm.showLoader = false;

    vm.toggleFolder = (folder, icon, node) => {
      if (folder.$modelValue.backup) {
        return;
      }
      // console.log(folder.$treeScope.$element[0])
      // console.log($(folder.$element[0]).find('.row .file-listing')[0].addClass('bg-dark'))
      $(folder.$treeScope.$element[0])
        .find(".folder-open")
        .removeClass("folder-open");
      $(folder.$element[0])
        .find(".row")
        .first()
        .addClass("folder-open");

      vm.showLoader = true;
      apiFactory
        .viewHierarchy(folder.$modelValue._id)
        .then(resp => {
          /* Append files to the folder */
          vm.windowItems = {
            folderData: folder,
            folders: folder.$modelValue.children,
            files: resp.data.files
          };

          vm.breadCrumbList = resp.data.breadcrumbs;
          vm.showLoader = false;
          folder.$modelValue.files = resp.data.files;
          navigationStack.push(folder);
        })
        .catch(e => {
          console.log(e);
        });
      if (folder.collapsed) {
        folder.toggle();
      } else if (icon) {
        navigationStack.push(folder);
        // folder.toggle();
      }
    };

    const navigationStack = fileManagerFactory.navigationStack();

    vm.navigate = forward => {
      let folder = forward
        ? navigationStack.forward()
        : navigationStack.backward();

      // if (folder ? (folder.collapsed ? true : false) : false) {
      if (folder) {
        vm.showLoader = true;
        apiFactory
          .viewHierarchy(folder.$modelValue._id)
          .then(resp => {
            /* Append files to the folder */
            vm.windowItems = {
              folderData: folder,
              folders: folder.$modelValue.children,
              files: resp.data.files
            };
            vm.showLoader = false;
            folder.$modelValue.files = resp.data.files;
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.openFolder = id => {
      /* Get the node obj from the window item obj */
      let folderData = vm.windowItems.folderData
        .childNodes()
        .reduce((acc, x) => {
          if (x.$modelValue._id === id) {
            acc = x;
          }
          return acc;
        }, null);

      vm.showLoader = true;
      apiFactory
        .viewHierarchy(id)
        .then(resp => {
          navigationStack.push(folderData);
          /* Append files to the folder */
          vm.windowItems = {
            folderData: folderData,
            folders: resp.data.folders,
            files: resp.data.files
          };
          vm.breadCrumbList = resp.data.breadcrumbs;
          vm.showLoader = false;
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.addFolder = (name, folder) => {
      if (vm.folderName == "" || vm.folderName == null) {
        Notification.warning("Folder name can't be empty");
        return;
      }
      $("#addModal").modal("hide");
      let payload = {
        name: name,
        isParent: false,
        parent: folder
      };
      apiFactory
        .addHierarchy(payload)
        .then(resp => {
          folder.children.push(resp.data.data);
          Notification.success(resp.data.message);
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.addFileToHierarchy = (assets, folder) => {
      console.log(vm.selectedFiles);
      if (vm.selectedFiles == null) {
        Notification.warning("You need to select files to save");
        return;
      }

      $("#addModal").modal("hide");
      const assetId = assets.map(x => x._id);
      const hierarchyId = folder._id;
      apiFactory
        .addFileToHierarchy({
          assetId,
          hierarchyId
        })
        .then(resp => {
          Notification.success(resp.data.message);
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.deleteFile = (id, folderData) => {
      $("#fileView").modal("hide");
      apiFactory
        .deleteAssets({
          assetId: id
        })
        .then(resp => {
          vm.showLoader = true;
          apiFactory
            .viewHierarchy(folderData.$modelValue._id)
            .then(resp => {
              /* Append files to the folder */
              vm.windowItems = {
                folderData: folderData,
                folders: folderData.$modelValue.children,
                files: resp.data.files
              };
              vm.showLoader = false;
              folderData.$modelValue.files = resp.data.files;
            })
            .catch(e => {
              console.log(e);
            });
        })
        .catch(e => {
          console.log(e);
        });
    };

    /* File   handling */
    vm.uploadState = false;
    vm.completedAll = false;

    vm.fileUpdated = (files, event) => {
      /* Refresh upload states with new files */
      let fileObj = event.target.files;
      vm.uploadState = false;
      vm.completedAll = false;

      vm.fileNames = Object.keys(fileObj).map(x => {
        let val = fileObj[x];
        val.progress = 0;
        val.isPaused = false;
        val.completed = false;
        val.aborted = false;
        val.plan = false;
        return val;
      });
    };
    vm.toggleUploadViewMaximize = val => {
      vm.uploadViewMaximize = !val;
    };

    /* Capture reload and back events */

    // window.onbeforeunload = function(e) {
    //   // vm.uploadState &&
    //   return (function() {
    //     if (window.confirm("Are you sure? File upload will be aborted")) {
    //       e.preventDefault();
    //     }
    //   })();
    // };

    /* Main upload functionality */

    vm.preUpload = (files, folder) => {
      console.log(vm.uploadFiles);
      if (vm.uploadFiles == null) {
        Notification.warning("You need to uplaod files");
        return false;
      }
      $("#addModal").modal("hide");
      fileManagerFactory
        .checkDuplicateFiles(files, folder._id)
        .then(processed => {
          if (processed.duplicates.length) {
            vm.preUploadFiles = processed;
            console.log(vm.preUploadFiles);
            $("#versioningModal").modal("show");
          } else {
            console.log(processed);
            vm.uploadFile(processed, projectStore.get()._id, folder);
          }
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.processDuplicateFileName = file => {
      if (file.action === "version") {
        file.assetName = fileManagerFactory.generateVersion(file.name);
      } else {
        file.assetName = file.name;
      }
    };

    vm.uploadFile = (files, projectId, folder) => {
      /* Validate duplicate files */
      if (fileManagerFactory.checkNameChange(files.duplicates)) {
        Notification.warning("File names can't be the same");
        return;
      }
      /* Collate files */
      $("#versioningModal").modal("hide");
      files = [...files.duplicates, ...files.uploadFiles];
      vm.uploadState = true;
      $("#addModal").modal("hide");
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

    vm.closeUploadView = () => {
      vm.uploadState = false;
    };

    vm.fileView = file => {
      $("#fileView").modal("show");
      vm.previewData = file;
      vm.previewData.customUrl =
        file.format === "pdf"
          ? file.secure_url.replace(/\.pdf/, ".png")
          : file.secure_url;
    };

    /* Toggling edit */

    vm.editEnabled = false;
    vm.toggleEdit = bool => {
      vm.editEnabled = bool;
    };

    /* Context menu functionality */
    $scope.backBtnView = false;
    vm.contextMenuOptions = {
      explorer: [
        {
          text: "Paste item(s)",
          click: function($itemScope, $event, modelValue, text, $li) {
            if (vm.windowItems.folderData) {
              clipBoard
                .paste(vm.windowItems.folderData.$modelValue._id)
                .then(resp => {
                  if (resp) {
                    apiFactory
                      .viewHierarchy(vm.windowItems.folderData.$modelValue._id)
                      .then(resp => {
                        /* Append files to the folder */
                        vm.windowItems = {
                          folderData: vm.windowItems.folderData,
                          folders: resp.data.folders,
                          files: resp.data.files
                        };
                      })
                      .catch(e => {
                        console.log(e);
                      });
                  }
                })
                .catch(e => {
                  console.log(e);
                });
            } else {
              Notification.warning("Cannot paste file in root location");
            }
          }
        }
      ],
      file: [
        {
          text: "Copy",
          click: function($itemScope, $event, modelValue, text, $li) {
            clipBoard.copy($itemScope.file);
          }
        },
        {
          text: "Cut",
          click: function($itemScope, $event, modelValue, text, $li) {
            clipBoard.cut(
              $itemScope.file,
              vm.windowItems.folderData.$modelValue._id
            );
          }
        },
        {
          text: "Move to",
          click: function($itemScope) {
            vm.pdfonly = false;
            vm.pickerFolders = angular.copy(vm.rootFolders);
            vm.moveToSourceFile = $itemScope.file;
            $("#moveTo").modal("show");
            $(".rootFolder").show();
            $(".childFolder").hide();
            vm.moveto = "move To";
            $scope.folderName = "Root Folder";
            if ($scope.folderName == "Root Folder") {
              $scope.backBtnView = true;
            } else {
              $scope.backBtnView = false;
            }
          }
        }
      ]
    };
    vm.childFolderView = val => {
      vm.childFolders = val.children;
      vm.moveto = val.name;
      $(".rootFolder").hide();
      $(".childFolder").show();
    };
    $scope.backBtnView = false;
    if ($scope.folderName == "Root Folder") {
      $scope.backBtnView = true;
    } else {
      $scope.backBtnView = false;
    }

    /* Hierarchy template */
    vm.saveHierarchyTree = name => {
      if (!name) {
        Notification.error("Please enter template name");
      } else {
        $("#saveTemplateModal").modal("hide");
        let data = {
          name: name
        };
        apiFactory
          .saveHierarchyTree(projectStore.get()._id, data)
          .then(resp => {
            Notification.success(resp.data.message);
          })
          .console.log(e => {
            console.log(e);
          });
      }
    };

    vm.selectedTemplate = "";

    // getHierarchyTemplate

    apiFactory
      .getHierarchyTemplate()
      .then(resp => {
        vm.templateList = resp.data.data;
      })
      .catch(e => {
        console.log(e);
      });

    vm.assignTemplate = () => {
      var data = {
        projectId: projectStore.get()._id,
        templateId: vm.selectedTemplate._id
      };
      $("#assignTemplateModal").modal("hide");
      apiFactory
        .changeProjectTemplate(data)
        .then(resp => {
          Notification.success(resp.data.message);
          vm.getPrimaryFolders(projectStore.get());
          apiFactory
            .getProjectById(projectStore.get()._id)
            .then(resp => {
              projectStore.set(resp.data);
              vm.backupFolders = projectStore.get().backupFolders;
            })
            .catch(e => {
              console.log(e);
            });
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.showBackupFiles = false;
    vm.showRecentFiles = false;

    vm.toggleBookmarks = (val, key) => {
      vm[key] = !val;
    };

    vm.loadProjectFiles = id => {
      let limit = 5;
      apiFactory.showProjectFiles(id, limit).then(response => {
        vm.projectFiles = response.data.data;
      });
    };
    vm.loadProjectFiles(projectStore.get()._id);
  }
})();
