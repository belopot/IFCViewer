(function() {
  "use strict";

  angular.module("app").factory("eventsVPFactory", eventsVPFactory);

  /** @ngInject */
  function eventsVPFactory($rootScope) {
    return {
      windowEvents: function(windowObject) {
        var obj;
        var entities = [];
        windowObject.addEventListener("resize", function(ev) {
          angular.forEach(entities, function(v) {
            v.fire("windowResized");
          });
        });
        return {
          register: function(entity) {
            entities.push(entity);
          },
          show: function() {
            return obj;
          }
        };
      },
      stageEvents: function(stage) {
        var stage = stage;
        var events = [];
        return {
          register: function(event, handler) {
            if (!stage) {
              return;
            }
            events.push(event);
            stage.on(event, handler);
          }
        };
      },
      shapeEvents: function(shape) {
        var shape = shape;
        var events = [];
        return {
          register: function(event, handler) {
            if (events.indexOf(event) > -1) {
              /* Check for duplicate events */
              return;
            } else {
              events.push(event);
              shape.on(event, handler);
            }
          }
        };
      },
      layerEvents: function(layer) {
        var layer = layer;
        var events = [];
        return {
          register: function(event, handler) {
            if (events.indexOf(event) > -1) {
              /* Check for duplicate events */
              return;
            } else {
              events.push(event);
              layer.on(event, handler);
            }
          }
        };
      }
    };
  }
})();
