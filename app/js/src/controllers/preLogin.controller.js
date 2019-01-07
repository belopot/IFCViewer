(() => {
  angular.module("app").controller("preLoginCtrl", preLoginCtrl);

  function preLoginCtrl(
    $scope,
    $timeout,
    $state,
    authFactory,
    apiFactory,
    globals,
    localStorageService,
    Notification,
    NgMap
  ) {
    /* Requiring vars */
    let vm = this;
    const { progress, logout, userStore } = globals;
    vm.loggedIn = false;

    if (authFactory.checkUser()) {
      $state.go("dashboard");
      vm.loggedIn = true;
      return;
    }

    /* Google map config */

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
      markers: [[28.7041, 77.1025], [13.0827, 80.2707]]
    };

    NgMap.getMap().then(map => {
      map.setOptions({
        styles: vm.gmap.styles,
        disableDefaultUI: true,
        zoom: 2,
        center: {
          lat: 28.7041,
          lng: 77.1025
        }
      });
    });

    /* Login */
    // $scope.login = function (isValid) {
    //   if (isValid) {
    //     alert()
    //     var formData = {
    //       email: $scope.username,
    //       password: $scope.password
    //     }
    //     console.log(formData)
    //     apiFactory
    //       .login(formData)
    //       .then(resp => { })
    //       .catch(err => { });
    //   }
    // }
    vm.regsiterModal = () => {
      $("#loginModal, #forgotPassModal").modal("hide");
      $("#registerModal").modal("show");
    };
    vm.loginModal = () => {
      $("#registerModal, #forgotPassModal").modal("hide");
      $("#loginModal").modal("show");
    };
    vm.forgotPassModal = () => {
      $("#loginModal").modal("hide");
      $("#forgotPassModal").modal("show");
    };

    vm.login = (isValid, formData) => {
      console.log(formData);
      apiFactory
        .login(formData)
        .then(resp => {
          $("#loginModal").modal("hide");
          $("body").removeClass("modal-open");
          $(".modal-backdrop").hide();
          localStorageService.set("access-token", resp.data.token);
          userStore.set(resp.data.user);
          $state.go("dashboard");
          Notification.success("Login success");
        })
        .catch(err => {
          Notification.error(err.data.message);
        });
    };

    vm.forgotPass = (isValid, formData) => {
      if (formData == undefined) {
        Notification.error("please Valid mail Id");
      } else {
        var data = formData;
        apiFactory
          .forgotPassword(data)
          .then(resp => {
            $("#forgotPassModal").modal("hide");
            Notification.success(resp.data.message);

          })
          .catch(err => {
            Notification.error(err.data.message);
          });
      }
    };

    vm.register = (isValid, formData) => {
      apiFactory
        .registration(formData)
        .then(resp => {
          $("#registerModal").modal("hide");
          Notification.success(resp.data.message);
        })
        .catch(err => {
          $("#registerModal").modal("hide");
          Notification.error(err.data.message);
        });
    };

    vm.subscribe = email => {
      let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        Notification.error("Invalid email");
        return;
      }
      apiFactory
        .subscribe({ email: email })
        .then(resp => {
          vm.subscribeEmail = "";
          Notification.success(resp.data.message);
        })
        .catch(err => {
          Notification.error(err.data.message);
        });
    };
  }
  (function($) {
    $(window).on("load", function() {
      $("#registerModal .modal-body").mCustomScrollbar({
        setHeight: 340,
        theme: "minimal-dark"
      });
    });
  });
})();
