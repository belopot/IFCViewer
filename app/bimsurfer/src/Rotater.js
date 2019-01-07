define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.Rotater = xeogl.Component.extend({

        type: "xeogl.Rotater",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;

            var isStart = false;
            var isSelect = false;

            this.cancelRotate = function () {
                isStart = false;
            };

            var rotaterPreview = new xeogl.Entity(scene, {
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

            var initRotate = function () {
                isStart = false;
                isSelect = false;
                rotaterPreview.visible = false;
            };

            this.newRotate = function () {
                initRotate();
                isStart = true;
            };

            input.on("mousemove",
                function (canvasPos) {
                    if (isStart && !isSelect) {
                        updateHitCursorForRotater(canvasPos);
                    }
                    if (isSelect) {
                        moveTarget(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isStart && input.mouseDownLeft) {
                        oldCanvasPos = canvasPos;
                        if (!isSelect)
                            rotaterDecide(canvasPos);
                        else {
                            rotateFinish();
                        }
                    }
                });

            var updateHitCursorForRotater = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                calibrateRotater(hit);
            };

            var rotaterDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                rotaterDecide(hit);
            };

            var calibrateRotater = function (hit) {
                rotaterPreview.visible = true;
            };

            var rotaterDecide = function (hit) {

            };

            var moveTarget = function (canvasPos) {
                
            };

            var rotateFinish = function () {
                isSelect = false;
                rotaterPreview.visible = false;
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