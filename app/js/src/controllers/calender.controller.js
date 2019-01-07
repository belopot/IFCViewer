(() => {
  angular.module("app").controller("calenderCtrl", calenderCtrl);

  function calenderCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    NgMap,
    Upload
  ) {

    $scope.invitees = [
        { id: '1', img: '/assets/images/user_pic2.png', name: 'Lisa Guerrero', lb: true, 'status': false },
        { id: '2', img: '/assets/images/user_pic3.png', name: 'Peter Gregor', lb: false, 'status': false },
        { id: '3', img: '/assets/images/user_pic2.png', name: 'Lisa Guerrero', lb: false, 'status': false },
        { id: '4', img: '/assets/images/user_pic3.png', name: 'Peter Gregor', lb: false, 'status': false }
    ]
    
    /* Requiring vars */
    let vm = this;
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }
    vm.logout = () => {
        logout();
    };
    /* Get project list */
    vm.userData = userStore.get();

    vm.tabChange = (val) => {
      $(".eventmodal .nav-tabs li .nav-link").removeClass("active");
      $(".eventmodal .nav-tabs li .nav-link").eq(val).addClass("active");

      $(".eventmodal .tab-content .tab-pane").removeClass("active");
      $(".eventmodal .tab-content .tab-pane").removeClass("show");
      $(".eventmodal .tab-content .tab-pane").eq(val).addClass("show");
      $(".eventmodal .tab-content .tab-pane").eq(val).addClass("active");
    }

    vm.gmap = {
      url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU&libraries=places",
      markers: [],
      styles: [],
      center: "41,-87",
      zoom: 3
    };
    let gObjLocation = {coordinates:[],address:''};

    vm.placeMarker = function (map) {
      console.log(this.getPlace())
      const placeData = this.getPlace().geometry.location;
      console.log(placeData)
      vm.gmap.markers = [
        [placeData.lat(), placeData.lng()]
      ];
      vm.gmap.zoom = 15;
      vm.gmap.center = `${placeData.lat()},${placeData.lng()}`;
     // vm.event.location =  [placeData.lat(), placeData.lng()]
      gObjLocation.coordinates  = [placeData.lat(), placeData.lng()]
      gObjLocation.address = this.getPlace().formatted_address;
      console.log(gObjLocation)
    };
    vm.inputImg = [];
    vm.uploadImg = [];
    vm.event={
      'listAssets':[]
    }
    vm.inputFiles = [];
    vm.uploadFiles = [];

    vm.fileUpdated = (files, event, modal) => {
      let fileObj = event.target.files;
      console.log( vm.fileNames)
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      console.log( vm.fileNames)
      angular.forEach(files, function(x, index) {
        x.description = "";
        if(modal == 'image') {
          if(vm.uploadImg.length == 0) {
            vm.uploadImg.push(x)
          } else {
            let duplicateImg = false
            angular.forEach(vm.uploadImg, function (y) {
              if(x.name == y.name) {
                duplicateImg = true
                return
              }
            });
            if (!duplicateImg) {
              vm.uploadImg.push(x)
            } else {
              Notification.error('File name already exist');
            }
          }
        } else {
          if(vm.uploadFiles.length == 0) {
            vm.uploadFiles.push(x)
          } else {
            let duplicateImg = false
            angular.forEach(vm.uploadFiles, function (y) {
              if(x.name == y.name) {
                duplicateImg = true
                return
              }
            });
            if (!duplicateImg) {
              vm.uploadFiles.push(x)
            } else {
              Notification.error('File name already exist');
            }
          }
        }
      });
    };

    NgMap.getMap().then(map => {
      vm.map = map;
      map.setOptions({
        styles: vm.gmap.styles,
        disableDefaultUI: true,
        zoomControl: true,
        zoom: 1,
        center: {
          lat: 0,
          lng: 0
        }
      });
    });

    vm.todayDate = moment()
    vm.dateFormat = 'YYYY/MM/DD hh:mm:ss';
    vm.resetForm = (res)=>{
      vm.event = {};
      vm.uploadImg = [];
      vm.uploadFiles = [];
      vm.getAllMembersInCurrentCompany();
    }
    vm.createNewEvent = (formData) => {
      $("#new_event").modal("hide");  
      let imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);
      var data = formData;
      data.date = moment(data.date).format('YYYY/MM/DD hh:mm:ss')
      data.location = gObjLocation;
      data.listAssets =  imgAndFiles;
      console.log(data);
      apiFactory.createEvent(data).then(resp => {                  
        Notification.success(resp.data.message);   
        return apiFactory.getAllEvents()
      })
      .then(listAllEventsData)
      .catch(err => {
        console.log(err);
        Notification.error(err.data.message);
      });
    };

    vm.updateEvent = (formData) => {
      $("#event_details").modal("hide");
      let imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);  
      var data = formData;
      data.location = gObjLocation;
      data.listAssets = imgAndFiles;

      apiFactory.updateMyEvent(data,formData._id).then(resp => {       
        return apiFactory.getAllEvents()
      })
      .then(listAllEventsData)
      .catch(err => {
        console.log(err);
        Notification.error(err.data.message);
      });
    };

    vm.deleteFile = (indexVal,type) => {
      if (type == "image") {
        vm.uploadImg.splice(indexVal, 1);
      } else {
        vm.uploadFiles.splice(indexVal, 1);
      }
      //vm.event.listAssets.splice(indexVal, 1)
    };

    vm.descriptionPopover = (indexVal, type) => {
      $scope.fileType = type;
      $scope.fileIndex = indexVal;
    };
    let gAryCompanyMembers = [];

    apiFactory.getAllEvents()
    .then(listAllEventsData)
    .catch(err => {
      console.log(err);
      Notification.error(err.data.message);
    });

    /* List All Events */
    function listAllEventsData(resp){
      let calendar = $('#calendar');
      let lAryEventsData = []
      for(let v of resp.data.data){
        lAryEventsData.push({
          'title' : v.name,
           'start':v.date,
          '_id':v._id,
          'allDay':false
        })
      }
      console.log(lAryEventsData, "lAryEventsData")
      var bgEvent = {
        id: -1,
        start: null,
        end: null,
        rendering: 'background',
        backgroundColor: 'orange'
      };

      calendar.fullCalendar({
        header: {
            left: 'Calendar',
            center: 'title,prev,next today',
            right: 'month,agendaWeek,agendaDay,listWeek'
        },
        eventClick: (calEvent, jsEvent, view) => {
          let getRes = resp.data.data.filter(res => res._id === calEvent._id);
          vm.event = getRes[0];
          vm.event.view = moment(vm.event.date).format('YYYY/MM/DD hh:mm:ss')
          vm.event.companyMembers = gAryCompanyMembers;
          vm.todayDate = vm.event.date;
          vm.uploadImg = vm.event.listAssets.images;
          vm.uploadFiles = vm.event.listAssets.docs;
          vm.event.location = vm.event.location.address;

          console.log(vm.event)
          angular.forEach(vm.event.listAssets, function (x, index) {
            console.log(x)
            x.description = '';
          });
         // vm.inputFiles = vm.event.listAssets;
          $scope.$apply();

          console.log(vm.event);
          console.log( vm.inputFiles );
          $('#event_details').modal("show")

          /* apiFactory.getAllEvents(calEvent._id).then(resp => {   
            vm.event = resp.data.data;
            vm.event.date = moment( vm.event.date).format('YYYY/MM/DD')
            $('#event_details').modal("show")
          }).catch(err => {
            Notification.error(err.data.message);
          }); */
      
        },
        // eventMouseover: function (event, jsEvent, view) {
        //     //console.log('in');
        //     bgEvent.start = event.start;
        //     bgEvent.end = event.end;
        //     var events = calendar.fullCalendar('clientEvents', bgEvent.id);
        //     if (events.length) {
        //         var e = events[0];
        //         calendar.fullCalendar('updateEvent', e);
        //     }
        //     else
        //         calendar.fullCalendar('renderEvent', bgEvent);
        // },
        // eventMouseout: function (event, jsEvent, view) {
        //     //console.log('out');
        //     calendar.fullCalendar('removeEvents', bgEvent.id);
        // },
        defaultDate: new Date(),
        editable: true,
        //eventLimit: true, // allow "more" link when too many events
        events: lAryEventsData
      });
    }

    vm.getAllMembersInCurrentCompany =()=>{
      apiFactory.getAllMembersInCurrentCompany(vm.userData.companyId).then(data1=>{
        console.log(data1)
        gAryCompanyMembers = data1.data.data;
        vm.event = (!!vm.event) ? vm.event : {};
        vm.event.companyMembers = gAryCompanyMembers;
        return data1.data.data;
      }).catch(err => {
        console.log(err);
        Notification.error(err.data.message);
      });
    }
    vm.getAllMembersInCurrentCompany();
  }
})();
