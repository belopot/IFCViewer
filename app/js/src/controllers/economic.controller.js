(() => {
  angular.module("app").controller("economicCtrl", economicCtrl);

  function economicCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    NgMap,
    Upload,
    moment,
    $location
  ) {
    /* Requiring vars */
    let vm = this;
    const { logout, userStore, debounce } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    /* Get project list */
    vm.userData = userStore.get();
    
    console.log(vm.userData)
    vm.logout = () => {
      logout();
    };

    /* $scope.activeClass = function (path) {
      return ($location.path().substr(0, path.length) === path) ? 'active' : '';
    } */
    $scope.activeClass = function (path) {
      return ($location.path() === path) ? 'active' : '';
    }

    vm.animateElements = () => {
      $('.progressbar').each(function () {
        var elementPos = $(this).offset().top;
        var topOfWindow = $(window).scrollTop();
        var percent = $(this).find('.circle').attr('data-percent');
        var percentage = parseInt(percent, 10) / parseInt(100, 10);
        var animate = $(this).data('animate');
        if (elementPos < topOfWindow + $(window).height() - 30 && !animate) {
          $(this).data('animate', true);
          $(this).find('.circle').circleProgress({
            startAngle: -Math.PI / 2,
            value: percent / 100,
            size: 180,
            thickness: 8,
            emptyFill: "rgba(0,0,0, .2)",
            fill: {
              color: '#43f6fd'
            }
          }).on('circle-animation-progress', function (event, progress, stepValue) {

            $(this).find('div').text((stepValue * 100).toFixed(0));
          }).stop();
        }
      });
    }
    // Show animated elements
    vm.animateElements();
    $(window).scroll(vm.animateElements());

  }
})();
