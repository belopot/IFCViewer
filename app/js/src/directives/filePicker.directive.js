(() => {
  angular.module("app").directive("filePicker", filePicker);

  function filePicker($rootScope, apiFactory, $timeout, globals, Notification) {
    return {
      restrict: "E",
      templateUrl: "/partials/filePicker.html",
      scope: {
        folders: "=",
        options: "=",
        source: "=",
        sourcefile: "=",
        sourcedir: "="
      },
      link: function($scope, elem, attrs) {
        let folderPaths = [];
        const { projectStore } = globals;
        $scope.files = [];
        $scope.folderName = "Root Folder";
        $scope.currentFolder = "";
        $scope.selectedFolder = null;
        $scope.backBtnView = false;

        $scope.viewFolder = folder => {
          let name = folder.name;
          folderPaths.push(folder);
          $scope.selectedFolder;
          apiFactory
            .viewHierarchy(folder._id)
            .then(resp => {
              $scope.selectedFolder = folder;
              $scope.currentFolder = folder.name;
              $scope.folders = resp.data.folders;
              $scope.files = resp.data.files;
              $scope.breadCrumbs = resp.data.breadcrumbs;
              $scope.folderName = name;
              if ($scope.folderName == "Root Folder") {
                $scope.backBtnView = true;
              } else {
                $scope.backBtnView = false;
              }
            })
            .catch(e => {
              console.log(e);
            });
        };

        $scope.selectFile = (file, breadCrumbs) => {
          file.breadCrumbs = breadCrumbs;
          $rootScope.$broadcast("loader", true);
          $rootScope.$broadcast("selectedRoofPlanDoc", file);
        };

        $scope.back = () => {
          folderPaths.pop();

          const previous = folderPaths[folderPaths.length - 1];
          const apiName = previous ? "viewHierarchy" : "getHierarchy";
          const param = previous ? previous._id : projectStore.get()._id;

          apiFactory[apiName](param)
            .then(resp => {
              $scope.selectedFolder = previous || null;
              $scope.currentFolder = previous ? previous.name : null;
              $scope.folders = previous
                ? resp.data.folders
                : resp.data.data.hierarchies;
              $scope.files = previous ? resp.data.files : [];
              $scope.folderName = previous ? previous.name : "Root Folder";

              if ($scope.folderName == "Root Folder") {
                $scope.backBtnView = true;
              } else {
                $scope.backBtnView = false;
              }
            })
            .catch(e => {
              console.log(e);
            });
        };

        $scope.moveTo = (folder, source) => {
          if (!folder) {
            /* return if no folder is selected */
            return;
          }

          let payload = {
            assetId: $scope.sourcefile._id,
            sourceId: source.$modelValue._id,
            destId: folder._id
          };
          /* Step 1: Move asset */
          apiFactory
            .moveAssets(payload)
            .then(resp => {
              /* Step 2: remove file from the source dir if successful */
              if ($scope.sourcedir) {
                $scope.sourcedir = $scope.sourcedir.filter(
                  x => x._id !== $scope.sourcefile._id
                );
              }
              Notification.success("File Moved Successfully");
              $("#moveTo").modal("hide");
            })
            .catch(e => {
              console.log(e);
            });
        };
      }
    };
  }
})();
