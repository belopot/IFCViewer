define([
    "../lib/xeogl"
], function () {

    "use strict";

    xeogl.ComponentsManager = xeogl.Component.extend({

        type: "xeogl.ComponentsManager",

        _init: function (cfg) {
            var scene = this.scene;
            var input = scene.input;
            var viewer = cfg.viewer;
            var collection = cfg.collection;
            var models = cfg.models;
            var spin_names = parent.document.getElementById('component_names');
            var btn_select = parent.document.getElementById('btn_component_select');
            var list = parent.document.getElementById('component_list');
            var componentPreview = parent.document.getElementById('td_component_preview');
            var inputName = parent.document.getElementById("component_name");
            var inputTip = parent.document.getElementById("component_tip");

            var compData = [];
            var request = new XMLHttpRequest();
            request.open("GET", "components/components.xml", false);
            request.send();
            var xml = request.responseXML;
            var comps = xml.getElementsByTagName("components");


            var currentComponent;
            list.innerHTML = '';
            spin_names.innerHTML = '';

            var isNew = false;

            var previewModel;

            var realModel;
            var initPreview = function () {
                componentPreview.innerHTML = '';
                var canvas = document.createElement('canvas');
                canvas.id = 'component_preview';
                canvas.classList.add('component_preview');
                componentPreview.appendChild(canvas);

                //Create 3d scene in canvas
                var componentScene = new xeogl.Scene({
                    canvas: parent.document.getElementById('component_preview'),
                    transparent: true,
                });

                previewModel = new xeogl.OBJModel(componentScene, {
                    src: currentComponent,
                });

                componentScene.camera.eye = [60, 60, 60];
                new xeogl.CameraControl(componentScene);

            };

            // Add new material in material dialog
            var addComponent = function (name, tip, img, file) {
                addInSpinNames(name, tip, img, file);
                addComponentInLst(name, tip, img, file);
            };

            var addInSpinNames = function (name, tip, img, file) {
                var atag = document.createElement('a');
                atag.classList.add('dropdown-item', 'small', 'px-2', 'material-name');
                var itag = document.createElement('i');
                itag.classList.add('fas', 'fa-sm', 'text-success');
                atag.appendChild(itag);
                atag.innerText = name;
                atag.addEventListener('click', function () {
                    onClickComponentSelect(name, tip, img, file);
                }, false);
                spin_names.appendChild(atag);
            };

            function onClickComponentSelect(name, tip, img, file) {
                btn_select.innerHTML = name + '<i class="caret"></i>';
                changeComponent(name, tip, img, file);
            }


            var addComponentInLst = function (name, tip, img, file) {
                var divtag = document.createElement('div');
                divtag.classList.add('component-sample-icon');
                var imgTag = document.createElement('img');
                imgTag.src = img;
                imgTag.addEventListener('click', function () {
                    onClickComponentSelect(name, tip, img, file);
                    isNew = true;
                    if(realModel)
                        realModel.destroy();
                    realModel = loadobj(currentComponent);
                }, false);
                divtag.appendChild(imgTag);
                list.appendChild(divtag);
            };

            for (var i = 0; i < comps.length; i++) {
                var comp = comps[i];
                var component = comp.getElementsByTagName("component");
                for (var j = 0; j < component.length; j++) {
                    var nameNode = component[j].childNodes[0].nextSibling;
                    var tipNode = nameNode.nextSibling.nextSibling;
                    var imgNode = tipNode.nextSibling.nextSibling;
                    var fileNode = imgNode.nextSibling.nextSibling;

                    var compDatas = {};
                    compDatas.name = nameNode.textContent;
                    compDatas.tip = tipNode.textContent;
                    compDatas.img = imgNode.textContent;
                    compDatas.file = fileNode.textContent;
                    addComponent(compDatas.name, compDatas.tip, compDatas.img, compDatas.file);
                    compData.push(compDatas);
                }
            }
            var initInfo = function (name, tip) {
                inputName.value = name;
                inputTip.innerText = tip;
            };

            initPreview();
            onClickComponentSelect(compData[0].name, compData[0].tip, compData[0].img, compData[0].file);

            function changeComponent(name, tip, img, file) {
                currentComponent = file;
                initInfo(name, tip);
                previewModel.src = currentComponent;
            }

            this.getSelectedMaterial = function () {
                return currentComponent;
            };

            input.on("mousemove",
                function (canvasPos) {
                    if (isNew) {
                        viewer.enableHitPlane();
                        updateHitCursor(canvasPos);
                    }
                });
            input.on("mousedown",
                function (canvasPos) {
                    if (isNew & input.mouseDownLeft) {
                        decide(canvasPos);
                    } else {
                        isNew = false;
                        if (realModel)
                            realModel.destroy();
                        realModel = undefined;
                        // viewer.disableHitPlane();
                    }
                });

            var updateHitCursor = function (canvasPos) {
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
                    // setCursor("auto", true);
                }
            };

            var calibrate = function (hit) {
                // console.log(realModel);
                if (realModel) {
                    var trans = new xeogl.Transform(scene, {
                        xyz: hit.worldPos
                    });
                    realModel.transform = trans;
                    // console.log(realModel, hit.worldPos);
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
                        isNew = false;
                        realModel = undefined;
                        // viewer.disableHitPlane();
                    }
                } else {
                    isNew = false;
                    if (realModel)
                        realModel.destroy();
                    realModel = undefined;
                    // viewer.disableHitPlane();
                    // setCursor("auto", true);
                }
            };

            var trans = new xeogl.Rotate(scene, {
                xyz:[1,0,0],
                angle: 90
            });

            var loadglTF = function (src) {

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
                                viewer._addObject("DEFAULT", component);
                                component.transform = trans;
                            }
                        });
    
                    });
    
                return model;
            };

            var uuid = 0;
            var loadobj = function (src) {
                var model = new xeogl.OBJModel(scene, {
                    src: src
                });
    
                collection.add(model);
    
                models[model.id] = model;
    
                model.on("loaded",
                    function () {
    
                        // TODO: viewFit, but boundaries not yet ready on Model Entities
    
                        model.iterate(function (component) {
                            if (component.isType("xeogl.Entity")) {
                                viewer._addObject("DEFAULT", component);
                                component.id = "_obj"+uuid++;
                                component.transform = trans;
                            }
                        });
    
                    });
    
                return model;
            };

        },

        _props: {

        }
    });
});