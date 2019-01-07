(() => {
  angular.module("app").controller("issueDetailCtrl", issueDetailCtrl);

  function issueDetailCtrl(
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
    FileSaver,
    imageMarker
  ) {
    let vm = this;
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
    }
    vm.userData = userStore.get();

    vm.logout = () => {
      logout();
    };
    vm.issueId = $stateParams.id;
    vm.ImageAssets = [];
    vm.DocumentAssets = [];

    $scope.currentPage = 1;
    $scope.itemsPerPage = 3;

    vm.getIssueDetail = () => {
      apiFactory.getIssueById(vm.issueId).then(resp => {
        vm.issueData = resp.data;
        vm.planToMark = resp.data.markedImages.map((x, i) => {
          x.active = i === 0 ? true : false;
          return x;
        });
        vm.totalItems = vm.issueData.comments.length;
        $scope.ArrayComments = vm.issueData.comments.reverse();
        $scope.ArrayActivities = vm.issueData.issueActivity.reverse();

        vm.allComments = $scope.ArrayComments.slice(0, 3);
        vm.allActivities = $scope.ArrayActivities.slice(0, 6);
        $timeout(() => {
          $("#pagination").pagination({
            items: vm.totalItems,
            itemsOnPage: $scope.itemsPerPage,
            cssStyle: "light-theme",
            hrefTextPrefix: "#",
            ordering: false,
            currentPage: 1,
            onPageClick: function(page, event) {
              event.preventDefault();
              setPagingData(page);
            }
          });
          $("#paginationActivity").pagination({
            items: vm.issueData.issueActivity.length,
            itemsOnPage: 7,
            cssStyle: "light-theme",
            hrefTextPrefix: "#",
            ordering: false,
            currentPage: 1,
            onPageClick: function(page, event) {
              event.preventDefault();
              setActivityPagingData(page);
            }
          });
        });
        if (vm.issueData.listAssets && vm.issueData.listAssets.length) {
          vm.issueData.listAssets.map(x => {
            if (x.mimetype == "image/png" || x.mimetype == "image/jpg") {
              vm.ImageAssets.push(x);
            } else {
              vm.DocumentAssets.push(x);
            }
          });
        }
      });
    };

    function setPagingData(page) {
      var pagedData = vm.issueData.comments.slice(
        (page - 1) * $scope.itemsPerPage,
        page * $scope.itemsPerPage
      );
      vm.allComments = pagedData;
      /**to refresh the comments when page click use $apply */
      $scope.$apply();
    }
    function setActivityPagingData(page) {
      var pagedData = vm.issueData.issueActivity.slice(
        (page - 1) * 7,
        page * 7
      );
      vm.allActivities = pagedData;
      /**to refresh the comments when page click use $apply */
      $scope.$apply();
    }

    vm.getIssueDetail();

    //Add comments....
    vm.postComment = function(comment) {
      console.log("comment: ", comment);
      let comment1 = comment.replace(/\n\r?/g, "<br />");
      console.log("comment: ", comment1);

      if (comment == undefined) {
        Notification.error("Please add comment.");
      } else {
        var commentobj = { comment: comment };
        apiFactory
          .postCommentForIssue(vm.issueId, commentobj)
          .then(resp => {
            console.log("esp:", resp);
            vm.getIssueDetail();
            $("#commentarea").val("");
            Notification.success("Comment added successfully..");
          })
          .catch(e => {
            Notification.error("Couldn't update comment");
          });
      }
    };

    $scope.changeCompletionStatus = function() {
      alert("completion");
    };

    //download attachment file
    vm.downloadFile = function(docs) {
      console.log("docs", docs);

      var blob = new Blob([docs], { type: docs.mimetype });
      console.log("blob", blob);
      saveAs(blob, docs.origionalname);
    };

    $scope.reOpenIssue = function() {
      apiFactory
        .reOpenIssueStatusUpdate(vm.issueId)
        .then(resp => {
          vm.getIssueDetail();
          $("#confirmmodal").modal("hide");
          Notification.success("Issue status is now open");
        })
        .catch(e => {
          Notification.error("could not update Status");
        });
    };

    $scope.markIssueAsComplete = function(comment, imageFiles) {
      console.log(comment);
      console.log(imageFiles);
      var editObject = { comment: comment, Images: imageFiles };
      apiFactory
        .saveIssueAsComplete(vm.issueId, editObject)
        .then(resp => {
          vm.getIssueDetail();
          $("#completionstatusmodal").modal("hide");
          Notification.success("Issue is been marked as completed");
        })
        .catch(e => {
          Notification.error(
            "Something wrong happened. couldent update changes"
          );
        });
    };

    /* Issue markings */
    vm.errorImage = "assets/images/enduserissue.png";
    $scope.btnMarker = "../assets/images/gps.png";
    $scope.btnCircle = "../assets/images/circle-shape-outline.png";
    $scope.btnLine = "../assets/images/lineicon.png";
    $scope.btnText = "../assets/images/text-option-interface-symbol.png";

    vm.openEditMarking = () => {
      $("#konva_issue_marker").modal("show");
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

    vm.currentMarkingImage = null;

    const actions = imageMarker.undoRedo();

    vm.actions = action => {
      actions[action]();
    };

    vm.openSliderImage = image => {
      if (!image) {
        return;
      }
      /* Clear action stack before switching to another image */
      actions.reset();
      saveExistingMarking(vm.currentMarkingImage)
        .then(_ => {
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
          $timeout(() => {
            $scope.$apply();
          });
        })
        .catch(e => {
          console.log(e);
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

    vm.updateMarkingInfo = function(markings) {
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
      apiFactory
        .editIssueMarkings(payload)
        .then(resp => {
          Notification.success(resp.data.message);
          vm.getIssueDetail();
        })
        .catch(e => {
          console.log(e);
        });
    };

    vm.modalClose = () => {
      $("#konva_issue_marker").modal("hide");
    };
  }
})();
