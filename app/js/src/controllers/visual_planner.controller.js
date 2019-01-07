(() => {
  angular.module("app").controller("visualPlannerCtrl", visualPlannerCtrl);

  function visualPlannerCtrl(
    $scope,
    $timeout,
    $state,
    $location,
    globals,
    authFactory,
    apiFactory,
    Notification,
    commonVPFactory,
    toolsVPFactory,
    shapesVPFactory,
    localStorageService,
    eventsVPFactory,
    layersVPFactory
  ) {
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    //$("#chooseRoofModal").modal("show");

    /* Drag and drop */
    // dragElement(document.getElementById("mydiv"));
    $(".drag_element").mousedown(function() {
      dragElement(
        document.getElementById(
          $(this)
            .closest("div")
            .attr("id")
        )
      );
    });

    function dragElement(elmnt, e) {
      var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
      if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(
          elmnt.id + "header"
        ).onmousedown = dragMouseDown;
      } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    /* drag and drop -end */

    /* Authorize user */
    var userPresent = authFactory.checkUser();
    if (!userPresent) {
      return;
    }

    /* $mdDialog.show({
        contentElement: '#visualPlannerDialog',
        parent: angular.element(document.body),
        clickOutsideToClose: false,
        escapeToClose: false
      }); */

    var vm = this;
    // Wait for the document to load before setting up the canvas stage
    /************************************************************* 
        Preload functionality
      **************************************************************/
    vm.hideInitModal = false;

    vm.roofPlans = localStorageService.get("roofPlans");

    vm.selectPlan = function(plan) {
      vm.selectedPlan = plan._id;
      loadPlanner(plan);
      vm.hideInitModal = true;
    };
    vm.selectPlan(localStorageService.get("selectedPlan"));
    // vm.choosePlan = function(planId) {
    //   var plan = vm.roofPlans.filter(function(x) {
    //     return x._id === planId;
    //   })[0];
    //   $("#chooseRoofModal").modal("hide");
    //   vm.selectPlan(plan);
    // };

    // vm.choosePlan(localStorageService.get("selectedPlan"));

    vm.closeVisualPlanner = function() {
      document.body.style.cursor = "default";
      $("#chooseRoofModal").modal("hide");
      $state.go("dashboard");
    };

    /************************************************************* 
       End of Preload functionality
      **************************************************************/

    function loadPlanner(roofPlan) {
      /************************************************************* 
          Essential vars
        **************************************************************/
      /* Helper vars */

      var loadFromJson = roofPlan.plannerData
        ? roofPlan.plannerData.initialized
          ? true
          : false
        : false;

      /* Expose shape selection methodds */

      var selectedShape = commonVPFactory.selectedShape();

      /* Color picker config */

      var colorPicker = toolsVPFactory.colorPicker();
      /* make this object available to shape factory so it can fetch the props */
      shapesVPFactory.getShapeTools(colorPicker);

      vm.shapeProps = {
        colorType: "strokeColor",
        strokeColor: "rgba(0 ,0 , 0 , 1)",
        fillColor: "rgba(255, 255, 255, 0.57)",
        strokeWidth: 1
      };

      /* Color Picker Options */

      vm.cpOptions = {
        swatch: true,
        inputClass: "h-30",
        format: "rgb",
        case: "lower",
        alpha: true
      };

      /* Color Picker Events */
      vm.cpEvents = {
        onChange: function(api, color, $event) {
          var obj = {};
          obj.stroke = vm.shapeProps.strokeColor;
          obj.fill = vm.shapeProps.fillColor;
          colorPicker.set(obj);
        }
      };

      /* bound to ng change of the slider */
      vm.changeStrokeWidth = function() {
        colorPicker.set({
          strokeWidth: vm.shapeProps.strokeWidth
        });
      };

      /* End of color picker config */

      /* Creating the stage */

      var stage = commonVPFactory.createStage(
        "stage",
        {
          height: window.innerHeight,
          width: window.innerWidth
        },
        roofPlan.plannerData
      );

      /* Check if roofPlans has existing drawings */

      var stageEvents = eventsVPFactory.stageEvents(stage);

      stageEvents.register("mousemove", function() {
        /* register mouse move event for stage */
        vm.pointerPosition = {
          x: stage.getPointerPosition().x,
          y: stage.getPointerPosition().y
        };
        $scope.$apply();
      });

      /* Initializing draw state */

      var drawState = commonVPFactory.drawState();

      $scope.$on("drawStateChange", function(e, drawStates) {
        vm.currentDrawState = drawStates;
      });

      /* Creating the base layer */
      var baseLayer = loadFromJson
        ? stage.getChildren()[0]
        : layersVPFactory.createLayer(stage);

      var processStore = layersVPFactory.initiateProcess(stage, baseLayer);

      var selectionStore = commonVPFactory.selectionStore();

      /* Initializing transformer store for shapes */

      var transformerStore = commonVPFactory.transformers(baseLayer);

      /* Adding roof plan image to the base layer */

      /*  Initializing calibrator */

      var calibrator = shapesVPFactory.calibrator(stage, baseLayer);

      var calibrationState = commonVPFactory.calibrationState();

      /* Initializing metric function */

      var metrics = toolsVPFactory.metrics();

      vm.showPanel = false;
      vm.zoomLevel = 100;
      vm.shapeInfo;

      /* Setting up the calibration and layers value to bind it in the view */
      if (loadFromJson) {
        if (roofPlan.plannerData && roofPlan.plannerData.calibration) {
          calibrationState.set(roofPlan.plannerData.calibration);
          /* Load Process if available */
          var loadedProcesses = stage
            .getChildren()[0]
            .getChildren()
            .filter(function(x) {
              return /process*/.test(x.name()) ? true : false;
            });
          if (loadedProcesses.length > 0) {
            processStore.loadProcesses(loadedProcesses);
          } else {
            processStore.createProcess();
          }
        }

        if (roofPlan.plannerData && roofPlan.plannerData.countData) {
          shapesVPFactory.loadShapeId(roofPlan.plannerData.countData);
        }
      } else {
        processStore.createProcess();
      }

      /* Binding calibration data to view */
      vm.calibrationData = calibrationState.get();

      vm.formatCalibration = function(val) {
        return val.toFixed(3);
      };

      /* Binding process data to view */
      vm.processes = processStore.getProcesses();

      /* Initializing associations module */

      vm.associations = commonVPFactory.associations();

      /* Initializing roof plan image */

      var imageObj = new Image();
      imageObj.crossOrigin = "Anonymous";

      if (roofPlan.plannerData && roofPlan.plannerData.jsonString) {
        imageObj.src = roofPlan.assetObj.url;
        imageObj.onload = function() {
          var imageContainer = baseLayer.get("#bgImage")[0];
          imageContainer.image(imageObj);

          vm.imageProps = {
            x: Math.round(imageContainer.width()),
            y: Math.round(imageContainer.height())
          };
          stage.draw();
        };
      } else {
        imageObj.src = roofPlan.assetObj.url;

        imageObj.onload = function() {
          /* Setting image props */
          var imageHeight = Math.round(stage.height() - 75);
          var aspectRatio = imageObj.height / imageHeight;
          var imageWidth = Math.round(imageObj.width / aspectRatio);

          vm.imageProps = {
            x: imageWidth,
            y: imageHeight
          };

          var bgImage = new Konva.Image({
            image: imageObj,
            name: "bgImage",
            id: "bgImage",
            height: imageHeight,
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowOpacity: 0.5,
            x: stage.width() / 2 - imageWidth / 2,
            /* Centering the image on the stage */
            y: 20,
            width: imageWidth
          });

          bgImage.on("click", function(e) {
            transformerStore.removeAll();
          });
          // add the shape to the layer
          baseLayer.add(bgImage);
          baseLayer.draw();
          // move BG layer to bottom
          baseLayer.moveToBottom();
        };
      }

      /* Initiating action states for undo and redo */
      var actionStates = commonVPFactory.actionStates();

      /************************************************************* 
          End of essential vars
        **************************************************************/

      /************************************************************* 
          Registering events 
        **************************************************************/
      var windowEvent = eventsVPFactory.windowEvents(window);
      windowEvent.register(stage);
      vm.historyPos = {
        x: undefined,
        y: undefined
      };
      /* Event listener for zoom functionality */

      window.addEventListener("wheel", function(e) {
        var scaleBy = 1.15;

        /* Disable scroll only on visual planner state */
        $state.$current.name === "visualPlanner" &&
          /* Also allow scroll inside pop-ups */
          !/modal-open/.test(
            document.getElementsByTagName("body")[0].className
          ) &&
          e.preventDefault();

        /* Center position */

        var centerY = Math.round(stage.height() / 2),
          centerX = Math.round(stage.width() / 2);

        if (e.ctrlKey) {
          var oldScale = baseLayer.scaleX();
          var mousePointTo = {
            x:
              stage.getPointerPosition().x / oldScale -
              baseLayer.x() / oldScale,
            y:
              stage.getPointerPosition().y / oldScale - baseLayer.y() / oldScale
          };

          var newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
          baseLayer.scale({
            x: newScale,
            y: newScale
          });

          var newPos = {
            x:
              -(mousePointTo.x - stage.getPointerPosition().x / newScale) *
              newScale,
            y:
              -(mousePointTo.y - stage.getPointerPosition().y / newScale) *
              newScale
          };

          /* Change image resolution with scale */
          var imageProps = {
            y: Math.round(baseLayer.find("#bgImage")[0].height() * newScale),
            x: Math.round(baseLayer.find("#bgImage")[0].width() * newScale)
          };
          vm.imageProps = imageProps;

          vm.zoomLevel = Math.round(baseLayer.scale().x * 100);
          toolsVPFactory.scaleTransformerBasedOnZoom(baseLayer);

          // adding zoom level for display
          $scope.$apply();
          baseLayer.position(newPos);
          stage.batchDraw();
        }
      });

      window.addEventListener("contextmenu", function(e) {
        if (e.target.tagName === "CANVAS") {
          e.preventDefault();
          shapesVPFactory.cancelDrawing();
          baseLayer.draw();
          drawState.reset();
        }
      });

      /* Zoom using button */

      vm.zoomButton = function(type) {
        // 0 - in , 1 - out

        var centerY = Math.round(stage.height() / 2),
          centerX = Math.round(stage.width() / 2);
        var scaleBy = 1.15;
        var oldScale = baseLayer.scaleX();
        var mousePointTo = {
          x: centerX / oldScale - baseLayer.x() / oldScale,
          y: centerY / oldScale - baseLayer.y() / oldScale
        };
        var newScale = type > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        baseLayer.scale({
          x: newScale,
          y: newScale
        });
        var newPos = {
          x: -(mousePointTo.x - centerX / newScale) * newScale,
          y: -(mousePointTo.y - centerY / newScale) * newScale
        };

        /* Change image resolution with scale */
        var imageProps = {
          y: Math.round(baseLayer.find("#bgImage")[0].height() * newScale),
          x: Math.round(baseLayer.find("#bgImage")[0].width() * newScale)
        };
        vm.imageProps = imageProps;
        toolsVPFactory.scaleTransformerBasedOnZoom(baseLayer);
        vm.zoomLevel = Math.round(baseLayer.scale().x * 100);

        baseLayer.position(newPos);
        stage.batchDraw();
      };

      vm.zoomSlider = function(percentage) {
        var centerY = Math.round(stage.height() / 2),
          centerX = Math.round(stage.width() / 2);

        var oldScale = baseLayer.scaleX();
        var mousePointTo = {
          x: centerX / oldScale - baseLayer.x() / oldScale,
          y: centerY / oldScale - baseLayer.y() / oldScale
        };

        var newScale = percentage / 100;
        baseLayer.scale({
          x: newScale,
          y: newScale
        });
        var newPos = {
          x: -(mousePointTo.x - centerX / newScale) * newScale,
          y: -(mousePointTo.y - centerY / newScale) * newScale
        };

        /* Change image resolution with scale */
        var imageProps = {
          y: Math.round(baseLayer.find("#bgImage")[0].height() * newScale),
          x: Math.round(baseLayer.find("#bgImage")[0].width() * newScale)
        };
        vm.imageProps = imageProps;
        toolsVPFactory.scaleTransformerBasedOnZoom(baseLayer);
        vm.zoomLevel = Math.round(baseLayer.scale().x * 100);

        baseLayer.position(newPos);
        stage.batchDraw();
      };

      /* function to reset zoom */

      vm.resetZoom = function() {
        vm.zoomLevel = 100;
        baseLayer.position({
          x: 0,
          y: 0
        });
        baseLayer.scale({
          x: 1,
          y: 1
        });
        stage.batchDraw();
      };

      var baseLayerEvent = eventsVPFactory.layerEvents(baseLayer);

      /* Default baselayer click event */
      baseLayerEvent.register("click", function(e) {
        if (e.target.className === "Image") {
          transformerStore.removeAll();
          vm.closeInfoWidget();
          vm.closeTextInfoWidget();
          selectedShape.reset();
        }
      });

      /* Event wrappers */

      function rectangleEventWrapper(shapeObject, shapeType, process) {
        var rectangleEvent = eventsVPFactory.shapeEvents(
          shapeObject.shape
        ); /* Create an event obj for the shape */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.shape);
          currentProcess.moveToTop();
        }
        /* initiating custom transformers */
        var customTransformer = toolsVPFactory.customTransformer(
          stage,
          baseLayer,
          shapeObject.shape,
          true
        );
        customTransformer.set(shapeObject.shape.points());
        transformerStore.add(customTransformer.getGroup());

        /* 
            Registering a dragmove method to bind dragmove and click event to the custom transformer
          */
        rectangleEvent.register("dragmove." + shapeType, function(e) {
          customTransformer.update({
            x: shapeObject.shape.x(),
            y: shapeObject.shape.y()
          });
        });

        /* 
            Registering custom transformer event to the created polygon
          */
        rectangleEvent.register("transformPolygon", function() {
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(shapeObject.shape.points(), scale),
            unit: calibrationState.get().unit
          });
          $scope.$apply();
          vm.shapeInfo = metrics.getShapeInfo();

          shapeObject.shape.points(customTransformer.getPoints());
        });

        /* Enable transformer on select */
        rectangleEvent.register("click." + shapeType, function() {
          shapeObject.shape.moveToTop();
          selectedShape.set(shapeObject.shape);
          baseLayer.draw();
          customTransformer.update({
            x: shapeObject.shape.x(),
            y: shapeObject.shape.y()
          });

          vm.openInfoWidget();
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(shapeObject.shape.points(), scale),
            unit: calibrationState.get().unit
          });
          $timeout(function() {
            $scope.$apply();
          });
          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;

          transformerStore.removeAll();
          baseLayer.add(customTransformer.getGroup());
          baseLayer.draw();
        });

        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        rectangleEvent.register("dragstart." + shapeType, function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        rectangleEvent.register("dragend." + shapeType, function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.shape,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });
      }

      function ellipseEventWrapper(shapeObject, shapeType, process) {
        var ellipseEvent = eventsVPFactory.shapeEvents(
          shapeObject.shape
        ); /* Create an event obj for the ellipse */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.shape);
          currentProcess.moveToTop();
        }

        /* Ellipse transformer setup */

        var ellipseTransfomer = toolsVPFactory.ellipseTransfomer(
          stage,
          baseLayer,
          shapeObject.shape
        );

        ellipseTransfomer.set(shapeObject.shape.radius());
        transformerStore.add(ellipseTransfomer.getGroup());

        ellipseEvent.register("dragmove.ellipse", function(e) {
          ellipseTransfomer.destroy();
          ellipseTransfomer = toolsVPFactory.ellipseTransfomer(
            stage,
            baseLayer,
            shapeObject.shape
          );
          ellipseTransfomer.set(shapeObject.shape.radius());
          transformerStore.add(ellipseTransfomer.getGroup());
        });

        ellipseEvent.register("click.ellipse", function(e) {
          shapeObject.shape.moveToTop();
          baseLayer.draw();
          /* remove other transformers */
          transformerStore.removeAll();
          selectedShape.set(shapeObject.shape);
          vm.openInfoWidget();
          /* Area calculation */
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.ellipseArea(shapeObject.shape.radius(), scale),
            unit: calibrationState.get().unit
          });

          ellipseTransfomer.destroy();
          ellipseTransfomer = toolsVPFactory.ellipseTransfomer(
            stage,
            baseLayer,
            shapeObject.shape
          );
          ellipseTransfomer.set(shapeObject.shape.radius());
          transformerStore.add(ellipseTransfomer.getGroup());
          baseLayer.draw();

          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;
          $timeout(function() {
            $scope.$apply();
          });
        });

        ellipseEvent.register("transformEllipse", function(e) {
          /* Area calculation */

          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.ellipseArea(shapeObject.shape.radius(), scale),
            unit: calibrationState.get().unit
          });

          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;
        });
        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        ellipseEvent.register("dragstart.ellipse", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        ellipseEvent.register("dragend.ellipse", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.shape,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });
      }

      function polygonEventWrapper(shapeObject, process) {
        var polygonEvent = eventsVPFactory.shapeEvents(
          shapeObject.polygon
        ); /* Create an event obj for the polygon */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.polygon);
          currentProcess.moveToTop();
        }
        /* initiating custom transformers */
        var customTransformer = toolsVPFactory.customTransformer(
          stage,
          baseLayer,
          shapeObject.polygon,
          false
        );
        customTransformer.set(shapeObject.polygon.points());
        transformerStore.add(customTransformer.getGroup());

        /* 
            Registering a dragmove method to bind dragmove and click event to the custom transformer
          */
        polygonEvent.register("dragmove.polygon", function(e) {
          customTransformer.update({
            x: shapeObject.polygon.x(),
            y: shapeObject.polygon.y()
          });
        });
        polygonEvent.register("click.polygon", function(e) {
          customTransformer.update({
            x: shapeObject.polygon.x(),
            y: shapeObject.polygon.y()
          });
        });

        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        polygonEvent.register("dragstart.polygon", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        polygonEvent.register("dragend.polygon", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.polygon,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });
        /* 
            Registering custom transformer event to the created polygon
          */
        polygonEvent.register("transformPolygon", function() {
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(
              shapeObject.polygon.points(),
              scale
            ),
            unit: calibrationState.get().unit
          });
          $timeout(function() {
            $scope.$apply();
          });
          vm.shapeInfo = metrics.getShapeInfo();

          shapeObject.polygon.points(customTransformer.getPoints());
        });

        /* Enable transformer on select */
        polygonEvent.register("click", function() {
          shapeObject.polygon.moveToTop();
          baseLayer.draw();
          selectedShape.set(shapeObject.polygon);
          vm.openInfoWidget();
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(
              shapeObject.polygon.points(),
              scale
            ),
            unit: calibrationState.get().unit
          });
          $scope.$apply();
          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;

          transformerStore.removeAll();
          baseLayer.add(customTransformer.getGroup());
          baseLayer.draw();
        });
      }

      function freeHandEventWrapper(shapeObject, process) {
        var freeHandEvent = eventsVPFactory.shapeEvents(
          shapeObject.polygon
        ); /* Create an event obj for the polygon */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.polygon);
          currentProcess.moveToTop();
        }
        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        freeHandEvent.register("dragstart.polygon", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        freeHandEvent.register("dragend.polygon", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.polygon,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });

        /* Enable transformer on select */
        freeHandEvent.register("click", function() {
          shapeObject.polygon.moveToTop();
          baseLayer.draw();
          selectedShape.set(shapeObject.polygon);
          vm.openInfoWidget();
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;
          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(
              shapeObject.polygon.points(),
              scale
            ),
            unit: calibrationState.get().unit
          });
          $timeout(function() {
            $scope.$apply();
          });
          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;
          transformerStore.removeAll();
          baseLayer.draw();
        });
      }

      function lineEventWrapper(shapeObject, process) {
        var lineEvent = eventsVPFactory.shapeEvents(shapeObject.line);

        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.line);
          currentProcess.moveToTop();
        }
        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        lineEvent.register("dragstart.line", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        lineEvent.register("dragend.line", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.line,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });

        /* Enable transformer on select */
        lineEvent.register("click", function() {
          shapeObject.line.moveToTop();
          selectedShape.set(shapeObject.line);
          vm.openInfoWidget();
          //vm.showPanel = true;
          transformerStore.removeAll();
          baseLayer.draw();
        });
      }

      function freeHandMarkerWrapper(shapeObject, process) {
        var freeHandEvent = eventsVPFactory.shapeEvents(
          shapeObject.polygon
        ); /* Create an event obj for the polygon */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.polygon);
          currentProcess.moveToTop();
        }
        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        freeHandEvent.register("dragstart.freeHandMarker", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        freeHandEvent.register("dragend.freeHandMarker", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.polygon,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });

        /* Enable transformer on select */
        freeHandEvent.register("click.freeHandMarker", function() {
          shapeObject.polygon.moveToTop();
          baseLayer.draw();

          selectedShape.set(shapeObject.polygon);
          vm.openInfoWidget();

          transformerStore.removeAll();
          baseLayer.draw();
        });
      }

      function bezierEventWrapper(shapeObject, process) {
        var bezierEvent = eventsVPFactory.shapeEvents(
          shapeObject.line
        ); /* Create an event obj for the polygon */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(shapeObject.line);
          currentProcess.moveToTop();
        }
        /* initiating custom transformers */
        var bezierTransformer = toolsVPFactory.bezierTransformer(
          stage,
          baseLayer,
          shapeObject.line
        );
        bezierTransformer.set(shapeObject.line.points());
        transformerStore.add(bezierTransformer.getGroup());

        /* 
            Registering a dragmove method to bind dragmove and click event to the custom transformer
          */
        bezierEvent.register("dragmove.polygon", function(e) {
          bezierTransformer.update({
            x: shapeObject.line.x(),
            y: shapeObject.line.y()
          });
        });
        bezierEvent.register("click.polygon", function(e) {
          bezierTransformer.update({
            x: shapeObject.line.x(),
            y: shapeObject.line.y()
          });
        });

        /* 
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        bezierEvent.register("dragstart.polygon", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        bezierEvent.register("dragend.polygon", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shapeObject.line,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });
        /* 
            Registering custom transformer event to the created polygon
          */
        bezierEvent.register("transformBezier", function() {
          shapeObject.line.points(bezierTransformer.getPoints());
        });

        /* Enable transformer on select */
        bezierEvent.register("click", function() {
          shapeObject.line.moveToTop();
          baseLayer.draw();
          selectedShape.set(shapeObject.line);
          vm.openInfoWidget();
          var scale =
            calibrationState.get().value === 0
              ? undefined
              : calibrationState.get().value;

          metrics.setShapeInfo({
            area: toolsVPFactory.polygonArea(shapeObject.line.points(), scale),
            unit: calibrationState.get().unit
          });
          vm.shapeInfo = metrics.getShapeInfo();
          vm.showPanel = true;

          transformerStore.removeAll();
          baseLayer.add(bezierTransformer.getGroup());
          baseLayer.draw();
        });
      }

      function textEventWrapper(group, process) {
        var textEvent = eventsVPFactory.shapeEvents(
          group
        ); /* Create an event obj for the shape */
        if (!process) {
          /* Do not create process if it's already available from json */
          var currentProcess = processStore.getCurrent();
          currentProcess.add(group);
          currentProcess.moveToTop();
        }

        /* initiating custom transformers */
        var customTransformer = toolsVPFactory.customTransformer(
          stage,
          baseLayer,
          group,
          true
        );
        var wrapper = group.getChildren()[0];
        var text = group.getChildren()[1];

        customTransformer.set(wrapper.points());
        transformerStore.add(customTransformer.getGroup());

        /* 
            Registering a dragmove method to bind dragmove and click event to the custom transformer
          */
        textEvent.register("dragmove.textGroup", function(e) {
          customTransformer.update({
            x: group.x(),
            y: group.y()
          });
        });

        /* 
            Registering custom transformer event to the created polygon
          */
        textEvent.register("transformPolygon", function() {
          wrapper.points(customTransformer.getPoints());

          var updatedPoints = wrapper.points();

          text.width(Math.abs(updatedPoints[0] - updatedPoints[2]) - 10);
          text.position({
            x: updatedPoints[0] + 5,
            y: updatedPoints[1] + 5
          });
          baseLayer.draw();
        });

        /* Enable transformer on select */
        textEvent.register("click.textGroup", function() {
          group.moveToTop();
          selectedShape.set(text);
          baseLayer.draw();
          customTransformer.update({
            x: group.x(),
            y: group.y()
          });

          $timeout(function() {
            $scope.$apply();
          });

          transformerStore.removeAll();
          baseLayer.add(customTransformer.getGroup());
          wrapper.stroke("grey");
          baseLayer.draw();
          vm.openTextInfoWidget();
        });

        /*  
            Dragstart and dragend movements for undo/redo states
          */
        var movement = commonVPFactory.movement();

        textEvent.register("dragstart.textGroup", function(e) {
          movement.add(
            e.target.getPosition()
          ); /* Grabbing start position of the movement */
        });
        textEvent.register("dragend.textGroup", function(e) {
          /* pushing the movement to actionState after the end position */
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              group,
              processStore.getCurrent(),
              "move",
              movement.add(e.target.getPosition())
            )
          );
        });
      }

      /* Attach events when shapes are loaded from json */
      (function(loadType) {
        if (loadType) {
          /* Search for groups with the name process and fetch the shapes */
          angular.forEach(baseLayer.getChildren(), function(x) {
            if (/process*/.test(x.name())) {
              angular.forEach(x.getChildren(), function(child) {
                /* For circle and ellipse */

                if (child.className === "Ellipse") {
                  ellipseEventWrapper(
                    {
                      shape: child
                    },
                    "ellipse",
                    true
                  );

                  /* For lines and polygons */
                } else if (
                  child.className === "Line" ||
                  child.className === "Arrow"
                ) {
                  /* Check if given shape is a rectangle or a polygon */
                  var shapeName = child.name();
                  if (/Rect*/.test(shapeName)) {
                    rectangleEventWrapper(
                      {
                        shape: child
                      },
                      "rectangle",
                      true
                    );
                  } else if (/polygon*/.test(shapeName)) {
                    polygonEventWrapper(
                      {
                        polygon: child
                      },
                      true
                    );
                  } else if (/line*/.test(shapeName)) {
                    lineEventWrapper(
                      {
                        line: child
                      },
                      true
                    );
                  } else if (/freeHand*/.test(shapeName)) {
                    freeHandEventWrapper(
                      {
                        polygon: child
                      },
                      true
                    );
                  } else if (/markerFreeHand*/.test(shapeName)) {
                    freeHandMarkerWrapper(
                      {
                        polygon: child
                      },
                      true
                    );
                  }

                  /* For text */
                } else if (/textGroup*/.test(child.name())) {
                  textEventWrapper(child, true);
                }
              });
            }
          });

          transformerStore.removeAll();
        }
        return;
      })(loadFromJson);

      /************************************************************* 
          End of events
        **************************************************************/

      /************************************************************* 
          View functions
        **************************************************************/

      /* Function to draw rectangle/square */
      vm.rectangle = function(square) {
        var shapeType = square ? "square" : "rectangle";
        drawState.set("shapes." + shapeType);
        document.body.style.cursor = "crosshair";
        console.log(vm.currentDrawState.shapes.square);
        /* Event configuration */
        baseLayerEvent.register("click." + shapeType, function() {
          if (drawState.check("shapes." + shapeType)) {
            var shapeObject = shapesVPFactory.createShape(
              0,
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );

            if (shapeObject.start) {
              baseLayer.add(shapeObject.shape);
              /* Adding action handlers for undo redo */

              actionStates.push(
                commonVPFactory.actionHandler(
                  stage,
                  shapeObject.shape,
                  processStore.getCurrent(),
                  "create"
                )
              );
              baseLayer.draw();
            } else {
              /* Add rectangle transformers */
              rectangleEventWrapper(shapeObject, shapeType);

              document.body.style.cursor = "default";
              drawState.reset();
              shapesVPFactory.destroyShape();
            }
          }
        });
        baseLayerEvent.register("mousemove." + shapeType, function() {
          if (drawState.check("shapes." + shapeType)) {
            shapesVPFactory.drawShape(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              square
            );
            baseLayer.draw();
          }
        });
      };

      /* Function to draw ellipse/circle */
      vm.ellipse = function(circle) {
        var shapeType = circle ? "circle" : "ellipse";
        drawState.set("shapes." + shapeType);
        document.body.style.cursor = "crosshair";

        /* Event configuration */

        baseLayerEvent.register("click." + shapeType, function() {
          if (drawState.check("shapes." + shapeType)) {
            var shapeObject = shapesVPFactory.createShape(
              1,
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            if (shapeObject.start) {
              baseLayer.add(shapeObject.shape);
              actionStates.push(
                commonVPFactory.actionHandler(
                  stage,
                  shapeObject.shape,
                  processStore.getCurrent(),
                  "create"
                )
              );
              baseLayer.draw();
            } else {
              document.body.style.cursor = "default";

              ellipseEventWrapper(shapeObject, shapeType);

              drawState.reset();
              shapesVPFactory.destroyShape();
            }
          }
        });
        baseLayerEvent.register("mousemove." + shapeType, function() {
          if (drawState.check("shapes." + shapeType)) {
            shapesVPFactory.drawShape(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              circle
            );
            baseLayer.draw();
          }
        });
      };

      /* Function to draw polygon */
      vm.polygon = function() {
        drawState.set("shapes.polygon");
        document.body.style.cursor = "crosshair";

        /* Event configuration */
        baseLayerEvent.register("click.polygon", function() {
          if (drawState.check("shapes.polygon")) {
            var shapeObject = shapesVPFactory.createPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            if (shapeObject) {
              if (shapeObject.start) {
                actionStates.push(
                  commonVPFactory.actionHandler(
                    stage,
                    shapeObject.polygon,
                    processStore.getCurrent(),
                    "create"
                  )
                );
                baseLayer.add(shapeObject.polygon);
              } else {
                /* Polygon finish block */

                polygonEventWrapper(shapeObject);

                document.body.style.cursor = "default";
                drawState.reset();
                shapesVPFactory.destroyShape();
              }
            }
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mousemove.polygon", function() {
          if (drawState.check("shapes.polygon")) {
            shapesVPFactory.drawPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            baseLayer.draw();
          }
        });
      };

      /* Function to draw a freehand shape */
      vm.freeHand = function() {
        drawState.set("measurement.freeHand");
        document.body.style.cursor = "crosshair";

        /* Event configuration */
        baseLayerEvent.register("mousedown.freehand", function() {
          if (drawState.check("measurement.freeHand")) {
            var shapeObject = shapesVPFactory.createPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              true
            );
            if (shapeObject) {
              if (shapeObject.start) {
                actionStates.push(
                  commonVPFactory.actionHandler(
                    stage,
                    shapeObject.polygon,
                    processStore.getCurrent(),
                    "create"
                  )
                );
                baseLayer.add(shapeObject.polygon);
              } else {
                /* Polygon finish block */

                freeHandEventWrapper(shapeObject);

                document.body.style.cursor = "default";
                drawState.reset();
                shapesVPFactory.destroyShape();
              }
            }
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mousemove.freehand", function() {
          if (drawState.check("measurement.freeHand")) {
            shapesVPFactory.drawPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              true
            );
            baseLayer.draw();
          }
        });
      };

      /* Marker functions */
      vm.simpleLine = function(type) {
        drawState.set("markings." + type);
        document.body.style.cursor = "crosshair";

        /* Event configuration */
        baseLayerEvent.register("click." + type, function() {
          if (drawState.check("markings." + type)) {
            var shapeObject = shapesVPFactory.createLine(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              type
            );
            if (shapeObject) {
              if (shapeObject.start) {
                actionStates.push(
                  commonVPFactory.actionHandler(
                    stage,
                    shapeObject.line,
                    processStore.getCurrent(),
                    "create"
                  )
                );
                baseLayer.add(shapeObject.line);
                baseLayer.draw();
              } else {
                /* Polygon finish block */
                lineEventWrapper(shapeObject);

                document.body.style.cursor = "default";
                drawState.reset();
                shapesVPFactory.destroyShape();
              }
            }
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mousemove." + type, function() {
          if (drawState.check("markings." + type)) {
            shapesVPFactory.drawLine(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            baseLayer.draw();
          }
        });
      };

      vm.bezierLine = function() {
        drawState.set("markings.bezier");
        document.body.style.cursor = "crosshair";
        baseLayerEvent.register("click.bezier", function() {
          if (drawState.check("markings.bezier")) {
            var shapeObject = shapesVPFactory.createBezierLine(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            if (shapeObject) {
              if (shapeObject.start) {
                actionStates.push(
                  commonVPFactory.actionHandler(
                    stage,
                    shapeObject.line,
                    processStore.getCurrent(),
                    "create"
                  )
                );
                baseLayer.add(shapeObject.line);
                baseLayer.draw();
              } else {
                /* Polygon finish block */
                bezierEventWrapper(shapeObject);

                document.body.style.cursor = "default";
                drawState.reset();
                shapesVPFactory.destroyShape();
              }
            }
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mousemove.bezier", function() {
          if (drawState.check("markings.bezier")) {
            shapesVPFactory.drawBezierLine(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            baseLayer.draw();
          }
        });
      };

      /* Free hand marker functions */
      vm.freehandMarker = function() {
        drawState.set("shapes.freeHand");
        document.body.style.cursor = "crosshair";

        /* Event configuration */
        baseLayerEvent.register("mousedown.freehand", function() {
          if (drawState.check("shapes.freeHand")) {
            var shapeObject = shapesVPFactory.createPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              true,
              true
            );
            if (shapeObject) {
              if (shapeObject.start) {
                actionStates.push(
                  commonVPFactory.actionHandler(
                    stage,
                    shapeObject.polygon,
                    processStore.getCurrent(),
                    "create"
                  )
                );
                baseLayer.add(shapeObject.polygon);
              } else {
                freeHandMarkerWrapper(shapeObject);
                document.body.style.cursor = "default";
                drawState.reset();
                shapesVPFactory.destroyShape();
              }
            }
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mousemove.freehand", function() {
          if (drawState.check("shapes.freeHand")) {
            shapesVPFactory.drawPolygon(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              true
            );
            baseLayer.draw();
          }
        });
      };

      vm.textWidget = function() {
        drawState.set("shapes.text");
        document.body.style.cursor = "crosshair";
        /* Event configuration */
        baseLayerEvent.register("click.textWrapper", function() {
          if (drawState.check("shapes.text")) {
            var shapeObject = shapesVPFactory.createShape(
              0,
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );

            if (shapeObject.start) {
              baseLayer.add(shapeObject.shape);
              /* Adding action handlers for undo redo */

              actionStates.push(
                commonVPFactory.actionHandler(
                  stage,
                  shapeObject.shape,
                  processStore.getCurrent(),
                  "create"
                )
              );
            } else {
              // Create a new group for text

              var textGroup = shapesVPFactory.createTextGroup();

              textGroup.add(shapeObject.shape);

              /* Add properties */
              var points = shapeObject.shape.points();
              var textProps = {
                position: {
                  x: points[0] + 10,
                  y: points[1] + 10
                },
                width: Math.abs(points[0] - points[2]) - 10
              };
              var textObj = shapesVPFactory.createText(textProps);
              textGroup.add(textObj);

              textEventWrapper(textGroup);

              document.body.style.cursor = "default";
              drawState.reset();
              shapesVPFactory.destroyShape();

              baseLayer.draw();
            }
          }
        });
        baseLayerEvent.register("mousemove.textWrapper", function() {
          if (drawState.check("shapes.text")) {
            shapesVPFactory.drawShape(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              false,
              "wrapper"
            );
            baseLayer.draw();
          }
        });
      };

      vm.manualSelection = function(shapeObj) {
        transformerStore.removeAll();
        selectedShape.reset();
        var shape = selectedShape.set(shapeObj);
        shapeObj.fire("click");
      };

      vm.dragSelection = function() {
        drawState.set("markings.selection");

        document.body.style.cursor = "crosshair";
        /* Event configuration */
        baseLayerEvent.register("mousedown.selection", function() {
          if (drawState.check("markings.selection")) {
            vm.selectAllShapes(false);
            var shapeObject = shapesVPFactory.createShape(
              0,
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              )
            );
            baseLayer.add(shapeObject.shape);
            baseLayer.draw();
          }
        });

        baseLayerEvent.register("mouseup.selection", function() {
          if (drawState.check("markings.selection")) {
            document.body.style.cursor = "default";
            drawState.reset();

            /* Selection logic */
            var selectionPoints = shapesVPFactory.cancelDrawing();
            var selectedShapes = shapesVPFactory.selectShapes(
              baseLayer,
              selectionPoints
            );
            var selectedShapeNames = selectedShapes.map(function(x) {
              return x.name();
            });

            selectionStore.store(selectedShapes);
            angular.forEach(vm.processes, function(process) {
              angular.forEach(process.getChildren(), function(child) {
                if (selectedShapeNames.indexOf(child.name()) > -1) {
                  child.selected = true;
                }
              });
            });

            baseLayer.draw();
          }
        });
        baseLayerEvent.register("mousemove.selection", function() {
          if (drawState.check("markings.selection")) {
            shapesVPFactory.drawShape(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              false,
              "grabber"
            );
            baseLayer.draw();
          }
        });
      };

      vm.selectAllShapes = function(toggleValue) {
        var allShapes = shapesVPFactory.extractAllShapes(baseLayer);
        if (toggleValue) {
          selectionStore.store(allShapes);
        } else {
          selectionStore.clear();
        }
        angular.forEach(allShapes, function(x) {
          x.selected = toggleValue ? true : false;
        });
      };

      vm.toggleShapeVisibility = function(shape) {
        transformerStore.removeAll();
        shape.visible(!shape.visible());
        baseLayer.draw();
      };

      vm.calibrator = function() {
        drawState.set("measurement.calibrator");
        calibrator = shapesVPFactory.calibrator(stage, baseLayer);
        baseLayerEvent.register("click.calibrator", function() {
          if (drawState.check("measurement.calibrator")) {
            calibrator(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              true
            );
          }
        });

        baseLayerEvent.register("mousemove.calibrator", function() {
          if (drawState.check("measurement.calibrator")) {
            calibrator(
              commonVPFactory.dragOffset(
                stage.getPointerPosition(),
                baseLayer.getPosition(),
                baseLayer.scale()
              ),
              false
            );
          }
        });
      };

      /* Calibration handling */

      $scope.$on("calibrated", function(e, calibratedLine) {
        // var value = window.prompt('Please enter a scale');
        var value;
        $("#calibrateModal").modal("show");

        /* Distance of the line */
        var points = calibratedLine.points();
        var distance = Math.sqrt(
          Math.pow(points[0] - points[2], 2) +
            Math.pow(points[1] - points[3], 2)
        );

        vm.calibrationDistance = distance;
        vm.saveCalibration = function() {
          var value = vm.calibrationScale.value;

          var scale;

          scale = parseInt(value) / distance;

          /* Setting calibration value to that it can be fetched globally */
          calibrationState.set({
            value: scale,
            unit: vm.calibrationScale.unit
          });

          vm.calibrationData = calibrationState.get();

          vm.showPanel = true;
          vm.shapeInfo = metrics.getShapeInfo();
          calibratedLine.destroy();
          baseLayer.draw();

          $("#calibrateModal").modal("hide");
        };

        $("#calibrateModal").on("hide.bs.modal", function(e) {
          calibratedLine.destroy();
          baseLayer.draw();
        });
      });

      vm.deleteShape = function(shapeObj) {
        var shape = shapeObj ? shapeObj : selectedShape.get();
        if (shape) {
          transformerStore.removeAll();
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shape,
              shape.getParent(),
              "delete"
            )
          );
          shape.remove();
          baseLayer.draw();
          vm.closeInfoWidget();
          vm.closeTextInfoWidget();
          selectedShape.reset();
        }
      };

      vm.openInfoWidget = function() {
        var shape = selectedShape.get();
        vm.infoWidgetProps = {
          name: shape.name(),
          colorType: "stroke",
          stroke: shape.stroke(),
          fill: shape.fill(),
          strokeWidth: shape.strokeWidth()
        };
        vm.shapeInfoWidget = true;
      };

      vm.colorTypes = [
        {
          type: "Stroke",
          value: "stroke"
        },
        {
          type: "Fill",
          value: "fill"
        }
      ];

      vm.textColorTypes = [
        {
          type: "Background",
          value: "stroke"
        },
        {
          type: "Font",
          value: "fill"
        }
      ];

      vm.fontStyles = [
        {
          type: "Normal",
          value: "normal"
        },
        {
          type: "Bold",
          value: "bold"
        },
        {
          type: "Italic",
          value: "italic"
        }
      ];

      vm.webSafeFonts = [
        "Arial",
        "Calibri",
        "Helvetica",
        "Times New Roman",
        "Times",
        "Courier New",
        "Courier",
        "Verdana",
        "Georgia",
        "Palatino",
        "Garamond",
        "Bookman",
        "Comic Sans MS",
        "Trebuchet MS",
        "Arial Black",
        "Impact"
      ];

      vm.openTextInfoWidget = function() {
        var shape = selectedShape.get();
        vm.textInfoWidgetProps = {
          colorType: "stroke",
          text: shape.text(),
          fontSize: shape.fontSize(),
          fontStyle: shape.fontStyle(),
          fontFamily: shape.fontFamily(),
          stroke: shape.stroke(),
          fill: shape.fill(),
          strokeWidth: shape.strokeWidth()
        };
        vm.textInfoWidget = true;
        $scope.$apply();
      };

      vm.changeTextInfo = function(prop, value) {
        var shape = selectedShape.get();
        shape[prop](value);
        baseLayer.draw();
      };

      vm.infoWidgetStroke = function(val) {
        var shape = selectedShape.get();
        // var strokeHistory = commonVPFactory.shapePropertyHistory()
        // var props = {
        //   stroke: shape.stroke(),
        //   fill: shape.fill(),
        //   strokeWidth: shape.strokeWidth()
        // };
        // strokeHistory.add(props);
        // var done = false;
        // $timeout(function () {
        //   if(done) {
        //     return;
        //   } else {
        //     var endProps = {
        //       stroke: shape.stroke(),
        //       fill: shape.fill(),
        //       strokeWidth: shape.strokeWidth()
        //     };
        //     actionStates.push(commonVPFactory.actionHandler(stage, shape, processStore.getCurrent(), 'shapeProps', strokeHistory.add(endProps)));
        //     done = true;
        //   }
        // }, 1000);

        shape.strokeWidth(val);
        baseLayer.draw();
      };

      var shapePropHistory = commonVPFactory.shapePropertyHistory();

      vm.infoWidgetEvents = {
        onChange: function(api, color, $event) {
          var shape = selectedShape.get();
          if (vm.infoWidgetProps.colorType === "fill") {
            shape.fill(color);
          } else if (vm.infoWidgetProps.colorType === "stroke") {
            shape.stroke(color);
          }
          baseLayer.draw();
        },
        /* for shape undo and redo */
        onOpen: function(api, color, $event) {
          var shape = selectedShape.get();
          var props = {
            stroke: shape.stroke(),
            fill: shape.fill(),
            strokeWidth: shape.strokeWidth()
          };
          shapePropHistory.add(props);
        },
        onClose: function(api, color, $event) {
          var shape = selectedShape.get();
          var props = {
            stroke: shape.stroke(),
            fill: shape.fill(),
            strokeWidth: shape.strokeWidth()
          };
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shape,
              processStore.getCurrent(),
              "shapeProps",
              shapePropHistory.add(props)
            )
          );
          /* Reset shape props history */
          shapePropHistory = commonVPFactory.shapePropertyHistory();
        }
      };

      vm.textInfoWidgetEvents = {
        onChange: function(api, color, $event) {
          var shape = selectedShape.get();
          if (vm.textInfoWidgetProps.colorType === "fill") {
            shape.fill(color);
          } else if (vm.textInfoWidgetProps.colorType === "stroke") {
            var wrapper = shape.getParent().find("Line");
            wrapper.fill(color);
          }
          baseLayer.draw();
        },
        /* for shape undo and redo */
        onOpen: function(api, color, $event) {
          var shape = selectedShape.get();
          var props = {
            stroke: shape.stroke(),
            fill: shape.fill(),
            strokeWidth: shape.strokeWidth()
          };
          shapePropHistory.add(props);
        },
        onClose: function(api, color, $event) {
          var shape = selectedShape.get();
          var props = {
            stroke: shape.stroke(),
            fill: shape.fill(),
            strokeWidth: shape.strokeWidth()
          };
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shape,
              processStore.getCurrent(),
              "shapeProps",
              shapePropHistory.add(props)
            )
          );
          /* Reset shape props history */
          shapePropHistory = commonVPFactory.shapePropertyHistory();
        }
      };

      vm.closeInfoWidget = function() {
        vm.shapeInfoWidget = false;
      };

      vm.closeTextInfoWidget = function() {
        var text = selectedShape.get();
        if (text && text.name() === "text") {
          var group = text.getParent();
          var wrapper = group.find("Line")[0];
          wrapper.stroke(null);
          baseLayer.draw();
          transformerStore.removeAll();
        }
        vm.textInfoWidget = false;
      };

      /* End of shape events */

      /* Pan image */
      vm.currentPanState = true;
      vm.panImage = function() {
        vm.currentPanState = baseLayer.draggable();
        vm.currentPanState
          ? (document.body.style.cursor = "default")
          : (document.body.style.cursor = "move");
        baseLayer.draggable(!vm.currentPanState);
        baseLayer.draw();
      };

      /* Undo/Redo */

      vm.undoOrRedo = function(type) {
        /* type 0 - undo , 1 - redo */
        transformerStore.removeAll();
        type === 1 ? actionStates.redo() : actionStates.undo();
      };

      /* Downloads */

      vm.downloadImage = function() {
        var dataURL = stage.toDataURL();
        var link = document.createElement("a");
        link.download = "roofplan_image_" + Date.now();
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      vm.downloadFile = function() {
        var json = stage.toJSON();
        var file = new Blob([json], {
          type: "application/json"
        });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = "roofplan_json_" + Date.now();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      vm.saveRoofPlan = function() {
        transformerStore.removeAll();
        var json = stage.toJSON();

        /* Get associations and process them before saving */

        apiFactory
          .saveRoofPlan(roofPlan._id, {
            jsonString: json,
            calibration: calibrationState.get(),
            countData: shapesVPFactory.getShapeId(),
            associations: vm.associations.getAssociationsForSave()
          })
          .then(resp => {
            Notification.success(resp.data.message);

            apiFactory
              .getProjectRoofPlans(localStorageService.get("roofPlanProject"))
              .then(resp => {
                localStorageService.set("roofPlans", resp.data.data);
              })
              .catch(e => {
                console.log(e);
              });
          })
          .catch(e => {
            console.log(e);
          });
      };

      /* Process methods */

      vm.hideProcess = function(index) {
        transformerStore.removeAll();
        processStore.hideProcess(index);
      };
      vm.showProcess = function(index) {
        processStore.showProcess(index);
      };

      vm.addProcess = function() {
        processStore.createProcess();
        vm.processes = processStore.getProcesses();
      };

      vm.selectLayer = function(i) {
        vm.selectedIndex = i;
        processStore.setCurrent(i);
      };

      /* Initially load 1st layer */
      vm.selectLayer(0);

      vm.selectOrUnselect = function(shape) {
        shape.selected
          ? selectionStore.push(shape)
          : selectionStore.pull(shape.name());
      };

      vm.layerIconName = function(shapeName) {
        if (/Rect*/.test(shapeName)) {
          return "square";
        }
        if (/Ellipse*/.test(shapeName)) {
          return "circle";
        }
        if (/polygon*/.test(shapeName)) {
          return "polygon";
        }
        if (/line*/.test(shapeName)) {
          return "line";
        }
        if (/textGroup*/.test(shapeName)) {
          return "text";
        }
        if (/freeHand*/.test(shapeName)) {
          return "pencil";
        }
      };

      vm.hideSelection = function() {
        var selectedShapes = selectionStore.get();
        console.log(selectedShapes);
        transformerStore.removeAll();
        angular.forEach(selectedShapes, function(shape) {
          shape.visible(false);
        });
        baseLayer.draw();
      };

      vm.deleteSelection = function() {
        var selectedShapes = selectionStore.get();
        transformerStore.removeAll();
        angular.forEach(selectedShapes, function(shape) {
          actionStates.push(
            commonVPFactory.actionHandler(
              stage,
              shape,
              shape.getParent(),
              "delete"
            )
          );
          shape.remove();
        });
        baseLayer.draw();
      };

      vm.loadMaterial = shapeProp => {
        $("#loadMaterial").modal("show");
      };

      vm.createAssociation = (shapeId, entityId, type) => {
        vm.associations.createAssociation(shapeId, entityId, type);
        $("#loadMaterial").modal("hide");
      };

      $scope.$on("selectedMaterial", (e, data) => {
        console.log("selectedMaterial----", data);
      });

      /************************************************************* 
          End of view functions
        **************************************************************/
    }
  }
})();
