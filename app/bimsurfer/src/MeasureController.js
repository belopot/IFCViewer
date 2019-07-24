define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.MeasureController = xeogl.Component.extend({

        type: "xeogl.MeasureController",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var camera = scene.camera;
            var canvas = scene.canvas;
            var math = xeogl.math;
            var status = cfg.status;
            var viewer = cfg.viewer;

            var _isCreate = false;
            var _isFirstDimensionPos = false;
            var _isEndDimensionPos = false;
            var _firstPosDimension = math.vec3();
            var _endPosDimension = math.vec3();

            var totalEdges = viewer.totalEdges;

            //Triangle Area
            var _trianglePos0 = math.vec3();
            var _trianglePos1 = math.vec3();
            var _trianglePos2 = math.vec3();

            //Same Plane
            var _samePlanePositions = [];
            var _samePlaneIndices = [];

            //Vertex Length
            var _nearVertexPos = null;

            //Angle
            var _firstLinePos0 = math.vec3();
            var _firstLinePos1 = math.vec3();
            var _secondLinePos0 = math.vec3();
            var _secondLinePos1 = math.vec3();
            var _angleStep = 0;

            var dimensionEntity = [];
            var dimensionRatio = 345.5998585386267;

            var actions = {
                NONE: -1,
                COMMON_LENGTH: 0, //Common Length
                EDGE_LENGTH: 1, //Edge Calibrate
                VERTEX_LENGTH: 2, //Vertex Calibrate
                TRIANGLE_AREA: 3, //Triangle Area
                SAME_PLANE: 4, //Same Plane
                TOTAL_AREA: 5, //Total Area
                VOLUME: 6, //Volume
                ANGLE: 7, //Angle
                CIRCLE_DIAMETER: 8, //CircleDiameter
                CIRCLE_CIRCUM: 9, //CircleCircum
                TARGET_LENGTH: 10, //Target Length
            };

            var currentAction = actions.COMMON_LENGTH;

            var _targetMeshDimension = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        -0.5, 0.5, 0, 0.5, 0.5, 0,
                        -0.5, -0.5, 0, 0.5, -0.5, 0,
                        -0.3, 0, 0, 0.3, 0, 0,
                        0, 0.3, 0, 0, -0.3, 0,
                        0, 0, 0, 0, 0, 0.5
                    ],
                    indices: [
                        0, 1,
                        0, 2,
                        2, 3,
                        1, 3,
                        4, 5,
                        6, 7,
                        8, 9
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    emissive: [1, 0.2, 0.2],
                    diffuse: [1, 0, 0],
                    ambient: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 10
                }),
                pickable: false,
                layer: -1,
                visible: false
            });
            var _calibrateVertexPreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "points",
                    positions: [
                        0, 0, 0
                    ],
                    indices: [
                        0
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    emissive: [1, 0.2, 0.2],
                    diffuse: [1, 0, 0],
                    ambient: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 10
                }),
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: false,
                    edgeAlpha: 1.0,
                    edgeColor: [0.2, 0.8, 0.2],
                    edgeWidth: 2,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 13,
                    fill: false,
                    fillColor: [0, 0, 0],
                    fillAlpha: 1
                }),
                highlighted: true,
                pickable: false,
                layer: -1,
                visible: false
            });
            var _calibrateLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    diffuse: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 5
                }),
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: false,
                    fillColor: [0, 0, 0],
                    fillAlpha: 1
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateCircleDiameterPreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    diffuse: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 5
                }),
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: false,
                    fillColor: [0, 0, 0],
                    fillAlpha: 1
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateAngleLinePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "lines",
                    positions: [
                        0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    diffuse: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 5
                }),
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: false,
                    fillColor: [0, 0, 0],
                    fillAlpha: 1
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateTrianglePreview = new xeogl.Entity(scene, {
                geometry: new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    indices: [
                        0, 1, 2
                    ]
                }),
                material: new xeogl.PhongMaterial(scene, {
                    diffuse: [0, 0, 0],
                    backfaces: true,
                    lineWidth: 5
                }),
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
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
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateSameplanePreview = new xeogl.Entity(scene, {
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
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: true,
                    fillColor: [1, 0.0039, 0.782],
                    fillAlpha: 0.8
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateTotalAreaPreview = new xeogl.Entity(scene, {
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
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: true,
                    fillColor: [1, 0.0039, 0.782],
                    fillAlpha: 0.8
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var _calibrateVolumePreview = new xeogl.Entity(scene, {
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
                highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [1, 0.0039, 0.782],
                    edgeWidth: 5,
                    vertices: true,
                    vertexAlpha: 0.5,
                    vertexColor: [1, 0.0039, 0.782],
                    vertexSize: 10,
                    fill: true,
                    fillColor: [1, 0.0039, 0.782],
                    fillAlpha: 0.8
                }),
                highlighted: true,
                pickable: false,
                layer: 0,
                visible: false
            });

            var matTargetLengthText = new xeogl.PhongMaterial(scene, {
                diffuse: [0, 0, 0],
                backfaces: true,
                lineWidth: 5,
                alpha: 1
            });

            input.on("mousemove",
                function (canvasPos) {
                    if (_isCreate) {

                        updateHitCursorForMeasure(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (_isCreate && input.mouseDownLeft) {
                        dimensionDecide(canvasPos);

                    }
                });

            this.newDimensions = function (actionName) {
                switch (actionName) {
                    case 'CommonLength':
                        currentAction = actions.COMMON_LENGTH;
                        break;
                    case 'TargetLength':
                        currentAction = actions.TARGET_LENGTH;
                        break;
                    case 'EdgeCalibrate':
                        currentAction = actions.EDGE_LENGTH;
                        break;
                    case 'VertexCalibrate':
                        currentAction = actions.VERTEX_LENGTH;
                        break;
                    case 'Triangle Area':
                        currentAction = actions.TRIANGLE_AREA;
                        break;
                    case 'SamePlane':
                        currentAction = actions.SAME_PLANE;
                        break;
                    case 'TotalArea':
                        currentAction = actions.TOTAL_AREA;
                        break;
                    case 'Volume':
                        currentAction = actions.VOLUME;
                        break;
                    case 'Angle':
                        currentAction = actions.ANGLE;
                        break;
                    case 'CircleDiameter':
                        currentAction = actions.CIRCLE_DIAMETER;
                        break;
                    case 'CircleCircum':
                        currentAction = actions.CIRCLE_CIRCUM;
                        break;
                    default:
                        break;
                }
                console.log(actionName);
                _isCreate = true;
                _isFirstDimensionPos = false;
                _isEndDimensionPos = false;
                _firstPosDimension = math.vec3();
                _endPosDimension = math.vec3();
                _nearVertexPos = null;
                _calibrateLinePreview.visible = false;
                _calibrateVertexPreview.visible = false;

                _trianglePos0 = math.vec3();
                _trianglePos1 = math.vec3();
                _trianglePos2 = math.vec3();
                _calibrateTrianglePreview.visible = false;

                _calibrateSameplanePreview.visible = false;

                _calibrateTotalAreaPreview.visible = false;

                _calibrateVolumePreview.visible = false;

                _firstLinePos0 = math.vec3();
                _firstLinePos1 = math.vec3();
                _secondLinePos0 = math.vec3();
                _secondLinePos1 = math.vec3();
                _angleStep = 0;
                _calibrateAngleLinePreview.visible = false;

                if (currentAction === actions.COMMON_LENGTH || currentAction === actions.TARGET_LENGTH || currentAction === actions.CIRCLE_DIAMETER || currentAction === actions.CIRCLE_CIRCUM) {
                    viewer.enableHitPlane();
                } else {
                    viewer.disableHitPlane();
                }
            };

            this.cancelMeasure = function () {
                _isCreate = false;
                _isFirstDimensionPos = false;
                _isEndDimensionPos = false;
                _firstPosDimension = math.vec3();
                _endPosDimension = math.vec3();
                _nearVertexPos = null;
                _calibrateLinePreview.visible = false;
                _calibrateVertexPreview.visible = false;

                _trianglePos0 = math.vec3();
                _trianglePos1 = math.vec3();
                _trianglePos2 = math.vec3();
                _calibrateTrianglePreview.visible = false;

                _calibrateSameplanePreview.visible = false;

                _calibrateTotalAreaPreview.visible = false;

                _calibrateVolumePreview.visible = false;

                _firstLinePos0 = math.vec3();
                _firstLinePos1 = math.vec3();
                _secondLinePos0 = math.vec3();
                _secondLinePos1 = math.vec3();
                _angleStep = 0;
                _calibrateAngleLinePreview.visible = false;
            };

            this.deleteDimensions = function () {
                for (var dim in dimensionEntity) {
                    dimensionEntity[dim].destroy();
                }
                dimensionEntity = [];

                removeMarker();
            };

            var commonLength = function (hit) {
                var xVec3 = [1, 0, 0];
                var yVec3 = [0, 1, 0];
                var zVec3 = [0, 0, 1];

                var normal = math.vec3();
                normal = hit.normal;
                math.normalizeVec3(normal, normal);

                //Normal vector of plane(pre-target)
                var p_normal = math.vec3();
                var p_vertex0Pos = [_targetMeshDimension.geometry.positions[0], _targetMeshDimension.geometry.positions[1], _targetMeshDimension.geometry.positions[2]];
                var p_vertex1Pos = [_targetMeshDimension.geometry.positions[3], _targetMeshDimension.geometry.positions[4], _targetMeshDimension.geometry.positions[5]];
                var p_vertex2Pos = [_targetMeshDimension.geometry.positions[6], _targetMeshDimension.geometry.positions[7], _targetMeshDimension.geometry.positions[8]];

                math.triangleNormal(p_vertex0Pos, p_vertex1Pos, p_vertex2Pos, p_normal);
                // math.normalizeVec3(p_normal, p_normal);

                // console.log(p_normal);

                //Angle(radian) between normal vector and x axis, y axis, z axis
                var n_ang_x = math.angleVec3(normal, xVec3);
                var n_ang_y = math.angleVec3(normal, yVec3);
                var n_ang_z = math.angleVec3(normal, zVec3);

                //Angle(radian) between normal vector of plane and x axis, y axis, z axis - normal vector of plane is [0,0,1]
                var p_ang_x = math.angleVec3(p_normal, xVec3);
                var p_ang_y = math.angleVec3(p_normal, yVec3);
                var p_ang_z = math.angleVec3(p_normal, zVec3);

                //Angle(radian) between normal vector of plane and normal vector of entity of hit
                var ang_x = (n_ang_x - p_ang_x);
                var ang_y = (n_ang_y - p_ang_y);
                var ang_z = (n_ang_z - p_ang_z);

                ang_x = radianToDegree(ang_x);
                ang_y = radianToDegree(ang_y);
                ang_z = radianToDegree(ang_z);

                // distance target pos with camera eye
                var disCamToTarget = distanceVec3(hit.worldPos, camera.eye);
                var targetScale = [disCamToTarget / 20, disCamToTarget / 20, disCamToTarget / 20];

                // console.log(t_normal, ang_x, ang_y, ang_z);

                var t1 = new xeogl.Translate(scene, {
                    xyz: hit.worldPos
                });
                var t2 = new xeogl.Scale(scene, {
                    parent: t1,
                    xyz: targetScale
                });
                var t3 = new xeogl.Rotate(scene, {
                    parent: t2,
                    xyz: [0, 0, 1],
                    angle: ang_z
                });
                var t4 = new xeogl.Rotate(scene, {
                    parent: t3,
                    xyz: [0, 1, 0],
                    angle: ang_y
                });
                var t5 = new xeogl.Rotate(scene, {
                    parent: t4,
                    xyz: [1, 0, 0],
                    angle: ang_x
                });

                _targetMeshDimension.visible = true;
                _targetMeshDimension.transform = t5;

                if (_isFirstDimensionPos) {
                    _calibrateLinePreview.visible = true;
                    _calibrateLinePreview.geometry.positions = [_firstPosDimension[0], _firstPosDimension[1], _firstPosDimension[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]];
                }
            };

            var commonLengthDecide = function (hit) {
                if (_isFirstDimensionPos) {
                    _isEndDimensionPos = true;
                    _endPosDimension = hit.worldPos;
                    _isCreate = false;
                    _targetMeshDimension.visible = false;
                    _calibrateLinePreview.visible = false;
                    //Draw new dimension
                    dimensionEntity.push(new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [
                                _firstPosDimension[0], _firstPosDimension[1], _firstPosDimension[2], _endPosDimension[0], _endPosDimension[1], _endPosDimension[2]
                            ],
                            indices: [
                                0, 1
                            ]
                        }),
                        material: new xeogl.PhongMaterial(scene, {
                            emissive: [0.9, 0.3, 0.3],
                            backfaces: true,
                            lineWidth: 2
                        }),
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: true,
                            edgeAlpha: 1.0,
                            edgeColor: [1, 0.0039, 0.682], //pink color
                            edgeWidth: 2,
                            vertices: true,
                            vertexAlpha: 0.3,
                            vertexColor: [1, 0.005, 0.682],
                            vertexSize: 8,
                            fill: true,
                            fillColor: [1, 0.0039, 0.682],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        pickable: false,
                        layer: -2,
                        visible: true
                    }));
                    var dis = distanceVec3(_endPosDimension, _firstPosDimension);
                    //unit mm
                    dis = dimensionRatio * dis;
                    dis = Math.ceil(dis);

                    var p0 = (_endPosDimension[0] + _firstPosDimension[0]) / 2;
                    var p1 = (_endPosDimension[1] + _firstPosDimension[1]) / 2;
                    var p2 = (_endPosDimension[2] + _firstPosDimension[2]) / 2;

                    var txtPos = [p0, p1, p2];
                    // dimension text
                    marker(txtPos, dis + "mm");

                } else {
                    _isFirstDimensionPos = true;
                    _firstPosDimension[0] = hit.worldPos[0];
                    _firstPosDimension[1] = hit.worldPos[1];
                    _firstPosDimension[2] = hit.worldPos[2];
                }
            };

            var snapDisForTargetLength = 2;
            var targetLine;
            var targetLength = function (hit) {
                if (targetDecide) {
                    targetLengthConnectLine.geometry.positions = [targetLengthConnectLine.geometry.positions[0], targetLengthConnectLine.geometry.positions[1], targetLengthConnectLine.geometry.positions[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]];
                    var trans = new xeogl.Translate(scene, {
                        xyz: hit.worldPos
                    });
                    targetLengthText.transform = trans;
                } else {
                    for (var i = 0; i < Object.keys(totalEdges).length; i++) {
                        var edge = totalEdges[i];
                        for (var j = 0; j < edge.geometry.positions.length / 3; j++) {
                            var edge_pos0 = [edge.worldPositions[j*3], edge.worldPositions[j*3+1], edge.worldPositions[j*3+2]];
                            var edge_pos1 = [edge.worldPositions[j*3+3], edge.worldPositions[j*3+4], edge.worldPositions[j*3+5]];
                            var snapDis = distanceLineAndVertex(edge_pos0, edge_pos1, hit.worldPos);

                            var minX = edge_pos0[0] > edge_pos1[0] ? edge_pos1[0] : edge_pos0[0];
                            var maxX = edge_pos0[0] < edge_pos1[0] ? edge_pos1[0] : edge_pos0[0];
                            var minY = edge_pos0[1] > edge_pos1[1] ? edge_pos1[1] : edge_pos0[1];
                            var maxY = edge_pos0[1] < edge_pos1[1] ? edge_pos1[1] : edge_pos0[1];
                            var minZ = edge_pos0[2] > edge_pos1[2] ? edge_pos1[2] : edge_pos0[2];
                            var maxZ = edge_pos0[2] < edge_pos1[2] ? edge_pos1[2] : edge_pos0[2];

                            minX -= snapDisForTargetLength;
                            minY -= snapDisForTargetLength;
                            minZ -= snapDisForTargetLength;
                            maxX += snapDisForTargetLength;
                            maxY += snapDisForTargetLength;
                            maxZ += snapDisForTargetLength;

                            if (hit.worldPos[0] > minX && hit.worldPos[0] < maxX && hit.worldPos[1] > minY && hit.worldPos[1] < maxY && hit.worldPos[2] > minZ && hit.worldPos[2] < maxZ && snapDis < snapDisForTargetLength) {
                                edge.highlighted = true;
                                targetLine = edge;
                                break;
                            } else {
                                edge.highlighted = false;
                                targetLine = undefined;
                            }
                        }
                        if(targetLine){
                            break;
                        }
                    }
                }
            };

            var targetDecide = false;
            var targetPos;
            var targetLengthConnectLine;
            var targetLengthText;
            var targetLengthDecide = function (hit) {
                if (targetLine === undefined) {
                    return;
                }
                console.log("dddd");
                if (targetDecide) {
                    dimensionEntity.push(targetLengthConnectLine);
                    dimensionEntity.push(targetLengthText);
                    targetLine.highlighted = false;
                    targetLine = undefined;
                    targetDecide = false;
                    // _isCreate = false;
                } else {
                    targetPos = getNearPosOnEdgeFromVertex([targetLine.worldPositions[0], targetLine.worldPositions[1], targetLine.worldPositions[2]], [targetLine.worldPositions[3], targetLine.worldPositions[4], targetLine.worldPositions[5]], hit.worldPos);
                    //Draw new dimension
                    targetLengthConnectLine = new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [targetPos[0], targetPos[1], targetPos[2], hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]],
                            indices: [0, 1]
                        }),
                        material: matTargetLengthText,
                        pickable: false,
                        layer: -2,
                        visible: true
                    });
                    // dimension text
                    var length = distanceVec3([targetLine.worldPositions[0], targetLine.worldPositions[1], targetLine.worldPositions[2]], [targetLine.worldPositions[3], targetLine.worldPositions[4], targetLine.worldPositions[5]]);
                    length = dimensionRatio * length;
                    length = Math.ceil(length);
                    targetLengthText = new xeogl.Entity(scene, { // Label
                        geometry: new xeogl.VectorTextGeometry(scene, {
                            text: length + "mm",
                            size: 3
                        }),
                        material: matTargetLengthText,
                        pickable: false,
                        collidable: true,
                        visible: true,
                        transform: new xeogl.Translate(scene, {
                            xyz: hit.worldPos
                        }),
                        billboard: "spherical"
                    });

                    targetDecide = true;
                }
            };

            var calibrateVertex = function (hit) {
                var entity = hit.entity;
                var primIndex = hit.primIndex;
                var indices = hit.indices;
                var hitPos = hit.worldPos;

                var snapDis = 10;
                // console.log(hit);

                var trianglePos0 = [entity.worldPositions[indices[0] * 3], entity.worldPositions[indices[0] * 3 + 1], entity.worldPositions[indices[0] * 3 + 2]];
                var trianglePos1 = [entity.worldPositions[indices[1] * 3], entity.worldPositions[indices[1] * 3 + 1], entity.worldPositions[indices[1] * 3 + 2]];
                var trianglePos2 = [entity.worldPositions[indices[2] * 3], entity.worldPositions[indices[2] * 3 + 1], entity.worldPositions[indices[2] * 3 + 2]];

                var triangleVertexPos = [];
                triangleVertexPos.push(trianglePos0);
                triangleVertexPos.push(trianglePos1);
                triangleVertexPos.push(trianglePos2);

                var d = snapDis;
                for (var i = 0; i < triangleVertexPos.length; i++) {
                    // Distance between hit pos and triangle Pos
                    var dis = distanceVec3(triangleVertexPos[i], hitPos);
                    if (snapDis > dis) {
                        if (d > dis) {
                            d = dis;
                            _nearVertexPos = triangleVertexPos[i];
                        }
                    }
                }

                if (_nearVertexPos === null) {
                    _calibrateVertexPreview.visible = false;
                } else {
                    var t1 = new xeogl.Translate(scene, {
                        xyz: _nearVertexPos
                    });

                    _calibrateVertexPreview.transform = t1;
                    _calibrateVertexPreview.visible = true;

                    if (_isFirstDimensionPos) {
                        _calibrateLinePreview.visible = true;
                        _calibrateLinePreview.geometry.positions = [_firstPosDimension[0], _firstPosDimension[1], _firstPosDimension[2], _nearVertexPos[0], _nearVertexPos[1], _nearVertexPos[2]];
                    }
                }


            };

            var calibrateVertexDecide = function (hit) {
                if (!_calibrateVertexPreview.visible)
                    return;

                if (_isFirstDimensionPos) {
                    _isEndDimensionPos = true;
                    _endPosDimension = _nearVertexPos;
                    _isCreate = false;
                    _calibrateLinePreview.visible = false;
                    _calibrateVertexPreview.visible = false;
                    //Draw new dimension
                    dimensionEntity.push(new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [
                                _firstPosDimension[0], _firstPosDimension[1], _firstPosDimension[2], _endPosDimension[0], _endPosDimension[1], _endPosDimension[2]
                            ],
                            indices: [
                                0, 1
                            ]
                        }),
                        material: new xeogl.PhongMaterial(scene, {
                            emissive: [0.9, 0.3, 0.3],
                            backfaces: true,
                            lineWidth: 2
                        }),
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: true,
                            edgeAlpha: 1.0,
                            edgeColor: [1, 0.0039, 0.682], //pink color
                            edgeWidth: 2,
                            vertices: true,
                            vertexAlpha: 0.3,
                            vertexColor: [1, 0.005, 0.682],
                            vertexSize: 8,
                            fill: true,
                            fillColor: [1, 0.0039, 0.682],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        pickable: false,
                        layer: -2,
                        visible: true
                    }));
                    var dis = distanceVec3(_endPosDimension, _firstPosDimension);
                    //unit mm
                    dis = dimensionRatio * dis;
                    dis = Math.ceil(dis);

                    var p0 = (_endPosDimension[0] + _firstPosDimension[0]) / 2;
                    var p1 = (_endPosDimension[1] + _firstPosDimension[1]) / 2;
                    var p2 = (_endPosDimension[2] + _firstPosDimension[2]) / 2;

                    var txtPos = [p0, p1, p2];
                    // dimension text
                    marker(txtPos, dis + "mm");

                } else {
                    _isFirstDimensionPos = true;
                    _firstPosDimension[0] = _nearVertexPos[0];
                    _firstPosDimension[1] = _nearVertexPos[1];
                    _firstPosDimension[2] = _nearVertexPos[2];
                }
            };

            var calibrateEdge = function (hit) {
                var entity = hit.entity;
                var primIndex = hit.primIndex;
                var indices = hit.indices;
                var hitPos = hit.worldPos;
                var snapDis = 10;
                // console.log(hit);

                var trianglePos0 = [entity.worldPositions[indices[0] * 3], entity.worldPositions[indices[0] * 3 + 1], entity.worldPositions[indices[0] * 3 + 2]];
                var trianglePos1 = [entity.worldPositions[indices[1] * 3], entity.worldPositions[indices[1] * 3 + 1], entity.worldPositions[indices[1] * 3 + 2]];
                var trianglePos2 = [entity.worldPositions[indices[2] * 3], entity.worldPositions[indices[2] * 3 + 1], entity.worldPositions[indices[2] * 3 + 2]];

                var triangleVertexPos = [];
                triangleVertexPos.push(trianglePos0);
                triangleVertexPos.push(trianglePos1);
                triangleVertexPos.push(trianglePos2);

                // distance between 3 edges
                var e0_dis = distanceLineAndVertex(trianglePos0, trianglePos1, hitPos);
                var e1_dis = distanceLineAndVertex(trianglePos1, trianglePos2, hitPos);
                var e2_dis = distanceLineAndVertex(trianglePos0, trianglePos2, hitPos);

                var minDis = e0_dis;
                var pos0 = trianglePos0;
                var pos1 = trianglePos1;
                if (minDis > e1_dis) {
                    minDis = e1_dis;
                    pos0 = trianglePos1;
                    pos1 = trianglePos2;
                }
                if (minDis > e2_dis) {
                    minDis = e2_dis;
                    pos0 = trianglePos0;
                    pos1 = trianglePos2;
                }

                if (minDis > snapDis) {
                    _calibrateLinePreview.visible = false;
                } else {
                    _firstPosDimension[0] = pos0[0];
                    _firstPosDimension[1] = pos0[1];
                    _firstPosDimension[2] = pos0[2];
                    _endPosDimension[0] = pos1[0];
                    _endPosDimension[1] = pos1[1];
                    _endPosDimension[2] = pos1[2];
                    _calibrateLinePreview.geometry.positions = [pos0[0], pos0[1], pos0[2], pos1[0], pos1[1], pos1[2]];
                    _calibrateLinePreview.visible = true;
                }

            };

            var calibrateEdgeDecide = function (hit) {
                if (!_calibrateLinePreview.visible)
                    return;

                _isCreate = false;
                _calibrateLinePreview.visible = false;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "lines",
                        positions: [
                            _firstPosDimension[0], _firstPosDimension[1], _firstPosDimension[2], _endPosDimension[0], _endPosDimension[1], _endPosDimension[2]
                        ],
                        indices: [
                            0, 1
                        ]
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: true,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 1
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));
                var dis = distanceVec3(_endPosDimension, _firstPosDimension);
                //unit mm
                dis = dimensionRatio * dis;
                dis = Math.ceil(dis);

                var p0 = (_endPosDimension[0] + _firstPosDimension[0]) / 2;
                var p1 = (_endPosDimension[1] + _firstPosDimension[1]) / 2;
                var p2 = (_endPosDimension[2] + _firstPosDimension[2]) / 2;

                var txtPos = [p0, p1, p2];
                // dimension text
                marker(txtPos, dis + "mm");
            };

            var calibrateTriangleArea = function (hit) {
                var entity = hit.entity;
                var primIndex = hit.primIndex;
                var indices = hit.indices;
                var hitPos = hit.worldPos;

                var trianglePos0 = [entity.worldPositions[indices[0] * 3], entity.worldPositions[indices[0] * 3 + 1], entity.worldPositions[indices[0] * 3 + 2]];
                var trianglePos1 = [entity.worldPositions[indices[1] * 3], entity.worldPositions[indices[1] * 3 + 1], entity.worldPositions[indices[1] * 3 + 2]];
                var trianglePos2 = [entity.worldPositions[indices[2] * 3], entity.worldPositions[indices[2] * 3 + 1], entity.worldPositions[indices[2] * 3 + 2]];

                var triangleVertexPos = [];
                triangleVertexPos.push(trianglePos0);
                triangleVertexPos.push(trianglePos1);
                triangleVertexPos.push(trianglePos2);

                _trianglePos0 = trianglePos0;
                _trianglePos1 = trianglePos1;
                _trianglePos2 = trianglePos2;

                _calibrateTrianglePreview.geometry.positions = [trianglePos0[0], trianglePos0[1], trianglePos0[2], trianglePos1[0], trianglePos1[1], trianglePos1[2], trianglePos2[0], trianglePos2[1], trianglePos2[2]];
                _calibrateTrianglePreview.visible = true;

            };

            var calibrateTriangleAreaDecide = function (hit) {
                if (!_calibrateTrianglePreview.visible)
                    return;

                _isCreate = false;
                _calibrateTrianglePreview.visible = false;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "triangles",
                        positions: [
                            _trianglePos0[0], _trianglePos0[1], _trianglePos0[2], _trianglePos1[0], _trianglePos1[1], _trianglePos1[2], _trianglePos2[0], _trianglePos2[1], _trianglePos2[2]
                        ],
                        indices: [
                            0, 1, 2
                        ]
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: true,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 0.9
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));
                var area = calcTriangleArea(_trianglePos0, _trianglePos1, _trianglePos2);
                //unit mm2
                area = Math.pow(dimensionRatio, 2) * area;
                area = Math.ceil(area);

                var txtPos = [hit.worldPos[0] + hit.bary[0], hit.worldPos[1] + hit.bary[1], hit.worldPos[2] + hit.bary[2]];
                // console.log(hit);
                // dimension text
                marker(txtPos, area + "mm<sup>2</sup>");
            };

            var calibrateSamePlane = function (hit) {
                var entity = hit.entity;
                var normals = entity.geometry.normals;
                var positions = entity.worldPositions;
                var primIndex = hit.primIndex;
                var hitPlaneIndices = hit.indices;
                var hitPos = hit.worldPos;
                var indices = entity.geometry.indices;
                _samePlanePositions = [];

                var hitPlanePos0 = [entity.worldPositions[hitPlaneIndices[0] * 3], entity.worldPositions[hitPlaneIndices[0] * 3 + 1], entity.worldPositions[hitPlaneIndices[0] * 3 + 2]];
                var hitPlanePos1 = [entity.worldPositions[hitPlaneIndices[1] * 3], entity.worldPositions[hitPlaneIndices[1] * 3 + 1], entity.worldPositions[hitPlaneIndices[1] * 3 + 2]];
                var hitPlanePos2 = [entity.worldPositions[hitPlaneIndices[2] * 3], entity.worldPositions[hitPlaneIndices[2] * 3 + 1], entity.worldPositions[hitPlaneIndices[2] * 3 + 2]];

                var hitPlaneNormal = math.vec3();
                math.triangleNormal(hitPlanePos0, hitPlanePos1, hitPlanePos2, hitPlaneNormal);
                math.normalizeVec3(hitPlaneNormal, hitPlaneNormal);

                var _sI = [];
                for (var i = 0; i < positions.length / 3; i++) {
                    var v = [positions[i * 3] - hitPlanePos0[0], positions[i * 3 + 1] - hitPlanePos0[1], positions[i * 3 + 2] - hitPlanePos0[2]];
                    var dot = math.dotVec3(hitPlaneNormal, v);
                    if (dot === 0) {
                        _samePlanePositions.push(positions[i]);
                        _samePlanePositions.push(positions[i + 1]);
                        _samePlanePositions.push(positions[i + 2]);
                        _sI.push(i);
                    }
                }

                _samePlaneIndices = [];
                for (var j = 0; j < indices.length / 3; j++) {
                    var i_0 = indices[j * 3];
                    var i_1 = indices[j * 3 + 1];
                    var i_2 = indices[j * 3 + 2];

                    if (_sI.indexOf(i_0) !== -1 && _sI.indexOf(i_1) !== -1 && _sI.indexOf(i_2) !== -1) {
                        _samePlaneIndices.push(i_0);
                        _samePlaneIndices.push(i_1);
                        _samePlaneIndices.push(i_2);
                    }
                }

                // console.log(positions,indices);
                var geo = new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: positions,
                    indices: _samePlaneIndices
                });
                _calibrateSameplanePreview.geometry = geo;
                _calibrateSameplanePreview.visible = true;

            };

            var calibrateSamePlaneDecide = function (hit) {
                if (!_calibrateSameplanePreview.visible)
                    return;

                _isCreate = false;
                _calibrateSameplanePreview.visible = false;

                var positions = hit.entity.worldPositions;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "triangles",
                        positions: positions,
                        indices: _samePlaneIndices
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: true,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 0.9
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));

                var area = 0;
                for (var i = 0; i < _samePlaneIndices.length / 3; i++) {
                    var pos0 = [positions[_samePlaneIndices[i * 3] * 3], positions[_samePlaneIndices[i * 3] * 3 + 1], positions[_samePlaneIndices[i * 3] * 3 + 2]];
                    var pos1 = [positions[_samePlaneIndices[i * 3 + 1] * 3], positions[_samePlaneIndices[i * 3 + 1] * 3 + 1], positions[_samePlaneIndices[i * 3 + 1] * 3 + 2]];
                    var pos2 = [positions[_samePlaneIndices[i * 3 + 2] * 3], positions[_samePlaneIndices[i * 3 + 2] * 3 + 1], positions[_samePlaneIndices[i * 3 + 2] * 3 + 2]];
                    area += calcTriangleArea(pos0, pos1, pos2);
                }

                //unit mm2
                area = Math.pow(dimensionRatio, 2) * area;
                area = Math.ceil(area);

                var txtPos = [hit.worldPos[0] + hit.bary[0], hit.worldPos[1] + hit.bary[1], hit.worldPos[2] + hit.bary[2]];
                // console.log(hit);
                // dimension text
                marker(txtPos, area + "mm<sup>2</sup>");
            };

            var calibrateTotalArea = function (hit) {
                var entity = hit.entity;
                var normals = entity.geometry.normals;
                var positions = entity.worldPositions;
                var primIndex = hit.primIndex;
                var hitPlaneIndices = hit.indices;
                var hitPos = hit.worldPos;
                var indices = entity.geometry.indices;

                // console.log(positions,indices);
                var geo = new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: positions,
                    indices: indices
                });
                _calibrateTotalAreaPreview.geometry = geo;
                _calibrateTotalAreaPreview.visible = true;
            };

            var calibrateTotalAreaDecide = function (hit) {
                if (!_calibrateTotalAreaPreview.visible)
                    return;

                _isCreate = false;
                _calibrateTotalAreaPreview.visible = false;

                var positions = hit.entity.worldPositions;
                var indices = hit.entity.geometry.indices;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "triangles",
                        positions: positions,
                        indices: indices
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: true,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 0.9
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));

                var area = 0;
                for (var i = 0; i < indices.length / 3; i++) {
                    var pos0 = [positions[indices[i * 3] * 3], positions[indices[i * 3] * 3 + 1], positions[indices[i * 3] * 3 + 2]];
                    var pos1 = [positions[indices[i * 3 + 1] * 3], positions[indices[i * 3 + 1] * 3 + 1], positions[indices[i * 3 + 1] * 3 + 2]];
                    var pos2 = [positions[indices[i * 3 + 2] * 3], positions[indices[i * 3 + 2] * 3 + 1], positions[indices[i * 3 + 2] * 3 + 2]];
                    area += calcTriangleArea(pos0, pos1, pos2);
                }

                //unit mm2
                area = Math.pow(dimensionRatio, 2) * area;
                area = Math.ceil(area);

                var txtPos = [hit.worldPos[0] + hit.bary[0], hit.worldPos[1] + hit.bary[1], hit.worldPos[2] + hit.bary[2]];
                // console.log(hit);
                // dimension text
                marker(txtPos, area + "mm<sup>2</sup>");
            };

            var calibrateVolume = function (hit) {
                var entity = hit.entity;
                var normals = entity.geometry.normals;
                var positions = entity.worldPositions;
                var primIndex = hit.primIndex;
                var hitPlaneIndices = hit.indices;
                var hitPos = hit.worldPos;
                var indices = entity.geometry.indices;

                // console.log(positions,indices);
                var geo = new xeogl.Geometry(scene, {
                    primitive: "triangles",
                    positions: positions,
                    indices: indices
                });
                _calibrateVolumePreview.geometry = geo;
                _calibrateVolumePreview.visible = true;
            };

            var calibrateVolumeDecide = function (hit) {
                if (!_calibrateVolumePreview.visible)
                    return;

                _isCreate = false;
                _calibrateVolumePreview.visible = false;

                var positions = hit.entity.worldPositions;
                var indices = hit.entity.geometry.indices;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "triangles",
                        positions: positions,
                        indices: indices
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: true,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 0.8
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));

                var volume = 0;
                for (var i = 0; i < indices.length / 3; i++) {
                    var pos0 = [positions[indices[i * 3] * 3], positions[indices[i * 3] * 3 + 1], positions[indices[i * 3] * 3 + 2]];
                    var pos1 = [positions[indices[i * 3 + 1] * 3], positions[indices[i * 3 + 1] * 3 + 1], positions[indices[i * 3 + 1] * 3 + 2]];
                    var pos2 = [positions[indices[i * 3 + 2] * 3], positions[indices[i * 3 + 2] * 3 + 1], positions[indices[i * 3 + 2] * 3 + 2]];
                    volume += signedVolumeOfTriangle(pos0, pos1, pos2);
                }

                //unit mm3
                volume = Math.pow(dimensionRatio, 3) * volume;
                volume = Math.ceil(volume);

                var txtPos = [hit.worldPos[0] + hit.bary[0], hit.worldPos[1] + hit.bary[1], hit.worldPos[2] + hit.bary[2]];
                // console.log(hit);
                // dimension text
                marker(txtPos, volume + "mm<sup>3</sup>");
            };



            var calibrateAngle = function (hit) {
                var entity = hit.entity;
                var primIndex = hit.primIndex;
                var indices = hit.indices;
                var hitPos = hit.worldPos;
                var snapDis = 10;
                // console.log(hit);

                var trianglePos0 = [entity.worldPositions[indices[0] * 3], entity.worldPositions[indices[0] * 3 + 1], entity.worldPositions[indices[0] * 3 + 2]];
                var trianglePos1 = [entity.worldPositions[indices[1] * 3], entity.worldPositions[indices[1] * 3 + 1], entity.worldPositions[indices[1] * 3 + 2]];
                var trianglePos2 = [entity.worldPositions[indices[2] * 3], entity.worldPositions[indices[2] * 3 + 1], entity.worldPositions[indices[2] * 3 + 2]];

                var triangleVertexPos = [];
                triangleVertexPos.push(trianglePos0);
                triangleVertexPos.push(trianglePos1);
                triangleVertexPos.push(trianglePos2);

                // distance between 3 edges
                var e0_dis = distanceLineAndVertex(trianglePos0, trianglePos1, hitPos);
                var e1_dis = distanceLineAndVertex(trianglePos1, trianglePos2, hitPos);
                var e2_dis = distanceLineAndVertex(trianglePos0, trianglePos2, hitPos);

                var minDis = e0_dis;
                var pos0 = trianglePos0;
                var pos1 = trianglePos1;
                if (minDis > e1_dis) {
                    minDis = e1_dis;
                    pos0 = trianglePos1;
                    pos1 = trianglePos2;
                }
                if (minDis > e2_dis) {
                    minDis = e2_dis;
                    pos0 = trianglePos0;
                    pos1 = trianglePos2;
                }

                if (minDis > snapDis) {
                    _calibrateAngleLinePreview.visible = false;
                } else {
                    if (_angleStep === 0) {
                        _firstLinePos0[0] = pos0[0];
                        _firstLinePos0[1] = pos0[1];
                        _firstLinePos0[2] = pos0[2];
                        _firstLinePos1[0] = pos1[0];
                        _firstLinePos1[1] = pos1[1];
                        _firstLinePos1[2] = pos1[2];
                    } else if (_angleStep === 1) {
                        _secondLinePos0[0] = pos0[0];
                        _secondLinePos0[1] = pos0[1];
                        _secondLinePos0[2] = pos0[2];
                        _secondLinePos1[0] = pos1[0];
                        _secondLinePos1[1] = pos1[1];
                        _secondLinePos1[2] = pos1[2];
                    }

                    _calibrateAngleLinePreview.geometry.positions = [pos0[0], pos0[1], pos0[2], pos1[0], pos1[1], pos1[2]];
                    _calibrateAngleLinePreview.visible = true;
                }

            };

            var calibrateAngleDecide = function (hit) {
                if (!_calibrateAngleLinePreview.visible)
                    return;

                _angleStep++;
                if (_angleStep === 1) {
                    //Draw First Line for Angle
                    dimensionEntity.push(new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [
                                _firstLinePos0[0], _firstLinePos0[1], _firstLinePos0[2], _firstLinePos1[0], _firstLinePos1[1], _firstLinePos1[2]
                            ],
                            indices: [
                                0, 1
                            ]
                        }),
                        material: new xeogl.PhongMaterial(scene, {
                            emissive: [0.9, 0.3, 0.3],
                            backfaces: true,
                            lineWidth: 2
                        }),
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: true,
                            edgeAlpha: 1.0,
                            edgeColor: [1, 0.0039, 0.682], //pink color
                            edgeWidth: 2,
                            vertices: true,
                            vertexAlpha: 0.3,
                            vertexColor: [1, 0.005, 0.682],
                            vertexSize: 8,
                            fill: true,
                            fillColor: [1, 0.0039, 0.682],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        pickable: false,
                        layer: -2,
                        visible: true
                    }));
                }
                if (_angleStep === 2) {

                    // Conditions under which two straight lines will be placed on one plane
                    var normal0 = math.vec3();
                    math.triangleNormal(_firstLinePos0, _firstLinePos1, _secondLinePos0, normal0);
                    math.normalizeVec3(normal0, normal0);
                    var normal1 = math.vec3();
                    math.triangleNormal(_secondLinePos0, _secondLinePos1, _firstLinePos0, normal1);
                    math.normalizeVec3(normal1, normal1);

                    var dot = math.dotVec3(normal0, normal1);

                    var dis1 = distanceVec3(_firstLinePos0, _secondLinePos0);
                    var dis2 = distanceVec3(_firstLinePos0, _secondLinePos1);
                    var dis3 = distanceVec3(_firstLinePos1, _secondLinePos0);
                    var dis4 = distanceVec3(_firstLinePos1, _secondLinePos1);

                    var isOnePoint = dis1 * dis2 * dis3 * dis4;

                    //first line Vector
                    var flVec3 = [_firstLinePos0[0] - _firstLinePos1[0], _firstLinePos0[1] - _firstLinePos1[1], _firstLinePos0[2] - _firstLinePos1[2]];
                    math.normalizeVec3(flVec3, flVec3);
                    //second line Vector
                    var slVec3 = [_secondLinePos0[0] - _secondLinePos1[0], _secondLinePos0[1] - _secondLinePos1[1], _secondLinePos0[2] - _secondLinePos1[2]];
                    math.normalizeVec3(slVec3, slVec3);

                    // When the two straight lines are parallel

                    //Angle between frist vector and second vector
                    var angle = Math.acos(math.dotVec3(flVec3, slVec3));
                    angle = radianToDegree(angle);

                    if (isOnePoint !== 0 && (angle === 0 || angle === 180)) {
                        //Two straight lines are parallel
                        status.innerHTML = "Two straight lines are parallel";
                    } else {
                        status.innerHTML = "Angle : " + Math.ceil(angle) + "&deg";
                    }

                    _isCreate = false;
                    _calibrateAngleLinePreview.visible = false;
                    //Draw Second Line for Angle
                    dimensionEntity.push(new xeogl.Entity(scene, {
                        geometry: new xeogl.Geometry(scene, {
                            primitive: "lines",
                            positions: [
                                _secondLinePos0[0], _secondLinePos0[1], _secondLinePos0[2], _secondLinePos1[0], _secondLinePos1[1], _secondLinePos1[2]
                            ],
                            indices: [
                                0, 1
                            ]
                        }),
                        material: new xeogl.PhongMaterial(scene, {
                            emissive: [0.9, 0.3, 0.3],
                            backfaces: true,
                            lineWidth: 2
                        }),
                        highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                            edges: true,
                            edgeAlpha: 1.0,
                            edgeColor: [1, 0.0039, 0.682], //pink color
                            edgeWidth: 2,
                            vertices: true,
                            vertexAlpha: 0.3,
                            vertexColor: [1, 0.005, 0.682],
                            vertexSize: 8,
                            fill: true,
                            fillColor: [1, 0.0039, 0.682],
                            fillAlpha: 1
                        }),
                        highlighted: true,
                        pickable: false,
                        layer: -2,
                        visible: true
                    }));
                }


            };

            var circleCandidate;
            var circleDiameterFirstPos = [];
            var circleDiameterEndPos = [];
            var circleCentroidPos = [];
            var circleDiameter = 0;
            var circleSnapDis = 5;
            var snapCircle = false;
            var calibrateCircleDiameter = function (hit) {

                var entity = hit.entity;
                var positions = entity.worldPositions;
                snapCircle = false;
                if (circleCandidate)
                    circleCandidate.highlighted = false;
                _calibrateCircleDiameterPreview.visible = false;
                Object.keys(totalEdges).forEach(function (id) {
                    var edge = totalEdges[id];
                    var edgePositions = edge.worldPositions;
                    for (var i = 0; i < edgePositions.length / 3; i++) {
                        var edge_pos0 = [edgePositions[i * 3], edgePositions[i * 3 + 1], edgePositions[i * 3 + 2]];
                        var edge_pos1 = [edgePositions[i * 3 + 3], edgePositions[i * 3 + 4], edgePositions[i * 3 + 5]];
                        var snapDis = distanceLineAndVertex(edge_pos0, edge_pos1, hit.worldPos);
                        if (snapDis < circleSnapDis) {
                            var minX = edge.aabb[0] - circleSnapDis;
                            var minY = edge.aabb[1] - circleSnapDis;
                            var minZ = edge.aabb[2] - circleSnapDis;
                            var maxX = edge.aabb[3] + circleSnapDis;
                            var maxY = edge.aabb[4] + circleSnapDis;
                            var maxZ = edge.aabb[5] + circleSnapDis;
                            if (hit.worldPos[0] > minX && hit.worldPos[0] < maxX && hit.worldPos[1] > minY && hit.worldPos[1] < maxY && hit.worldPos[2] > minZ && hit.worldPos[2] < maxZ) {
                                circleCandidate = edge;
                                snapCircle = true;
                                break;
                            }
                        }
                    }

                });

                //check circle
                if (snapCircle) {
                    circleCandidate.highlighted = true;
                    var candPositions = circleCandidate.worldPositions;
                    //Get center pos of mass of mesh
                    var centroidPos = CalculateCentroid(candPositions);

                    //find positon that is most far from centorid position
                    var farPos = new math.vec3();
                    var dis = 0;
                    for (var i = 0; i < candPositions.length / 3; i++) {
                        var p = [candPositions[i * 3], candPositions[i * 3 + 1], candPositions[i * 3 + 2]];
                        var dis1 = distanceVec3(centroidPos, p);
                        if (dis < dis1) {
                            farPos = p;
                            dis = dis1;
                        }
                    }
                    // same position
                    var circlePos = [];
                    for (var j = 0; j < candPositions.length / 3; j++) {
                        var spos = [candPositions[j * 3], candPositions[j * 3 + 1], candPositions[j * 3 + 2]];
                        var dis2 = distanceVec3(centroidPos, spos);
                        if (Math.abs(dis - dis2) < 1) {
                            circlePos.push(spos);
                        }
                    }
                    // console.log(circlePos);
                    // circle is consist of 8 pos
                    if (circlePos.length >= 10) {
                        //The Entity is Circle
                        var diameter = dis * 2;
                        var drawPos0 = circlePos[0];
                        var drawPos1 = [2 * centroidPos[0] - drawPos0[0], 2 * centroidPos[1] - drawPos0[1], 2 * centroidPos[2] - drawPos0[2]];
                        _calibrateCircleDiameterPreview.geometry.positions = [drawPos0[0], drawPos0[1], drawPos0[2], drawPos1[0], drawPos1[1], drawPos1[2]];
                        _calibrateCircleDiameterPreview.visible = true;

                        circleDiameter = diameter;
                        circleDiameterFirstPos = drawPos0;
                        circleDiameterEndPos = drawPos1;
                        circleCentroidPos = centroidPos;
                        return;
                    }
                }


            };

            var calibrateCircleDiameterDecide = function (hit) {
                if (!_calibrateCircleDiameterPreview.visible)
                    return;

                viewer.disableHitPlane();
                // _isCreate = false;
                circleCandidate.highlighted = false;
                _calibrateCircleDiameterPreview.visible = false;
                //Draw new dimension
                dimensionEntity.push(new xeogl.Entity(scene, {
                    geometry: new xeogl.Geometry(scene, {
                        primitive: "lines",
                        positions: [circleDiameterFirstPos[0], circleDiameterFirstPos[1], circleDiameterFirstPos[2], circleDiameterEndPos[0], circleDiameterEndPos[1], circleDiameterEndPos[2]],
                        indices: [0, 1]
                    }),
                    material: new xeogl.PhongMaterial(scene, {
                        emissive: [0.9, 0.3, 0.3],
                        backfaces: true,
                        lineWidth: 2
                    }),
                    highlightMaterial: new xeogl.EmphasisMaterial(scene, {
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [1, 0.0039, 0.682], //pink color
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 0.3,
                        vertexColor: [1, 0.005, 0.682],
                        vertexSize: 8,
                        fill: false,
                        fillColor: [1, 0.0039, 0.682],
                        fillAlpha: 0.8
                    }),
                    highlighted: true,
                    pickable: false,
                    layer: -2,
                    visible: true
                }));

                // dimension text
                circleDiameter = dimensionRatio * circleDiameter;
                circleDiameter = Math.ceil(circleDiameter);
                marker(circleCentroidPos, "Diameter : " + circleDiameter + "mm");
            };


            var circleCircum = 0;
            var circleFind = false;
            var calibrateCircleCircum = function (hit) {
                var entity = hit.entity;
                var positions = entity.worldPositions;
                snapCircle = false;
                if (circleCandidate)
                    circleCandidate.highlighted = false;
                _calibrateCircleDiameterPreview.visible = false;
                Object.keys(totalEdges).forEach(function (id) {
                    var edge = totalEdges[id];
                    var edgePositions = edge.worldPositions;
                    for (var i = 0; i < edgePositions.length / 3; i++) {
                        var edge_pos0 = [edgePositions[i * 3], edgePositions[i * 3 + 1], edgePositions[i * 3 + 2]];
                        var edge_pos1 = [edgePositions[i * 3 + 3], edgePositions[i * 3 + 4], edgePositions[i * 3 + 5]];
                        var snapDis = distanceLineAndVertex(edge_pos0, edge_pos1, hit.worldPos);
                        if (snapDis < circleSnapDis) {
                            var minX = edge.aabb[0] - circleSnapDis;
                            var minY = edge.aabb[1] - circleSnapDis;
                            var minZ = edge.aabb[2] - circleSnapDis;
                            var maxX = edge.aabb[3] + circleSnapDis;
                            var maxY = edge.aabb[4] + circleSnapDis;
                            var maxZ = edge.aabb[5] + circleSnapDis;
                            if (hit.worldPos[0] > minX && hit.worldPos[0] < maxX && hit.worldPos[1] > minY && hit.worldPos[1] < maxY && hit.worldPos[2] > minZ && hit.worldPos[2] < maxZ) {
                                circleCandidate = edge;
                                snapCircle = true;
                                break;
                            }
                        }
                    }

                });

                //check circle
                if (snapCircle) {
                    circleCandidate.highlighted = true;
                    var candPositions = circleCandidate.worldPositions;
                    //Get center pos of mass of mesh
                    var centroidPos = CalculateCentroid(candPositions);

                    //find positon that is most far from centorid position
                    var farPos = new math.vec3();
                    var dis = 0;
                    for (var i = 0; i < candPositions.length / 3; i++) {
                        var p = [candPositions[i * 3], candPositions[i * 3 + 1], candPositions[i * 3 + 2]];
                        var dis1 = distanceVec3(centroidPos, p);
                        if (dis < dis1) {
                            farPos = p;
                            dis = dis1;
                        }
                    }
                    // same position
                    var circlePos = [];
                    for (var j = 0; j < candPositions.length / 3; j++) {
                        var spos = [candPositions[j * 3], candPositions[j * 3 + 1], candPositions[j * 3 + 2]];
                        var dis2 = distanceVec3(centroidPos, spos);
                        if (Math.abs(dis - dis2) < 1) {
                            circlePos.push(spos);
                        }
                    }
                    // console.log(circlePos);
                    // circle is consist of 8 pos
                    if (circlePos.length >= 8) {
                        //The Entity is Circle
                        circleFind = true;
                        var drawPos0 = circlePos[0];
                        var drawPos1 = [2 * centroidPos[0] - drawPos0[0], 2 * centroidPos[1] - drawPos0[1], 2 * centroidPos[2] - drawPos0[2]];

                        circleCircum = 2 * dis * Math.PI;
                        circleDiameterFirstPos = drawPos0;
                        circleDiameterEndPos = drawPos1;
                        circleCentroidPos = centroidPos;
                        return;
                    }
                }

            };

            var calibrateCircleCircumDecide = function (hit) {
                if (!circleFind)
                    return;

                viewer.disableHitPlane();
                // _isCreate = false;
                circleFind = false;
                circleCandidate.highlighted = false;

                // dimension text
                circleCircum = dimensionRatio * circleCircum;
                circleCircum = Math.ceil(circleCircum);
                marker(circleCentroidPos, "Circumference : " + circleCircum + "mm");
            };


            var updateHitCursorForMeasure = function (canvasPos) {

                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });

                if (hit) {
                    // setCursor("pointer", true);
                    if (hit.worldPos) {
                        switch (currentAction) {
                            case actions.COMMON_LENGTH:
                                commonLength(hit);
                                break;
                            case actions.TARGET_LENGTH:
                                targetLength(hit);
                                break;
                            case actions.EDGE_LENGTH:
                                calibrateEdge(hit);
                                break;
                            case actions.VERTEX_LENGTH:
                                calibrateVertex(hit);
                                break;
                            case actions.TRIANGLE_AREA:
                                calibrateTriangleArea(hit);
                                break;
                            case actions.SAME_PLANE:
                                calibrateSamePlane(hit);
                                break;
                            case actions.TOTAL_AREA:
                                calibrateTotalArea(hit);
                                break;
                            case actions.VOLUME:
                                calibrateVolume(hit);
                                break;
                            case actions.ANGLE:
                                calibrateAngle(hit);
                                break;
                            case actions.CIRCLE_DIAMETER:
                                calibrateCircleDiameter(hit);
                                break;
                            case actions.CIRCLE_CIRCUM:
                                calibrateCircleCircum(hit);
                                break;
                            default:
                                break;
                        }
                    }
                } else {
                    _targetMeshDimension.visible = false;
                    _calibrateTrianglePreview.visible = false;
                    _calibrateLinePreview.visible = false;
                    _calibrateTotalAreaPreview.visible = false;
                    _calibrateVolumePreview.visible = false;
                    _calibrateVertexPreview.visible = false;
                    _calibrateSameplanePreview.visible = false;
                    _calibrateAngleLinePreview.visible = false;

                    if (circleCandidate) {
                        circleCandidate.highlighted = false;
                        circleCandidate = null;
                    }
                    _calibrateCircleDiameterPreview.visible = false;
                    // setCursor("auto", true);
                }
            };

            var dimensionDecide = function (canvasPos) {
                var hit = scene.pick({
                    canvasPos: canvasPos,
                    pickSurface: true
                });
                if (hit) {
                    if (hit.worldPos) {
                        // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                        switch (currentAction) {
                            case actions.COMMON_LENGTH:
                                commonLengthDecide(hit);
                                break;
                            case actions.TARGET_LENGTH:
                                targetLengthDecide(hit);
                                break;
                            case actions.VERTEX_LENGTH:
                                calibrateVertexDecide(hit);
                                break;
                            case actions.EDGE_LENGTH:
                                calibrateEdgeDecide(hit);
                                break;
                            case actions.TRIANGLE_AREA:
                                calibrateTriangleAreaDecide(hit);
                                break;
                            case actions.SAME_PLANE:
                                calibrateSamePlaneDecide(hit);
                                break;
                            case actions.TOTAL_AREA:
                                calibrateTotalAreaDecide(hit);
                                break;
                            case actions.VOLUME:
                                calibrateVolumeDecide(hit);
                                break;
                            case actions.ANGLE:
                                calibrateAngleDecide(hit);
                                break;
                            case actions.CIRCLE_DIAMETER:
                                calibrateCircleDiameterDecide(hit);
                                break;
                            case actions.CIRCLE_CIRCUM:
                                calibrateCircleCircumDecide(hit);
                                break;
                            default:
                                break;
                        }
                    }
                } else {
                    // setCursor("auto", true);
                }
            };

            //marker
            var markerZIndex = 0;
            var marker = function (pivotPoint, text) { // Pivots the Camera around an arbitrary World-space position
                var spot = document.createElement("div");
                spot.innerHTML = text;
                spot.classList.add("marker");
                spot.style.color = "#ff0080";
                spot.style.position = "absolute";
                spot.style.height = "23px";
                spot.style.left = "0px";
                spot.style.top = "0px";
                spot.style.background = "#ffffe2";
                spot.style.border = "1px solid #00000055";
                spot.style.visibility = "hidden";
                spot.style["z-index"] = markerZIndex++;
                spot.style["pointer-events"] = "none";
                spot.style["font-size"] = "1.3em";
                document.body.appendChild(spot);

                (function () {
                    var viewPos = math.vec4();
                    var projPos = math.vec4();
                    var canvasPos = math.vec2();
                    var distDirty = true;
                    camera.on("viewMatrix", function () {
                        distDirty = true;
                    });
                    camera.on("projMatrix", function () {
                        distDirty = true;
                    });
                    scene.on("tick", function () {
                        if (distDirty) {
                            math.transformPoint3(camera.viewMatrix, pivotPoint, viewPos);
                            viewPos[3] = 1;
                            math.transformPoint4(camera.projMatrix, viewPos, projPos);
                            var aabb = canvas.boundary;
                            // console.log(canvas, aabb);
                            canvasPos[0] = Math.floor((1 + projPos[0] / projPos[3]) * aabb[2] / 2);
                            canvasPos[1] = Math.floor((1 - projPos[1] / projPos[3]) * aabb[3] / 2);
                            var canvasElem = canvas.canvas;
                            // console.log(canvasElem);
                            var rect = canvasElem.getBoundingClientRect();
                            spot.style.left = (Math.floor(rect.left + canvasPos[0]) - 12) + "px";
                            spot.style.top = (Math.floor(rect.top + canvasPos[1]) - 12) + "px";
                            spot.style.visibility = "visible";
                            distDirty = false;
                        }
                    });
                })();
            };


            var distanceVec3 = function (a, b) {
                var c0 = a[0] - b[0];
                var c1 = a[1] - b[1];
                var c2 = a[2] - b[2];
                return Math.sqrt(c0 * c0 + c1 * c1 + c2 * c2);
            };

            var distanceLineAndVertex = function (linePos0, linePos1, pos) {
                var pqA = (pos[1] - linePos0[1]) * (linePos1[2] - linePos0[2]) - (linePos1[1] - linePos0[1]) * (pos[2] - linePos0[2]);
                var pqB = (pos[0] - linePos0[0]) * (linePos1[2] - linePos0[2]) - (linePos1[0] - linePos0[0]) * (pos[2] - linePos0[2]);
                var pqC = (pos[0] - linePos0[0]) * (linePos1[1] - linePos0[1]) - (linePos1[0] - linePos0[0]) * (pos[1] - linePos0[1]);
                var v = Math.sqrt(Math.pow(linePos1[0] - linePos0[0], 2) + Math.pow(linePos1[1] - linePos0[1], 2) + Math.pow(linePos1[2] - linePos0[2], 2));
                var dis = Math.sqrt(Math.pow(pqA, 2) + Math.pow(pqB, 2) + Math.pow(pqC, 2)) / v;
                return dis;
            };

            var getNearPosOnEdgeFromVertex = function (linePos0, linePos1, pos) {
                var p0 = linePos0;
                var p1 = linePos1;
                //angle between line and linePos
                var line = [p0[0] - linePos1[0], linePos0[1] - linePos1[1], linePos0[2] - linePos1[2]];
                math.normalizeVec3(line, line);
                var angle = Math.acos(math.dotVec3(line, [1, 0, 0]));
                var x = (linePos0[1] - pos[1]) / Math.tan(angle);
                var p = [pos[0], pos[1], pos[2]];
                return p;
            };

            var calcTriangleArea = function (pos0, pos1, pos2) {
                var vec0 = [pos1[0] - pos0[0], pos1[1] - pos0[1], pos1[2] - pos0[2]];
                var vec1 = [pos1[0] - pos2[0], pos1[1] - pos2[1], pos1[2] - pos2[2]];
                var vec0_length = distanceVec3(pos0, pos1);
                var vec1_length = distanceVec3(pos2, pos1);
                var alpha = Math.acos(math.dotVec3(vec0, vec1) / (vec0_length * vec1_length));
                var area = vec0_length * vec1_length * Math.sin(alpha) / 2;
                return area;
            };

            var angleVec3 = function (a, b) {
                var angle = [];
                angle[0] = Math.atan((a[2] - b[2]) / (a[0] - b[0]));
                angle[1] = Math.atan((a[2] - b[2]) / (a[1] - b[1]));
                angle[2] = Math.atan((a[1] - b[1]) / (a[0] - b[0]));

                angle[0] = radianToDegree(angle[0]);
                angle[1] = radianToDegree(angle[1]);
                angle[2] = radianToDegree(angle[2]);
                return angle;
            };

            var radianToDegree = function (rad) {
                return rad * 180 / Math.PI;
            };
            var degreeToRadian = function (deg) {
                return deg * Math.PI / 180;
            };

            var signedVolumeOfTriangle = function (p1, p2, p3) {
                var v321 = p3[0] * p2[1] * p1[2];
                var v231 = p2[0] * p3[1] * p1[2];
                var v312 = p3[0] * p1[1] * p2[2];
                var v132 = p1[0] * p3[1] * p2[2];
                var v213 = p2[0] * p1[1] * p3[2];
                var v123 = p1[0] * p2[1] * p3[2];
                return (1.0 / 6.0) * (-v321 + v231 + v312 - v132 - v213 + v123);
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

            var removeMarker = function () {
                Element.prototype.remove = function () {
                    this.parentElement.removeChild(this);
                };
                NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
                    for (var i = this.length - 1; i >= 0; i--) {
                        if (this[i] && this[i].parentElement) {
                            this[i].parentElement.removeChild(this[i]);
                        }
                    }
                };
                document.getElementsByClassName("marker").remove();
            };

        },

        _props: {

        }
    });
});