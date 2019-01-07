define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.LineDrawer = xeogl.Component.extend({

        type: "xeogl.LineDrawer",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;

            var isNew = false;
            var isDecide = false;
            var firstPos = math.vec3();
            var endPos = math.vec3();

            var actions = {
                NONE: -1,
                STRAIGHT: 0,
                FREE: 1,
                SEVERAL: 2
            };

            var totalEdges = cfg.viewer.totalEdges;

            var snapAngleWithAxis = 5;
            var snapDisWithPoint = 1;

            var currentAction = actions.NONE;

            var matLinePreview = new xeogl.PhongMaterial(scene, {
                diffuse: [0, 0, 0],
                backfaces: true,
                lineWidth: 5
            });

            var hmatLinePreview = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0.0039, 1, 0.782],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.5,
                vertexColor: [0.0039, 1, 0.782],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatLinePreviewForVertexSnap = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0.0039, 1, 0.782],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.7,
                vertexColor: [0.0, 0.1, 1],
                vertexSize: 13,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatLinePreviewX = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [1, 0, 0],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.5,
                vertexColor: [1, 0, 0],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatLinePreviewY = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 1, 0],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.5,
                vertexColor: [0, 1, 0],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatLinePreviewZ = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 1],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.5,
                vertexColor: [0, 0, 1],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var matLine = new xeogl.PhongMaterial(scene, {
                emissive: [0.9, 0.3, 0.3],
                backfaces: true,
                lineWidth: 2
            });

            var gmatLine = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 0],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 0.5,
                vertexColor: [0, 0, 0],
                vertexSize: 5,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatLine = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 1],
                edgeWidth: 5,
                vertices: false,
                vertexAlpha: 0.5,
                vertexColor: [0, 0, 1],
                vertexSize: 10,
                fill: true,
                fillColor: [0, 0, 1],
                fillAlpha: 1
            });

            var straightLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: matLinePreview,
                highlightMaterial: hmatLinePreview,
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var hmatSnapLineX = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 0.5,
                edgeColor: [0, 1, 0],
                edgeWidth: 5,
                vertices: false,
                vertexAlpha: 0.5,
                vertexColor: [0.0039, 1, 0.782],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var hmatSnapLineY = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 0.5,
                edgeColor: [1, 0, 0],
                edgeWidth: 5,
                vertices: false,
                vertexAlpha: 0.5,
                vertexColor: [0.0039, 1, 0.782],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 0],
                fillAlpha: 1
            });

            var snapXAxisLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: matLinePreview,
                highlightMaterial: hmatSnapLineX,
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var snapYAxisLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: matLinePreview,
                highlightMaterial: hmatSnapLineY,
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });


            input.on("mousemove",
                function (canvasPos) {
                    if (isNew) {
                        updateHitCursorForLineDrawing(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isNew) {
                        lineDrawingDecide(canvasPos);
                    }
                });

            this.newStraightLine = function () {
                currentAction = actions.STRAIGHT;
                isNew = true;
                isDecide = false;
                firstPos = math.vec3();
                endPos = math.vec3();
                straightLinePreview.visible = false;
            };

            this.cancelDrawLine = function () {
                isNew = false;
                isDecide = false;
                firstPos = math.vec3();
                endPos = math.vec3();
                currentAction = actions.NONE;
                straightLinePreview.visible = false;
                snapXAxisLinePreview.visible = false;
                snapYAxisLinePreview.visible = false;
            };

            var severalLineDrawing = function (hit) {
                if (isDecide) {
                    if (distanceVec3(hit.worldPos, firstPos) < 0.1)
                        return;

                    straightLinePreview.geometry.positions = [firstPos[0], firstPos[1], firstPos[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]];
                    straightLinePreview.visible = true;
                }
            };

            var straightLineDrawing = function (hit) {
                straightLinePreview.visible = true;
                endPos[0] = hit.worldPos[0];
                endPos[1] = hit.worldPos[1];
                endPos[2] = hit.worldPos[2];
                //angle between axis and line
                var line = [endPos[0] - firstPos[0], endPos[1] - firstPos[1], endPos[2] - firstPos[2]];
                math.normalizeVec3(line, line);
                var angleX = Math.acos(math.dotVec3(line, [1, 0, 0]));
                var angleY = Math.acos(math.dotVec3(line, [0, 1, 0]));
                var angleZ = Math.acos(math.dotVec3(line, [0, 0, 1]));
                angleX = radianToDegree(angleX);
                angleY = radianToDegree(angleY);
                angleZ = radianToDegree(angleZ);

                straightLinePreview.highlightMaterial = hmatLinePreview;

                //Snap Axis
                if (angleX >= 0 && angleX <= snapAngleWithAxis || angleX >= 180 - snapAngleWithAxis && angleX <= 180) {
                    //parallel x axis
                    endPos[1] = firstPos[1];
                    straightLinePreview.highlightMaterial = hmatLinePreviewX;
                }

                if (angleY >= 0 && angleY <= snapAngleWithAxis || angleY >= 180 - snapAngleWithAxis && angleY <= 180) {
                    //parallel y axis
                    endPos[0] = firstPos[0];
                    straightLinePreview.highlightMaterial = hmatLinePreviewY;
                }

                if (angleZ >= 0 && angleZ <= snapAngleWithAxis || angleZ >= 180 - snapAngleWithAxis && angleZ <= 180) {
                    //parallel z axis
                    endPos[0] = firstPos[0];
                    endPos[1] = firstPos[1];
                    straightLinePreview.highlightMaterial = hmatLinePreviewZ;
                }
                //Snap Point
                snapXAxisLinePreview.visible = false;
                snapYAxisLinePreview.visible = false;
                Object.keys(totalEdges).forEach(function (i) {
                    var l = totalEdges[i];
                    for (var j = 0; j < l.geometry.positions.length / 3; j++) {
                        var point = [l.geometry.positions[j * 3], l.geometry.positions[j * 3 + 1], l.geometry.positions[j * 3 + 2]];
                        var dis = distanceVec3(point, endPos);
                        if (dis < snapDisWithPoint) {
                            endPos = point;
                            straightLinePreview.highlightMaterial = hmatLinePreviewForVertexSnap;
                        }

                        //snap x axis
                        if (Math.abs(point[0] - endPos[0]) < snapDisWithPoint) {
                            endPos[0] = point[0];
                            snapXAxisLinePreview.geometry.positions = [endPos[0], endPos[1], endPos[2], point[0], point[1], point[2]];
                            snapXAxisLinePreview.visible = true;
                        } 
                        //snap y axis
                        if (Math.abs(point[1] - endPos[1]) < snapDisWithPoint) {
                            endPos[1] = point[1];
                            snapYAxisLinePreview.geometry.positions = [endPos[0], endPos[1], endPos[2], point[0], point[1], point[2]];
                            snapYAxisLinePreview.visible = true;
                        } 
                    }
                });
                if (!isDecide) {
                    firstPos[0] = endPos[0];
                    firstPos[1] = endPos[1];
                    firstPos[2] = endPos[2];
                }

                straightLinePreview.geometry.positions = [firstPos[0], firstPos[1], firstPos[2], endPos[0], endPos[1], endPos[2]];
            };

            var straightLine = [];
            var straightLines = [];
            var straightLineDrawingDecide = function (hit) {
                if (input.mouseDownRight) {
                    straightLine.forEach(partLine => {
                        partLine.ghosted = true;
                        partLine.highlighted = false;
                    });

                    straightLines.push(straightLine);
                    straightLine = [];
                    // isNew = false;
                    isDecide = false;
                    // currentAction = actions.NONE;
                    straightLinePreview.visible = false;
                }

                if (input.mouseDownLeft) {
                    if (isDecide) {
                        var straightLinePart = new xeogl.Entity(scene, {
                            geometry: new xeogl.Geometry(scene, {
                                primitive: "lines",
                                positions: [
                                    firstPos[0], firstPos[1], firstPos[2], endPos[0], endPos[1], endPos[2]
                                ],
                                indices: [
                                    0, 1
                                ]
                            }),
                            material: matLine,
                            ghostMaterial: gmatLine,
                            ghosted: true,
                            highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                                edges: true,
                                edgeAlpha: 1.0,
                                edgeColor: [0, 0, 1],
                                edgeWidth: 5,
                                vertices: true,
                                vertexAlpha: 0.5,
                                vertexColor: [0, 0, 1],
                                vertexSize: 10,
                                fill: true,
                                fillColor: [0, 0, 1],
                                fillAlpha: 1
                            }),
                            highlighted: false,
                            pickable: true,
                            layer: 2,
                            visible: true
                        });

                        
                        

                        totalEdges.push(straightLinePart);
                        straightLine.push(straightLinePart);

                        firstPos[0] = endPos[0];
                        firstPos[1] = endPos[1];
                        firstPos[2] = endPos[2];

                    } else {
                        isDecide = true;
                        firstPos[0] = endPos[0];
                        firstPos[1] = endPos[1];
                        firstPos[2] = endPos[2];
                    }
                }

            };

            this.newFreeLine = function () {
                currentAction = actions.FREE;
                isNew = true;
                isDecide = false;
                firstPos = math.vec3();
                endPos = math.vec3();
            };

            var freeLine = [];
            var freeLines = [];
            var freeLineDrawing = function (hit) {
                if (isDecide) {
                    if (distanceVec3(hit.worldPos, firstPos) < 0.5)
                        return;

                    endPos[0] = hit.worldPos[0];
                    endPos[1] = hit.worldPos[1];
                    endPos[2] = hit.worldPos[2];

                    var freeLinePart = new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [
                                firstPos[0], firstPos[1], firstPos[2], endPos[0], endPos[1], endPos[2]
                            ],
                            indices: [
                                0, 1
                            ]
                        }),
                        material: matLine,
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: true,
                            edgeAlpha: 1.0,
                            edgeColor: [0, 0, 1],
                            edgeWidth: 5,
                            vertices: true,
                            vertexAlpha: 0.5,
                            vertexColor: [0, 0, 1],
                            vertexSize: 10,
                            fill: true,
                            fillColor: [0, 0, 1],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        ghostMaterial: gmatLine,
                        ghosted: false,
                        pickable: true,
                        layer: -2,
                        visible: true
                    });

                    freeLine.push(freeLinePart);
                    totalEdges.push(freeLinePart);

                    firstPos[0] = endPos[0];
                    firstPos[1] = endPos[1];
                    firstPos[2] = endPos[2];
                }
            };

            var freeLineDrawingDecide = function (hit) {
                if (input.mouseDownRight) {
                    //change material
                    freeLine.forEach(partLine => {
                        partLine.ghosted = true;
                        partLine.highlighted = false;
                    });

                    freeLines.push(freeLine);
                    freeLine = [];
                    // isNew = false;
                    isDecide = false;
                    // currentAction = actions.NONE;
                    straightLinePreview.visible = false;
                }

                if (input.mouseDownLeft) {
                    if (isDecide) {
                        endPos = hit.worldPos;
                        // isNew = false;
                        isDecide = false;
                        // currentAction = actions.NONE;
                        //change material
                        freeLine.forEach(partLine => {
                            partLine.ghosted = true;
                            partLine.highlighted = false;
                        });

                        freeLines.push(freeLine);
                        freeLine = [];
                    } else {
                        isDecide = true;
                        firstPos[0] = hit.worldPos[0];
                        firstPos[1] = hit.worldPos[1];
                        firstPos[2] = hit.worldPos[2];
                    }
                }
            };

            this.newSeveralLine = function () {
                currentAction = actions.SEVERAL;
                isNew = true;
                isDecide = false;
                firstPos = math.vec3();
                endPos = math.vec3();
            };

            var severalLine = [];
            var severalLines = [];
            var severalLineDrawing = function (hit) {
                if (isDecide) {
                    straightLinePreview.geometry.positions = [firstPos[0], firstPos[1], firstPos[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]];
                    straightLinePreview.visible = true;
                }
            };

            var severalLineDrawingDecide = function (hit) {
                if (input.mouseDownRight) {
                    //change material
                    severalLine.forEach(partLine => {
                        partLine.ghosted = true;
                        partLine.highlighted = false;
                    });

                    severalLines.push(severalLine);
                    severalLine = [];
                    // isNew = false;
                    isDecide = false;
                    // currentAction = actions.NONE;
                    straightLinePreview.visible = false;
                }
                if (input.mouseDownLeft) {
                    if (isDecide) {

                        endPos[0] = hit.worldPos[0];
                        endPos[1] = hit.worldPos[1];
                        endPos[2] = hit.worldPos[2];

                        var severalLinePart = new xeogl.Entity(scene, {
                            geometry: new xeogl.Geometry(scene, {
                                primitive: "lines",
                                positions: [
                                    firstPos[0], firstPos[1], firstPos[2], endPos[0], endPos[1], endPos[2]
                                ],
                                indices: [
                                    0, 1
                                ]
                            }),
                            material: matLine,
                            highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                                edges: true,
                                edgeAlpha: 1.0,
                                edgeColor: [0, 0, 1],
                                edgeWidth: 5,
                                vertices: true,
                                vertexAlpha: 0.5,
                                vertexColor: [0, 0, 1],
                                vertexSize: 10,
                                fill: true,
                                fillColor: [0, 0, 1],
                                fillAlpha: 1
                            }),
                            highlighted: true,
                            ghostMaterial: gmatLine,
                            ghosted: false,
                            pickable: true,
                            layer: -2,
                            visible: true
                        });

                        severalLine.push(severalLinePart);
                        totalEdges.push(severalLinePart);

                        firstPos[0] = endPos[0];
                        firstPos[1] = endPos[1];
                        firstPos[2] = endPos[2];


                    } else {
                        isDecide = true;
                        firstPos[0] = hit.worldPos[0];
                        firstPos[1] = hit.worldPos[1];
                        firstPos[2] = hit.worldPos[2];
                    }
                }

            };
            var updateHitCursorForLineDrawing = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });

                if (hit) {
                    // setCursor("pointer", true);
                    if (hit.worldPos) {
                        switch (currentAction) {
                            case actions.STRAIGHT:
                                straightLineDrawing(hit);
                                break;
                            case actions.FREE:
                                freeLineDrawing(hit);
                                break;
                            case actions.SEVERAL:
                                severalLineDrawing(hit);
                                break;
                            default:
                                break;
                        }
                    }
                } else {

                    // setCursor("auto", true);
                }
            };

            var lineDrawingDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        switch (currentAction) {
                            case actions.STRAIGHT:
                                straightLineDrawingDecide(hit);
                                break;
                            case actions.FREE:
                                freeLineDrawingDecide(hit);
                                break;
                            case actions.SEVERAL:
                                severalLineDrawingDecide(hit);
                                break;
                            default:
                                break;
                        }
                    }
                } else {
                    // setCursor("auto", true);
                }
            };

            var distanceVec3 = function (a, b) {
                var c0 = a[0] - b[0];
                var c1 = a[1] - b[1];
                var c2 = a[2] - b[2];
                return Math.sqrt(c0 * c0 + c1 * c1 + c2 * c2);
            };

            var radianToDegree = function (rad) {
                return rad * 180 / Math.PI;
            };
            var degreeToRadian = function (deg) {
                return deg * Math.PI / 180;
            };

        },

        _props: {

        }
    });
});