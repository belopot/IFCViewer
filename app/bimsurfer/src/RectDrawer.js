define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.RectDrawer = xeogl.Component.extend({

        type: "xeogl.RectDrawer",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;
            var viewer = cfg.viewer;
            var totalEdges = viewer.totalEdges;

            var isNew = false;
            var isDecide = false;
            var originPos = math.vec3();

            var actions = {
                NONE: -1,
                COMMON: 0
            };

            var vertexCnt = 4;

            var positions = [];

            var currentAction = actions.NONE;

            var matRect = new xeogl.PhongMaterial(scene, {
                diffuse: [0.572, 0.713, 0.784],
                backfaces: true,
            });

            var hmatRect = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 1],
                edgeWidth: 5,
                vertices: true,
                vertexAlpha: 0.5,
                vertexColor: [0, 0, 1],
                vertexSize: 10,
                fill: false,
                fillColor: [0, 0, 1],
                fillAlpha: 1
            });

            var gmatRect = new xeogl.EmphasisMaterial(scene, {
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.572, 0.713, 0.784],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1,
                vertexColor: [0.572, 0.713, 0.784],
                vertexSize: 5,
                fill: true,
                fillColor: [0.572, 0.713, 0.784],
                fillAlpha: 1
            });

            var radiusLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: matRect,
                highlightMaterial: hmatRect,
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var rectPolygon;
            var rectEdge;
            var rects = [];

            input.on("mousemove",
                function (canvasPos) {
                    if (isNew) {
                        updateHitCursorForRectDrawing(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isNew & input.mouseDownLeft) {
                        rectDrawingDecide(canvasPos);
                    }
                });

            this.cancelDrawRect = function () {
                isNew = false;
                isDecide = false;
                positions = [];
                currentAction = actions.NONE;
            };

            this.newCommonRect = function () {
                currentAction = actions.COMMON;
                isNew = true;
                isDecide = false;
                originPos = math.vec3();
                radiusLinePreview.visible = false;
            };

            var commonDrawing = function (hit) {
                if (isDecide) {
                    radiusLinePreview.visible = true;
                    radiusLinePreview.geometry.positions = [originPos[0], originPos[1], originPos[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]];

                    //Point 2
                    positions[3] = hit.worldPos[0];
                    positions[4] = positions[1];  
                    //Point 3
                    positions[6] = positions[0];
                    positions[7] = hit.worldPos[1]; 
                    //Point 4                   
                    positions[9] = hit.worldPos[0];
                    positions[10] = hit.worldPos[1];

                    rectPolygon.geometry.positions = positions;
                }
            };

            var hitPlane;
            var commonDrawingDecide = function (hit) {
                
                if (isDecide) {
                    isDecide = false;
                    // isNew = false;
                    radiusLinePreview.visible = false;
                    // currentAction = actions.NONE;
                    rectPolygon.highlighted = false;
                    positions = [];

                    rects.push(rectPolygon);
                    totalEdges.push(rectPolygon);

                } else {
                    hitPlane = hit;
                    isDecide = true;
                    originPos[0] = hit.worldPos[0];
                    originPos[1] = hit.worldPos[1];
                    originPos[2] = hit.worldPos[2];

                    for (var i = 0; i < vertexCnt; i++) {
                        positions.push(originPos[0]);
                        positions.push(originPos[1]);
                        positions.push(originPos[2]);
                    }

                    rectPolygon = new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "triangles",
                            positions: positions,
                            indices: [0,1,3,3,2,0],
                            normals: [
                                0, 0, 1,
                                0, 0, 1,
                                0, 0, 1,
                                0, 0, 1,]
                        }),
                        material: matRect,
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: false,
                            edgeAlpha: 1.0,
                            edgeColor: [0, 0, 1],
                            edgeWidth: 5,
                            vertices: false,
                            vertexAlpha: 0.5,
                            vertexColor: [0, 0, 1],
                            vertexSize: 10,
                            fill: false,
                            fillColor: [0, 0, 1],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        ghostMaterial: gmatRect,
                        ghosted: true,
                        pickable: true,
                        layer: 3,
                        visible: true
                    });

                    // for(var j=0; j<vertexCnt; j++){
                    //     var e1 = new xeogl.Entity(scene, {
                    //         geometry: new xeogl.Geometry(scene, {
                    //             primitive: "lines",
                    //             positions: [positions[j*3],positions[j*3+1],positions[j*3+2],positions[j*3+3],positions[j*3+4],positions[j*3+5]],
                    //             indices: [0,1],
                    //             normals: [
                    //                 0, 0, 1,
                    //                 0, 0, 1
                    //             ]
                    //         }),
                    //         material: matRect,
                    //         highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    //             edges: true,
                    //             edgeAlpha: 1.0,
                    //             edgeColor: [0, 0, 1],
                    //             edgeWidth: 5,
                    //             vertices: true,
                    //             vertexAlpha: 0.5,
                    //             vertexColor: [0, 0, 1],
                    //             vertexSize: 10,
                    //             fill: false,
                    //             fillColor: [0, 0, 1],
                    //             fillAlpha: 1
                    //         }),
                    //         highlighted: true,
                    //         ghostMaterial: gmatRect,
                    //         ghosted: true,
                    //         pickable: true,
                    //         layer: 3,
                    //         visible: true
                    //     });
                    // }
                    
                }
            };

            var updateHitCursorForRectDrawing = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });

                if (hit) {
                    // setCursor("pointer", true);
                    if (hit.worldPos) {
                        switch (currentAction) {
                            case actions.COMMON:
                                commonDrawing(hit);
                                break;
                            default:
                                break;
                        }
                    }
                } else {

                    // setCursor("auto", true);
                }
            };

            var rectDrawingDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        switch (currentAction) {
                            case actions.COMMON:
                                commonDrawingDecide(hit);
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

        },

        _props: {

        }
    });
});