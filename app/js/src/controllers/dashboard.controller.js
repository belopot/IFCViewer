(() => {
  angular.module("app").controller("dashboardCtrl", dashboardCtrl);

  function dashboardCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    $window,
    $location,
    apiFactory,
    Notification,
    localStorageService,
    globals,
    NgMap
  ) {
    /* Requiring vars */

    let vm = this;
    vm.loggedIn = true;

    const {
      logout,
      userStore,
      companyStore,
      projectStore,
      throttler
    } = globals;

    if (!authFactory.checkUser()) {
      logout();
      vm.loggedIn = false;
      return;
    }
    vm.loader = false;

    /* Get project list */
    vm.userData = userStore.get();
    vm.clientUrl =
      "https://res.cloudinary.com/dktnhmsjx/image/upload/v1486129234/default/company.png";
    vm.gmap = {
      url:
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU",
      styles: [
        {
          elementType: "geometry",
          stylers: [
            {
              color: "#212121"
            }
          ]
        },
        {
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off"
            }
          ]
        },
        {
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#757575"
            }
          ]
        },
        {
          elementType: "labels.text.stroke",
          stylers: [
            {
              color: "#212121"
            }
          ]
        },
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [
            {
              color: "#757575"
            }
          ]
        },
        {
          featureType: "administrative.country",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#9e9e9e"
            }
          ]
        },
        {
          featureType: "administrative.land_parcel",
          stylers: [
            {
              visibility: "off"
            }
          ]
        },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#bdbdbd"
            }
          ]
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#757575"
            }
          ]
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [
            {
              color: "#181818"
            }
          ]
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#616161"
            }
          ]
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.stroke",
          stylers: [
            {
              color: "#1b1b1b"
            }
          ]
        },
        {
          featureType: "road",
          elementType: "geometry.fill",
          stylers: [
            {
              color: "#2c2c2c"
            }
          ]
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#8a8a8a"
            }
          ]
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [
            {
              color: "#373737"
            }
          ]
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [
            {
              color: "#3c3c3c"
            }
          ]
        },
        {
          featureType: "road.highway.controlled_access",
          elementType: "geometry",
          stylers: [
            {
              color: "#4e4e4e"
            }
          ]
        },
        {
          featureType: "road.local",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#616161"
            }
          ]
        },
        {
          featureType: "transit",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#757575"
            }
          ]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [
            {
              color: "#000000"
            }
          ]
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#3d3d3d"
            }
          ]
        }
      ],
      markers: []
    };

    function addMarkers(projectList) {
      let mxLat = 0,
        mxLng = 0,
        mnLat = 0,
        mnLng = 0,
        markers = [];
      projectList.forEach(element => {
        if (element.address) {
          if (
            element.address.loc.coordinates[0] != 0 ||
            element.address.loc.coordinates[1] != 0
          ) {
            var mrkr = {
              id: element._id,
              latitude: element.address.loc.coordinates[1],
              longitude: element.address.loc.coordinates[0]
            };
            mxLat = mxLat > mrkr.latitude ? mrkr.latitude : mxLat;
            mnLat = mnLat < mrkr.latitude ? mrkr.latitude : mnLat;
            mxLng = mxLng > mrkr.longitude ? mrkr.longitude : mxLng;
            mnLng = mnLng < mrkr.longitude ? mrkr.longitude : mnLng;
            markers.push([mrkr.latitude, mrkr.longitude]);
          }
        }
      });
      return markers;
    }

    /* Get all dashboard data */

    Promise.all([
      apiFactory.getCompanyById(vm.userData.companyId),
      apiFactory.listAllProjects(),
      apiFactory.listAllClients(),
      apiFactory.listAllTodoList()
    ])
      .then(data => {
        /* Add companyData to store */
        companyStore.set(data[0].data);
        /* Add markers from project data */
        vm.gmap.markers = addMarkers(data[1].data.list);
        vm.dashboardData = {
          company: data[0].data,
          projects: data[1].data.list,
          clients: data[2].data.list,
          todoLists: data[3].data.data
        };
      })
      .catch(e => {
        console.log(e);
      });

    NgMap.getMap().then(map => {
      map.setOptions({
        styles: vm.gmap.styles,
        disableDefaultUI: true,
        zoom: 1,
        center: {
          lat: 0,
          lng: 0
        }
      });
    });

    /* Project picker load functionality */

    let enabled = true,
      chunkSize = 5;
    vm.projectSearch = "";
    vm.enableLazyLoad = false;
    vm.sortParams = {
      field: "created",
      type: false
    };

    vm.projectName = "PROJECT";

    /* Get bookmarked project List */
    $scope.getBookmarkedProject = () => {
      apiFactory
        .getBookmarks()
        .then(resp => {
          vm.bookmarkedProject = resp.data.bookmarks;
          vm.bookmarkedProjectList = angular.copy(vm.bookmarkedProject);
          vm.bookmarkedProjectList.push({
            _id: "others",
            projectName: "All Project List"
          });
          // vm.bookmarkedProjectList.unshift({
          //   _id: "NA",
          //   projectName: "Select a project"
          // });
          // vm.project = vm.bookmarkedProjectList[0];
        })
        .catch(e => {
          console.log(e);
        });
    };
    $scope.getBookmarkedProject();

    vm.loadProjectFiles = id => {
      let limit = 5;
      apiFactory.showProjectFiles(id, limit).then(resp => {
        vm.projectFiles = resp.data.data;
      });
    };
    vm.bookmarkFlag = false;
    /* choose project from bookmarked project list */
    vm.selectedProject = project => {
      if (project._id == "others") {
        apiFactory
          .listAllProjects()
          .then(resp => {
            vm.projectPickerData = resp.data.list;
            $("#chooseProject").modal("show");
          })
          .catch(e => {
            console.log(e);
          });
      } else {
        vm.bookmarkFlag = false;
        angular.forEach(vm.bookmarkedProject, function(x) {
          if (x._id == project._id) {
            return (vm.bookmarkFlag = true);
          }
        });
        vm.projectName = project.projectName;
        projectStore.set(project);
        vm.loadProjectFiles(project._id);
      }
    };

    /* Choose project form all project list */
    vm.chooseProject = project => {
      var index = vm.bookmarkedProjectList.findIndex(function(x) {
        return x._id == "others";
      });
      vm.bookmarkedProjectList.splice(index, 1);
      let alreadyExist = true;
      angular.forEach(vm.bookmarkedProject, function(x) {
        if (x._id == project._id) {
          alreadyExist = false;
        }
      });
      if (alreadyExist) {
        vm.bookmarkedProjectList.push(project);
      }

      vm.bookmarkedProjectList.push({
        _id: "others",
        projectName: "All Project List"
      });

      vm.project = project;
      vm.projectName = project.projectName;
      vm.bookmarkFlag = false;
      projectStore.set(project);

      $("#chooseProject").modal("hide");
    };

    if (localStorageService.get("currentProject")) {
      let currentProject = localStorageService.get("currentProject");
      vm.project = currentProject;
      // console.log(vm.project, "vm.project")
      vm.projectName = currentProject.projectName;
      vm.loadProjectFiles(vm.project._id);

      let alreadyBookmarked = false;
      angular.forEach(vm.bookmarkedProject, function(x) {
        if (x._id == currentProject._id) {
          return (alreadyBookmarked = true);
        }
      });

      if (!alreadyBookmarked) {
        $timeout(function() {
          var index = vm.bookmarkedProjectList.findIndex(function(x) {
            return x._id == "others";
          });
          vm.bookmarkedProjectList.splice(index, 1);
          vm.bookmarkedProjectList.push(currentProject);
          vm.bookmarkedProjectList.push({
            _id: "others",
            projectName: "All Project List"
          });
        }, 1500);
      } else {
      }
    }

    /* Event handler to reset add material modal */
    $("#chooseProject").on("hide.bs.modal", function() {
      vm.enableLazyLoad = false;
    });

    vm.closeProjectPicker = () => {
      $("#chooseProject").modal("hide");
      vm.project = null;
      projectStore.set("");
    };

    vm.checkBookmark = data => {
      let bookmark = true;
      let alreadyBookmarked = false;
      angular.forEach(vm.bookmarkedProject, function(x) {
        if (x._id == data._id) {
          return (alreadyBookmarked = true);
        }
      });
      if (alreadyBookmarked) {
        bookmark = false;
      } else {
        bookmark = true;
      }

      apiFactory
        .bookMarkProject(projectStore.get()._id, bookmark)
        .then(resp => {
          if (bookmark) {
            Notification.success("Project successfully bookmarked");
            vm.bookmarkedProject.push(data);
            vm.bookmarkFlag = true;
          } else {
            Notification.success(
              "Project successfully removed from bookmark list"
            );
            var index = vm.bookmarkedProject.findIndex(function(x) {
              return x._id == data._id;
            });
            vm.bookmarkedProject.splice(index, 1);
            vm.bookmarkFlag = false;
          }
        })
        .catch(err => {
          console.log(err);
        });
    };

    vm.addMore = () => {
      if (enabled) {
        enabled = false;
        $timeout(() => {
          enabled = true;
        }, 500);
        chunkSize += 5;
        apiFactory
          .listAllProjects({
            search: vm.projectSearch,
            chunk: chunkSize,
            page: 1,
            sort: vm.sortParams.field,
            sortType: vm.sortParams.type
          })
          .then(resp => {
            vm.projectPickerData = resp.data.list;
          })
          .catch(e => {
            console.log(e);
          });
      }
    };
    /* File picker options */

    vm.filePickerOptions = {
      filter: "pdf"
    };
    /* Function to search projects */
    vm.searchProjects = text => {
      apiFactory
        .listAllProjects({
          search: vm.projectSearch,
          chunk: chunkSize,
          page: 1,
          sort: vm.sortParams.field,
          sortType: vm.sortParams.type
        })
        .then(resp => {
          vm.projectPickerData = resp.data.list;
        })
        .catch(e => {
          console.log(e);
        });
    };

    /* Function to sort projects */
    vm.sort = field => {
      if (vm.sortParams.field === field) {
        vm.sortParams.type = !vm.sortParams.type;
      } else {
        vm.sortParams.field = field;
        vm.sortParams.type = true;
      }

      apiFactory
        .listAllProjects({
          search: vm.projectSearch,
          chunk: chunkSize,
          page: 1,
          sort: vm.sortParams.field,
          sortType: vm.sortParams.type
        })
        .then(resp => {
          vm.projectPickerData = resp.data.list;
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.logout = () => {
      logout();
    };

    $scope.redirectTo3D = function() {
      console.log("rediection called");

      apiFactory.get3DPage().then(response => {
        console.log("response:", response);
        // if (response.data == "true") {
        //   console.log("console when response true",response);
        //   $window.location.href = "https://cloudes-3d.com";
        // } else {
        //   console.log("console when response false",response);
        //   $window.location.href = "https://cloudes-3d.com";

        // }
      });
    };
    vm.goToEconomic = () => {
      /*  if (projectStore.get()) {
        $state.go("economic");
      } else { 
      Notification.warning("Please select a project");
      $("html, body").animate(
        {
          scrollTop: $(".project").offset().top
        },
        500,
        function() {
          $("#selectProject")
            .focus()
            .addClass("blink");
          setTimeout(() => {
            $("#selectProject").removeClass("blink");
          }, 1000);
        }
      );
      }*/
      $state.go("economic");
    };
    vm.goToFileManager = () => {
      console.log("project", projectStore.get());
      if (projectStore.get()) {
        $state.go("fileManager");
      } else {
        Notification.warning("Please select a project");
        $("html, body").animate(
          {
            scrollTop: $(".project").offset().top
          },
          500,
          function() {
            $("#selectProject")
              .focus()
              .addClass("blink");
            setTimeout(() => {
              $("#selectProject").removeClass("blink");
            }, 1000);
          }
        );
      }
    };

    /* Roof plan functionalities */

    vm.planPickerPlans = [];
    vm.rootFolders = [];

    vm.openPlanPicker = () => {
      if (!projectStore.get()) {
        Notification.warning("No project selected");
        return;
      }
      apiFactory
        .getProjectRoofPlans(projectStore.get()._id)
        .then(resp => {
          let roofPlans = resp.data.data;
          localStorageService.set("roofPlanProject", projectStore.get()._id);
          localStorageService.set("roofPlans", roofPlans);
          vm.planPickerPlans = roofPlans;
          $("#chooseRoofModal").modal("show");
        })
        .catch(e => {
          console.log(e);
        });

      apiFactory
        .getHierarchy(projectStore.get()._id)

        .then(resp => {
          vm.showTree = true;
          vm.rootFolders = resp.data.data.hierarchies;
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.choosePlan = plan => {
      $("#chooseRoofModal").modal("hide");
      localStorageService.set("selectedPlan", plan);
      $state.go("visualPlanner");
    };

    vm.allModalClose = () => {
      $("#chooseFile, #selectFileCanvas, #selectFile, #chooseRoofModal").modal(
        "hide"
      );
    };

    vm.fileChoose = () => {
      vm.pickerFolders = angular.copy(vm.rootFolders);
      $("#chooseFile").modal("show");
      $("#chooseFile").css("display", "block");
      $("#chooseFile .modal-dialog").css({
        "-webkit-box-shadow": "0px 0px 47px 6px rgba(0, 0, 0, 0.75)",
        "-moz-box-shadow": "0px 0px 47px 6px rgba(0, 0, 0, 0.75)",
        "box-shadow": "0px 0px 47px 6px rgba(0, 0, 0, 0.75)"
      });
      $(".rootFolder").show();
      $(".childFolder").hide();
      vm.moveto = "move To";
      $scope.folderName = "Root Folder";
      if ($scope.folderName == "Root Folder") {
        $scope.backBtnView = true;
      } else {
        $scope.backBtnView = false;
      }
    };
    $scope.$on("loader", (e, data) => {
      vm.loader = data;
      if (vm.loader) {
        $("body").addClass("modal-open");
      } else {
        $("body").removeClass("modal-open");
      }
    });
    $scope.$on("selectedRoofPlanDoc", (e, data) => {
      vm.selectedAssetForPlan = data;

      vm.roofplanBreadCrumb =
        data.breadCrumbs.reduce((acc, x) => {
          acc += `${x.name} > `;
          return acc;
        }, "") + data.assetName;

      if (/cloudinary/.test(data.secure_url)) {
        vm.fileArray = globals.extractPagesFromPdf(data.secure_url, data.pages);
        vm.loader = false;
        $("#chooseRoofModal").css("visibility", "hidden");
        $("#selectFile").modal("show");
        $("#selectFile").css("display", "block");
        vm.pdfFiles = angular.copy(vm.fileArray);
        console.log(vm.fileArray);
      } else {
        if (data.planDocument) {
          $timeout(() => {
            $scope.$apply();
          });
          vm.pdfPagesData = vm.pdfFiles = data.planImages.map((x, i) => {
            let obj = {
              pageNo: i,
              title: `title_${Date.now()}`,
              url: x,
              selected: false,
              description: ""
            };

            return obj;
          });

          vm.loader = false;
          $("#chooseRoofModal").css("visibility", "hidden");
          $("#selectFile").modal("show");
          $("#selectFile").css("display", "block");
        } else {
          globals.createPagesFromPdf(data).then(pages => {
            $timeout(() => {
              $scope.$apply();
            });
            vm.pdfPagesData = pages;
            vm.pdfFiles = pages;
            vm.loader = false;
            $("#chooseRoofModal").css("visibility", "hidden");
            $("#selectFileCanvas").modal("show");
            $("#selectFileCanvas").css("display", "block");
          });
        }
      }
    });
    vm.hideSelectFile = () => {
      $("#chooseRoofModal").css("visibility", "visible");
      $("#selectFile").css("display", "none");
    };
    vm.selectedFileList = (val, type, asset) => {
      if (val == "submit") {
        $("#chooseFile, #selectFile, #selectFileCanvas").css("display", "none");
        $("#chooseRoofModal").css("visibility", "visible");
        vm.selectedFiles = [];
        angular.forEach(vm.pdfFiles, x => {
          if (x.selected) {
            vm.selectedFiles.push(x);
          }
        });
        if (type === 1) {
          let endpoint =
            !asset.planDocument && /cloudinary/.test(asset.secure_url)
              ? "addProjectRoofPlan"
              : "addRoofPlansFromAsset";
          /* Cloudinary plans */
          let payload = {
            assetId: asset._id,
            projectId: projectStore.get()._id,
            pages: vm.selectedFiles
          };

          apiFactory[endpoint](payload)
            .then(resp => {
              Notification.success(resp.data.message);
              apiFactory
                .getProjectRoofPlans(projectStore.get()._id)
                .then(resp => {
                  let roofPlans = resp.data.data;
                  localStorageService.set(
                    "roofPlanProject",
                    projectStore.get()._id
                  );
                  localStorageService.set("roofPlans", roofPlans);
                  vm.planPickerPlans = roofPlans;
                })
                .catch(e => {
                  console.log(e);
                });
            })
            .catch(e => {
              console.log(e);
            });
        } else {
          /* S3 plans */
          let payload = {
            assetId: asset._id,
            pdfUrl: asset.secure_url,
            projectId: projectStore.get()._id,
            pages: vm.selectedFiles.reduce((acc, x) => {
              let obj = {
                title: x.title,
                description: x.description,
                pageNo: x.pageNo
              };
              acc.push(obj);
              return acc;
            }, [])
          };
          apiFactory
            .generateRoofPlans(payload)
            .then(resp => {
              Notification.success(resp.data.message);
              apiFactory
                .getProjectRoofPlans(projectStore.get()._id)
                .then(resp => {
                  let roofPlans = resp.data.data;
                  localStorageService.set(
                    "roofPlanProject",
                    projectStore.get()._id
                  );
                  localStorageService.set("roofPlans", roofPlans);
                  vm.planPickerPlans = roofPlans;
                })
                .catch(e => {
                  console.log(e);
                });
            })
            .catch(e => {
              console.log(e);
            });
        }
      } else if (val == "close") {
        $("#chooseFile, #selectFile, #selectFileCanvas").css("display", "none");
        $("#chooseRoofModal").css("visibility", "visible");
      }
    };

    vm.goToMeetingRoom = () => {
      if (projectStore.get()) {
        $state.go("meetingroom");
      } else {
        Notification.warning("Please select a project");
        $("html, body").animate(
          {
            scrollTop: $(".project").offset().top
          },
          500,
          function() {
            $("#selectProject")
              .focus()
              .addClass("blink");
            setTimeout(() => {
              $("#selectProject").removeClass("blink");
            }, 1000);
          }
        );
      }
    };
  }
})();
