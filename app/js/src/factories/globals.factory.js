(() => {
  angular.module("app").factory("globals", globals);

  function globals(
    $http,
    $state,
    $location,
    ngProgressFactory,
    Notification,
    localStorageService
  ) {
    /* To avoid redundant function calls of the same type (Eg. multiple token expired messages) */
    let throttler = (() => {
      let enabled = true;
      return fn => {
        if (enabled) {
          enabled = false;
          setTimeout(() => {
            enabled = true;
          });
          fn();
        }
      };
    })();

    return {
      progress: (() => {
        let progressbar = ngProgressFactory.createInstance();
        return progressbar;
      })(),
      logout: () => {
        localStorageService.remove("access-token");
        localStorageService.remove("userData");
        localStorageService.remove("companyData");
        localStorageService.set("currentProject", null);
        localStorageService.remove("inventoryState");

        $state.go("preLogin");
        throttler(() => Notification.error("Please login"));
      },
      /* Access user info globally */
      userStore: (() => {
        let userData = localStorageService.get("userData") || {};

        return {
          set: data => {
            const userRoles = [
              "admin",
              "manager",
              "sub_contractor",
              "team_leader",
              "worker"
            ];
            data.privilege = userRoles.indexOf(data.designation);

            localStorageService.set("userData", data);
            userData = data;
            return userData;
          },
          get: () => userData,
          reset: () => {
            localStorageService.remove("userData");
            userData = {};
          }
        };
      })(),

      companyStore: (() => {
        let companyData = localStorageService.get("companyData") || null;

        return {
          set: data => {
            localStorageService.set("companyData", data);
            companyData = data;
            return companyData;
          },
          get: () => companyData,
          /* Call refetch when company dependant data is modified */
          refetch: id => {
            $http({
              method: "GET",
              headers: {
                "x-access-token": localStorageService.get("access-token"),
                platform: JSON.stringify({ source: "web" })
              },
              url: `https://api.staging.cloudes.eu/api/getCompanyById/${id}`
            })
              .then(resp => {
                localStorageService.set("companyData", resp.data);
              })
              .catch(e => {
                console.log(e);
              });
          },
          reset: () => {
            localStorageService.remove("companyData");
            companyData = {};
          }
        };
      })(),

      projectStore: (() => {
        let currentProject = localStorageService.get("currentProject") || null;
        return {
          set: data => {
            localStorageService.set("currentProject", data);
            currentProject = data;
            return currentProject;
          },
          get: () => localStorageService.get("currentProject"),
          reset: () => {
            localStorageService.remove("currentProject");
            currentProject = null;
          }
        };
      })(),

      inventoryState: () => {
        let state = localStorageService.get("inventoryState") || {
          tab: 0,
          searchText: "",
          page: {
            material: 1,
            combo: 1
          }
        };

        return {
          setPage: (type, value) => {
            state.page[type] = value;
            localStorageService.set("inventoryState", state);
          },
          setTab: val => {
            state.tab = val;
            localStorageService.set("inventoryState", state);
          },
          text: text => {
            state.searchText = text;
            localStorageService.set("inventoryState", state);
          },
          get: () => {
            return state;
          }
        };
      },

      mUnits: [
        {
          name: "mt",
          value: "mt"
        },
        {
          name: "sq.mt",
          value: "sq.mt"
        },
        {
          value: "cu.mt",
          name: "cu.mt"
        },
        {
          name: "ft",
          value: "ft"
        },
        {
          name: "sq.ft",
          value: "sq.ft"
        },
        {
          value: "cu.ft",
          name: "cu.ft"
        },
        {
          value: "unit",
          name: "unit"
        }
      ],

      getCurrency: () => {
        return $http.get("/data/currencies.json");
      },
      getCountryCode: () => {
        return $http.get("/data/CountryCode.json");
      },
      getIndustry: () => {
        return $http.get("/data/industry.json");
      },

      debounce: rate => {
        let timer;
        return function(fn, args) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            fn.apply(null, args);
          }, rate);
        };
      },

      genericStore: () => {
        let item;
        return {
          store: val => {
            item = val;
          },
          get: () => {
            return item;
          }
        };
      },

      /**
       * @param {String} pdfLink
       * @returns {Object[]} - links of individual pages as image (cloudinary)
       */

      extractPagesFromPdf: (pdfLink, pageCount) => {
        return [...Array(pageCount).keys()].reduce((acc, _, i) => {
          let pageObj = {
            pageNo: i,
            url: pdfLink
              .replace("/upload/", `/upload/pg_${i + 1}/`)
              .replace(/\.pdf$/, ".png"),
            title: `title_${Date.now()}`,
            selected: false,
            description: ""
          };
          acc.push(pageObj);
          return acc;
        }, []);
      },

      /**
       * @param {Object} pdf - File object
       * @returns {Promise}
       */

      createPagesFromPdf: pdf => {
        return new Promise((resolve, reject) => {
          pdfjsLib
            .getDocument(pdf.secure_url)
            .promise.then(doc => {
              Promise.all(
                [...Array(doc.numPages).keys()].map((_, i) =>
                  doc.getPage(i + 1)
                )
              )
                .then(pages => {
                  resolve(
                    pages.map((x, i) => {
                      (x.pageNo = i), (x.title = `title_${Date.now()}`);
                      x.selected = false;
                      x.description = "";
                      return x;
                    })
                  );
                })
                .catch(e => {
                  reject(e);
                });
            })
            .catch(e => {
              console.log(e);
              reject(e);
            });
        });
      },

      renderPage: (page, canvas) => {
        var viewport = page.getViewport(
          canvas.width / page.getViewport(1).width
        );
        var context = canvas.getContext("2d");
        canvas.height = viewport.height;

        var task = page.render({
          canvasContext: context,
          viewport: viewport
        });
      }
    };
  }
})();
