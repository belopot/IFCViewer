(function() {
  "use strict";

  angular.module("app").factory("toolsVPFactory", toolsVPFactory);

  /** @ngInject */
  function toolsVPFactory($rootScope, eventsVPFactory) {
    return {
      // Returns area of polygon
      /* 
        @param points = Array, scale = Number
        @return Number
      */
      polygonArea: function(points, scale) {
        var det = 0;
        var result;
        var chunkedArray = [];
        var chunk = [];
        for (var i = 0; i < points.length; i++) {
          if (chunk.length < 2) {
            chunk.push(points[i]);
          } else {
            chunkedArray.push({
              x: chunk[0],
              y: chunk[1]
            });
            chunk = [];
            chunk.push(points[i]);
          }
        }
        var l = chunkedArray.length;

        if (chunkedArray[0] != chunkedArray[chunkedArray.length - 1])
          chunkedArray = chunkedArray.concat(chunkedArray[0]);

        for (var i = 0; i < l; i++)
          det +=
            chunkedArray[i].x * chunkedArray[i + 1].y -
            chunkedArray[i].y * chunkedArray[i + 1].x;

        if (scale) {
          result = (Math.abs(det) / 2) * scale;
        } else {
          result = Math.abs(det) / 2;
        }
        return Number.parseFloat(result).toFixed(2);
      },
      // Calculate area of rectangle

      rectangleArea: function(height, width, scale) {
        var area = height * width * scale;
        return area;
      },

      // Return area of ellipse
      ellipseArea: function(radii, scale) {
        var area = Math.PI * radii.x * radii.y;
        var result = scale ? area * scale : area;
        return Number.parseFloat(result).toFixed(2);
      },

      ellipseTransfomer: function(stage, layer, ellipse) {
        var vertices = [];
        var set = false;
        var group = new Konva.Group({
          name: "transformers"
        });
        return {
          set: function(radius) {
            var ellipsePosition = ellipse.position();
            vertices.push(
              [ellipsePosition.x - radius.x, ellipsePosition.y],
              [ellipsePosition.x + radius.x, ellipsePosition.y],
              [ellipsePosition.x, ellipsePosition.y + radius.y],
              [ellipsePosition.x, ellipsePosition.y - radius.y]
            );
            var inc = 0;
            angular.forEach(vertices, function(x, $index) {
              var circle = new Konva.Circle({
                x: x[0],
                y: x[1],
                radius: 5 / layer.scaleX(),
                name:
                  ($index + inc).toString() +
                  "," +
                  ($index + inc + 1).toString(),
                /* Assign names as co-ordinates */
                fill: "white",
                stroke: "black",
                strokeWidth: 3 / layer.scaleX(),
                dragBoundFunc: function(pos) {
                  return {
                    x: $index > 1 ? this.getAbsolutePosition().x : pos.x,
                    y: $index <= 1 ? this.getAbsolutePosition().y : pos.y
                  };
                },
                draggable: true
              });
              inc++;
              var circleEvent = eventsVPFactory.shapeEvents(circle);
              circleEvent.register("dragmove.transformer", function() {
                var previousRadius = ellipse.radius();
                var selectedVertex = circle.name();
                var isNegative = false;
                switch (selectedVertex) {
                  case "0,1":
                    isNegative =
                      ellipse.position().x - circle.x() < 0 ? true : false;
                    ellipse.radius({
                      x: Math.abs(ellipse.position().x - circle.x()),
                      y: previousRadius.y
                    });
                    angular.forEach(group.children, function(z) {
                      if (z.name() === "2,3") {
                        if (!isNegative) {
                          z.x(ellipse.position().x + ellipse.radius().x);
                        } else {
                          z.x(ellipse.position().x - ellipse.radius().x);
                        }
                      }
                    });
                    break;
                  case "2,3":
                    isNegative =
                      ellipse.position().x - circle.x() < 0 ? true : false;
                    ellipse.radius({
                      x: Math.abs(ellipse.position().x - circle.x()),
                      y: previousRadius.y
                    });
                    angular.forEach(group.children, function(z) {
                      if (z.name() === "0,1") {
                        if (!isNegative) {
                          z.x(ellipse.position().x + ellipse.radius().x);
                        } else {
                          z.x(ellipse.position().x - ellipse.radius().x);
                        }
                      }
                    });
                    break;
                  case "4,5":
                    isNegative =
                      ellipse.position().y - circle.y() < 0 ? true : false;
                    ellipse.radius({
                      x: previousRadius.x,
                      y: Math.abs(ellipse.position().y - circle.y())
                    });
                    angular.forEach(group.children, function(z) {
                      if (z.name() === "6,7") {
                        if (!isNegative) {
                          z.y(ellipse.position().y + ellipse.radius().y);
                        } else {
                          z.y(ellipse.position().y - ellipse.radius().y);
                        }
                      }
                    });
                    break;
                  case "6,7":
                    isNegative =
                      ellipse.position().y - circle.y() < 0 ? true : false;
                    ellipse.radius({
                      x: previousRadius.x,
                      y: Math.abs(ellipse.position().y - circle.y())
                    });
                    angular.forEach(group.children, function(z) {
                      if (z.name() === "4,5") {
                        if (!isNegative) {
                          z.y(ellipse.position().y + ellipse.radius().y);
                        } else {
                          z.y(ellipse.position().y - ellipse.radius().y);
                        }
                      }
                    });
                    break;
                }
                layer.draw();

                ellipse.fire("transformEllipse");
              });

              /* Scale transfomer based on zoom */

              circleEvent.register("scaleOnZoom", function(e) {
                e.target.radius(5 / layer.scaleX());
                e.target.strokeWidth(3 / layer.scaleX());
                layer.draw();
              });

              circleEvent.register("mouseenter", function(e) {
                document.body.style.cursor = "move";
              });
              circleEvent.register("mouseleave", function(e) {
                document.body.style.cursor = "default";
              });
              group.add(circle);
            });
            ellipse.fire("transformEllipse");

            set = true;
            layer.add(group);
            return group;
          },

          getGroup: function() {
            return group;
          },
          destroy: function() {
            group.destroy();
          }
        };
      },

      /* Custom transformer for polygon */
      customTransformer: function(stage, layer, polygon, isRectangle) {
        /* Change transformer behavious based on isRectangle parameter */
        var vertices = [];
        var set = false;
        var group = new Konva.Group({
          name: "transformers"
        });
        var polygon = polygon;
        return {
          // method to set the points
          set: function(points) {
            for (var i = 0; i < points.length - 2; i += 2) {
              // ignore the last pair since it's similar to the first pair
              vertices.push([points[i], points[i + 1]]); // chunkify points
            }

            /* Counter to generate circle names to map them with co-ordinates */
            var inc = 0;

            angular.forEach(vertices, function(x, $index) {
              var circle = new Konva.Circle({
                x: x[0],
                y: x[1],
                radius: 5 / layer.scaleX(),
                name:
                  ($index + inc).toString() +
                  "," +
                  ($index + inc + 1).toString(),
                /* Assign names as co-ordinates */
                fill: "white",
                stroke: "black",
                strokeWidth: 3 / layer.scaleX(),
                draggable: true
              });
              inc++;

              /* Register dragmove events for the transformer's vertex */
              var circleEvent = eventsVPFactory.shapeEvents(circle);
              circleEvent.register("dragmove.transformer", function(e) {
                if (isRectangle) {
                  /* Bind other vertices for rectangle */
                  var selectedVertex = circle.name();

                  /* Find x and y hinges based upon diagonal hinge */

                  switch (selectedVertex) {
                    case "0,1":
                      vertices[0] = [circle.x(), circle.y()];
                      vertices[1][1] = circle.y();
                      vertices[3][0] = circle.x();
                      angular.forEach(group.children, function(z) {
                        /* x - circle */
                        if (z.name() === "6,7") {
                          z.x(circle.x());
                        }
                        /* y - circle */
                        if (z.name() === "2,3") {
                          z.y(circle.y());
                        }
                      });

                      break;
                    case "2,3":
                      vertices[1] = [circle.x(), circle.y()];
                      vertices[0][1] = circle.y();
                      vertices[2][0] = circle.x();
                      angular.forEach(group.children, function(z) {
                        /* x - circle */
                        if (z.name() === "4,5") {
                          z.x(circle.x());
                        }
                        /* y - circle */
                        if (z.name() === "0,1") {
                          z.y(circle.y());
                        }
                      });
                      break;
                    case "4,5":
                      vertices[2] = [circle.x(), circle.y()];
                      vertices[3][1] = circle.y();
                      vertices[1][0] = circle.x();
                      angular.forEach(group.children, function(z) {
                        /* x - circle */
                        if (z.name() === "2,3") {
                          z.x(circle.x());
                        }
                        /* y - circle */
                        if (z.name() === "6,7") {
                          z.y(circle.y());
                        }
                      });
                      break;
                    case "6,7":
                      vertices[3] = [circle.x(), circle.y()];
                      vertices[2][1] = circle.y();
                      vertices[0][0] = circle.x();
                      angular.forEach(group.children, function(z) {
                        /* x - circle */
                        if (z.name() === "0,1") {
                          z.x(circle.x());
                        }
                        /* y - circle */
                        if (z.name() === "4,5") {
                          z.y(circle.y());
                        }
                      });
                      break;
                  }
                } else {
                  /* Ignore other circles for polygon */
                  var temp = [];
                  angular.forEach(group.children, function(x) {
                    temp.push([x.x(), x.y()]);
                  });
                  vertices = angular.copy(temp);
                }
                polygon.fire("transformPolygon");
              });

              /* Scale transfomer based on zoom */
              circleEvent.register("scaleOnZoom", function(e) {
                e.target.radius(5 / layer.scaleX());
                e.target.strokeWidth(3 / layer.scaleX());
                layer.draw();
              });

              circleEvent.register("mouseenter", function(e) {
                document.body.style.cursor = "move";
              });
              circleEvent.register("mouseleave", function(e) {
                document.body.style.cursor = "default";
              });
              group.add(circle);
            });

            set = true;
            layer.add(group);
            return group;
          },
          // update transformer position when shape is moved
          update: function(offset) {
            group.x(offset.x);
            group.y(offset.y);
            layer.draw();
          },
          getPoints: function() {
            return vertices.reduce(function(acc, x, i) {
              acc.push(x[0], x[1]);
              if (i === vertices.length - 1) {
                // include the start vertex twice to complete the polygon
                acc.push(vertices[0], vertices[1]);
              }
              return acc;
            }, []);
          },
          getGroup: function() {
            return group;
          }
        };
      },

      /* Bezier Transformer */

      bezierTransformer: function(stage, layer, bezier) {
        var vertices = [];
        var set = false;
        var group = new Konva.Group({
          name: "transformers"
        });
        var bezier = bezier;
        return {
          // method to set the points
          set: function(points) {
            for (var i = 0; i < points.length; i += 2) {
              vertices.push([points[i], points[i + 1]]); // chunkify points
            }

            /* Counter to generate circle names to map them with co-ordinates */
            var inc = 0;

            angular.forEach(vertices, function(x, $index) {
              var circle = new Konva.Circle({
                x: x[0],
                y: x[1],
                radius: 5 / layer.scaleX(),
                name:
                  ($index + inc).toString() +
                  "," +
                  ($index + inc + 1).toString(),
                /* Assign names as co-ordinates */
                fill: "white",
                stroke: "black",
                strokeWidth: 3 / layer.scaleX(),
                draggable: true
              });
              inc++;

              /* Register dragmove events for the transformer's vertex */
              var circleEvent = eventsVPFactory.shapeEvents(circle);
              circleEvent.register("dragmove.transformer", function(e) {
                var temp = [];
                angular.forEach(group.children, function(x) {
                  temp.push([x.x(), x.y()]);
                });
                vertices = angular.copy(temp);
                bezier.fire("transformBezier");
              });

              /* Scale transfomer based on zoom */
              circleEvent.register("scaleOnZoom", function(e) {
                e.target.radius(5 / layer.scaleX());
                e.target.strokeWidth(3 / layer.scaleX());
                layer.draw();
              });

              circleEvent.register("mouseenter", function(e) {
                document.body.style.cursor = "move";
              });
              circleEvent.register("mouseleave", function(e) {
                document.body.style.cursor = "default";
              });
              group.add(circle);
            });

            set = true;
            layer.add(group);
            return group;
          },
          // update transformer position when shape is moved
          update: function(offset) {
            group.x(offset.x);
            group.y(offset.y);
            layer.draw();
          },
          getPoints: function() {
            return vertices.reduce(function(acc, x, i) {
              acc.push(x[0], x[1]);
              if (i === vertices.length - 1) {
                // include the start vertex twice to complete the polygon
                acc.push(vertices[0], vertices[1]);
              }
              return acc;
            }, []);
          },
          getGroup: function() {
            return group;
          }
        };
      },

      // function to scale transformer based on zoom

      scaleTransformerBasedOnZoom: function(baseLayer) {
        var transformerGroup = baseLayer.find(".transformers");
        if (transformerGroup.length) {
          angular.forEach(transformerGroup[0].getChildren(), function(child) {
            child.fire("scaleOnZoom");
          });
        }
      },

      metrics: function() {
        var shapeInfo;

        return {
          setShapeInfo: function(info) {
            shapeInfo = info;
          },
          getShapeInfo: function() {
            return shapeInfo;
          }
        };
      },

      colorPicker: function() {
        var props = {
          stroke: "black",
          opacity: 1,
          fill: "rgba(255, 255, 255, 0)",
          strokeWidth: 1
        };

        return {
          set: function(obj) {
            props = Object.assign(props, obj);
          },
          get: function(prop) {
            return prop ? props[prop] : props;
          }
        };
      }
    };
  }
})();
