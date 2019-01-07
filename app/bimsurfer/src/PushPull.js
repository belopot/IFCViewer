define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.PushPull = xeogl.Component.extend({

        type: "xeogl.PushPull",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var math = xeogl.math;
            var status = cfg.status;

            var isStart = false;
            var isSelect = false;

            var pushPullPlanePositions = [];
            var pushPullPlaneIndices = [];

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

            var init = function () {
                isStart = false;
                isSelect = false;
                pushPullPlanePositions = [];
                pushPullPlaneIndices = [];
                preview.visible = false;
            };

            this.cancelPushPull = function () {
                isStart = false;
            };

            this.newPushPull = function () {
                init();
                isStart = true;
            };

            input.on("mousemove",
                function (canvasPos) {
                    if (isStart && !isSelect) {
                        updateHit(canvasPos);
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
                            decide(canvasPos);
                        else {
                            moverFinish();
                        }
                    }
                });

            var updateHit = function (canvasPos) {
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
                        pushPullDecide(hit);
                    }
                } else {
                    // setCursor("auto", true);
                }
            };

            var pushpullPlaneNormal;
            var onlyMove = false;
            var previewGeometry;

            var calibrate = function (hit) {
                var entity = hit.entity;
                var positions = entity.geometry.positions;
                var indices = entity.geometry.indices;
                var hitPos = hit.worldPos;
                pushPullPlanePositions = [];
                pushpullPlaneNormal = math.vec3();

                var hitPlanePos0 = [positions[indices[0] * 3], positions[indices[0] * 3 + 1], positions[indices[0] * 3 + 2]];
                var hitPlanePos1 = [positions[indices[1] * 3], positions[indices[1] * 3 + 1], positions[indices[1] * 3 + 2]];
                var hitPlanePos2 = [positions[indices[2] * 3], positions[indices[2] * 3 + 1], positions[indices[2] * 3 + 2]];
                math.triangleNormal(hitPlanePos0, hitPlanePos1, hitPlanePos2, pushpullPlaneNormal);
                math.normalizeVec3(pushpullPlaneNormal, pushpullPlaneNormal);

                var _sI = [];
                for (var i = 0; i < positions.length / 3; i++) {
                    var v = [positions[i * 3] - hitPlanePos0[0], positions[i * 3 + 1] - hitPlanePos0[1], positions[i * 3 + 2] - hitPlanePos0[2]];
                    var dot = math.dotVec3(pushpullPlaneNormal, v);
                    if (dot === 0) {
                        pushPullPlanePositions.push(positions[i]);
                        pushPullPlanePositions.push(positions[i + 1]);
                        pushPullPlanePositions.push(positions[i + 2]);
                        _sI.push(i);
                    }
                }

                pushPullPlaneIndices = [];
                for (var j = 0; j < indices.length / 3; j++) {
                    var i_0 = indices[j * 3];
                    var i_1 = indices[j * 3 + 1];
                    var i_2 = indices[j * 3 + 2];

                    if (_sI.indexOf(i_0) !== -1 && _sI.indexOf(i_1) !== -1 && _sI.indexOf(i_2) !== -1) {
                        pushPullPlaneIndices.push(i_0);
                        pushPullPlaneIndices.push(i_1);
                        pushPullPlaneIndices.push(i_2);
                    }
                }

                if (previewGeometry)
                    previewGeometry.destroy();

                previewGeometry = new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: positions,
                    indices: pushPullPlaneIndices
                });
                preview.geometry = previewGeometry;
                preview.visible = true;
            };

            var selectedEntity;
            var moveIndices = [];
            var selectedEntityPositions;
            var newEntity;
            var newEntityPositions = [];
            var pushPullDecide = function (hit) {
                if (isSelect) {
                    isSelect = false;
                } else {
                    isSelect = true;
                    selectedEntity = hit.entity;
                    selectedEntityPositions = selectedEntity.geometry.positions;
                    var ind = [];
                    moveIndices = [];
                    for (var a = 0; a < pushPullPlaneIndices.length; a++) {
                        var i = pushPullPlaneIndices[a];
                        if (ind.indexOf(i) !== -1)
                            continue;
                        ind.push(i);
                        var s_p0 = selectedEntityPositions[i * 3];
                        var s_p1 = selectedEntityPositions[i * 3 + 1];
                        var s_p2 = selectedEntityPositions[i * 3 + 2];

                        var s_p = [s_p0, s_p1, s_p2];

                        //find same positions
                        for (var b = 0; b < selectedEntityPositions.length / 3; b++) {
                            var p_p = [selectedEntityPositions[b * 3], selectedEntityPositions[b * 3 + 1], selectedEntityPositions[b * 3 + 2]];
                            if (distanceVec3(s_p, p_p) < 0.1) {
                                moveIndices.push(b);
                            }
                        }

                    }
                    moveSensitivity = distanceVec3(camera.eye, hit.worldPos) * 0.001;

                    if (selectedEntity.geometry.positions.length === preview.geometry.positions.length) {
                        onlyMove = false;
                        //Create New Entity
                        preview.visible = false;
                        newEntityPositions = [];
                        for (var l = 0; l < selectedEntityPositions.length / 3; l++) {
                            newEntityPositions.push(selectedEntityPositions[l * 3]);
                            newEntityPositions.push(selectedEntityPositions[l * 3 + 1]);
                            newEntityPositions.push(selectedEntityPositions[l * 3 + 2]);
                            newEntityPositions.push(selectedEntityPositions[l * 3]);
                            newEntityPositions.push(selectedEntityPositions[l * 3 + 1]);
                            newEntityPositions.push(selectedEntityPositions[l * 3 + 2]);
                        }
                        var newEntityIndices = [];
                        for (var k = 0; k < selectedEntity.geometry.indices.length; k++) {
                            newEntityIndices.push(selectedEntity.geometry.indices[k] * 2);
                            newEntityIndices.push(selectedEntity.geometry.indices[k] * 2 + 1);
                        }
                        for(var n = 0; n<selectedEntity.geometry.indices.length * 2; n++){
                            newEntityIndices.push(selectedEntity.geometry.indices[n] * 2);
                        }
                        for(var n = 0; n<selectedEntity.geometry.indices.length * 2; n++){
                            newEntityIndices.push(selectedEntity.geometry.indices[n] * 2+1);
                        }
                        var newEntityNormals = [];
                        for (var m = 0; m < selectedEntity.geometry.normals.length/3; m++) {
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3]*1);
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3 + 1]*1);
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3 + 2]*1);
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3]);
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3 + 1]);
                            newEntityNormals.push(selectedEntity.geometry.normals[m * 3 + 2]);
                        }
                        newEntity = new xeogl.Entity(scene, {
                            geometry: new xeogl.Geometry(scene, {
                                primitive: "triangle-strip",
                                positions: newEntityPositions,
                                indices: newEntityIndices,
                                normals: newEntityNormals
                            }),
                            material: selectedEntity.material,
                            ghostMaterial: selectedEntity.ghostMaterial,
                            ghosted: selectedEntity.ghosted,
                            highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                                edges: true,
                                edgeAlpha: 1.0,
                                edgeColor: [1, 1, 1],
                                edgeWidth: 5,
                                vertices: true,
                                vertexAlpha: 0.5,
                                vertexColor: [1, 0.0039, 0.782],
                                vertexSize: 10,
                                fill: true,
                                fillColor: [1, 0.0039, 0.782],
                                fillAlpha: 0.8
                            }),
                            highlighted: false,
                            pickable: selectedEntity.pickable,
                            layer: selectedEntity.layer,
                            visible: true
                        });
                        selectedEntity.destroy();
                    } else {
                        onlyMove = true;
                    }
                }
            };

            var oldCanvasPos;
            var moveSensitivity = 15;
            var moveTarget = function (canvasPos) {
                if (oldCanvasPos[0] === canvasPos[0] && oldCanvasPos[1] === canvasPos[1]) {
                    return;
                }

                var deltaMove = pushpullPlaneNormal[0] * (canvasPos[0] - oldCanvasPos[0]) + pushpullPlaneNormal[1] * (canvasPos[0] - oldCanvasPos[0]) + pushpullPlaneNormal[2] * (oldCanvasPos[1] - canvasPos[1]);
                oldCanvasPos = canvasPos;

                if (onlyMove) {
                    for (var i = 0; i < moveIndices.length; i++) {
                        selectedEntityPositions[moveIndices[i] * 3] += deltaMove * pushpullPlaneNormal[0] * moveSensitivity;
                        selectedEntityPositions[moveIndices[i] * 3 + 1] += deltaMove * pushpullPlaneNormal[1] * moveSensitivity;
                        selectedEntityPositions[moveIndices[i] * 3 + 2] += deltaMove * pushpullPlaneNormal[2] * moveSensitivity;
                    }
                    selectedEntity.geometry.positions = selectedEntityPositions;
                } else {
                    for (var j = 0; j < moveIndices.length; j++) {
                        newEntityPositions[moveIndices[j]*2 * 3] += deltaMove * pushpullPlaneNormal[0] * moveSensitivity;
                        newEntityPositions[moveIndices[j]*2 * 3 + 1] += deltaMove * pushpullPlaneNormal[1] * moveSensitivity;
                        newEntityPositions[moveIndices[j]*2 * 3 + 2] += deltaMove * pushpullPlaneNormal[2] * moveSensitivity;
                    }
                    newEntity.geometry.positions = newEntityPositions;
                }
            };

            var moverFinish = function () {
                isSelect = false;
                pushPullPlanePositions = [];
                pushPullPlaneIndices = [];
                preview.visible = false;
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