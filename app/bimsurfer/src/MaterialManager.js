define([
    "../lib/xeogl"
], function () {

    "use strict";

    /**

     Controls camera with mouse and keyboard, handles selection of entities and rotation point.

     */
    xeogl.MaterialManager = xeogl.Component.extend({

        type: "xeogl.MaterialManager",

        _init: function (cfg) {
            this.defaultMaterials = [];
            var scene = this.scene;
            var colors = cfg.colors;
            var dlg = parent.document.getElementById('dlg_materials');
            var spin_names = parent.document.getElementById('material_names');
            var btn_select = parent.document.getElementById('btn_material_select');
            var list = parent.document.getElementById('material_list');
            var matPreview = parent.document.getElementById('td_material_preview');

            var currentMaterial;

            var canvas_id_index = 0;
            list.innerHTML = '';
            matPreview.innerHTML = '';

            var preview_entity;

            var loadedMaterials = [];
            var sampleEntities = [];


            var defaultMat = new xeogl.EmphasisMaterial(scene, {
                id: 'default',
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [0.5, 0.5, 0.5],
                fillAlpha: 1
            });

            var defaultMat_0 = new xeogl.EmphasisMaterial(scene, {
                id: 'default_0',
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [1, 0, 0],
                fillAlpha: 1
            });

            var defaultMat_1 = new xeogl.EmphasisMaterial(scene, {
                id: 'default_1',
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [0, 1, 0],
                fillAlpha: 1
            });

            var defaultMat_2 = new xeogl.EmphasisMaterial(scene, {
                id: 'default_2',
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [0, 0, 1],
                fillAlpha: 1
            });

            loadedMaterials.push(defaultMat);

            // //Initialize material in scene from default materials
            this.initMaterials = function () {
                var types = Object.keys(colors);
                for (var i = 0; i < types.length; i++) {
                    var color = colors[types[i]];
                    var mat = new xeogl.EmphasisMaterial(scene, {
                        id: types[i],
                        edges: false,
                        edgeAlpha: 1.0,
                        edgeColor: [0.227451, 0.227451, 0.227451],
                        edgeWidth: 2,
                        vertices: false,
                        vertexAlpha: 1.0,
                        vertexColor: [0.6, 1.0, 0.6],
                        vertexSize: 10,
                        fill: true,
                        fillColor: [color[0], color[1], color[2]],
                        fillAlpha: color[3]
                    });
                    this.defaultMaterials.push(mat);
                }

                this.initPreview();
            };

            this.initPreview = function(){
                // <canvas id = "material_preview" class="material-preview"></canvas>
                var canvas = document.createElement('canvas');
                canvas.id = 'material_preview';
                canvas.classList.add('material_preview');
                matPreview.appendChild(canvas);

                //Create 3d scene in canvas
                xeogl.scene = new xeogl.Scene({
                    canvas: parent.document.getElementById(canvas.id),
                    transparent: true,
                    backgroundcolor: [0, 0, 0],
                    webgl2: false,
                });

                // Redefine default light sources;
                // var lights = [
                //     {
                //         type: "ambient",
                //         params: {
                //             color: [0.65, 0.65, 0.75],
                //             intensity: 1
                //         }
                //     },
                //     {
                //         type: "dir",
                //         params: {
                //             dir: [0.0, 0.0, -1.0],
                //             color: [1.0, 1.0, 1.0],
                //             intensity: 1.0,
                //             space: "view"
                //         }
                //     }
                // ];
                // xeogl.scene.lights.lights = buildLights(lights);

                preview_entity = new xeogl.Entity({
                    geometry: new xeogl.SphereGeometry({
                        center: [0,0,0],
                        radius: 1.5,
                        heightSegments: 60,
                        widthSegments: 60
                    }),
                    material: new xeogl.MetallicMaterial({
                        diffuse: [1, 0.3, 0.3]
                    }),
                    ghostMaterial: new xeogl.EmphasisMaterial({
                        edges: defaultMat.edges,
                        edgeAlpha: defaultMat.edgeAlpha,
                        edgeColor: defaultMat.edgeColor,
                        edgeWidth: defaultMat.edgeWidth,
                        vertices: defaultMat.vertices,
                        vertexAlpha: defaultMat.vertexAlpha,
                        vertexColor: defaultMat.vertexColor,
                        vertexSize: defaultMat.vertexSize,
                        fill: defaultMat.fill,
                        fillColor: defaultMat.fillColor,
                        fillAlpha: defaultMat.fillAlpha
                    }),
                    ghosted: true
                });

                xeogl.scene.camera.eye = [0, 0, -4];

                // new xeogl.CameraControl(xeogl.scene);

                currentMaterial = defaultMat;

                this.addMaterial(defaultMat_0);
                this.addMaterial(defaultMat_1);
                this.addMaterial(defaultMat_2);
            };
            // Return material by type (type: string)
            this.getMaterialByType = function (type) {
                var material = null;
                for (var i = 0; i < this.defaultMaterials.length; i++) {
                    if (this.defaultMaterials[i].id === type) {
                        material = this.defaultMaterials[i];
                        break;
                    }
                }
                return material;
            };

            // Add new material in material dialog
            this.addMaterial = function (material) {
                if(material===null)
                    return;
                var isLoaded = false;
                for (var i = 0; i < loadedMaterials.length; i++) {
                    if (material.id === loadedMaterials[i].id) {
                        isLoaded = true;
                        break;
                    }
                }
                if (isLoaded)
                    return;

                loadedMaterials.push(material);
                this.addMaterialInDlg(material);
            };

            this.addMaterialInDlg = function (material) {
                this.addInSpinNames(material);
                this.addInLstMats(material);
            };

            this.addInSpinNames = function (material) {
                //add material name in select spinner
                // <a class="dropdown-item small px-2 material-name"><i class="fas fa-sm text-success"></i> Material1</a>
                var atag = document.createElement('a');
                atag.classList.add('dropdown-item', 'small', 'px-2', 'material-name');
                var itag = document.createElement('i');
                itag.classList.add('fas', 'fa-sm', 'text-success');
                atag.appendChild(itag);
                atag.innerText = material.id;
                atag.addEventListener('click', function(){onClickMaterialSelect(material.id);}, false);
                spin_names.appendChild(atag);
            };

            function onClickMaterialSelect(materialId){
                btn_select.innerHTML = materialId + '<i class="caret"></i>';
                changeMaterial(materialId);
            }

            
            this.addInLstMats = function (material) {
                //add material in Material List
                // <div class="material-sample-icon"><img src="../assets/images/dialog/material.png"></div>
                // var divtag = document.createElement('div');
                // divtag.classList.add('material-sample-icon');
                // var canvas = document.createElement('canvas');
                // canvas.addEventListener('click', function(){onClickMaterialSelect(material.id);}, false);
                // divtag.appendChild(canvas);
                // list.appendChild(divtag);

                // canvas.id = 'canvas' + canvas_id_index++;
                // var canvas_id = canvas.id;

                // //Create 3d scene in canvas
                // var matScene = new xeogl.Scene({
                //     canvas: parent.document.getElementById(canvas_id),
                //     transparent: true,
                //     backgroundcolor: [0, 0, 0],
                //     webgl2: false,
                // });

                // // Redefine default light sources;
                // // var lights = [
                // //     {
                // //         type: "ambient",
                // //         params: {
                // //             color: [0.65, 0.65, 0.75],
                // //             intensity: 1
                // //         }
                // //     },
                // //     {
                // //         type: "dir",
                // //         params: {
                // //             dir: [0.0, 0.0, -1.0],
                // //             color: [1.0, 1.0, 1.0],
                // //             intensity: 1.0,
                // //             space: "view"
                // //         }
                // //     }
                // // ];

                // // xeogl.scene.lights.lights = buildLights(lights);

                // var entity = new xeogl.Entity(matScene, {
                //     geometry: new xeogl.TorusGeometry(matScene,{
                //         radius: 1.5,
                //         tube: 0.3,
                //         radialSegments: 120,
                //         tubeSegments: 60
                //     }),
                //     material: new xeogl.MetallicMaterial(matScene,{
                //         diffuse: [1, 0.3, 0.3]
                //     }),
                //     ghostMaterial: new xeogl.EmphasisMaterial(matScene,{
                //         id: material.id,
                //         edges: material.edges,
                //         edgeAlpha: material.edgeAlpha,
                //         edgeColor: material.edgeColor,
                //         edgeWidth: material.edgeWidth,
                //         vertices: material.vertices,
                //         vertexAlpha: material.vertexAlpha,
                //         vertexColor: material.vertexColor,
                //         vertexSize: material.vertexSize,
                //         fill: material.fill,
                //         fillColor: material.fillColor,
                //         fillAlpha: material.fillAlpha
                //     }),
                //     ghosted: true
                // });
                // sampleEntities.push(entity);

                // matScene.camera.eye = [0, 0, -4];

                // matScene.on("tick", function () {
                //     this.camera.orbitYaw(0.5);
                //     this.camera.orbitPitch(0.3);
                // });
            };

            function changeMaterial(materialId){
                // console.log(materialId);
                var material = defaultMat;
                for(var i=0; i<loadedMaterials.length; i++){
                    if(loadedMaterials[i].id === materialId){
                        material = loadedMaterials[i];
                        break;
                    }
                }
                preview_entity.ghostMaterial.edgeAlpha = material.edgeAlpha;
                preview_entity.ghostMaterial.edgeColor = material.edgeColor;
                preview_entity.ghostMaterial.edgeWidth = material.edgeWidth;
                preview_entity.ghostMaterial.vertices = material.vertices;
                preview_entity.ghostMaterial.vertexAlpha = material.vertexAlpha;
                preview_entity.ghostMaterial.vertexColor = material.vertexColor;
                preview_entity.ghostMaterial.vertexSize = material.vertexSize;
                preview_entity.ghostMaterial.fill = material.fill;
                preview_entity.ghostMaterial.fillColor = material.fillColor;
                preview_entity.ghostMaterial.fillAlpha = material.fillAlpha;

                currentMaterial = material;
            }

            this.getSelectedMaterial = function(){
                return currentMaterial;
            };

            this.changeSelectedMaterial = function(material){
                var index = 0;
                for(var i=0; i<loadedMaterials.length; i++){
                    if(loadedMaterials[i].id === material.id){
                        index = i;
                        break;
                    }
                }
                loadedMaterials[index] = material;

                preview_entity.ghostMaterial.edgeAlpha = material.edgeAlpha;
                preview_entity.ghostMaterial.edgeColor = material.edgeColor;
                preview_entity.ghostMaterial.edgeWidth = material.edgeWidth;
                preview_entity.ghostMaterial.vertices = material.vertices;
                preview_entity.ghostMaterial.vertexAlpha = material.vertexAlpha;
                preview_entity.ghostMaterial.vertexColor = material.vertexColor;
                preview_entity.ghostMaterial.vertexSize = material.vertexSize;
                preview_entity.ghostMaterial.fill = material.fill;
                preview_entity.ghostMaterial.fillColor = material.fillColor;
                preview_entity.ghostMaterial.fillAlpha = material.fillAlpha;

                var entity;
                for(var j=0; j<sampleEntities.length; j++){
                    if(sampleEntities[j].ghostMaterial.id === material.id){
                        entity = sampleEntities[j];
                        break;
                    }
                }
                entity.ghostMaterial.edgeAlpha = material.edgeAlpha;
                entity.ghostMaterial.edgeColor = material.edgeColor;
                entity.ghostMaterial.edgeWidth = material.edgeWidth;
                entity.ghostMaterial.vertices = material.vertices;
                entity.ghostMaterial.vertexAlpha = material.vertexAlpha;
                entity.ghostMaterial.vertexColor = material.vertexColor;
                entity.ghostMaterial.vertexSize = material.vertexSize;
                entity.ghostMaterial.fill = material.fill;
                entity.ghostMaterial.fillColor = material.fillColor;
                entity.ghostMaterial.fillAlpha = material.fillAlpha;

                currentMaterial = material;

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

            // When load page, set default material


        },

        _props: {

        }
    });
});
