(() => {
  angular.module("app").controller("issuesCtrl", issuesCtrl);

  function issuesCtrl(
    $scope,
    $rootScope,
    $timeout,
    authFactory,
    $state,
    $q,
    apiFactory,
    Notification,
    globals,
    fileManagerFactory,
    Upload,
    localStorageService,
    uploadFactory,
    imageMarker
  ) {
    let vm = this;
    vm.backImg;
    const { logout, userStore, projectStore, debounce } = globals;
    vm.UploadFiles = [];
    vm.issueData = {};
    $scope.issueModel = {};
    $scope.file;
    $scope.comment = "";
    //   $scope.inputFiles = [];
    $scope.openEdit = false;
    $scope.filesToRemove = [];
    $scope.isSelectedBtn = false;
    $scope.updateform = false;
    $scope.UndoArray = [];
    $scope.redoArray = [];
    vm.planToMark = [];
    vm.LocalImgs = [];
    // const { logout } = globals;
    $scope.searchingText = false;
    $scope.openFillColor = false;
    //color picker variables
    $scope.colorpick = "#0000ff";
    $scope.colorWell;
    $scope.fillWell;
    $scope.fillColor = "transparent";
    $scope.textForm = false;
    $scope.canvas = document.getElementById("slideCanvas");
    vm.errorImage = "assets/images/enduserissue.png";
    $scope.btnMarker = "../assets/images/gps.png";
    $scope.btnCircle = "../assets/images/circle-shape-outline.png";
    $scope.btnLine = "../assets/images/lineicon.png";
    $scope.btnText = "../assets/images/text-option-interface-symbol.png";

    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    /* Get project list */
    vm.userData = userStore.get();

    vm.logout = () => {
      logout();
    };

    vm.inputImg = [];
    vm.uploadImg = [];
    vm.inputFiles = [];
    vm.uploadFiles = [];

    /* Data table setup **************************/
    $(".issuesList").DataTable();
    $scope.activeJustified = 0;

    vm.currentPage = 1;

    vm.toggleObj = {
      toggleIssue: {
        systemTag: false,
        title: false,
        description: false,
        projectName: false,
        created: true
      }
    };
    vm.searchText = "";
    vm.sortissues = (type, resource) => {
      /* For toggling ascending and descending order */
      vm.toggleObj[resource][type] === undefined
        ? (vm.toggleObj[resource][type] = true)
        : (vm.toggleObj[resource][type] = !vm.toggleObj[resource][type]);
      apiFactory
        .listAllIssues({
          page: 1,
          chunk: 10,
          sort: "created",
          search: vm.searchText,
          sortType: false
        })
        .then(resp => {
          // vm[resource]= resp.data.list;
          // vm[resource + "Count"] = resp.data.total;
          vm.allIssues = resp.data.list;
          console.log("all issues", vm.allIssues);
          vm.issueCount = resp.data.total;
          $timeout(() => {
            $scope.searchingText = false;
            $("#pagination").pagination({
              items: vm.issueCount,
              itemsOnPage: 10,
              cssStyle: "light-theme",
              hrefTextPrefix: "#",
              ordering: false,
              currentPage: 1,
              onPageClick: function(page, event) {
                event.preventDefault();
                apiFactory
                  .listAllIssues({
                    page: page,
                    chunk: 10,
                    sort: type,
                    sortType: vm.toggleObj[type]
                  })
                  .then(resp => {
                    vm.allIssues = resp.data.list;
                  })
                  .catch(e => {
                    console.log(e);
                  });
              }
            });
            $("#pagination ul li .prev").text("<<");
            $("#pagination ul li .next").text(">>");
          });
        })
        .catch(e => {
          console.log(e);
        });
    };

    const searchDebounce = debounce(250); /* Passing in the debounce rate */
    vm.searchIssues = text => {
      /**
       * @param {function} fn - pass the function which you want to debounce
       * @param {Array} args - pass the arguments from the view as an array
       */
      searchDebounce(
        () => {
          apiFactory
            .listAllIssues({
              page: 1,
              chunk: 10,
              search: text,
              sort: "created",
              sortType: false
            })
            .then(resp => {
              vm.allIssues = resp.data.list;
              vm.issueCount = resp.data.total;

              $timeout(() => {
                $scope.searchingText = true;
                $("#paging").pagination({
                  items: vm.issueCount,
                  itemsOnPage: 10,
                  cssStyle: "light-theme",
                  hrefTextPrefix: "#",
                  ordering: false,
                  currentPage: 1,

                  onPageClick: function(page, event) {
                    event.preventDefault();
                    apiFactory
                      .listAllIssues({
                        page: page,
                        chunk: 10,
                        sort: type,
                        sortType: vm.toggleObj[resource][type]
                      })
                      .then(resp => {
                        vm.allIssues = resp.data.list;
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
      );
    };

    /* Initially sort issue in descending order */
    vm.sortissues("created", "toggleIssue");

    vm.dtOptions = {
      paging: false,
      info: false,
      ordering: false,
      searching: false
    };

    /* End of  Data table setup **********************/

    $scope.issueCategory = ["Safety", "Quality", "Issue"];

    apiFactory.listAllUsers().then(resp => {
      vm.allUsers = resp.data.list;
    });

    apiFactory.listAllRoofers().then(resp => {
      vm.allRoofers = resp.data.list;
    });

    apiFactory.listAllProjects().then(resp => {
      vm.allProjects = resp.data.list;
    });

    apiFactory.getIssuesList().then(resp => {
      vm.listOfIssue = resp.data.list;
    });

    vm.descriptionPopover = (indexVal, type) => {
      $scope.fileType = type;
      $scope.fileIndex = indexVal;
    };
    vm.addDescription = (index, data) => {
      if ($scope.fileType == "image") {
        vm.uploadImg[index].description = data;

        $("#closePopoverImg_" + index).trigger("click");
      } else {
        vm.uploadFiles[index].description = data;

        $("#closePopoverFile_" + index).trigger("click");
      }
    };

    vm.fileAdded = (files, event, modal) => {
      console.log(vm.inputImg);
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function(x, index) {
        x.description = "";
        if (modal == "image") {
          if (vm.uploadImg.length == 0) {
            vm.uploadImg.push(x);
          } else {
            let duplicateImg = false;
            angular.forEach(vm.uploadImg, function(y) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              vm.uploadImg.push(x);
            } else {
              Notification.error("File name already exist");
            }
          }
        } else {
          if (vm.uploadFiles.length == 0) {
            if (/image/.test(x.type)) {
              vm.uploadImg.push(x);
            } else {
              vm.uploadFiles.push(x);
            }
          } else {
            let duplicateImg = false;
            angular.forEach([].concat(vm.uploadFiles, vm.uploadImg), function(
              y
            ) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              if (/image/.test(x.type)) {
                vm.uploadImg.push(x);
              } else {
                vm.uploadFiles.push(x);
              }
            } else {
              Notification.error("File name already exist");
            }
          }
        }
      });
      console.log(vm.uploadImg);
    };

    vm.deleteFile = (indexVal, type) => {
      if (type == "image") {
        vm.uploadImg.splice(indexVal, 1);
      } else {
        vm.uploadFiles.splice(indexVal, 1);
      }
    };

    vm.addIssueDetails = () => {
      if (!vm.issueData.category) {
        Notification.error("Please Select issue Category");
        return;
      } else if (!vm.issueData.assignedTo) {
        Notification.error("Please Select assigned user");
        return;
      } else if (!vm.issueData.owner) {
        Notification.error("Please Select issue owner");
        return;
      } else {
        $scope.imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);
        console.log($scope.imgAndFiles);
        var formData = {
          title: vm.issueData.title,
          description: vm.issueData.description,
          projectId: vm.issueData.project,
          issueCategory: vm.issueData.category,
          assignedTo: vm.issueData.assignedTo,
          issueStatus: vm.issueData.issueStatus,
          ownerId: vm.issueData.owner,
          dependencyOn: vm.issueData.dependencyOn,
          deadLine: vm.issueData.deadLine,
          files: $scope.imgAndFiles,
          assetObj: $scope.imgAndFiles.map((x, i) => {
            return {
              assetDescription: x.description
            };
          })
        };
        apiFactory
          .createIssue(formData)
          .then(resp => {
            Notification.success(resp.data.message);
            $("#issue_modal").css("display", "none");
            $("#konva_issue_marker").modal("show");
            vm.inputImg = [];
            vm.uploadImg = [];
            vm.inputFiles = [];
            vm.uploadFiles = [];
            vm.issueData = {};
            vm.createdIssue = resp.data.data;
            vm.toggleObj.toggleIssue.createdAt = true;
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.updateIssueDetails = formData => {
      var issueObject = {};
      if (vm.updateIssue == undefined) {
        console.log("update issue is undefined");
        issueObject.Title = $scope.issueModel.title;
        issueObject.description = $scope.issueModel.description;
        issueObject.deadLine = $scope.issueModel.deadLine;
        issueObject.issueStatus = $scope.issueModel.issueStatus;
      } else {
        console.log("update isuue is not undfined so in esle case");
        if (vm.updateIssue.title == undefined) {
          issueObject.Title = $scope.issueModel.title;
        } else {
          issueObject.Title = vm.updateIssue.title;
        }
        // $('#issue_modal').modal('hide');
        //$('#issue_marker').modal('show');
      }

      vm.updateIssueDetails = formData => {
        var issueObject = {};
        if (vm.updateIssue == undefined) {
          console.log("update issue is undefined");
          issueObject.Title = $scope.issueModel.title;
          issueObject.description = $scope.issueModel.description;
        } else {
          issueObject.description = vm.updateIssue.description;
        }
        if (vm.updateIssue.deadLine == undefined) {
          issueObject.deadLine = $scope.issueModel.deadLine;
        } else {
          issueObject.deadLine = vm.updateIssue.deadLine;
        }
        if (vm.updateIssue.issueStatus == undefined) {
          issueObject.issueStatus = $scope.issueModel.issueStatus;
        } else {
          issueObject.issueStatus = vm.updateIssue.issueStatus;
        }
      };

      if ($scope.inputFiles.length > 0) {
        issueObject.files = $scope.inputFiles;
      }
      if ($scope.filesToRemove.length > 0) {
        console.log("files to remove", $scope.filesToRemove);
        issueObject.removedFiles = $scope.filesToRemove;
      }
      console.log("ISUUEOBJECT", issueObject);
      apiFactory
        .updateIssue(issueObject, $scope.issueModel._id)
        .then(resp => {
          Notification.success("Issue has been updated successfully");
          $scope.inputFiles = [];
          $scope.filesToRemove = [];
          $scope.updateform = false;
          $("#issuedetail").modal("hide");
          vm.sortissues("created", "toggleIssue");
        })
        .catch(e => {
          console.log(e);
          $scope.inputFiles = [];
          $scope.filesToRemove = [];
          $scope.updateform = false;
          Notification.error("Something went wrong");
        });
    };

    //reading file images
    $scope.readImg = function(fileImg) {
      var output = document.getElementById("blah");
      output.src = URL.createObjectURL(fileImg);
    };

    $scope.deleteImg = function(index, array) {
      array.splice(index, 1);
    };

    vm.localFiles = [];

    $("#issue_marker").on("hidden.bs.modal", function(e) {
      $(this).removeData("bs.modal");
      if ($("#chooseIssueRoofModal").is(":visible")) {
        console.log("Modal is open");
      } else {
        console.log("Modal is closed");
        $(this).modal("show");
      }
    });

    $scope.getImagesInCarosel = function() {
      var projectID = "58eb9d2ec921d67036787832";

      apiFactory
        .getProjectRoofPlans(projectID)
        .then(resp => {
          //$("#issue_modal").modal("hide");
          let ProjectPlans = resp.data.data;
          vm.planPickerPlans = ProjectPlans;
          console.log("planpicker: ", vm.planPickerPlans);
          $("#issue_marker").modal("hide");
          $("#chooseIssueRoofModal").modal("show");
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.choosePlanData = function(plan) {
      vm.planToMark.push(plan.assetObj);
      //  console.log(vm.planToMark);
    };
    //Test pan
    vm.choosePlanData1 = function(plan) {
      vm.planToMark.push(plan);
      //  console.log(vm.planToMark);
    };

    $scope.addToDetails = function(imgarray) {
      $("#chooseIssueRoofModal").modal("hide");
      $("#issue_marker").modal("show");
      console.log("vm.plan to mrk:", vm.planToMark);
      var firstCanvasImg = imgarray.slice(-1);
      //$("#slideCanvas").css("background-image","url("+firstCanvasImg[0].url+")");
      $("#carousellist")
        .carousel("pause")
        .removeData();
      $("#carousellist").carousel(vm.planToMark);
    };

    $scope.getDetail = function(issue) {
      $("#issuedetail").modal();
      $scope.issueModel = issue;

      $scope.Title = $scope.issueModel.title;
      $scope.Description = $scope.issueModel.description;

      $scope.DeadLineDate = new Date($scope.issueModel.deadLine);
      document.getElementById("deadline").defaultValue = $scope.DeadLineDate;
      $scope.day = $scope.DeadLineDate.getDate() - 1;

      $scope.month = $scope.DeadLineDate.getMonth() + 1;

      $scope.year = $scope.DeadLineDate.getFullYear();

      $scope.deadLineDate = $scope.month + "/" + $scope.day + "/" + $scope.year;

      $scope.Status = $scope.issueModel.issueStatus;
    };

    $scope.addFileToUpdate = function(file, comment) {
      $scope.inputFiles.push({ file: file, comment: comment });
      $scope.file = "";
      $scope.comment = "";
    };

    $scope.updateRequest = function(updateobj) {
      $scope.updateform = true;
      $scope.openEdit = false;
    };

    $scope.removeFiles = function(index, array, imageId) {
      array.splice(index, 1);
      $scope.filesToRemove.push(imageId);
    };
    vm.closeUpdteModel = function() {
      $scope.updateform = false;
    };

    $scope.openEditDate = function() {
      $scope.openEdit = true;
    };
    $scope.closeEditDate = function() {
      $scope.openEdit = false;
    };

    $scope.imageTempUrl = "../assets/images/rooftestimages/image1.jpg";
    $scope.rooftestDemo = function(string) {
      console.log("string", string);
      $scope.imageTempUrl = ".." + string;
    };

    // $scope.canvas = document.getElementById('slideCanvas');
    $("#issue_marker").on("shown.bs.modal", function(e) {
      $("#carousellist").flexslider({
        animation: "slide",
        controlNav: false,
        animationLoop: false,
        slideshow: false,
        itemWidth: 200,
        itemMargin: 3
      });
      //$scope.canvas = document.getElementById('slideCanvas');
    });

    vm.markingsArray = [];

    $scope.getFilesFromLocal = function(files, createdIssue) {
      if (files) {
        let payload = {
          files,
          //issueId: "5beeac6dae040c0b88a9ca9e"
          issueId: createdIssue._id
        };
        apiFactory
          .saveLocalIssueAsset(payload)
          .then(resp => {
            return resp.data.data;
          })
          .then(loadImagesInCarousel)
          .catch(e => {
            Notification.error(
              "couldnot load images please select images again."
            );
          });

        // $("#slideCanvas").css("background-image","url("+firstCanvasImg[0].url+")");

        // $("#localfilesmodel").modal("show");
      } else {
        Notification.error("No Files selected.");
      }

      // $("#issue_modal").modal("hide");
      // $("#issue_marker").modal("show");
    };

    vm.removeImage = id => {
      var index = vm.planToMark.findIndex(function(x) {
        return x._id == id;
      });
      vm.planToMark.splice(index, 1);
    };

    //return a promise that resolves with a File instance
    function urltoFile(url, filename, mimeType) {
      return fetch(url)
        .then(function(res) {
          return res.arrayBuffer();
        })
        .then(function(buf) {
          return new File([buf], filename, { type: mimeType });
        });
    }

    $(document).on("click", ".lightbox img", function(e) {});

    function loadImagesInCarousel(resp) {
      vm.planToMark = resp.map((x, i) => {
        x.active = i === 0 ? true : false;
        x.markingJson = null;
        return x;
      });
    }
    /* This will be null since we don't have a default marking image selected initally */
    vm.currentMarkingImage = null;

    const actions = imageMarker.undoRedo();

    vm.actions = action => {
      actions[action]();
    };

    vm.openSliderImage = image => {
      /* Clear action stack before switching to another image */
      actions.reset();
      saveExistingMarking(vm.currentMarkingImage).then(_ => {
        /* Set stage dimensions */
        let dimensions = {};
        if (image.width > 650) {
          let offset = 650 / image.width;
          dimensions.height = image.height * offset;
          dimensions.width = 650;
        } else {
          dimensions = {
            height: image.height,
            width: image.width
          };
        }

        imageMarker.init("slideCanvas", dimensions, image);
        vm.planToMark.forEach(x => {
          if (x._id === image._id) {
            x.active = true;
          } else {
            x.active = false;
          }
        });
        vm.currentMarkingImage = image;
      });
    };

    function saveExistingMarking(assetObj) {
      return new Promise((resolve, reject) => {
        /* Adding image and file obj to asset obj */
        if (assetObj) {
          let dataImage = imageMarker.getCanvasImage();
          fetch(dataImage)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], "detailfile");
              assetObj.fileObj = file;
              assetObj.markingJson = imageMarker.serialize();
              console.log("Marking saved");
              resolve(null);
            });
        } else {
          resolve(null);
        }
      });
    }

    vm.drawmarkerOnCanvas = () => {
      imageMarker.setState("marker");
    };

    vm.drawLineOnCanvas = () => {
      imageMarker.setState("line");
    };

    vm.drawCircleOnCanvas = () => {
      imageMarker.setState("circle");
    };

    vm.textState = false;
    vm.fillTextOnCanvas = text => {
      console.log("asdadas", vm.textState, text);
      if (vm.textState && text) {
        imageMarker.fill_text(text);
        vm.canvasText = "";
      }
      vm.textState = !vm.textState;
    };

    $scope.$on("saveDrawing", e => {
      saveExistingMarking(vm.currentMarkingImage);
    });

    vm.saveMarkInfo = function(markings, createdIssue) {
      $("#konva_issue_marker, #issue_modal").modal("hide");
      let payload = markings.reduce(
        (acc, x) => {
          if (x.markingJson) {
            let fileData = {
              assetId: x._id,
              serializedData: x.markingJson
            };
            acc.fileData.push(fileData);

            acc.files.push(x.fileObj);
          }

          return acc;
        },
        { fileData: [], files: [] }
      );
      payload.issueId = createdIssue._id;
      apiFactory
        .postMarkImg(payload)
        .then(resp => {
          Notification.success("Markings are successfully saved");
          vm.sortissues("created", "toggleIssue");
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.modalClose = () => {
      $("#konva_issue_marker").modal("hide");
      $("#issue_modal").modal("hide");
    };
    vm.markingColor = "rgba(0,0,0,1)";
    vm.cpOptions = {
      swatch: true,
      format: "rgb",
      pos: "top right",
      case: "lower",
      alpha: true
    };

    /* Color Picker Events */
    vm.cpEvents = {
      onChange: function(api, color, $event) {
        imageMarker.setColor(color);
      }
    };
  }
})();
