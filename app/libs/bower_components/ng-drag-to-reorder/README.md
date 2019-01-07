# ng-drag-to-reorder

Lightweight AngularJS drag and drop functionality to reorder lists, table rows, etc. without any dependencies other than Angular. Works great with ng-repeats!

## Demos: 

- [`Avengers Demo`](http://htmlpreview.github.io/?https://github.com/mhthompson86/ng-drag-to-reorder/blob/master/demo/index.html)
- [`CSS Classes`](http://htmlpreview.github.io/?https://github.com/mhthompson86/ng-drag-to-reorder/blob/master/demo/css-classes.html)


## Install:

```shell
$ npm install ng-drag-to-reorder
```
or
```shell
$ bower install ng-drag-to-reorder
```

## Inject into your Angular app

- Add **ngDragToReorder** as a dependency to your module in your application.

```js
angular.module('yourApp', ['ngDragToReorder']);
```

## How to Use:

There are 2 fundamental options when deciding how you want this to work.  You can either **1)** listen for the `dragToReorder.dropped` 
on your controller and then update your collection based on the data that was passed back or **2)**
use 2-way binding to directly update the collection that is being passed in.
If you want to modify your collection based on the reordering outcome, the first option is probably best.

### 1) Listening for the dropped event and then doing something with the newly reordered collection.
- Add the `drag-to-reorder` attribute to the parent element and pass it the collection you want it to track.
Then on the draggable elements, add the `dtr-draggable` attribute.

```html
<ul drag-to-reorder="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" dtr-draggable>
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
```

- Then in your controller, listen for the `dragToReorder.dropped` event and do something with the data that's passed in.
The `dragToReorder.dropped` event is broadcasted when an item is dropped and will contain the relevant data,
allowing your controllers to know when the list has been reordered and react to the changes.
(See #4 `dtrEvent` in **Options** below on how you can customize the event name.)

```js
$scope.$on('dragToReorder.dropped', function (evt, data) {   
    
  // The list after it has been reordered
  data.list
    
  // The dragged item
  data.item
  
  // The new index number for the dragged item
  data.newIndex
  
  // The previous index number for the dragged item
  data.prevIndex
});
```

### 2) Using 2-way data binding to directly update the collection that is being passed in.
- Add the `drag-to-reorder-bind` attribute to the parent element and pass it the collection you want it to track.
Then on the draggable elements, add the `dtr-draggable` attribute. That's it! This is great if all you need to know is the index
number of an item. 

```html
<ul drag-to-reorder-bind="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" dtr-draggable>
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
```

## CSS Classes:

When you start dragging the element, different classes are added to the element being dragged as well as the elements you are dragging over. 
(All classes are added to the elements containing the `dtr-draggable` attribute)


- `dtr-dragging` is added to the element that is being dragged when you start to drag it.
- `dtr-over` is added to the element you are hovering over.
- `dtr-dropping-above` is added to the element if you are hovering **above** the the middle point of the element. ***
- `dtr-dropping-below` is added to the element if you are hovering **below** the the middle point of the element. ***
- `dtr-transition` is added to the dragged element when you start to drag it, but is removed on a delay after being dropped. 
This default delay is 1 second (1000 ms), but can be designated by using the `dtr-transition-timeout` attribute (see **Options** below).


*** **Important:**  The class `dtr-dropping-above` or `dtr-dropping-below` will also be added to the previous or next sibling element of the one you are hovering over. 
Depending on which class the element you are hovering over has will determine which sibling will have a class added. (See example below...)

**E.g. - [`CSS Classes Demo`](http://htmlpreview.github.io/?https://github.com/mhthompson86/ng-drag-to-reorder/blob/master/demo/index.html)**
If you have Elements 1-10.  And you begin dragging Element 1.  Element 1 will have the `dtr-dragging` and `dtr-transition` classes added to it.
Let's say you drag Element 1 and are hovering over Element 5. Element 5 will have the `dtr-over` class and either the `dtr-dropping-above` class if the mouse is above the
halfway point of Element 5 or `dtr-dropping-below` if below it.  If above it, the previous sibling above (Element 4) will have the `dtr-dropping-below` class added to it. 
If below the halfway point, the next sibling below (Element 6) will have the `dtr-dropping-above` class added to it. 
After you drop Element 1, the `dtr-dragging` class is removed immediately, followed by the `dtr-transition` class one second later or after the number of milliseconds passed
in via the `dtr-transition-timeout` attribute (see **Options** below). This allows for more flexibility in how you want to style the elements during the drag and drop process. 



## Options:

### 1) dtrInit

- The `dtr-init` attribute allows you turn the drag and drop functionality on and off. You can pass it an expression to observe and will add or remove the event listeners based on a true/false value.
(Note that this is the only attribute that requires interpolation.)

```html
<!-- In your template (example) -->
<ul drag-to-reorder="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" 
    dtr-draggable
    dtr-init="{{$ctrl.draggable}}">
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
<button ng-click="$ctrl.toggleDrag()">Toggle Drag and Drop</button>
```

```javascript
  // In your controller (example)
  
  //prevent the list from being draggable on load
  this.draggable = false;
  
  //toggle drag and drop
  this.toggleDrag = () => this.draggable = !this.draggable;
```
<br>

### 2) dtrTransitionTimeout
- The `dtr-transition-timeout` attribute allows you to set the timeout period (in milliseconds) for when the `dtr-transition` class is removed from the dragged element. 
You can pass in the number of milliseconds, or you can pass in a variable for it to evaluate.
This is just an available option in case you want to add some custom animation.

```html
<!-- In your template (example) -->
<ul drag-to-reorder="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" 
    dtr-draggable
    dtr-transition-timeout="5000"> 
    <!-- e.g. dtr-transition-timeout="$ctrl.myTimeoutPeriod" -->
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
```
<br>

### 3) The ngDragToReorder service
- The `ngDragToReorder` service can be imported into your controller to check to see if drag and drop functionality is supported by your 
browser. The `dtr-draggable` directive uses this service to prevent itself from wiring up event listeners if the browser doesn't support 
it. You can use the same service if you want to show or hide any buttons or other UI based on browser support.  

```html
<!-- In your template (example) -->
<ul drag-to-reorder="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" 
    dtr-draggable
    dtr-init="{{$ctrl.draggable}}">
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
<button ng-if="$ctrl.isSupported" ng-click="$ctrl.toggleDrag()">Toggle Drag and Drop</button>
```

```javascript
 /* @ngInject */
  function exampleComponentController(ngDragToReorder, $scope) {
      //check to see if the browser supports drag and drop
    this.isSupported = ngDragToReorder.isSupported();
    
    //prevent the list from being draggable on load
    this.draggable = false;
    
    //toggle drag and drop
    this.toggleDrag = () => this.draggable = !this.draggable;
  }
```
<br>

### 4) dtrEvent
- The `dtr-event` attribute allows you to customize the name of the event broadcasted when an element is dropped.
This is particularly helpful if you have more than one collection and/or controller and want to make sure they only react to the event they are supposed to.
The name passed in will replace 'dropped' in 'dragToReorder.dropped'.  See below for example.

```html
<!-- In your template (example) -->
<ul drag-to-reorder="$ctrl.avengers">
  <li ng-repeat="avenger in $ctrl.avengers" 
    dtr-draggable
    dtr-event="suchEvent">
    <span ng-bind="avenger.rank"></span>
    <span ng-bind="avenger.name"></span>
  </li>
</ul>
<ul drag-to-reorder="$ctrl.list">
  <li ng-repeat="item in $ctrl.list" 
    dtr-draggable
    dtr-event="myListChanged">
    {{item}}
  </li>
</ul>
```

```js
$scope.$on('dragToReorder.suchEvent', function (evt, data) {   
    //do something only when suchEvent is fired
});

$scope.$on('dragToReorder.myListChanged', function (evt, data) {   
    //do something only when myListChanged is fired
});
```
