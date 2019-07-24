define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.Bucketer = xeogl.Component.extend({

        type: "xeogl.Bucketer",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;

            var isStart = false;

            this.cancelBucket = function () {
                isStart = false;
            };

            var bucketPlanePositions = [];
            var bucketPlaneIndices = [];

            var initBucket = function () {
                isStart = false;
                bucketPlanePositions = [];
                bucketPlaneIndices = [];
            };

            var materialManager;
            this.newBucket = function (matManager) {
                materialManager = matManager;
                initBucket();
                isStart = true;
            };

            input.on("mousedown",
                function (canvasPos) {
                    if (isStart && input.mouseDownLeft) {
                        bucketDecide(canvasPos);
                    }
                });


            var bucketDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        var entity = hit.entity;
                        var positions = entity.worldPositions;
                        var hitPlaneIndices = hit.indices;
                        var indices = entity.geometry.indices;
                        var hitPos = hit.worldPos;
                        bucketPlanePositions = [];
                        var bucketPlaneNormal = math.vec3();

                        var hitPlanePos0 = [entity.worldPositions[hitPlaneIndices[0] * 3], entity.worldPositions[hitPlaneIndices[0] * 3 + 1], entity.worldPositions[hitPlaneIndices[0] * 3 + 2]];
                        var hitPlanePos1 = [entity.worldPositions[hitPlaneIndices[1] * 3], entity.worldPositions[hitPlaneIndices[1] * 3 + 1], entity.worldPositions[hitPlaneIndices[1] * 3 + 2]];
                        var hitPlanePos2 = [entity.worldPositions[hitPlaneIndices[2] * 3], entity.worldPositions[hitPlaneIndices[2] * 3 + 1], entity.worldPositions[hitPlaneIndices[2] * 3 + 2]];

                        math.triangleNormal(hitPlanePos0, hitPlanePos1, hitPlanePos2, bucketPlaneNormal);
                        math.normalizeVec3(bucketPlaneNormal, bucketPlaneNormal);

                        var _sI = [];
                        for (var i = 0; i < positions.length / 3; i++) {
                            var v = [positions[i * 3] - hitPlanePos0[0], positions[i * 3 + 1] - hitPlanePos0[1], positions[i * 3 + 2] - hitPlanePos0[2]];
                            var dot = math.dotVec3(bucketPlaneNormal, v);
                            if (dot === 0) {
                                bucketPlanePositions.push(positions[i]);
                                bucketPlanePositions.push(positions[i + 1]);
                                bucketPlanePositions.push(positions[i + 2]);
                                _sI.push(i);
                            }
                        }

                        bucketPlaneIndices = [];
                        for (var j = 0; j < indices.length / 3; j++) {
                            var i_0 = indices[j * 3];
                            var i_1 = indices[j * 3 + 1];
                            var i_2 = indices[j * 3 + 2];

                            if (_sI.indexOf(i_0) !== -1 && _sI.indexOf(i_1) !== -1 && _sI.indexOf(i_2) !== -1) {
                                bucketPlaneIndices.push(i_0);
                                bucketPlaneIndices.push(i_1);
                                bucketPlaneIndices.push(i_2);
                            }
                        }

  
                        for (var k = 0; k < positions.length / 3; k++) {

                        }

                        entity.ghostMaterial = materialManager.getSelectedMaterial();
                    }
                } else {
                    // setCursor("auto", true);
                }
            };

        },

        _props: {

        }
    });
});