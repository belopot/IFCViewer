(function() {
  "use strict";

  angular.module("app").factory("shapesVPFactory", shapesVPFactory);

  /** @ngInject */
  function shapesVPFactory(
    $rootScope,
    eventsVPFactory,
    commonVPFactory,
    toolsVPFactory
  ) {
    var shapeId = commonVPFactory.shapeId();
    var createdShape;

    /* Options common for polygon creation */
    var polygonOptions = {
      init: false,
      /* to check if a polygon is initated or not */
      points: [],
      pointSet: true /* true for click event and false for mouse over event */
    };

    var shapeTools;

    return {
      /* This method is fired in the controller and sets the global shapeTools */
      getShapeTools: function(obj) {
        shapeTools = obj;
      },
      /* 
        This function returns the shape which is inturn passed to the drawShape function.
        Baseed on mouse click event
      */

      loadShapeId: function(obj) {
        shapeId.load(obj);
      },

      getShapeId: function() {
        return shapeId.get();
      },

      createShape: function(type, position) {
        /* 0 - Rectangle/Square , 1 - Ellipse/Circle */
        if (createdShape) {
          return {
            start: false,
            shape: createdShape
          };
        }
        var shape;
        var shapeProps = shapeTools.get();

        switch (type) {
          case 0:
            shape = new Konva.Line({
              points: [
                position.x,
                position.y,
                position.x,
                position.y,
                position.x,
                position.y,
                position.x,
                position.y,
                position.x,
                position.y
              ],
              stroke: shapeProps.stroke || "black",
              name: "Rect" + shapeId.getCount("shapes", "rectangle"),
              strokeWidth: shapeProps.strokeWidth || 1,
              fill: shapeProps.fill,
              draggable: true,
              closed: true
            });
            break;
          case 1:
            shape = new Konva.Ellipse({
              x: position.x,
              y: position.y,
              radius: {
                x: 1,
                y: 1
              },
              stroke: shapeProps.stroke || "black",
              name: "Ellipse" + shapeId.getCount("shapes", "ellipse"),
              strokeWidth: shapeProps.strokeWidth || 1,
              fill: shapeProps.fill,
              draggable: true
            });
            break;
        }
        createdShape = shape;

        return {
          start: true,
          shape: createdShape
        };
      },

      /* 
        This function draws the shape which is already created by createShape
        Based on mousemove event
      */
      drawShape: function(position, shapeLock, misc) {
        /* if shapelock is true , lock the aspect ratio */

        /* Misc is a special param for rectangles such as grab selector and text wrapper */

        if (createdShape) {
          switch (createdShape.className) {
            case "Line":
              /* Treating rectangle like a polygon */

              this.drawRectangle(position, createdShape, shapeLock, misc);

              break;
            case "Ellipse":
              createdShape.radius({
                /* Make sure radius isn't negative */
                x: Math.abs(position.x - createdShape.x()),
                y: Math.abs(
                  shapeLock
                    ? position.x - createdShape.x()
                    : position.y - createdShape.y()
                )
              });
              break;
          }
        }
      },

      drawRectangle: function(position, shape, shapelock, misc) {
        var points = shape.points(); /* get rectangle vertices */
        /* Diagonal hinge - Reassign both x and y based on position */

        points[4] = position.x;
        points[5] = shapelock
          ? Math.abs(points[1] + (position.x - points[0]))
          : position.y;

        /* Y - axis hinge (change x - axis and keep y - fixed)*/

        points[7] = shapelock
          ? Math.abs(points[1] + (position.x - points[0]))
          : position.y;
        /* X - axis hinge (change y - axis and keep x - fixed) */

        points[2] = position.x;
        /* Handle selection */

        switch (misc) {
          case "grabber":
            shape.dash([10, 10]);
            break;
          case "wrapper":
            shape.stroke("grey");
            shape.draggable(false);
            break;
        }

        /* Reassign to shape */
        shape.points(points);
      },

      /* This function doesn't actually destroy the shape that has been draws. It simply removes the var inside this factory funtion */
      destroyShape: function() {
        createdShape = undefined;
        polygonOptions = {
          init: false,
          points: [],
          pointSet: true
        };
      },

      /* This function is used to clear the drawing when the user cancels it midway */
      cancelDrawing: function(selection) {
        var selectionPoints = createdShape.points();
        document.body.style.cursor = "default";
        createdShape && createdShape.remove();
        createdShape = undefined;
        polygonOptions = {
          init: false,
          points: [],
          pointSet: true
        };
        return selectionPoints;
      },

      /* 
        @param position = stage pointer position
        @param freeHand = Boolean (enabling freehand)
        @param freeHandMaker = Boolean (enabling marker functionality which doesn't check for threshold)
      */

      createPolygon: function(position, freeHand, freeHandMarker) {
        if (!polygonOptions.init && !createdShape) {
          /* Check if a polygon has been initialized and also if any other shape exists */
          var shapeProps = shapeTools.get(); /* Get shape props */
          polygonOptions.points = [position.x, position.y];

          if (freeHandMarker) {
            /* For Marker */
            createdShape = new Konva.Line({
              name: "markerFreeHand" + shapeId.getCount("markings", "freehand"),
              points: polygonOptions.points,
              fill: shapeProps.fill,
              stroke: shapeProps.stroke || "black",
              strokeWidth: shapeProps.strokeWidth || 1
            });
          } else {
            /* For closable freehand and polygon */
            createdShape = new Konva.Line({
              name: freeHand
                ? "freeHand" + shapeId.getCount("shapes", "freeHand")
                : "polygon" + shapeId.getCount("shapes", "polygon"),
              points: polygonOptions.points,
              fill: shapeProps.fill,
              stroke: shapeProps.stroke || "black",
              strokeWidth: shapeProps.strokeWidth || 1
            });
          }

          polygonOptions.init = true;
          return {
            start: true,
            polygon: createdShape
          };
        } else {
          /* End for freehand marker */
          if (freeHandMarker) {
            polygonOptions.pointSet = true;
            createdShape.draggable(true);
            return {
              start: false,
              polygon: createdShape
            };
          }

          /* Close only when threshold is attained for regular polygons and freehand */

          if (this.checkThreshold(position)) {
            /* Close if threshold is reached */
            polygonOptions.points.splice(
              -2
            ); /* Remove existing mouse over points */
            polygonOptions.points.push(
              polygonOptions.points[0],
              polygonOptions.points[1]
            ); /* Close polygon with inital points */
            createdShape.points(polygonOptions.points);
            polygonOptions.pointSet = true;
            createdShape.closed(true);
            createdShape.draggable(true);
            return {
              start: false,
              polygon: createdShape
            };
          } else {
            polygonOptions.points.splice(
              -2
            ); /* Remove existing mouse over points */
            polygonOptions.points.push(position.x, position.y);
            createdShape.points(polygonOptions.points);
            polygonOptions.pointSet = true;
          }
        }
      },

      drawPolygon: function(position, freeHand) {
        if (createdShape) {
          if (freeHand) {
            /* Freehand block */
            polygonOptions.points.push(position.x, position.y);
            createdShape.points(polygonOptions.points);
          } else {
            /* Polygon block */
            if (polygonOptions.pointSet) {
              polygonOptions.points.push(position.x, position.y);
              polygonOptions.pointSet = false;
              createdShape.points(polygonOptions.points);
            } else {
              polygonOptions.points[polygonOptions.points.length - 2] =
                position.x;
              polygonOptions.points[polygonOptions.points.length - 1] =
                position.y;
              createdShape.points(polygonOptions.points);
            }
          }
        }
      },

      createLine: function(position, type) {
        if (createdShape) {
          return {
            start: false,
            line: createdShape
          };
        }

        var line;
        var shapeProps = shapeTools.get();

        switch (type) {
          case "line":
            line = new Konva.Line({
              name: "lineSimple" + shapeId.getCount("markings", "line"),
              points: [position.x, position.y],
              strokeWidth: shapeProps.strokeWidth || 1,
              stroke: shapeProps.stroke || "black",
              draggable: true
            });
            break;
          case "singleArrow":
            line = new Konva.Arrow({
              name: "lineArrow" + shapeId.getCount("markings", "singleArrow"),
              points: [position.x, position.y],
              strokeWidth: 1,
              stroke: shapeProps.stroke || "black",
              fill: shapeProps.fill || "black",
              draggable: true,
              pointerLength: 10,
              pointerWidth: 10
            });
            break;

          case "doubleArrow":
            line = new Konva.Arrow({
              name:
                "lineArrowDouble" + shapeId.getCount("markings", "doubleArrow"),
              points: [position.x, position.y],
              strokeWidth: shapeProps.strokeWidth || 1,
              stroke: shapeProps.stroke || "black",
              fill: shapeProps.fill || "black",
              draggable: true,
              pointerLength: 10,
              pointerWidth: 10,
              pointerAtBeginning: true
            });
            break;
        }
        createdShape = line;
        return {
          start: true,
          line: createdShape
        };
      },
      drawLine: function(position) {
        if (createdShape) {
          var points = createdShape.points();
          points[2] = position.x;
          points[3] = position.y;
          createdShape.points(points);
        }
      },

      createBezierLine: function(position) {
        if (createdShape) {
          var createdPoints = createdShape.points();

          var q = [
            (createdPoints[2] - createdPoints[0]) * 0.5 + createdPoints[0],
            (createdPoints[3] - createdPoints[1]) * 0.5 + createdPoints[1]
          ];

          var b1 = [
            (createdPoints[2] - createdPoints[0]) * 0.25 + createdPoints[0],
            (createdPoints[3] - createdPoints[1]) * 0.25 + createdPoints[1]
          ];
          var b2 = [
            (createdPoints[2] - createdPoints[0]) * 0.75 + createdPoints[0],
            (createdPoints[3] - createdPoints[1]) * 0.75 + createdPoints[1]
          ];

          createdPoints.push(q[0], q[1]);

          createdShape.points(createdPoints);
          createdShape.tension(1.1);

          return {
            start: false,
            line: createdShape
          };
        }

        var shapeProps = shapeTools.get();

        var bezier = new Konva.Line({
          name: "bezier" + shapeId.getCount("markings", "bezier"),
          lineJoin: "round",
          points: [position.x, position.y],
          strokeWidth: shapeProps.strokeWidth || 1,
          stroke: shapeProps.stroke || "black",
          draggable: true
        });
        createdShape = bezier;

        return {
          start: true,
          line: createdShape
        };
      },

      drawBezierLine: function(position) {
        if (createdShape) {
          var points = createdShape.points();
          points[2] = position.x;
          points[3] = position.y;
          createdShape.points(points);
        }
      },

      // text

      createText: function(props) {
        var textShape = new Konva.Text({
          x: props.position.x,
          y: props.position.y,
          name: "text",
          text: "Placeholder text",
          width: props.width,
          fontSize: 16,
          fontFamily: "Calibri",
          fill: "black"
        });
        return textShape;
      },

      createTextGroup: function() {
        var textGroup = new Konva.Group({
          name: "textGroup" + shapeId.getCount("markings", "text"),
          draggable: true
        });

        return textGroup;
      },

      // calibrator function
      calibrator: function(stage, layer) {
        var points = [];
        var isDone = false;
        var init = true;
        var line;
        return function(position, set, kill) {
          // killling the function

          if (kill) {
            line.destroy();
            layer.draw();
            return;
          }

          position = {
            x: position.x / stage.scale().x,
            y: position.y / stage.scale().y
          };

          if (!isDone) {
            if (init && set) {
              points.push(position.x, position.y);
              line = new Konva.Line({
                points: points,
                fill: "grey",
                stroke: "black",
                strokeWidth: 1,
                dash: [5, 1]
              });
              init = false;
              layer.add(line);
            } else if (!init) {
              if (set) {
                points[2] = position.x;
                points[3] = position.y;
                line.points(points);
                isDone = true;
                $rootScope.$broadcast("calibrated", line);
              } else {
                points[2] = position.x;
                points[3] = position.y;
                line.points(points);
              }
            }
          }
          layer.draw();
        };
      },

      checkThreshold: function(position) {
        var proximity = 10;
        // calulation to identify the proximity to close the polygon
        var xUpperThreshold = polygonOptions.points[0] + proximity;
        var yUpperThreshold = polygonOptions.points[1] + proximity;
        var xLowerThreshold = polygonOptions.points[0] - proximity;
        var yLowerThreshold = polygonOptions.points[1] - proximity;
        return xUpperThreshold > position.x &&
          xLowerThreshold < position.x &&
          (yUpperThreshold > position.y && yLowerThreshold < position.y)
          ? true
          : false;
      },

      /* Extract all shapes */
      extractAllShapes: function(layer) {
        var allShapes = layer.find("Group").reduce(function(acc, x) {
          if (/process*/.test(x.name())) {
            angular.forEach(x.getChildren(), function(child) {
              acc.push(child);
            });
          }
          return acc;
        }, []);
        return allShapes;
      },

      selectShapes: function(layer, points) {
        var allShapes = this.extractAllShapes(layer);

        var p1 = [points[0], points[1]];
        var p2 = [points[4], points[5]];

        var min = {
          x: points[0] > points[4] ? points[4] : points[0],
          y: points[1] > points[5] ? points[5] : points[1]
        };

        var max = {
          x: points[0] < points[4] ? points[4] : points[0],
          y: points[1] < points[5] ? points[5] : points[1]
        };

        var checkSelection = this.checkSelection;
        var selectedShapes = allShapes.filter(function(x) {
          var shapeName = x.name();
          if (
            /Rect*/.test(shapeName) ||
            /polygon*/.test(shapeName) ||
            /freeHand*/.test(shapeName) ||
            /markerFreeHand/.test(shapeName)
          ) {
            var points = x.points();
            var positionOffset = x.position();
            var vertices = [];
            for (var i = 0; i < points.length - 2; i += 2) {
              // ignore the last pair since it's similar to the first pair
              vertices.push([
                points[i] + positionOffset.x,
                points[i + 1] + positionOffset.y
              ]); // chunkify and offset points points
            }
            /* Checks if a shape is selected and returns Boolean */
            return checkSelection(
              {
                min: min,
                max: max
              },
              vertices,
              "rectangle"
            );
          }

          if (/line*/.test(shapeName)) {
            var points = x.points();
            var positionOffset = x.position();
            var vertices = [];
            for (var i = 0; i < points.length; i += 2) {
              // ignore the last pair since it's similar to the first pair
              vertices.push([
                points[i] + positionOffset.x,
                points[i + 1] + positionOffset.y
              ]); // chunkify and offset points points
            }
            /* Checks if a shape is selected and returns Boolean */
            return checkSelection(
              {
                min: min,
                max: max
              },
              vertices,
              "rectangle"
            );
          }

          if (/Ellipse*/.test(shapeName)) {
            return checkSelection(
              {
                min: min,
                max: max
              },
              x.position(),
              "ellipse"
            );
          }

          return false;
        });

        /* return only names of those shapes */
        return selectedShapes;
      },

      checkSelection: function(range, prop, type) {
        /* Selection logic for rectangle */
        if (type === "rectangle") {
          for (var i = 0; i < prop.length; i++) {
            if (
              prop[i][0] >= range.min.x &&
              prop[i][0] <= range.max.x && // x - axis
              (prop[i][1] >= range.min.y && prop[i][1] <= range.max.y) // y - axis
            ) {
              return true;
            }
          }
          return false;
        }
        /* Selection logic for ellipse */
        if (type === "ellipse") {
          // Comparing with center positions
          return prop.x >= range.min.x &&
          prop.x <= range.max.x && // x - axis
            (prop.y >= range.min.y && prop.y <= range.max.y) // -axis
            ? true
            : false;
        }
      }
    };
  }
})();
