define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.CircleDrawer = xeogl.Component.extend({

        type: "xeogl.CircleDrawer",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;
            var totalEdges = cfg.viewer.totalEdges;

            var isNew = false;
            var isDecide = false;
            var originPos = math.vec3();

            var actions = {
                NONE: -1,
                COMMON: 0
            };

            var vertexCnt = 30;

            var positions = [];
            var indices = [];
            var normals = [];

            var currentAction = actions.NONE;

            var matCircle = new xeogl.PhongMaterial(scene, {
                diffuse: [0.572, 0.713, 0.784],
                backfaces: true,
            });

            var hmatCircle = new xeogl.EmphasisMaterial(scene, {
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

            var gmatCircle = new xeogl.EmphasisMaterial(scene, {
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
                material: matCircle,
                highlightMaterial: hmatCircle,
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var circle;
            var circles = [];

            input.on("mousemove",
                function (canvasPos) {
                    if (isNew) {
                        updateHitCursorForCircleDrawing(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isNew & input.mouseDownLeft) {
                        circleDrawingDecide(canvasPos);
                    }
                });

            this.cancelDrawCircle = function () {
                isNew = false;
                isDecide = false;
                positions = [];
                indices = [];
                normals = [];
                currentAction = actions.NONE;
            };

            this.newCommonCircle = function () {
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
                    circle.visible = true;

                    var radius = distanceVec3(originPos, hit.worldPos);

                    for (var i = 0; i < vertexCnt; i++) {
                        positions[i * 3] = radius * Math.cos((i / vertexCnt) * 2.0 * Math.PI) + originPos[0];
                        positions[i * 3 + 1] = radius * Math.sin((i / vertexCnt) * 2.0 * Math.PI) + originPos[1];
                    }

                    circle.geometry.positions = positions;
                }
            };

            var commonDrawingDecide = function (hit) {
                if (isDecide) {
                    isDecide = false;
                    // isNew = false;
                    radiusLinePreview.visible = false;
                    // currentAction = actions.NONE;

                    circle.highlighted = false;

                    positions = [];
                    indices = [];
                    normals = [];

                    circles.push(circle);
                    totalEdges.push(circle);

                } else {
                    isDecide = true;
                    originPos[0] = hit.worldPos[0];
                    originPos[1] = hit.worldPos[1];
                    originPos[2] = hit.worldPos[2];

                    for (var i = 0; i <= vertexCnt; i++) {
                        positions.push(originPos[0]);
                        positions.push(originPos[1]);
                        positions.push(originPos[2]);
                        
                        normals.push(0);
                        normals.push(0);
                        normals.push(1);
                        if (i == 0)
                            indices.push(i);
                        else {
                            if (i == vertexCnt) {
                                indices.push(0);
                                indices.push(vertexCnt);
                            } else {
                                indices.push(i);
                                indices.push(vertexCnt);
                                indices.push(i);
                            }
                        }
                    }
                    circle = new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "triangles",
                            positions: positions,
                            indices: indices,
                            normals: normals
                        }),
                        material: matCircle,
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
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
                        }),
                        highlighted: false,
                        ghostMaterial: gmatCircle,
                        ghosted: true,
                        pickable: true,
                        layer: 3,
                        visible: true
                    });
                }
            };

            var updateHitCursorForCircleDrawing = function (canvasPos) {
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

            var circleDrawingDecide = function (canvasPos) {
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