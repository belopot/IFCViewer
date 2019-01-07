(function() {
  "use strict";

  angular.module("app").factory("commonVPFactory", commonVPFactory);

  /** @ngInject */
  function commonVPFactory($rootScope) {
    return {
      // Initializes a stage for the visual planner
      createStage: function(divId, initialSize, plannerData) {
        var stage;
        if (plannerData && plannerData.jsonString) {
          stage = Konva.Node.create(plannerData.jsonString, "stage");
          stage.width(initialSize.width);
          stage.height(initialSize.height);
        } else {
          stage = new Konva.Stage({
            container: divId,
            x: 1,
            y: 1,
            width: initialSize.width,
            height: initialSize.height
          });
        }
        var getStageSize = this.getStageSize;
        stage.on("windowResized", function() {
          var dimensions = getStageSize(divId);
          stage.width(dimensions.width);
          stage.height(dimensions.height);
          stage.draw();
        });
        return stage;
      },
      getStageSize: function(divId) {
        var el = document.getElementById(divId);
        return {
          height: el.clientHeight,
          width: el.clientWidth
        };
      },
      // generates shape Id and increments it everytime you call it

      shapeId: function() {
        var defaultCount = {
          shapes: {
            rectangle: 0,
            square: 0,
            circle: 0,
            ellipse: 0,
            calibrator: 0,
            freeHand: 0,
            polygon: 0
          },
          markings: {
            line: 0,
            singleArrow: 0,
            doubleArrow: 0,
            bezier: 0,
            freehand: 0,
            text: 0,
            selection: 0
          },
          measurement: {
            rectangle: 0,
            square: 0,
            circle: 0,
            ellipse: 0,
            calibrator: 0,
            polygon: 0,
            freeHand: 0
          }
        };

        var currentCount = defaultCount;
        return {
          load: function(count) {
            currentCount = count;
          },
          getCount: function(type, shape) {
            currentCount[type][shape]++;
            return currentCount[type][shape];
          },
          get: function() {
            return currentCount;
          },
          reset: function() {
            currentCount = defaultCount;
          }
        };
      },
      /* 
       Drawstate function lets you set and check the current drawing state for the canvas. (Eg. Square, ellipse etc)
       You can't draw a shape on the canvas unless the state for the particular shape is true. These stats will checked
       in the event listeners of the target such as stage , layer etc.
      */
      drawState: function() {
        /*  Do not modify this var */
        var initialDrawStates = {
          shapes: {
            rectangle: false,
            square: false,
            circle: false,
            ellipse: false,
            calibrator: false,
            polygon: false
          },
          markings: {
            line: false,
            singleArrow: false,
            doubleArrow: false,
            bezier: false,
            freehand: false,
            text: false,
            selection: false
          },
          measurement: {
            rectangle: false,
            square: false,
            circle: false,
            ellipse: false,
            calibrator: false,
            polygon: false,
            freeHand: false
          }
        };

        /* Draw states from the view are assigned to this var */
        var drawStates = angular.copy(initialDrawStates);

        return {
          // function to set the drawStates
          set: function(type) {
            var keys = type.split(".");
            this.reset(); // reset drawstates before assigning states
            drawStates[keys[0]][keys[1]] = true;
            $rootScope.$broadcast("drawStateChange", drawStates);
          },
          // to check the drawStates
          check: function(type) {
            var keys = type ? type.split(".") : "";
            return type ? drawStates[keys[0]][keys[1]] : drawStates;
          },
          reset: function() {
            drawStates = angular.copy(initialDrawStates);
            $rootScope.$broadcast("drawStateChange", drawStates);
          }
        };
      },

      // calibration state

      calibrationState: function() {
        var state = {
          value: 1,
          unit: "units"
        };

        return {
          set: function(obj) {
            state = obj;
          },
          get: function() {
            return state;
          }
        };
      },

      // Undo redo functionality
      actionStates: function(actions) {
        var stack = actions || [];
        var head = stack.length - 1;
        return {
          push: function(val) {
            stack.splice(head + 1, stack.length, val);
            head = stack.length - 1;
          },
          show: function() {
            return stack;
          },
          peek: function() {
            return stack[head];
          },
          undo: function() {
            if (head > -1) {
              stack[head].delete();
              head = head - 1;
            }
          },
          redo: function() {
            if (head < stack.length) {
              head = head === stack.length - 1 ? head : head + 1;
              stack[head].restore();
            }
          }
        };
      },

      /* Attach action handlers to entities before pushing into action state stack */
      actionHandler: function(stage, entity, process, actionType, props) {
        var entity = entity;
        var stage = stage;
        var process = process;
        var props = props;

        /* Handlers */
        var handlers = {
          create: {
            delete: function() {
              entity.remove();
              stage.batchDraw();
            },
            restore: function() {
              process.add(entity);
              stage.batchDraw();
            }
          },
          move: {
            delete: function() {
              entity.position(props.start);
              stage.batchDraw();
            },
            restore: function() {
              entity.position(props.end);
              stage.batchDraw();
            }
          },
          delete: {
            delete: function() {
              process.add(entity);
              stage.batchDraw();
            },
            restore: function() {
              entity.remove();
              stage.batchDraw();
            }
          },
          shapeProps: {
            delete: function() {
              for (var key in props.start) {
                entity[key](props.start[key]);
              }

              stage.batchDraw();
            },
            restore: function() {
              for (var key in props.end) {
                entity[key](props.end[key]);
              }
              stage.batchDraw();
            }
          }
        };

        return {
          entity: entity,
          restore: handlers[actionType].restore,
          delete: handlers[actionType].delete
        };
      },

      /* This function returns movement values for undo/redo */
      movement: function() {
        var start;
        return {
          add: function(position) {
            if (!start) {
              start = position;
            } else {
              return {
                start: start,
                end: position
              };
            }
          }
        };
      },

      shapePropertyHistory: function() {
        var start;
        return {
          add: function(props) {
            if (!start) {
              start = props;
            } else {
              return {
                start: start,
                end: props
              };
            }
          }
        };
      },

      /* Transformers */
      transformers: function(layer) {
        var stage = stage;
        var layer = layer;
        var transformers = [];

        return {
          add: function(transformer) {
            transformers.push(transformer);
          },
          removeAll: function() {
            angular.forEach(transformers, function(x) {
              x.remove();
            });
            layer.draw();
          }
        };
      },
      /* 
        The position of the pointer doesn't change when the background image layer is being dragged around.
        In order to compensate that offset, The stage pointer position must be subtracted from the layer position
      */
      dragOffset: function(stagePosition, layerOffset, stageScale) {
        return {
          x: (stagePosition.x - layerOffset.x) / stageScale.x,
          y: (stagePosition.y - layerOffset.y) / stageScale.y
        };
      },

      /* Selected Shape */
      selectedShape: function(shape) {
        var shape;
        return {
          get: function() {
            return shape;
          },
          set: function(val) {
            shape = val;
          },
          reset: function() {
            shape = undefined;
          }
        };
      },

      /* Selection store - To store and retrieve selected shapes */

      selectionStore: function() {
        var selections = [];
        return {
          store: function(shapes) {
            selections = shapes;
          },
          get: function() {
            return selections;
          },
          pull: function(shapeName) {
            selections = selections.filter(function(shape) {
              if (shape.name() === shapeName) {
                return false;
              }
              return true;
            });
          },
          push: function(shape) {
            var shapeNames = selections.map(function(shape) {
              return shape.name();
            });
            if (!(shapeNames.indexOf(shape.name()) > -1)) {
              selections.push(shape);
            }
          },
          clear: function() {
            selections = [];
          }
        };
      },

      associations: () => {
        let associations = {};

        let methods = {
          createAssociation: (shapeId, entityId, type) => {
            let key = `${shapeId}-${entityId}-${Date.now()}`;
            associations[key] = {
              shapeId,
              entityId,
              type
            };
            return key;
          },
          getAssociations: key => {
            return key ? associations[key] : associations;
          },
          getAssociationsForSave: () => {
            return Object.keys(associations).reduce((acc, x) => {
              let obj = {
                shapeId: associations[x].shapeId,
                type: associations[x].type
              };

              switch (associations[x].type) {
                case 1:
                  obj.materialId = associations[x].entityId;
                  break;
                case 2:
                  obj.comboId = associations[x].entityId;
                  break;
                case 3:
                  obj.equipmentId = associations[x].entityId;
                  break;
              }
              acc.push(obj);
              return acc;
            }, []);
          },
          removeAssociation: key => {
            associations[key] = undefined;
          },
          reset: () => {
            associations = {};
          }
        };

        return Object.freeze(methods);
      }
    };
  }
})();
