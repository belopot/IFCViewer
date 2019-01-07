define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.SquareMarker = xeogl.Component.extend({

        type: "xeogl.SquareMarker",

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

            var positions = [];
            var targetRect;

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
                edges: true,
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

            var gmatSquarePreview = new xeogl.EmphasisMaterial(scene, {
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0.013, 0.984],
                edgeWidth: 2,
                vertices: true,
                vertexAlpha: 1,
                vertexColor: [1, 0.1, 0.084],
                vertexSize: 8,
                fill: false,
                fillColor: [0.572, 0.713, 0.784],
                fillAlpha: 1
            });

            var preview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [0,0,0,0,0,0,0,0,0,0,0,0],
                    indices: [0,1,1,3,3,2,2,0]
                }),
                material: matRect,
                ghostMaterial: gmatSquarePreview,
                ghosted: true,
                visible: false
            });

            input.on("mousemove",
                function (canvasPos) {
                    if (isNew) {
                        viewer.enableHitPlane();
                        updateHitCursorForSquareMarker(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isNew & input.mouseDownLeft) {
                        if(!isDecide)
                            viewer.disableHitPlane();
                        squareMarkerDecide(canvasPos);
                    }
                });

            this.cancelSquareMarker = function () {
                isNew = false;
                isDecide = false;
                positions = [];
                preview.visible = false;
            };

            this.newSquareMarker = function () {
                isNew = true;
                isDecide = false;
                originPos = math.vec3();
                viewer.disableHitPlane();
            };

            var originScale = 1;
            var calibrateSquareMarker = function (hit) {
                if (isDecide) {
                    preview.visible = true;
                    var disX = (originPos[0] - hit.worldPos[0]);
                    var disY = (originPos[1] - hit.worldPos[1]);
                    var dis = Math.abs(disX) > Math.abs(disY) ? disX : disY;
                    var delta = dis*0.02;
                    if(Math.abs(delta)>0.4){
                        delta = delta > 0 ? 0.4 : -0.4;
                    }
                    originScale+=delta;
                    if(originScale<0){
                        originScale = 0.1;
                    }

                    var t1 = new xeogl.Translate(scene, {
                        xyz: targetBaryPos
                    });
                    var t2 = new xeogl.Scale(scene, {
                        parent: t1,
                        xyz: [originScale, originScale, 1]
                    });
                    preview.transform = t2;                    
                    originPos[0] = hit.worldPos[0];
                    originPos[1] = hit.worldPos[1];
                    originPos[2] = hit.worldPos[2];
                }
            };

            var rect;

            var updateHitCursorForSquareMarker = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });

                if (hit) {
                    // setCursor("pointer", true);
                    if (hit.worldPos) {
                        calibrateSquareMarker(hit);
                    }
                } else {
                    // setCursor("auto", true);
                }
            };
            var targetBaryPos;
            var squareMarkerDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        if (isDecide) {
                            isDecide = false;
                            viewer.disableHitPlane();
                            preview.visible = false;
                            var innerPositions = preview.worldPositions;
                            var exteriorPositions = targetRect.worldPositions;
                            positions = [];
                            for(var i=0; i<innerPositions.length/3; i++){
                                positions.push(innerPositions[i*3]);
                                positions.push(innerPositions[i*3+1]);
                                positions.push(innerPositions[i*3+2]);
                                positions.push(exteriorPositions[i*3]);
                                positions.push(exteriorPositions[i*3+1]);
                                positions.push(exteriorPositions[i*3+2]);
                            }
                            rect = new xeogl.Entity(scene, {
                                geometry: new xeogl.Geometry(scene, {
                                    primitive: "triangles",
                                    positions: positions,
                                    indices: [0,1,4,1,5,4,0,2,1,1,2,3,2,6,3,3,6,7,4,5,7,4,7,6],
                                    normals: [
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,
                                        0, 0, 1,]
                                }),
                                material: matRect,
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
                                ghostMaterial: gmatRect,
                                ghosted: true,
                                pickable: true,
                                layer: 3,
                                visible: true
                            });
                            totalEdges.push(rect);
                            targetRect.destroyed = true;
                            targetRect.geometry.destroy();
                            targetRect.material.destroy();
                            targetRect.destroy();
                        } else {

                            //Check Rect
                            var cntPoints = hit.entity.worldPositions.length/3;
                            if(cntPoints!==4)
                                return;
                            targetRect = hit.entity;
                            isDecide = true;
                            originPos[0] = hit.worldPos[0];
                            originPos[1] = hit.worldPos[1];
                            originPos[2] = hit.worldPos[2];
                            //Bary target
                            targetBaryPos = CalculateCentroid(targetRect.worldPositions);
                            var pos=[];
                            for(var i=0; i<targetRect.worldPositions.length/3; i++){
                                pos.push(targetRect.worldPositions[i*3] - targetBaryPos[0]);
                                pos.push(targetRect.worldPositions[i*3+1] - targetBaryPos[1]);
                                pos.push(targetRect.worldPositions[i*3+2] - targetBaryPos[2]);

                            }
                            // console.log(targetRectPos);
                            preview.geometry.positions = pos;
                            
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

            var CalculateCentroid = function (positions) {
                var s = new math.vec3();
                var areaTotal = 0.0;

                var p1 = new math.vec3();
                var p2 = new math.vec3();
                p1[0] = positions[0];
                p1[1] = positions[1];
                p1[2] = positions[2];
                p2[0] = positions[3];
                p2[1] = positions[4];
                p2[2] = positions[5];

                for (var i = 2; i < positions.length / 3; i++) {
                    var p3 = new math.vec3();
                    p3[0] = positions[i * 3];
                    p3[1] = positions[i * 3 + 1];
                    p3[2] = positions[i * 3 + 2];

                    var edge1 = new math.vec3();
                    math.subVec3(p3, p1, edge1);

                    var edge2 = new math.vec3();
                    math.subVec3(p3, p2, edge2);

                    var crossProduct = new math.vec3();
                    math.cross3Vec3(edge1, edge2, crossProduct);

                    var zero = [0, 0, 0];
                    var area = distanceVec3(crossProduct, zero) / 2;

                    s[0] += area * (p1[0] + p2[0] + p3[0]) / 3;
                    s[1] += area * (p1[1] + p2[1] + p3[1]) / 3;
                    s[2] += area * (p1[2] + p2[2] + p3[2]) / 3;

                    areaTotal += area;
                    p2 = p3;
                }

                var point = new math.vec3();
                point[0] = s[0] / areaTotal;
                point[1] = s[1] / areaTotal;
                point[2] = s[2] / areaTotal;

                return point;
            };

        },

        _props: {

        }
    });
});