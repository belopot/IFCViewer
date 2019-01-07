(() => {
  angular.module("app").factory("apiFactory", apiFactory);

  function apiFactory(
    $http,
    $state,
    $location,
    localStorageService,
    globals,
    Upload,
    Notification,
    $q
  ) {
    //const url = "http://192.168.10.188:1337",
    const url = "https://api.staging.cloudes.eu",
      //const url = "http://localhost:4200",
      //const url = "http://localhost:1337",
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
      headers3D = (method, token) => {
        return {
          "Content-Type": method === "GET" ? undefined : "application/json",
          "x-access-token": token
            ? localStorageService.get("access-token")
            : undefined,
          key: "favy@123"
        };
      },
      { progress, userStore, logout } = globals;

    return {
      login: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/authenticate",
            method: "POST",
            headers: headers("POST"),
            data: payload
          })
        );
        return promise;
      },
      forgotPassword: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/forgetPassword",
            method: "POST",
            headers: headers("POST"),
            data: payload
          })
        );
        return promise;
      },

      registration: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/dashboardRegistration",
            method: "POST",
            headers: headers("POST"),
            data: payload
          })
        );
        return promise;
      },

      subscribe: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/subscribe",
            method: "POST",
            headers: headers("POST"),
            data: payload
          })
        );
        return promise;
      },

      getCompanyById: function(companyId) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getCompanyById/${companyId}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      listAllUsers: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getadminusers",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      // listAllCountryCode = function (cb) {
      //   $rootScope.apiWait = true;
      //   $http
      //     .get("app/data/common-api/CountryCode.json", vm.getConfig()).then(function (res) {
      //       $rootScope.apiWait = false;
      //       cb(res.data);
      //     },
      //     function (err) {
      //       $rootScope.apiWait = false;
      //       if (err.status) {
      //         vm.showAlert(this, err);
      //       }
      //       else {
      //         cb(err.data);
      //       }
      //     })
      //},

      listAllProjects: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllProjects" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      listAllClients: function(queryObj) {
        // const promise = this.progressify(
        //   $http({
        //     url: url + "",
        //     method: "GET",
        //     headers: headers("GET", true)
        //   })
        // );
        // return promise;
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllClients" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      listAllRoofers: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllRoofers",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      createProject: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/createProject",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      createIssue: function(issueobj) {
        console.log("in create issue api", issueobj);
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/createIssue",
            method: "POST",
            data: issueobj,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      createIssueS3Upload: function(issueobj) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/createIssueForS3",
            method: "POST",
            data: issueobj,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      getIssueById: function(issueID) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getIssueById/${issueID}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      getClientById: function(clientID) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getClientById/${clientID}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      updateIssue: function(issueobj, id) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updateIssue/" + id,
            method: "PUT",
            data: issueobj,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      getProjectRoofPlans: function(projectId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getProjectRoofPlans/" + projectId,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      saveRoofPlan: function(roofPlanId, payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/saveRoofPlan/" + roofPlanId,
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      createMaterials: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/createMaterial",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      createEquipment: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/createEquipment",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      listAllMaterials: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllMaterials" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      listAllComboMaterials: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listComboMaterials" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      listAllEquipments: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllEquipments" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      updateMaterialById: function(id, payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updateMaterialById/" + id,
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      updateEquipmentById: function(id, payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updateEquipmentById/" + id,
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      getMaterialById: function(materialID) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getMaterialById/${materialID}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      getComboMaterialById: function(comboId) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getComboMaterialById/${comboId}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      getEquipmentById: function(id) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getEquipmentById/${id}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      createComboMaterial: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: `${url}/api/createComboMaterial`,
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },
      updateComboMaterialList: function(id, payload) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/updateComboMaterialList/${id}`,
            method: "PUT",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      updateComboMaterial: function(id, payload) {
        const promise = this.progressify(
          Upload.upload({
            url: `${url}/api/updateComboMaterial/${id}`,
            method: "PUT",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },
      showConversionRate: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/showConversionRate",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      // getCurrencyBasedOnCalculationDate: function() {
      //   const promise = this.progressify(
      //     $http({
      //       url: url + "/api/getCurrencyBasedOnCalculationDate",
      //       method: "POST",
      //       headers: headers("POST", true),
      //       data: {
      //         date: new Date()
      //       }
      //     })
      //   );
      //   return promise;
      // },
      getMaterialById: function(id) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getMaterialById/" + id,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      /* Decorate ajax calls with progress bar */
      progressify: promise => {
        return new Promise((resolve, reject) => {
          progress.start();
          promise
            .then(resp => {
              progress.complete();
              resolve(resp);
            })
            .catch(err => {
              progress.complete();
              if (err.status === 401) {
                logout();
              }
              reject(err);
            });
        });
      },

      listAllIssues: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllIssues" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      getIssuesList: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/allIssues",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      isTokenValid: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/isTokenValid",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      setPassword: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/resetPasswordAdmin",
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      updateRoleBasedAccess: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/updateRoleBasedAccess",
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      /* File Manager APIs */
      addHierarchy: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/addHierarchy",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },
      getHierarchyChildren: function(hierarchyId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getHierarchyChildren/" + hierarchyId,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      getHierarchy: function(projectId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getHierarchy/" + projectId + "?depth=2",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      viewProjectAssets: function(projectId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/viewProjectAssets/" + projectId,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      addFileToHierarchy: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/addFileToHierarchy",
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },

      viewHierarchy: function(hierarchyId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/viewHierarchy/" + hierarchyId,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      cloneAssets: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/cloneAssets",
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },
      uploadFileInFileManager: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/uploadFileInFileManager",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      dragMoveNodes: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/dragMoveNodes",
            method: "PUT",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      moveAssets: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/moveAssets",
            method: "PUT",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      deleteAssets: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/deleteAssets",
            method: "PUT",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      //3D-site redirection api call

      get3DPage: function() {
        let token = localStorageService.get("access-token");

        var Data3D = {
          "x-access-token": token,
          projectId: "5b697c030a7e97056835a94a"
        };
        const promise = this.progressify(
          $http({
            url: "https://cloudes-3d.com",
            method: "POST",
            data: Data3D
          })
        );
        return promise;
      },

      //create new client
      createClient: function(client) {
        console.log("client in api factory", client);
        const promise = this.progressify(
          $http({
            url: url + "/api/createClient",
            method: "POST",
            headers: headers("POST", true),
            data: client
          })
        );
        return promise;
      },

      saveHierarchyTree: function(projectId, name) {
        const promise = this.progressify(
          $http({
            url: url + "/api/saveHierarchyTree/" + projectId,
            method: "PUT",
            headers: headers("POST", true),
            data: name
          })
        );
        return promise;
      },

      getSystemTag: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getComboSystemTag",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      bookMarkProject: function(id, added) {
        const promise = this.progressify(
          $http({
            url: url + "/api/bookMarkProject",
            method: "PUT",
            data: {
              projectId: id,
              added: added
            },
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      getBookmarks: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getBookmarks",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      getHierarchyTemplate: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getHierarchyTemplate",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      loadHierarchyTree: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/loadHierarchyTree",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      newFileUpload: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/newFileUpload",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      showProjectFiles: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/showProjectFiles" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      changeProjectTemplate: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/changeProjectTemplate",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      showProjectFiles: function(id, limit) {
        const promise = this.progressify(
          $http({
            url: url + "/api/showProjectFiles/" + id + "?limit=" + limit,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      getProjectById: function(id) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getProjectById/" + id,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      checkAssetDuplicate: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/checkAssetDuplicate",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },
      createNewSupplier: function(supplier) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/addsupplier",
            method: "POST",
            data: supplier,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      getAllSuppliers: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listallsuppliers" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      getAllSubcontractors: function(queryObj) {
        let query = !queryObj // building query string
          ? ""
          : Object.keys(queryObj).reduce((acc, v) => {
              let str = `${v}=${queryObj[v]}&`;
              acc += str;
              return acc;
            }, "?");
        query = query.slice(0, -1); // remove trailing &
        const promise = this.progressify(
          $http({
            url: url + "/api/listallsubcontractor" + query,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      addProjectRoofPlan: function(payload, projectId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/addProjectRoofPlan",
            method: "POST",

            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      generateRoofPlans: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/generateRoofPlans",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      addRoofPlansFromAsset: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/addRoofPlansFromAsset",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      getSupplierById: function(supplierID) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getsupplier/${supplierID}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      createNewSubcontractor: function(subcontractor) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/addsubcontractor",
            method: "POST",
            data: subcontractor,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      getSubcontractorById: function(supplierID) {
        const promise = this.progressify(
          $http({
            url: `${url}/api/getsubcontractor/${supplierID}`,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      issueImage: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/issueImage",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      newIssues3FileUpload: function(payload) {
        console.log("IN S3 ISSUE FUNCTION");
        const promise = this.progressify(
          $http({
            url: url + "/api/newIssues3FileUpload",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      postCommentForIssue: function(id, comment) {
        console.log("Comment: ", comment);
        const promise = this.progressify(
          $http({
            url: url + "/api/addcomment/" + id,
            method: "PUT",
            data: comment,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      saveLocalIssueAsset: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/saveLocalIssueAsset",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      postMarkImg: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/postmarkings",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
        return promise;
      },

      reOpenIssueStatusUpdate: function(id) {
        var IssuestatusObj = { completionStatus: "OPEN" };
        const promise = this.progressify(
          $http({
            url: url + "/api/reopenStatus/" + id,
            method: "PUT",
            data: IssuestatusObj,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      getAllAtOnce: function() {
        // make our own promise
        var deferred = $q.defer();

        // we'll asume that you can put the fruit as part of the path
        var infoPromise = $http({
          url: url + "/api/getadminusers",
          method: "GET",
          headers: headers("GET", true)
        });
        var detailsPromise = $http({
          url: url + "/api/listAllRoofers",
          method: "GET",
          headers: headers("GET", true)
        });
        // $http.get(url + "/api/listAllRoofers");

        $q.all([infoPromise, detailsPromise]).then(function(data) {
          deferred.resolve({
            fruitInfo: data[0],
            fruitDetails: data[1]
          });

          return deferred.promise;
        });
      },

      saveIssueAsComplete: function(id, object) {
        console.log(object);
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/markissueascomplete/" + id,
            method: "PUT",
            data: object,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      addStaffMember: function(staff, id) {
        const promise = this.progressify(
          $http({
            url: url + "/api/addstaffmember/" + id,
            method: "PUT",
            data: staff,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      saveSystemTag: function(object) {
        const promise = this.progressify(
          $http({
            url: url + "/api/createTag",
            method: "POST",
            data: object,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      getAllSystemTags: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getTagsList",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      deleteSystemTag: function(id) {
        const promise = this.progressify(
          $http({
            url: url + "/api/deletetag/" + id,
            method: "DELETE",
            headers: headers("DELETE", true)
          })
        );
        return promise;
      },

      updateSubcontractor: function(subcontractor) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updatesubcontractor/" + subcontractor._id,
            method: "PUT",
            data: subcontractor,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },
      updateSupplier: function(supplier) {
        console.log(supplier);
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updatesupplier/" + supplier._id,
            method: "PUT",
            data: supplier,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },
      //Create New Todo
      createTodoList: function(input) {
        console.log(input);
        const promise = this.progressify(
          $http({
            url: url + "/api/createTodo",
            method: "POST",
            data: input,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      //lis all todo
      listAllTodoList: function(id) {
        let apiURL = !!id
          ? "/api/getTodoList?todoId=" + id
          : "/api/getTodoList";
        const promise = this.progressify(
          $http({
            url: url + apiURL,

            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      //update todo
      updateTodoList: function(id, object) {
        const promise = this.progressify(
          $http({
            url: url + "/api/updateTodoList/" + id,
            method: "PUT",
            data: object,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },
      getAllMembersInCurrentCompany: function(companyId) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getCurrentCompanyMembers/" + companyId,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      createEvent: function(input) {
        console.log(input);
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/createEvent",
            method: "POST",
            data: input,
            headers: headers("POST", true)
          })
        );
        return promise;
      },

      updateMyEvent: function(input, eventId) {
        console.log(input);
        const promise = this.progressify(
          $http({
            url: url + "/api/updateEvent/" + eventId,
            method: "PUT",
            data: input,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },

      //list all events
      getAllEvents: function(id) {
        let apiURL = !!id
          ? "/api/getAllEvents?eventId=" + id
          : "/api/getAllEvents";
        const promise = this.progressify(
          $http({
            url: url + apiURL,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      getAccessMeetingRoomToken: function() {
        const promise = $http({
          url: url + "/api/getAccessMeetingRoomToken",
          method: "GET",
          headers: headers("GET", true)
        });
        return promise;
      },
      /* TODO: */
      inviteUsersToMeeting: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/inviteUsersToMeeting",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      newMeetingFileMessage: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/newMeetingFileMessage",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      getMeetingTodo: function(payload) {
        const promise = $http({
          url: url + "/api/getMeetingTodo",
          method: "POST",
          data: payload,
          headers: headers("POST", true)
        });
        return promise;
      },
      changeCompanyCurrency: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/changeCompanyCurrency",
            method: "PUT",
            data: payload,
            headers: headers("PUT", true)
          })
        );
        return promise;
      },
      getTwilioAccessToken: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getTwilioAccessToken",
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },

      createInvoice: function(payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/createInvoice",
            method: "POST",
            data: payload,
            headers: headers("POST", true)
          })
        );
        return promise;
      },
      listAllProjectInvoice: function(projectTag) {
        const promise = this.progressify(
          $http({
            url: url + "/api/listAllProjectInvoice/" + projectTag,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      },
      editIssueMarkings: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/editIssueMarkings",
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },
      updateCompanyLogo: function(payload) {
        const promise = this.progressify(
          Upload.upload({
            url: url + "/api/updateCompanyLogo",
            method: "POST",
            headers: headers("POST", true),
            data: payload
          })
        );
      },
      updateCompanyById: function(companyId, payload) {
        const promise = this.progressify(
          $http({
            url: url + "/api/updateCompanyById/" + companyId,
            method: "PUT",
            headers: headers("PUT", true),
            data: payload
          })
        );
        return promise;
      },
      getAllSystemTags: function() {
        const promise = this.progressify(
          $http({
            url: url + "/api/getAllSystemTags",
            method: "GET",
            headers: headers("PUT", true)
          })
        );
        return promise;
      },
      listAllStaffs: function(id) {
        const promise = this.progressify(
          $http({
            url: url + "/api/getAllStaffs/" + id,
            method: "GET",
            headers: headers("GET", true)
          })
        );
        return promise;
      }
    };
  }
})();
