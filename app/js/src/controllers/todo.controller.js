(() => {
  angular.module("app").controller("todoCtrl", todoCtrl);

  function todoCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    Upload,
    moment
  ) {
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
    vm.dummy = [
      { name: "select 1." },
      { name: "select 2." },
      { name: "select 3." },
      { name: "select 4." },
      { name: "select 5." }
    ];

    vm.todayDate = moment()
    vm.dateFormat = 'YYYY/MM/DD hh:mm:ss';
    
    vm.createTodoList = (formData, valid) => {
      if (valid) {
        $("#todo_modal").modal("hide");
        var data = formData;
        data.date = moment(data.date).format('YYYY/MM/DD hh:mm:ss')
        apiFactory
          .createTodoList(data)
          .then(resp => {
            return apiFactory.listAllTodoList();
          })
          .then(listTodos)
          .catch(err => {
            Notification.error(err.data.message);
          });
      } else {
        Notification.error("Please fill all the details");
      }
    };
    
    vm.todayDate = new Date()

    vm.resetForm = (res)=>{
      vm.todoData = {};
    }
    
    apiFactory
      .getAllMembersInCurrentCompany(userStore.get().companyId)
      .then(resp => {
        vm.companyUsers = resp.data.data;
        console.log(vm.companyUsers);
      })
      .catch(err => {
        Notification.error(err.data.message);
      });

    apiFactory
      .listAllTodoList()
      .then(listTodos)
      .catch(err => {
        Notification.error(err.data.message);
      });

    /* Load todos */
    function listTodos(resp) {
      $scope.todo_list = resp.data.data;
    }
  }
})();
