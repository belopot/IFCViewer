define([
    "../DefaultMaterials",
    "../../lib/three",
    "../EventHandler",
    "../Utils",
    "../../lib/xeogl",
    "./controls/CameraControlFor2D",
    "./controls/CameraControlFor3D",
    "./entities/bimModel",
    "./entities/bimObject",
    "./helpers/bimBoundaryHelper",
    "./effects/highlightEffect",
    "./utils/collection",
    "../MaterialManager",
    "../ComponentsManager",
    "../MeasureController",
    "../LineDrawer",
    "../CircleDrawer",
    "../RectDrawer",
    "../TextDrawer",
    "../PushPull",
    "../ConnectCorner",
    "../SquareMarker",
    "../Rotater",
    "../Bucketer"
], function (DefaultMaterials, THREE, EventHandler, Utils) {

    "use strict";

    function xeoViewer(cfg) {

        // Distance to WebGL's far clipping plane.
        var FAR_CLIP = 500000;
        var AXIS_LENGTH = 100000;

        var math = xeogl.math;
        EventHandler.call(this);

        var self = this;
        self.objects_by_type = [];
        self.typenames = [];
        var bimObjects = [];

        var domNode = document.getElementById(cfg.domNode);
        var canvas = document.createElement("canvas");
        var plan = cfg.plan;

        domNode.appendChild(canvas);

        var status = document.createElement("div");
        status.innerHTML = "";
        status.classList.add("status");
        status.style.color = "#ff0080";
        status.style.position = "absolute";
        status.style.height = "20px";
        status.style.right = "40px";
        status.style.bottom = "60px";
        status.style.background = "#ffffffaf";
        status.style.visibility = "visible";
        status.style["z-index"] = 1000000;
        status.style["pointer-events"] = "none";
        status.style["font-size"] = "small";
        status.style.padding = "5px";
        document.body.appendChild(status);

        var drawActions = {
            NONE: 'none',
            LINE: 'line',
            CIRCLE: 'circle',
            RECT: 'rect',
            TEXT: 'text',
            MEASURE: 'measure',
            PUSHPULL: 'pushpull',
            CONNECTCORNER: 'connectcorner',
            SQUAREMARKER: 'squaremarker',
            BUCKET: 'bucket',
            ROTATEENTITY: 'rotateentity'
        };

        self.totalEdges = [];
        self.totalPolygons = [];

        var currentDrawAction = drawActions.NONE;

        // Create a Scene
        var scene = self.scene = new xeogl.Scene({ // http://xeoengine.org/docs/classes/Scene.html
            canvas: canvas,
            transparent: true,
        });


        // Redefine default light sources;
        var lights = [{
                type: "ambient",
                params: {
                    color: [1, 1, 1],
                    intensity: 0.3
                }
            },
            {
                type: "dir",
                params: {
                    dir: [0.0, 0.0, -1.0],
                    color: [1.0, 1.0, 1.0],
                    intensity: 0.8,
                    space: "view"
                }
            }
        ];

        //var t_scene = new THREE.Scene();
        //console.log(t_scene);

        scene.lights.lights = buildLights(lights);
        var light_pos = new xeogl.Translate(scene,{
            xyz: [0,0,100]
        });

        var light_rot = new xeogl.Rotate(scene, {
            parent: light_pos,
            xyz: [1, 0, 0],
            angle: -45
        });
        for(var i = 0; i<scene.lights.lights.length-1; i++){
            scene.lights.lights[i].transform = light_rot;
        }
        // console.log("dddd",scene.lights.lights);

        // Attached to all objects to fit the model inside the view volume
        var scale = new xeogl.Scale(scene, {
            xyz: [1, 1, 1]
        });

        // Provides user input
        var input = scene.input;

        // Using the scene's default camera
        var camera = scene.camera;
        camera.project.far = FAR_CLIP;

        // Flies cameras to objects
        var cameraFlight = new xeogl.CameraFlightAnimation(scene, { // http://xeoengine.org/docs/classes/CameraFlightAnimation.html
            fitFOV: 25,
            duration: 1
        });

        new xeogl.AxisHelper({
            lookat: camera,
            size: [150, 150],
            visible: true
        });

        var xAxis = new xeogl.Entity(scene, {
            id: "XAXIS",
            geometry: new xeogl.Geometry(scene, {
                primitive: "lines",
                positions: [
                    -AXIS_LENGTH, 0, 0, AXIS_LENGTH, 0, 0
                ],
                indices: [
                    0, 1
                ]
            }),  

            material: new xeogl.PhongMaterial(scene, {
                diffuse: [1, 0, 0],
                backfaces: true,
                lineWidth: 10
            }),

            ghostMaterial: new xeogl.GhostMaterial(scene,{
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [1, 0, 0],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: false,
                fillColor: [1,0,0],
                fillAlpha: 1
            }),
            ghosted: true,
            pickable: false,
            layer: 0
        });
        var yAxis = new xeogl.Entity(scene, {
            id: "YAXIS",
            geometry: new xeogl.Geometry(scene, {
                primitive: "lines",
                positions: [
                    0,-AXIS_LENGTH,0, 0,AXIS_LENGTH,0
                ],
                indices: [
                    0, 1
                ]
            }),  

            material: new xeogl.PhongMaterial(scene, {
                diffuse: [0, 1, 0],
                backfaces: true,
                lineWidth: 10
            }),

            ghostMaterial: new xeogl.GhostMaterial(scene,{
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 1, 0],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: false,
                fillColor: [1,0,0],
                fillAlpha: 1
            }),
            ghosted: true,
            pickable: false,
            layer: 0
        });

        var zAxis = new xeogl.Entity(scene, {
            id: "ZAXIS",
            geometry: new xeogl.Geometry(scene, {
                primitive: "lines",
                positions: [
                    0,0,-AXIS_LENGTH, 0,0,AXIS_LENGTH
                ],
                indices: [
                    0, 1
                ]
            }),  

            material: new xeogl.PhongMaterial(scene, {
                diffuse: [0, 1, 0],
                backfaces: true,
                lineWidth: 10
            }),

            ghostMaterial: new xeogl.GhostMaterial(scene,{
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 1],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: false,
                fillColor: [1,0,0],
                fillAlpha: 1
            }),
            ghosted: true,
            pickable: false,
            layer: 0
        });

        // Grid Plane
        var grid = new xeogl.Entity(scene, {
            id: "GRID",
            geometry: new xeogl.Geometry(scene, {
                primitive: "lines",
                positions: [
                    -100, 100, 0, -100, -100, 0,
                    -80, 100, 0, -80, -100, 0,
                    -60, 100, 0, -60, -100, 0,
                    -40, 100, 0, -40, -100, 0,
                    -20, 100, 0, -20, -100, 0,
                    0, 0, 0, 0, 0, 0,
                    20, 100, 0, 20, -100, 0,
                    40, 100, 0, 40, -100, 0,
                    60, 100, 0, 60, -100, 0,
                    80, 100, 0, 80, -100, 0,
                    100, 100, 0, 100, -100, 0,
                    -100, 80, 0, 100, 80, 0,
                    -100, 60, 0, 100, 60, 0,
                    -100, 40, 0, 100, 40, 0,
                    -100, 20, 0, 100, 20, 0,
                    0, 0, 0, 0, 0, 0,
                    -100, -20, 0, 100, -20, 0,
                    -100, -40, 0, 100, -40, 0,
                    -100, -60, 0, 100, -60, 0,
                    -100, -80, 0, 100, -80, 0
                ],
                indices: [
                    0, 1,
                    2, 3,
                    4, 5,
                    6, 7,
                    8, 9,
                    10, 11,
                    12, 13,
                    14, 15,
                    16, 17,
                    18, 19,
                    20, 21,
                    0, 20,
                    1, 21,
                    22, 23,
                    24, 25,
                    26, 27,
                    28, 29,
                    30, 31,
                    32, 33,
                    34, 35,
                    36, 37,
                    38, 39
                ]
            }),

            material: new xeogl.PhongMaterial(scene, {
                emissive: [0.2, 0.2, 0.2],
                diffuse: [0, 0, 0],
                ambient: [0, 0, 0],
                backfaces: true,
                lineWidth: 2
            }),
            pickable: false,
            layer: 1
        });

        var planeXY = new xeogl.Entity(scene, {
            id: "HITPLANEXY",
            geometry: new xeogl.PlaneGeometry(scene, {
                primitive: "triangles",
                xSize: AXIS_LENGTH,
                zSize: AXIS_LENGTH,
                xSegments: 1,
                zSegments: 1
            }),
            material: new xeogl.PhongMaterial(scene, {
                id: "DEFAULTBASEPLANE_MAT",
                diffuse: [0.1, 0.1, 0.2],
                backfaces: true,
                alpha: 1
            }),
            ghostMaterial: new xeogl.GhostMaterial(scene, {
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [0, 0, 0],
                fillAlpha: 0
            }),
            ghosted: true,
            pickable: true,
            layer: -1
        });

        var rot_x_90 = new xeogl.Rotate(scene, {
            xyz: [1, 0, 0],
            angle: 90
        });

        planeXY.transform = rot_x_90;

        var materialManager = new xeogl.MaterialManager(scene, {
            colors: DefaultMaterials
        });
        materialManager.initMaterials();

        

        var measureController = new xeogl.MeasureController(scene, {
            status: status,
            viewer: self
        });
        var lineDrawer = new xeogl.LineDrawer(scene, {
            status: status,
            viewer: self
        });
        var circleDrawer = new xeogl.CircleDrawer(scene, {
            status: status,
            viewer: self
        });
        var rectDrawer = new xeogl.RectDrawer(scene, {
            status: status,
            viewer: self
        });
        var textDrawer = new xeogl.TextDrawer(scene, {
            status: status
        });
        var pushpull = new xeogl.PushPull(scene, {
            status: status
        });
        var connectCorner = new xeogl.ConnectCorner(scene, {
            status: status
        });
        var squareMarker = new xeogl.SquareMarker(scene, {
            status: status,
            viewer: self
        });
        var rotater = new xeogl.Rotater(scene, {
            status: status
        });
        var bucketer = new xeogl.Bucketer(scene, {
            status: status
        });

        // Registers loaded xeoEngine components for easy destruction
        var collection = new xeogl.Collection(scene); // http://xeoengine.org/docs/classes/Collection.html

        var highlightEffect = new xeogl.HighlightEffect(scene, {
            color: cfg.selectionColor
        });

        // Models mapped to their IDs
        var models = {};

        // Objects mapped to IDs
        var objects = {};

        var objects_by_guid = {};

        // For each RFC type, a map of objects mapped to their IDs
        var rfcTypes = {};

        // Objects that are currently visible, mapped to IDs
        var visibleObjects = {};

        // Lazy-generated array of visible object IDs, for return by #getVisibility()
        var visibleObjectList = null;

        // Array of objects RFC types hidden by default
        var hiddenTypes = ["IfcOpeningElement", "IfcSpace"];

        // Objects that are currently selected, mapped to IDs
        var selectedObjects = {};

        // Lazy-generated array of selected object IDs, for return by #getSelection()
        var selectedObjectList = null;

        // Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
        var resetBookmark = null;

        var transparentObjectIds = [];


        var componentsManager = new xeogl.ComponentsManager(scene, {
            viewer: self,
            collection:collection,
            models: models
        });

        // Component for each projection type,
        // to swap on the camera when we switch projection types
        var project = {
            perspective: camera.project,
            ortho: new xeogl.Ortho(scene, {
                scale: 5000,
                near: 0.1,
                far: FAR_CLIP
            })
        };
        // var projections = {

        //     persp: camera.project, // Camera has a xeogl.Perspective by default

        //     ortho: new xeogl.Ortho(scene, {
        //         scale: 1.0,
        //         near: 0.1,
        //         far: FAR_CLIP
        //     })
        // };

        // The current projection type
        var projectionType = "perspective";

        //-----------------------------------------------------------------------------------------------------------
        // Camera notifications
        //-----------------------------------------------------------------------------------------------------------

        (function () {

            // Fold xeoEngine's separate events for view and projection updates
            // into a single "camera-changed" event, deferred to fire on next scene tick.

            var cameraUpdated = false;

            camera.on("projectMatrix",
                function () {
                    cameraUpdated = true;
                });

            camera.on("viewMatrix",
                function () {
                    cameraUpdated = true;
                });

            scene.on("tick",
                function () {

                    /**
                     * Fired on the iteration of each "game loop" for this xeoViewer.
                     * @event tick
                     * @param {String} sceneID The ID of this Scene.
                     * @param {Number} startTime The time in seconds since 1970 that this xeoViewer was instantiated.
                     * @param {Number} time The time in seconds since 1970 of this "tick" event.
                     * @param {Number} prevTime The time of the previous "tick" event from this xeoViewer.
                     * @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoViewer.
                     */
                    self.fire("tick");

                    if (cameraUpdated) {

                        /**
                         * Fired whenever this xeoViewer's camera changes.
                         * @event camera-changed
                         * @params New camera state, same as that got with #getCamera.
                         */
                        // self.fire("camera-changed", [self.getCamera()]);
                        cameraUpdated = false;
                    }
                });
        })();

        //-----------------------------------------------------------------------------------------------------------
        // Camera control
        //-----------------------------------------------------------------------------------------------------------
        var cameraControl;

        if (plan == "2D") {
            cameraControl = new xeogl.CameraControlFor2D(scene,{camera:camera});
        } else {
            cameraControl = new xeogl.CameraControlFor3D(scene, {camera: camera});
            cameraControl.on("doublePickedSurface",
                function (hit) {
                    // Get BIM object ID from entity metadata
                    var entity = hit.entity;
                    if (entity.id === "HITPLANEXY")
                        return;
                    if (!entity.meta) {
                        return;
                    }
                    var objectId = entity.meta.objectId || entity.id;
                    if (objectId === undefined) {
                        return;
                    }
                    var selected = !!selectedObjects[objectId]; // Object currently selected?
                    var shiftDown = scene.input.keyDown[input.KEY_SHIFT]; // Shift key down?
                    var s = scale.xyz[0];
                    var clickPos = xeogl.math.mulVec3Scalar(hit.worldPos, 1. / s, xeogl.math.vec3());
                    self.setSelection({
                        ids: [objectId],
                        selected: !selected, // Picking an object toggles its selection status
                        clear: !shiftDown, // Clear selection first if shift not down
                        clickPosition: clickPos
                    });
                });
    
            cameraControl.on("pickedNothing",
                function (hit) {
                    // console.log("dd");
                    self.setSelection({
                        clear: true
                    });
                });
        }
        cameraControl.active = true;

        self.setCameraView = function (type) {
            // console.log(type);
            if(plan!=="2D")
                cameraControl.fire("cameraview", type);
        };

        /**
         * Sets the default behaviour of mouse and touch drag input
         *
         * @method setDefaultDragAction
         * @param {String} action ("pan" | "orbit")
         */
        self.setDefaultDragAction = function (action) {
            // console.log(action);
            cameraControl.toolbarDragAction = action;
        };

        /**
         * Sets the global scale for models loaded into the viewer.
         *
         * @method setScale
         * @param {Number} s Scale factor.
         */
        this.setScale = function (s) {
            scale.xyz = [s, s, s];
        };

        /**
         * Notifies the viewer that a task (such as loading a model) has started. Use #taskFinished
         * to signal that the task has finished.
         *
         * Whenever the number of tasks is greater than zero, the viewer will display a spinner,
         * and reduce rendering speed so as to allow scene updates to happen faster.
         */
        this.taskStarted = function () {
            scene.canvas.spinner.processes++;
            scene.ticksPerRender = 15; // Tweak this if necessary
        };

        /**
         * Signals that a task has finished (see #taskStarted).
         */
        this.taskFinished = function () {
            var spinner = scene.canvas.spinner;
            if (spinner.processes === 0) {
                return;
            }
            spinner.processes--;
            if (spinner.processes === 0) {
                scene.ticksPerRender = 1; // Back to max speed, one render per tick
            }
        };

        /**
         * Loads random objects into the viewer for testing.
         *
         * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
         *
         * @method loadRandom
         * @param {*} params Parameters
         * @param {Number} [params.numEntities=200] Number of entities to create.
         * @param {Number} [params.size=200] Size of model on every axis.
         * @param {Float32Array} [params.center] Center point of model.
         */
        this.loadRandom = function (params) {
            // console.log("loadRandom !!!!!!!!");
            params = params || {};

            this.clear();

            var geometry = new xeogl.BoxGeometry(scene, {
                id: "geometry.test"
            });

            collection.add(geometry);

            var modelId = "test";
            var roid = "test";
            var oid;
            var type;
            var objectId;
            var translate;
            var scale;
            var matrix;
            var types = Object.keys(DefaultMaterials);
            console.log(types);
            var numEntities = params.numEntities || 200;
            var size = params.size || 200;
            var halfSize = size / 2;
            var centerX = params.center ? params.center[0] : 0;
            var centerY = params.center ? params.center[1] : 0;
            var centerZ = params.center ? params.center[2] : 0;

            this.createModel(modelId);

            for (var i = 0; i < numEntities; i++) {
                objectId = "object" + i;
                oid = objectId;
                translate = xeogl.math.translationMat4c(
                    (Math.random() * size - halfSize) + centerX,
                    (Math.random() * size - halfSize) + centerY,
                    (Math.random() * size - halfSize) + centerZ);
                scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
                matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
                type = types[Math.round(Math.random() * types.length)];
                this.createObject(modelId, roid, oid, objectId, ["test"], type, matrix);
            }

            // Set camera just to establish the up vector as +Z; the following
            // call to viewFit() will arrange the eye and target positions properly.
            this.setCamera({
                eye: [0, 0, 0],
                target: [centerX, centerY, centerZ],
                up: [0, 0, 1]
            });

            this.viewFit();

            this.saveReset();
        };

        /**
         * Creates a geometry.
         *
         * @method createGeometry
         * @param geometryId
         * @param positions
         * @param normals
         * @param colors
         * @param indices
         * @returns {xeogl.Geometry} The new geometry
         * @private
         */
        this.createGeometry = function (geometryId, positions, normals, colors, indices) {
            // console.log("create geometry", colors);
            var geometry = new xeogl.Geometry(scene, { // http://xeoengine.org/docs/classes/Geometry.html
                id: "geometry." + geometryId,
                primitive: "triangles",
                positions: positions,
                normals: normals,
                colors: colors,
                indices: indices
            });

            collection.add(geometry);

            return geometry;
        };


        /**
         * Creates a model.
         *
         * @param modelId
         * @returns {xeogl.BIMModel} The new model
         * @private
         */
        this.createModel = function (modelId) {
            //console.log("create model !!!!!!!!");
            if (models[modelId]) {
                console.log("Model with id " + modelId + " already exists, won't recreate");
                return;
            }

            var model = new xeogl.BIMModel(scene, {});

            models[modelId] = model;

            collection.add(model);

            return model;
        };

        /**
         * Creates an object.
         * @param [modelId] Optional model ID
         * @param roid
         * @param oid
         * @param objectId
         * @param geometryIds
         * @param type
         * @param matrix
         * @returns {xeogl.BIMObject} The new object
         * @private
         */
        this.createObject = function (modelId, roid, oid, objectId, geometryIds, type, matrix) {
            //console.log("create object !!!!!!!!");
            if (modelId) {
                var model = models[modelId];
                if (!model) {
                    console.log("Can't create object - model not found: " + modelId);
                    return;
                }
                objectId = modelId + ":" + objectId;
            }

            if (objects[objectId]) {
                console.log("Object with id " + objectId + " already exists, won't recreate");
                return;
            }

            var object = new xeogl.BIMObject(scene, {
                id: objectId,
                geometryIds: geometryIds,
                matrix: matrix
            });

            object.transform.parent = scale; // Apply model scaling

            this._addObject(type, object);

            if (model) {
                model.collection.add(object);
            }

            // Hide objects of certain types by default
            if (hiddenTypes.indexOf(type) !== -1) {
                object.visible = false;
            }
            return object;
        };

        /**
         * Inserts an object into this viewer
         *
         * @param {String} type
         * @param {xeogl.Entity | xeogl.BIMObject} object
         * @private
         */
        this._addObject = function (type, object) {
            var guid;
            if (object.id.indexOf("#") !== -1) {
                guid = Utils.CompressGuid(object.id.split("#")[1].substr(8, 36).replace(/-/g, ""));
            }
            collection.add(object);

            // Register object against ID
            objects[object.id] = object;
            if (guid) {
                (objects_by_guid[guid] || (objects_by_guid[guid] = [])).push(object);
            }

            // Register object against IFC type
            var types = (rfcTypes[type] || (rfcTypes[type] = {}));
            types[object.id] = object;
            // console.log(DefaultMaterials);
            // var color = DefaultMaterials[type] || DefaultMaterials["DEFAULT"];

            if (!guid) {
                // object.ghostMaterial.fillColor  = [color[0], color[1], color[2]];
                // console.log(materialManager.getMaterialByType( type || "DEFAULT" ));

                object.ghostMaterial = materialManager.getMaterialByType(type || "DEFAULT");
                var entities = object.entities;
                for (var i = 0; i < entities.length; i++) {
                    entities[i].ghostMaterial = materialManager.getMaterialByType(type || "DEFAULT");
                }
                materialManager.addMaterial(object.ghostMaterial);
            }

            if (object.ghostMaterial) {
                if (object.ghostMaterial.fillAlpha < 1) { // Transparent object
                    object.material.alphaMode = "blend";
                    transparentObjectIds.push(object.id);
                }
            }

            // if (object.material.alpha < 1) { // Transparent object
            //     object.material.alphaMode = "blend";
            // }

            if (self.typenames.indexOf(type) === -1) {
                self.typenames.push(type);
                self.objects_by_type[type] = [];
                self.objects_by_type[type].push(object);
            } else {
                self.objects_by_type[type].push(object);
            }
        };

        /**
         * Loads glTF model.
         *
         * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
         *
         * @param src
         */
        this.loadglTF = function (src) {

            this.clear();

            var model = new xeogl.GLTFModel(scene, {
                src: src
            });

            collection.add(model);

            models[model.id] = model;

            model.on("loaded",
                function () {

                    // TODO: viewFit, but boundaries not yet ready on Model Entities

                    model.iterate(function (component) {
                        if (component.isType("xeogl.Entity")) {
                            self._addObject("DEFAULT", component);
                        }
                    });

                    self.saveReset();
                });

            return model;
        };

        /**
         * Destroys a model and all its objects.
         *
         * @param modelId
         */
        this.destroyModel = function (modelId) {

            var model = models[modelId];

            if (!model) {
                console.warn("Can't destroy model - model not found: " + modelId);
                return;
            }

            model.collection.iterate(function (component) {
                component.destroy();
            });

            model.destroy();

            delete models[modelId];
        };

        /**
         * Clears the viewer.
         *
         * Subsequent calls to #reset will then set the viewer this clear state.
         */
        this.clear = function () {

            var list = [];

            collection.iterate(
                function (component) {
                    list.push(component);
                });

            while (list.length) {
                list.pop().destroy();
            }

            objects = {};
            rfcTypes = {};
            visibleObjects = {};
            visibleObjectList = null;
            selectedObjects = {};
            selectedObjectList = null;

            this.saveReset();
        };

        /**
         * Sets the visibility of objects specified by IDs or IFC types.
         * If IFC types are specified, this will affect existing objects as well as subsequently loaded objects of these types
         *
         * @param params
         * @param params.ids IDs of objects or IFC types to update.
         * @param params.color Color to set.
         */
        this.setVisibility = function (params) {
            // console.log(params.ids, params.types);
            var changed = false; // Only fire "visibility-changed" when visibility updates are actually made
            params = params || {};

            var ids = params.ids;
            var types = params.types;
            //console.log(ids, types);

            if (!ids && !types) {
                console.error("Param expected: ids or types");
                return;
            }

            ids = ids || [];
            types = types || [];

            //var recursive = !!params.recursive;
            var visible = params.visible !== false;

            var i;
            var len;
            var id;
            var objectId;
            var object;

            if (params.clear) {
                for (objectId in visibleObjects) {
                    if (visibleObjects.hasOwnProperty(objectId)) {
                        delete visibleObjects[objectId];
                        changed = true;
                    }
                }
            }

            for (i = 0, len = types.length; i < len; i++) {
                var type = types[i];
                var typedict = rfcTypes[type] || {};

                Object.keys(typedict).forEach(function (id) {
                    var object = typedict[id];
                    var entities = object.entities;
                    for (var i = 0; i < entities.length; i++) {
                        entities[i].visible = visible;
                    }
                    changed = true;
                });

                var index = hiddenTypes.indexOf(type);

                if (index !== -1 && visible) {
                    hiddenTypes.splice(index, 1); // remove type from array
                } else if (index === -1 && !visible) {
                    hiddenTypes.push(type); // add type to array
                }
            }
            //console.log(objects);
            for (i = 0, len = ids.length; i < len; i++) {
                id = ids[i];
                var fn = function (object) {
                    var entities = object.entities;
                    for (var i = 0; i < entities.length; i++) {
                        entities[i].visible = visible;
                    }
                    changed = true;
                }
                var object_ = objects[id];
                if (!object_) objects_by_guid[id].forEach(fn)
                else fn(object_);
            }

            if (changed) {
                visibleObjectList = Object.keys(visibleObjects);

                /**
                 * Fired whenever objects become invisible or invisible
                 * @event visibility-changed
                 * @params Array of IDs of all currently-visible objects.
                 */
                this.fire("visibility-changed", [visibleObjectList]);
            }
        };

        /**
         * Returns array of IDs of objects that are currently visible
         */
        this.getVisibility = function () {
            if (visibleObjectList) {
                return visibleObjectList;
            }
            visibleObjectList = Object.keys(visibleObjects);
            return visibleObjectList;
        };

        /**
         * Select or deselect some objects.
         *
         * @param params
         * @param params.ids IDs of objects.
         * @param params.selected Whether to select or deselect the objects
         * @param params.clear Whether to clear selection state prior to updating
         */
        this.setSelection = function (params) {
            highlightEffect.clear();
            params = params || {};

            var changed = false; // Only fire "selection-changed" when selection actually changes
            var selected = !!params.selected;
            var objectId;
            var object;

            if (params.clear) {
                for (objectId in selectedObjects) {
                    if (selectedObjects.hasOwnProperty(objectId)) {
                        object = selectedObjects[objectId];
                        //  object.highlighted = false;
                        delete selectedObjects[objectId];
                        changed = true;
                    }
                }
            }

            var ids = params.ids;

            if (ids) {

                for (var i = 0, len = ids.length; i < len; i++) {

                    var fn = function (object) {

                        var objectId = object.id;

                        if (!!selectedObjects[objectId] !== selected) {
                            changed = true;
                        }

                        if (selected) {
                            selectedObjects[objectId] = object;
                        } else {
                            if (selectedObjects[objectId]) {
                                delete selectedObjects[objectId];
                            }
                        }

                        selectedObjectList = null; // Now needs lazy-rebuild

                    }

                    objectId = ids[i];
                    var object_ = objects[objectId];
                    if (!object_) {
                        (objects_by_guid[objectId] || []).forEach(fn);
                    } else {
                        fn(object_);
                    }

                }
            }

            if (changed) {

                selectedObjectList = Object.keys(selectedObjects);

                // Show boundary around selected objects
                setBoundaryState({
                    ids: selectedObjectList,
                    show: selectedObjectList.length > 0
                });

                /**
                 * Fired whenever this xeoViewer's selection state changes.
                 * @event selection-changed
                 * @params Array of IDs of all currently-selected objects.
                 */
                this.fire("selection-changed", [{
                    objects: selectedObjectList,
                    clickPosition: params.clickPosition
                }]);
            }
        };

        /**
         * Returns array of IDs of objects that are currently selected
         */
        this.getSelection = function () {
            if (selectedObjectList) {
                return selectedObjectList;
            }
            selectedObjectList = Object.keys(selectedObjects);
            return selectedObjectList;
        };

        /**
         * Sets the color of objects specified by IDs or IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.color Color to set.
         */
        this.setColor = function (params) {

            params = params || {};

            var ids = params.ids;
            var types = params.types;

            if (!ids && !types) {
                console.error("Param expected: ids or types");
                return;
            }

            ids = ids || [];
            types = types || [];

            var color = params.color;

            if (!color) {
                console.error("Param expected: 'color'");
                return;
            }

            var objectId;
            var object;

            for (i = 0, len = types.length; i < len; i++) {
                var typedict = rfcTypes[types[i]] || {};
                Object.keys(typedict).forEach(function (id) {
                    var object = typedict[id];
                    self._setObjectColor(object, color);
                });
            }

            for (var i = 0, len = ids.length; i < len; i++) {

                objectId = ids[i];
                object = objects[objectId] || objects_by_guid[objectId];

                if (!object) {
                    // No return on purpose to continue changing color of
                    // other potentially valid object identifiers.
                    console.error("Object not found: '" + objectId + "'");
                } else {
                    this._setObjectColor(object, color);
                }
            }
        };

        this._setObjectColor = function (object, color) {

            var material = object.material;
            material.diffuse = [color[0], color[1], color[2]];

            var alpha = (color.length > 3) ? color[3] : 1;
            if (alpha !== material.alpha) {
                material.alpha = alpha;
                object.modes.transparent = alpha < 1;
            }
        };

        /**
         * Sets the alpha of objects specified by IDs of IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.alpha alpha to set.
         */
        this.setTransparentView = function (params) {

            params = params || {};

            var ids = params.ids;
            var types = params.types;

            if (!ids && !types) {
                console.error("Param expected: ids or types");
                return;
            }

            ids = ids || [];
            types = types || [];

            var opacity = params.opacity;

            if (opacity === undefined) {
                console.error("Param expected: 'opacity'");
                return;
            }

            var objectId;
            var object;

            for (i = 0, len = types.length; i < len; i++) {
                var typedict = rfcTypes[types[i]] || {};
                Object.keys(typedict).forEach(function (id) {
                    var object = typedict[id];
                    self._setObjectOpacity(object, opacity);
                });
            }

            for (var i = 0, len = ids.length; i < len; i++) {

                objectId = ids[i];
                object = objects[objectId] || objects_by_guid[objectId];

                if (!object) {
                    // No return on purpose to continue changing opacity of
                    // other potentially valid object identifiers.
                    console.error("Object not found: '" + objectId + "'");
                } else {
                    this._setObjectOpacity(object, opacity);
                }
            }
        };

        this._setObjectOpacity = function (object, opacity) {
            // console.log("Transparent!!!!", object, object.transparent);
            // var material = object.material;

            // if (opacity !== material.alpha) {
            //     material.alpha = opacity;
            //     // console.log("Transparent!!!!", object, object.transparent);
            //     object.transparent = opacity < 1;
            // }
            if (transparentObjectIds.indexOf(object.id) !== -1)
                return;
            var entities = object.entities;
            //console.log(entities);
            if (entities) {
                for (var i = 0, len = entities.length; i < len; i++) {
                    // console.log(entities[i]);
                    // console.log(opacity);
                    entities[i].ghostMaterial.fillAlpha = opacity;
                    entities[i].material.alphaMode = "blend";

                }
            }
        };


        /**
         * Sets the wireframe of objects specified by IDs of IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.wireframe bool to set.
         */
        this.setWireframeView = function (params) {

            params = params || {};

            var ids = params.ids;
            var types = params.types;

            if (!ids && !types) {
                console.error("Param expected: ids or types");
                return;
            }

            ids = ids || [];
            types = types || [];

            var wireframe = params.wireframe;

            if (wireframe === undefined) {
                console.error("Param expected: 'wireframe'");
                return;
            }

            var objectId;
            var object;

            for (i = 0, len = types.length; i < len; i++) {
                var typedict = rfcTypes[types[i]] || {};
                Object.keys(typedict).forEach(function (id) {
                    var object = typedict[id];
                    self._setWireframeView(object, wireframe);
                });
            }

            for (var i = 0, len = ids.length; i < len; i++) {

                objectId = ids[i];
                object = objects[objectId] || objects_by_guid[objectId];

                if (!object) {
                    // No return on purpose to continue changing wireframe of
                    // other potentially valid object identifiers.
                    console.error("Object not found: '" + objectId + "'");
                } else {
                    this._setWireframeView(object, wireframe);
                }
            }
        };

        this._setWireframeView = function (object, wireframe) {
            var entities = object.entities;
            if (entities) {
                for (var i = 0, len = entities.length; i < len; i++) {
                    if (wireframe) {
                        entities[i].ghostMaterial.edges = true;
                        entities[i].ghostMaterial.fill = false;
                    } else {
                        entities[i].ghostMaterial.edges = false;
                        entities[i].ghostMaterial.fill = true;
                    }

                }
            }
        };

        /**
         * Sets the edges of objects specified by IDs of IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.wireframe bool to set.
         */
        this.setEdgesView = function (params) {

            params = params || {};

            var ids = params.ids;
            var types = params.types;

            if (!ids && !types) {
                console.error("Param expected: ids or types");
                return;
            }

            ids = ids || [];
            types = types || [];

            var edges = params.edges;

            if (edges === undefined) {
                console.error("Param expected: 'edges'");
                return;
            }

            var objectId;
            var object;

            for (i = 0, len = types.length; i < len; i++) {
                var typedict = rfcTypes[types[i]] || {};
                Object.keys(typedict).forEach(function (id) {
                    var object = typedict[id];
                    self._setEdgesView(object, edges);
                });
            }

            for (var i = 0, len = ids.length; i < len; i++) {

                objectId = ids[i];
                object = objects[objectId] || objects_by_guid[objectId];

                if (!object) {
                    // No return on purpose to continue changing edges of
                    // other potentially valid object identifiers.
                    console.error("Object not found: '" + objectId + "'");
                } else {
                    this._setEdgesView(object, edges);
                }
            }
        };

        this._setEdgesView = function (object, edges) {
            var entities = object.entities;
            if (entities) {
                for (var i = 0, len = entities.length; i < len; i++) {
                    entities[i].ghostMaterial.edges = edges;
                }
            }
        };

        this.showGrid = function (show) {
            grid.visible = show;
        };

        this.getScene = function () {
            return scene;
        };

        this.getSelectedMaterial = function () {
            return materialManager.getSelectedMaterial();
        };

        this.changeSelectedMaterial = function (material) {
            materialManager.changeSelectedMaterial(material);
        };

        this.newDimensions = function (actionName) {
            if (currentDrawAction !== drawActions.MEASURE)
                return;
            measureController.newDimensions(actionName);
            highlightEffect.clear();
        };

        this.deleteDimensions = function () {
            measureController.deleteDimensions();
        };

        this.newStraightLine = function () {
            if (currentDrawAction !== drawActions.LINE)
                return;
            lineDrawer.newStraightLine();
        };

        self.newFreeLine = function () {
            if (currentDrawAction !== drawActions.LINE)
                return;
            lineDrawer.newFreeLine();
        };

        self.newSeveralLine = function () {
            if (currentDrawAction !== drawActions.LINE)
                return;
            lineDrawer.newSeveralLine();
        };

        self.newCircle = function () {
            if (currentDrawAction !== drawActions.CIRCLE)
                return;
            circleDrawer.newCommonCircle();
        };

        self.newRect = function () {
            if (currentDrawAction !== drawActions.RECT)
                return;
            rectDrawer.newCommonRect();
        };

        self.newText = function (action, txt, size) {
            if (currentDrawAction !== drawActions.TEXT)
                return;
            textDrawer.newText(action, txt, size);
        };

        self.setDrawAction = function (action) {
            currentDrawAction = action;
            if (currentDrawAction === drawActions.LINE || currentDrawAction === drawActions.CIRCLE ||currentDrawAction === drawActions.RECT || currentDrawAction === drawActions.TEXT || currentDrawAction === drawActions.ROTATEENTITY) {
                planeXY.pickable = true;
            } else {
                planeXY.pickable = false;
            }
        };

        self.enableHitPlane = function(){
            planeXY.pickable = true;
        };

        self.disableHitPlane = function(){
            planeXY.pickable = false;
        };

        self.getDrawAction = function () {
            return currentDrawAction;
        };

        self.onPushPull = function () {
            if (currentDrawAction !== drawActions.PUSHPULL)
                return;
            pushpull.newPushPull();
        };
        self.onConnectCorner = function () {
            if (currentDrawAction !== drawActions.CONNECTCORNER)
                return;
            connectCorner.newConnectCorner();
        };

        self.onSquareMarker = function () {
            if (currentDrawAction !== drawActions.SQUAREMARKER)
                return;
            squareMarker.newSquareMarker();
        };

        self.onRotateEntity = function () {
            if (currentDrawAction !== drawActions.ROTATEENTITY)
                return;
            rotater.newRotate();
        };

        self.onBucket = function () {
            if (currentDrawAction !== drawActions.BUCKET)
                return;
            bucketer.newBucket(materialManager);
        };

        self.settingViewerFor2DPlan = function () {
            // Bump scene origin to center the model
            var xmin = -300;
            var ymin = -300;
            var zmin = -300;
            var xmax = 300;
            var ymax = 300;
            var zmax = 300;

            var diagonal = Math.sqrt(
                Math.pow(xmax - xmin, 2) +
                Math.pow(ymax - ymin, 2) +
                Math.pow(zmax - zmin, 2));

            var scale = 100 / diagonal;

            self.setScale(scale); // Temporary until we find a better scaling system.

            var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor

            var center = [
                scale * ((xmax + xmin) / 2),
                scale * ((ymax + ymin) / 2),
                scale * ((zmax + zmin) / 2)
            ];
            self.setCamera({
                type: "ortho",
                target: center,
                up: [0, 0, 1],
                // eye: [0.000000, 0.00000, center[2] + scale * diagonal],
                far: FAR_CLIP,
                near: 0.1,
                scale: 100,
                worldAxis: [
                    -1, 0, 0, // Right
                    0, 0, 1, // Up
                    0, 1, 0 // Forward
                ]
            });
            cameraControl.fire("cameraview", "top");
        };

        self.settingViewerFor3DPlan = function () {
            // Bump scene origin to center the model
            var xmin = -300;
            var ymin = -300;
            var zmin = -300;
            var xmax = 300;
            var ymax = 300;
            var zmax = 300;

            var diagonal = Math.sqrt(
                Math.pow(xmax - xmin, 2) +
                Math.pow(ymax - ymin, 2) +
                Math.pow(zmax - zmin, 2));

            var scale = 100 / diagonal;

            self.setScale(scale); // Temporary until we find a better scaling system.

            var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor

            var center = [
                scale * ((xmax + xmin) / 2),
                scale * ((ymax + ymin) / 2),
                scale * ((zmax + zmin) / 2)
            ];
            self.setCamera({
                type: "perspective",
                target: center,
                up: [0, 0, 1],
                eye: [center[0] - scale * diagonal, center[1] - scale * diagonal, center[2] + scale * diagonal],
                far: FAR_CLIP,
                near: 0.1,
                fovy: 35.8493,
                worldAxis: [
                    1, 0, 0, // Right
                    0, 0, 1, // Up
                    0, -1, 0  // Forward
                ]
            });
        };

        self.initDrawingTools = function () {
            measureController.cancelMeasure();
            lineDrawer.cancelDrawLine();
            circleDrawer.cancelDrawCircle();
            rectDrawer.cancelDrawRect();
            textDrawer.cancelDrawText();
            pushpull.cancelPushPull();
            connectCorner.cancelConnectCorner();
            squareMarker.cancelSquareMarker();
            rotater.cancelRotate();
            bucketer.cancelBucket();
            currentDrawAction = drawActions.NONE;
            cameraControl.toolbarDragAction = 'selector';
        };

        /**
         * Sets camera state.
         *
         * @param params
         */
        self.setCamera = function (params) {
            // console.log(params)
            params = params || {};

            // Set projection type

            var type = params.type;
            // console.log(type);
            if (type) {
                camera.projection = type;
                projectionType = type;
                camera.project = project[type];
            }

            // Set camera position

            if (params.animate) {

                cameraFlight.flyTo({
                    eye: params.eye,
                    look: params.target,
                    up: params.up,
                    fitFOV: params.fitFOV,
                    duration: params.duration
                });

            } else {

                if (params.eye) {
                    camera.view.eye = params.eye;
                }

                if (params.target) {
                    camera.view.look = params.target;
                    cameraControl.rotatePos = camera.view.look; // Rotate about target initially
                }

                if (params.up) {
                    camera.view.up = params.up;
                }
            }

            // Set camera FOV angle, only if currently perspective

            if (params.fovy) {
                if (projectionType !== "perspective") {
                    console.error("Ignoring update to 'fovy' for current '" + projectionType + "' camera");
                } else {
                    camera.project.fovy = params.fovy;
                }
            }

            // Set camera view volume size, only if currently orthographic

            if (params.scale) {
                if (projectionType !== "ortho") {
                    console.error("Ignoring update to 'scale' for current '" + projectionType + "' camera");
                } else {
                    camera.project.scale = params.scale;
                }
            }

            if (params.worldAxis) {
                camera.worldAxis = params.worldAxis;
            }
        };

        /**
         * Gets camera state.
         *
         * @returns {{type: string, eye: (*|Array.<T>), target: (*|Array.<T>), up: (*|Array.<T>)}}
         */
        this.getCamera = function () {

            var view = camera.view;

            var json = {
                type: projectionType,
                eye: view.eye.slice(0),
                target: view.look.slice(0),
                up: view.up.slice(0)
            };

            var project = camera.project;

            if (projectionType === "perspective") {
                json.fovy = project.fovy;

            } else if (projectionType === "ortho") {
                json.size = [1, 1, 1]; // TODO: efficiently derive from cached value or otho volume
            }

            return json;
        };


        /**
         * Redefines light sources.
         * 
         * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         * See http://xeoengine.org/docs/classes/Lights.html for possible params for each light type
         */
        this.setLights = function (params) {
            lights = params;

            for (var i = scene.lights.lights.length - 1; i >= 0; i--) {
                scene.lights.lights[i].destroy();
            }

            scene.lights.lights = buildLights(lights);
        };


        /**
         * Returns light sources.
         * 
         * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         */
        this.getLights = function () {
            return lights;
        };

        function buildLights(lights) {
            return lights.map(function (light) {
                if (light.type == "ambient") {
                    return new xeogl.AmbientLight(scene, light.params);
                } else if (light.type == "dir") {
                    return new xeogl.DirLight(scene, light.params);
                } else if (light.type == "point") {
                    return new xeogl.PointLight(scene, light.params);
                } else {
                    console.log("Unknown light type: " + type);
                }
            });
        }


        /**
         *
         * @param params
         * @param ok
         */
        this.viewFit = function (params, ok) {

            params = params || {};

            var ids = params.ids;
            var aabb;

            if (!ids || ids.length === 0) {

                // Fit everything in view by default
                aabb = scene.worldBoundary.aabb;

            } else {
                // console.log(ids);
                aabb = getObjectsAABB(ids);
            }

            if (params.animate) {

                cameraFlight.flyTo({
                        aabb: aabb,
                        fitFOV: params.fitFOV,
                        duration: params.duration
                    },
                    function () {
                        if (ok) {
                            ok();
                        }

                        // Now orbiting the point we flew to
                        cameraControl.rotatePos = camera.view.look;
                    });

            } else {

                cameraFlight.jumpTo({
                    aabb: aabb,
                    fitFOV: 50.
                });
            }
        };

        // Updates the boundary helper
        //Effect highlight
        function setBoundaryState(params) {
            // console.log(params);
            if (params.aabb) {
                throw new Error("Not supported");
            } else if (params.ids) {
                //Edge Effect
                //boundaryHelper.setSelected(params.ids);

                highlightEffect.clear();

                var ids = params.ids;
                var objectId;
                var object;

                for (var i = 0, len = ids.length; i < len; i++) {
                    objectId = ids[i];
                    object = objects[objectId];
                    if (object) {
                        // console.log("ddd",object);
                        //Color Effect
                        highlightEffect.add(object);
                        //object.highlighted = true;
                    }
                }
            }

        }

        // Returns an axis-aligned bounding box (AABB) that encloses the given objects
        function getObjectsAABB(ids_) {

            var ids;
            if (Object.keys(objects_by_guid).length) {
                ids = [];
                ids_.forEach(function (i) {
                    objects_by_guid[i].forEach(function (o) {
                        ids.push(o.id);
                    });
                });
            } else {
                ids = ids_;
            }

            if (ids.length === 0) {

                // No object IDs given
                return null;
            }

            var objectId;
            var object;
            var worldBoundary;

            if (ids.length === 1) {

                // One object ID given

                objectId = ids[0];
                object = objects[objectId] || objects_by_guid[objectId];
                console.log(object);
                if (object) {
                    worldBoundary = object.entities[0];

                    if (worldBoundary) {

                        return worldBoundary.aabb;

                    } else {
                        return null;
                    }

                } else {
                    return null;
                }
            }

            // Many object IDs given

            var i;
            var len;
            var min;
            var max;

            var xmin = 100000;
            var ymin = 100000;
            var zmin = 100000;
            var xmax = -100000;
            var ymax = -100000;
            var zmax = -100000;

            var aabb;

            for (i = 0, len = ids.length; i < len; i++) {

                objectId = ids[i];
                object = objects[objectId] || objects_by_guid[objectId];

                if (!object) {
                    continue;
                }

                worldBoundary = object.worldBoundary;

                if (!worldBoundary) {
                    continue;
                }

                aabb = worldBoundary.aabb;

                min = aabb.slice(0);
                max = aabb.slice(3);

                if (min[0] < xmin) {
                    xmin = min[0];
                }

                if (min[1] < ymin) {
                    ymin = min[1];
                }

                if (min[2] < zmin) {
                    zmin = min[2];
                }

                if (max[0] > xmax) {
                    xmax = max[0];
                }

                if (max[1] > ymax) {
                    ymax = max[1];
                }

                if (max[2] > zmax) {
                    zmax = max[2];
                }
            }

            var result = xeogl.math.AABB3();

            result[0 + 0] = xmin;
            result[1 + 0] = ymin;
            result[2 + 0] = zmin;
            result[0 + 3] = xmax;
            result[1 + 3] = ymax;
            result[2 + 3] = zmax;

            return result;
        }

        /**
         * Remembers the current state of the viewer so that it can be reset to this state with
         * a subsequent call to #reset.
         */
        this.saveReset = function () {
            resetBookmark = this.getBookmark();
        };

        this.getObject = function (id) {
            return objects[id];
        };

        /**
         * Resets the state of this viewer to the state previously saved with #saveReset.
         * @param {*} params A mask which specifies which aspects of viewer state to reset.
         */
        this.reset = function (params) {
            if (!resetBookmark) {
                console.log("Ignoring call to xeoViewer.reset - xeoViewer.saveReset not called previously.");
                return;
            }
            this.setBookmark(resetBookmark, params);
        };

        /**
         * Returns a bookmark of xeoViewer state.
         * @param {*} options A mask which specifies which aspects of viewer state to bookmark.
         */
        this.getBookmark = function (options) {

            // Get everything by default

            var getVisible = !options || options.visible;
            var getColors = !options || options.colors;
            var getSelected = !options || options.selected;
            var getCamera = !options || options.camera;

            var bookmark = {};

            var objectId;
            var object;

            if (getVisible) {

                var visible = [];

                for (objectId in objects) {
                    if (objects.hasOwnProperty(objectId)) {

                        object = objects[objectId] || objects_by_guid[objectId];

                        if (getVisible && object.visible) {
                            visible.push(objectId);
                        }
                    }
                }
                bookmark.visible = visible;
            }

            if (getColors) {

                var colors = {};
                var opacities = {};

                for (objectId in objects) {
                    if (objects.hasOwnProperty(objectId)) {
                        object = objects[objectId] || objects_by_guid[objectId];
                        colors[objectId] = object.material.diffuse.slice(); // RGB
                        opacities[objectId] = object.transparent ? object.material.opacity : 1.0;
                    }
                }
                bookmark.colors = colors;
                bookmark.opacities = opacities;
            }

            if (getSelected) {
                bookmark.selected = this.getSelection();
            }

            if (getCamera) {
                var camera = this.getCamera();
                camera.animate = true; // Camera will fly to position when bookmark is restored
                bookmark.camera = camera;
            }

            return bookmark;
        };

        /**
         * Restores xeoViewer to a bookmark.
         *
         * @param bookmark
         * @param options
         */
        this.setBookmark = function (bookmark, options) {

            // Set everything by default, where provided in bookmark

            var setVisible = bookmark.visible && (!options || options.visible);
            var setColors = bookmark.colors && (!options || options.colors);
            var setSelected = bookmark.selected && (!options || options.selected);
            var setCamera = bookmark.camera && (!options || options.camera);

            if (setColors) {

                var objectId;
                var object;
                var colors = bookmark.colors;
                var opacities = bookmark.opacities;

                for (objectId in colors) {
                    if (colors.hasOwnProperty(objectId)) {
                        object = objects[objectId] || objects_by_guid[objectId];
                        if (object) {
                            this._setObjectColor(object, colors[objectId]);
                            this._setObjectOpacity(object, opacities[objectId]);
                        }
                    }
                }
            }

            if (setVisible) {
                this.setVisibility({
                    ids: bookmark.visible,
                    visible: true
                });
            }

            if (setSelected) {
                this.setSelection({
                    ids: bookmark.selected,
                    selected: true
                });
            }

            if (setCamera) {
                this.setCamera(bookmark.camera);
            }
        };

        // /**
        //  * Sets general configurations.
        //  *
        //  * @param params
        //  * @param {Boolean} [params.mouseRayPick=true] When true, camera flies to orbit each clicked point, otherwise
        //  * it flies to the boundary of the object that was clicked on.
        //  * @param [params.viewFitFOV=25] {Number} How much of field-of-view, in degrees, that a target {{#crossLink "Entity"}}{{/crossLink}} or its AABB should
        //  * fill the canvas when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}} or {{#crossLink "CameraFlightAnimation/jumpTo:method"}}{{/crossLink}}.
        //  * @param [params.viewFitDuration=1] {Number} Flight duration, in seconds, when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}}.
        //  */
        // this.setConfigs = function (params) {

        //     params = params || {};

        //     if (params.mouseRayPick != undefined) {
        //         cameraControl.mousePickEntity.rayPick = params.mouseRayPick;
        //     }

        //     if (params.viewFitFOV !== undefined) {
        //         cameraFlight.fitFOV = params.viewFitFOV;
        //     }

        //     if (params.viewFitDuration !== undefined) {
        //         cameraFlight.duration = params.viewFitDuration;
        //     }
        // };

        /**
         Returns a snapshot of this xeoViewer as a Base64-encoded image.

         #### Usage:
         ````javascript
         imageElement.src = xeoViewer.getSnapshot({
             width: 500, // Defaults to size of canvas
             height: 500,
             format: "png" // Options are "jpeg" (default), "png" and "bmp"
         });
         ````

         @method getSnapshot
         @param {*} [params] Capture options.
         @param {Number} [params.width] Desired width of result in pixels - defaults to width of canvas.
         @param {Number} [params.height] Desired height of result in pixels - defaults to height of canvas.
         @param {String} [params.format="jpeg"] Desired format; "jpeg", "png" or "bmp".
         @returns {String} String-encoded image data.
         */
        this.getSnapshot = function (params) {
            return scene.canvas.getSnapshot(params);
        };

        /**
         Returns a list of loaded IFC entity types in the model.

         @method getTypes
         @returns {Array} List of loaded IFC entity types, with visibility flag
         */
        this.getTypes = function () {
            return Object.keys(rfcTypes).map(function (n) {
                return {
                    name: n,
                    visible: hiddenTypes.indexOf(n) === -1
                };
            });
        };

        /**
         * Returns the world boundary of an object
         *
         * @method getWorldBoundary
         * @param {String} objectId id of object
         * @param {Object} result Existing boundary object
         * @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
         */
        this.getWorldBoundary = function (objectId, result) {
            let object = objects[objectId] || objects_by_guid[objectId];

            if (object === undefined) {
                return null;
            } else {
                if (result === undefined) {
                    result = {
                        obb: new Float32Array(32),
                        aabb: new Float32Array(6),
                        center: xeogl.math.vec3(),
                        sphere: xeogl.math.vec4()
                    };
                }

                // the boundary needs to be scaled back to real world units
                let s = 1 / scale.xyz[0],
                    scaled = object.worldBoundary;

                result.aabb[0] = scaled.aabb[0] * s;
                result.aabb[1] = scaled.aabb[1] * s;
                result.aabb[2] = scaled.aabb[2] * s;
                result.aabb[3] = scaled.aabb[3] * s;
                result.aabb[4] = scaled.aabb[4] * s;
                result.aabb[5] = scaled.aabb[5] * s;

                xeogl.math.mulVec3Scalar(scaled.center, s, result.center);
                xeogl.math.mulVec4Scalar(scaled.sphere, s, result.sphere);

                var obb = scaled.obb;
                var buffer = result.obb.buffer;
                for (var i = 0; i < 32; i += 4) {
                    var v = new Float32Array(buffer, 4 * i);
                    xeogl.math.mulVec3Scalar(obb.slice(i), s, v);
                    v[3] = 1.;
                }

                return result;
            }
        };

        /**
         * Destroys the viewer
         */
        this.destroy = function () {
            scene.destroy();
        }

    }

    xeoViewer.prototype = Object.create(EventHandler.prototype);

    return xeoViewer;
});