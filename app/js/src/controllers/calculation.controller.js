(() => {
  angular.module("app").controller("calculationCtrl", calculationCtrl);

  function calculationCtrl(
    $scope,
    $timeout,
    $location,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals
  ) {
    /* Requiring vars */
    let vm = this;
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }
    $scope.isEdit=false;

    /* Get project list */
    vm.userData = userStore.get();
    vm.logout = () => { logout(); };
    $scope.inputevent;
    $scope.isEdit=false;
    $scope.outerIndex=0;
    $scope.innerIndex=0;
    $scope.openSelectBox = false;
    $scope.tableInventory=[];
    $scope.Inventory = [];
    vm.addedColumn=false;
    
    vm.globalinindex;

    vm.TampArray = [[{name:"material1",cost:[{code1:"material code1.1", code2:"level 3.1"}]},
                     {name:"material2",cost:[{code1:"material code1.2", code2:"level 3.1"}]},
                     {name:"material3",cost:[{code1:"material code1.3", code2:"level 3.1",
                        code3:[{naming:"material naming"},{naming:"material naming1",codesubject:[{codesubject:"11111111111"}]}
                       ]}]}],

                     [{name:"combomaterial1",cost:[{code1:"combomaterial code2.1", code2:"level 3.1"}]},
                     {name:"combomaterial2",cost:[{code1:"combomaterial code2.2", code2:"level 3.1"}]},
                     {name:"combomaterial3",cost:[{code1:"combomaterial code2.3", code2:"level 3.1"}]}],

                     [{name:"equipment1",cost:[{code1:"equipment code3.1", code2:"level 3.1"}]},
                     {name:"equipment2",cost:[{code1:"equipment code3.2", code2:"level 3.1"}]},
                     {name:"equipment3",cost:[{code1:"equipment code3.3", code2:"level 3.1"}]}],
  
                ];

    Promise.all([
      apiFactory.listAllMaterials(),
      apiFactory.listAllComboMaterials(),
      apiFactory.listAllEquipments()
    ])
      .then(resp => {
        vm.itemList = [].concat(
          resp[0].data.list,
          resp[1].data.list,
          resp[2].data.list
        );
        $scope.getFirstInventory();
        console.log("items all:",vm.itemList);
       
          return new Promise((resolve, reject) => {
            resolve(vm.itemList);
          });
        
      })
      .catch(e => {
        console.log(e);
      });
   
      //make table editable
      $scope.MakeTableEditable=function(){
        $scope.isEdit=true;
      };
      //saving editing
      $scope.saveEditing = function(){
        $scope.isEdit=false;
      };
      $scope.Inventory1=[];
      $scope.getFirstInventory = function(){
       console.log(" n $scope.tableInventory: ");
       $scope.tableInventory=[[{},{},{},{}],[{},{},{},{}]]
       console.log("$scope.tableInventory: ",$scope.tableInventory);
       
      }

     
      $scope.openSelect=function(outindex){
        vm.addrowIndex=outindex;
        $scope.openSelectBox = true;
      }
      $scope.addedNewInventory=function(selected,index,childindex){
        console.log("parent: ",index);
        console.log("child: ",childindex);
      $scope.selectedMaterial=selected;
     
      
      
     // $scope.selectedMaterial.isEdit=false;
      $scope.tableInventory[index][childindex]=$scope.selectedMaterial;

     // $scope.Inventory[$scope.innerIndex]=$scope.selectedMaterial;
      //$scope.tableInventory[index]=$scope.Inventory;
     // $scope.innerIndex=$scope.innerIndex+1;
      console.log("outer index changed...",  $scope.tableInventory);
      $scope.filterCity=[];
      $scope.openSelectBox=false;
      $scope.getTotal();
      }

      $scope.materialSelection = item => {
        $scope.selectedMaterial = item;
        
      };

    $('.payrollList').DataTable();
   
  $scope.headers=[
    {name:' '},
    {name:'No'},
    {name:'Material Name'},
    {name:'Amount'},
    {name:'Unit'},
    
    {name:'Materials cost'},
    {name:'Labor cost'},
    {name:'Labor hrs'},
    {name:'Company cost'},
    {name:'Profit in %'},
    {name:'Profit'},
    {name:'Sales price'},
    {name:''}
  ]

  $( document ).ready(function() {

    $('#button_left').hide();
 
    
});
  $scope.leftClick = function(){
    if($('.example-one-header').scrollLeft() <= 100 )
    {$('#button_left').hide()}
    $('#button_right').show();
    $('.example-one-header').animate({
      scrollLeft: "-=100px"
    }, "slow");
  };
  $scope.rightClick = function(){
    if ($('.example-one-header').scrollLeft() >= 200)
    {$("#button_right").hide()}
  $('#button_left').show(); 
    $('.example-one-header').animate({
      scrollLeft: "+=250px"
    }, "slow");
  };

  vm.deleteInventory=function(index,array){
    console.log("index: ",index, "AND array : ",array   );
    if(array.length==4){
      array.splice(index, 1);
      array.push({});
    }
    else{
      array.splice(index, 1);
    }

  };

  vm.editInventory = function(index,item){
    //item.isEdit=true;
    $scope.updateToInventory=item;
  //  $scope.selectedIndex=index;
  //   $("#updatequantity").modal("show");
  };

  vm.updateQuantity=function(quantity,item){
   // item.isEdit=false;
    item.matcost=item.materialCost.value*quantity;
    item.roofcost=item.rooferCost.value*quantity;
    console.log("updated: ," ,item);
    $scope.getTotal();
   // $("#updatequantity").modal("hide");
  };

  $scope.addProjectPlan = function(){
    $scope.tableInventory.push([{},{},{},{}]);
   
  }

  $scope.getTotal = function() {
    $scope.mattotal = 0;
    $scope.rooftotal=0;
    if($scope.tableInventory.length>0){
      angular.forEach($scope.tableInventory, function(te) {
        angular.forEach(te,function(e){
          $scope.mattotal = $scope.mattotal+e.matcost;
          $scope.rooftotal = $scope.rooftotal+e.roofcost;
          
        })
      });
      
    }
  
};

$scope.addColumn = function(word){
 // $scope.header1 = angular.copy($scope.headers);
//  $scope.headers.unshift({name:''});

  $scope.headers.push({
    name:''
  });
  // vm.addedColumn=true;
  // console.log("headers: ",$scope.headers);
};


vm.out;
vm.in;
$scope.searchFunction= function(searchText,parent,child){
  vm.out=parent; vm.in=child;
  
  
  var output = [];
  if (searchText.length >= 3) {
    angular.forEach(vm.itemList , function(item) {
      if (item.name.toLowerCase().indexOf(searchText.toLowerCase()) >= 0) {
        output.push(item);
      }else{
       
      }
    });
  }
  $scope.filterCity = output;
  if(!$scope.filterCity.length>0){
    if(searchText.length >5){
      console.log("in not filter funtion: ");
      $scope.selectedMaterial={};
      $scope.selectedMaterial.Quantity=1;
      $scope.selectedMaterial.name=searchText;
      $scope.tableInventory[parent].push($scope.selectedMaterial);
      $scope.filterCity=[];
      $scope.openSelectBox=false;
      $scope.getTotal();
    }
    
  }
};

$scope.selectedItem = function(item,index,array){
  item.Quantity=1;
  array[index]=item;
  $scope.filterCity=[];
};

$scope.openTree = function(index,icon){
  
  if(icon.collapsed){
    icon.toggle();

  }else{
    icon.collapsed=false;
    icon.toggle();
   
  }

}

$scope.openSubTree = function(index,icon){
  if(icon.collapsed){
    icon.toggle();

  }else{
    icon.collapsed=false;
    icon.toggle();
   
  }
};

$scope.addNewRow = function(index){
  $scope.newRow={};
  $scope.tableInventory[index].push($scope.newRow);
}



vm.liSelected;
vm.indexList = -1;

document.addEventListener('keydown', function(event) {
 let ul = document.getElementById('calclistid');
  console.log("arrow key ",ul);
  var len = ul.getElementsByTagName('li').length-1;
  if(event.which === 40) {
      vm.indexList++;
      if (vm.liSelected) {
        removeClass(vm.liSelected, 'selected');
        $scope.next = ul.getElementsByTagName('li')[vm.indexList];
        if(typeof $scope.next !== undefined && vm.indexList <= len) {
        
                  vm.liSelected = $scope.next;
              } else {
                 vm.indexList = 0;
                   vm.liSelected = ul.getElementsByTagName('li')[0];
              }
              addClass(vm.liSelected, 'selected');
              console.log(vm.indexList);
      }
      else {
      vm.indexList = 0;
      
        vm.liSelected = ul.getElementsByTagName('li')[0];
         addClass(vm.liSelected, 'selected');
      }
  }
  else if (event.which === 38) {
  
    //up
      if (vm.liSelected) {
        removeClass(vm.liSelected, 'selected');
        vm.indexList--;
        console.log(vm.indexList);
        $scope.next = ul.getElementsByTagName('li')[vm.indexList];
        if(typeof $scope.next !== undefined && vm.indexList >= 0) {
                  vm.liSelected = $scope.next;
              } else {
                  vm.indexList = len;
                   vm.liSelected = ul.getElementsByTagName('li')[len];
              }
              addClass(vm.liSelected, 'selected');
      }
      else {
      vm.indexList = 0;
        vm.liSelected = ul.getElementsByTagName('li')[len];
        addClass(vm.liSelected, 'selected');
      }
    }
  
},false);

  }
})();
