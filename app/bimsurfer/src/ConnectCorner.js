define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.ConnectCorner = xeogl.Component.extend({

        type: "xeogl.ConnectCorner",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;

            var isStart = false;
            var isSelect = false;

            this.cancelConnectCorner = function () {
                isStart = false;
            };

            var preview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    indices: [0, 1, 2]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    diffuse: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 5
                }),
                ghostMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: false,
                    fillColor: [1, 0.0039, 0.782],
                    fillAlpha: 0.8
                }),
                ghosted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var initConnectCorner = function () {
                isStart = false;
                isSelect = false;
                preview.visible = false;
            };

            this.newConnectCorner = function (actionName) {
                initConnectCorner();
                isStart = true;
            };

            input.on("mousemove",
                function (canvasPos) {
                    if (isStart) {
                        updateHitCursorFor(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isStart && input.mouseDownLeft) {
                        decide(canvasPos);
                    }
                });

            var updateHitCursorFor = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });

                if (hit) {
                    // setCursor("pointer", true);
                    if (hit.worldPos) {
                        calibrate(hit);
                    }
                } else {
                    preview.visible = false;
                }
            };

            var decide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        if (!preview.visible)
                            return;

                        if (isSelect) {
                            isSelect = false;
                        } else {
                            isSelect = true;
                            selectedEntity = hit.entity;
                        }
                    }
                } else {
                    // setCursor("auto", true);
                }
            };

            var calibrate = function (hit) {
                var entity = hit.entity;
                var positions = entity.worldPositions;
                var hitPlaneIndices = hit.indices;
                var indices = entity.geometry.indices;
                var hitPos = hit.worldPos;

            };

            var selectedEntity;

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