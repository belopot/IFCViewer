(function() {
  "use strict";

  angular.module("app").factory("layersVPFactory", layersVPFactory);

  /** @ngInject */
  function layersVPFactory($rootScope) {
    return {
      createLayer: function(stage) {
        var layer = new Konva.Layer();
        stage.add(layer);
        return layer;
      },
      initiateProcess: function(stage, baseLayer) {
        var processes = [],
          head;
        return {
          createProcess: function() {
            var group = new Konva.Group({
              name: "process-" + Date.now()
            });
            processes.push(group);
            head = processes.length - 1;
            baseLayer.add(group);
          },
          getProcesses: function() {
            return processes;
          },
          getCurrent: function() {
            return processes[head];
          },
          setCurrent: function(index) {
            head = index;
          },
          showProcess: function(index) {
            if (index !== undefined) {
              baseLayer.add(processes[index]);
            } else {
              angular.forEach(processes, function(x) {
                baseLayer.add(x);
              });
            }
            baseLayer.draw();
          },
          hideProcess: function(index) {
            if (index !== undefined) {
              processes[index].remove();
            } else {
              angular.forEach(processes, function(x) {
                x.remove();
              });
            }
            baseLayer.draw();
          },
          /* Loading process from json */
          loadProcesses: function(processesFromJson) {
            processes = processesFromJson;
            head = processes.length - 1;
          }
        };
      }
    };
  }
})();
