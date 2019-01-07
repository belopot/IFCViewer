(() => {
  angular.module("app").factory("imageMarker", imageMarker);

  function imageMarker($http, $location, $rootScope, localStorageService) {
    let scope = null,
      state = null,
      color = "rgba(0,0,0,1)",
      currentDrawing = null,
      stack = [],
      head = stack.length - 1,
      methods = {
        init: function(divId, initialSize, assetObj) {
          /* Initiate canvas scope */
          scope = {};
          let stage;
          if (assetObj.markingJson) {
            stage = Konva.Node.create(assetObj.markingJson, divId);
            stage.width(assetObj.width);
            stage.height(assetObj.height);
            scope.stage = stage;
            scope.layer = stage.get("#baseLayer")[0];
            let imageObj = new Image();
            imageObj.crossOrigin = "Anonymous";
            /* Add source on load */
            let bgImage = scope.layer.find("#markingImage")[0];
            imageObj.onload = function() {
              bgImage.image(imageObj);
              scope.layer.draw();
            };
            imageObj.src = assetObj.secure_url;
            /* Attach events */
            bgImage.on("click", methods.imageClickHandler);
            bgImage.on("mousemove", methods.drawingHandler);
          } else {
            stage = new Konva.Stage({
              container: divId,
              x: 1,
              y: 1,
              width: initialSize.width,
              height: initialSize.height
            });
            scope.stage = stage;
            let newlayer = new Konva.Layer({
              id: "baseLayer"
            });
            scope.stage.add(newlayer);
            scope.layer = newlayer;

            var imageObj = new Image();
            imageObj.crossOrigin = "Anonymous";
            imageObj.src = assetObj.secure_url;

            imageObj.onload = function() {
              var bgImage = new Konva.Image({
                image: imageObj,
                name: "markingImage",
                id: "markingImage",
                height: scope.stage.height(),
                x: 0,
                /* Centering the image on the stage */
                y: 0,
                width: scope.stage.width(),
                opacity: 1
              });
              bgImage.on("click", methods.imageClickHandler);

              bgImage.on("mousemove", methods.drawingHandler);

              // add the shape to the layer
              scope.layer.add(bgImage);
              scope.layer.draw();
              scope.layer.moveToBottom();
            };
          }

          window.addEventListener("contextmenu", function(e) {
            if (e.target.tagName === "CANVAS") {
              e.preventDefault();
              document.body.style.cursor = "default";
              scope.layer.draw();
              methods.removeState();
            }
          });

          return scope;
        },
        getScope: () => {
          return scope;
        },
        setState: drawState => {
          document.body.style.cursor = "crosshair";
          state = drawState;
        },
        setColor: selectedColor => {
          color = selectedColor;
        },
        removeState: () => {
          state = null;
        },
        getCanvasImage: () => {
          if (scope) {
            return scope.stage.toDataURL("image/png");
          }
        },
        serialize: () => {
          if (scope) {
            return scope.stage.toJSON();
          }
        },
        imageClickHandler: e => {
          /* Return if scope and state has not been set */
          if (!scope || !state) {
            document.body.style.cursor = "default";
            return;
          }

          let position = {
            x: scope.stage.getPointerPosition().x,
            y: scope.stage.getPointerPosition().y
          };
          /* Call methods based on drawState and currentDrawing */
          currentDrawing
            ? methods.endDrawing()
            : methods[`init_${state}`](position);
        },
        drawingHandler: () => {
          /* Return functions based on state */
          if (!state || !currentDrawing) {
            return;
          }
          let position = {
            x: scope.stage.getPointerPosition().x,
            y: scope.stage.getPointerPosition().y
          };
          methods[`draw_${state}`](position);
        },
        init_marker: position => {
          let marker = new Konva.Circle({
            x: position.x,
            y: position.y,
            radius: 5,
            stroke: color,
            name: "Circle",
            strokeWidth: 1,
            fill: color,
            draggable: true
          });
          scope.layer.add(marker);
          scope.layer.draw();
          $rootScope.$broadcast("saveDrawing");
          methods.undoRedo().newItem(marker);
          return marker;
        },
        init_circle: position => {
          let circle = new Konva.Circle({
            x: position.x,
            y: position.y,
            radius: 1,
            fill: color,
            stroke: color,
            strokeWidth: 4
          });
          scope.layer.add(circle);
          scope.layer.draw();
          currentDrawing = circle;
        },
        draw_circle: position => {
          if (currentDrawing) {
            currentDrawing.radius(Math.abs(position.x - currentDrawing.x()));
            scope.layer.draw();
          }
        },
        init_line: position => {
          let line = new Konva.Line({
            name: "lineSimple",
            points: [position.x, position.y],
            strokeWidth: 1,
            stroke: color,
            draggable: true
          });
          scope.layer.add(line);
          scope.layer.draw();
          currentDrawing = line;
        },
        draw_line: position => {
          if (currentDrawing) {
            let points = currentDrawing.points();
            points[2] = position.x;
            points[3] = position.y;
            currentDrawing.points(points);
            scope.layer.draw();
          }
        },

        endDrawing: () => {
          document.body.style.cursor = "default";
          $rootScope.$broadcast("saveDrawing");
          methods.undoRedo().newItem(currentDrawing);
          state = null;
          currentDrawing = null;
        },

        fill_text: text => {
          if (!scope) {
            return;
          }
          let simpleText = new Konva.Text({
            x: scope.stage.getWidth() / 2,
            y: 15,
            text: text,
            fontSize: 30,
            draggable: true,
            fontFamily: "Calibri",
            fill: color
          });
          // to align text in the middle of the screen, we can set the
          // shape offset to the center of the text shape after instantiating it
          simpleText.setOffset({
            x: simpleText.getWidth() / 2
          });
          scope.layer.add(simpleText);
          scope.layer.draw();
          methods.undoRedo().newItem(simpleText);
          $rootScope.$broadcast("saveDrawing");
        },
        /* Undo redo state management */
        undoRedo: () => {
          const methods = {
            newItem: item => {
              stack.splice(head + 1, stack.length, item);
              head = stack.length - 1;
            },
            undo: () => {
              if (head > -1) {
                console.log("undo", stack[head]);
                stack[head].remove();
                scope.layer.draw();
                head--;
              }
            },
            redo: () => {
              if (head < stack.length - 1) {
                head++;
                console.log("redo", stack[head]);
                scope.layer.add(stack[head]);
                scope.layer.draw();
              }
            },
            reset: () => {
              (stack = []), (head = stack.length - 1);
            }
          };

          return Object.freeze(methods);
        }
      };

    return methods;
  }
})();
