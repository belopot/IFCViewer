define(["./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./BimSurfer"], function(BimServerModel, PreloadQuery, BimServerGeometryLoader, BimSufer) { 

    function BimServerModelLoader(bimServerClient, bimSurfer) {
    	
		var o = this;
		o.allObjects = [];
		o.allObjectIds = [];
		o.layerIds = [];
		o.layerNames = [];
		o.layerObjects = [];
		o.layerObjectIds = [];
		o.spans = [];
    	this.loadFullModel = function(apiModel, container){
    		return new Promise(function(resolve, reject) {
    			var model = new BimServerModel(apiModel);
				//Load Layer
    			apiModel.query(PreloadQuery, function () {}).done(function(){
					var oids = [];
					var cnt = 0;
    				apiModel.getAllOfType("IfcProduct", true, function(object){
						
						// console.log(object, cnt++);
						oids.push(object.oid);
						//All Model
						o.allObjects.push(object);
						o.allObjectIds.push(object.model.roid+":"+object.oid);
						//Layer Model
						object.getRepresentation(function(productRepresentation){
							if (productRepresentation !== null) {
								productRepresentation.getRepresentations(function(representation){
									// console.log(representation);
									representation.getLayerAssignments(function(layer){
										if(o.layerIds.indexOf(layer.oid)===-1){
											//new Layer
											o.layerIds.push(layer.oid);
											o.layerNames.push(layer.object.Name);
											o.layerObjects[layer.oid] = [];
											o.layerObjects[layer.oid].push(object);
											o.layerObjectIds[layer.oid] = [];
											o.layerObjectIds[layer.oid].push(object.model.roid+":"+object.oid);

											var tr = document.createElement("tr");
											tr.className = "layertr";
											var td1 = document.createElement("td");
											td1.className = "layertd";
											td1.innerText = layer.object.Name;
											tr.appendChild(td1);
											
											var td2 = document.createElement("td");
											td2.className = "layertd";
											var eye = document.createElement("div");
											
											var on = 1;
											var setClass = function() {
												eye.className = "eye " + ["eyeclosed", "eyeopen"][on*1];
											};
											setClass();
											eye.onclick = function() {
												on = !on;
												setClass();
												bimSurfer.setVisibility({ids:o.layerObjectIds[layer.oid], visible:on});
											};
											td2.appendChild(eye);
											o.spans[layer.oid] = document.createElement("span");
											o.spans[layer.oid].className = "badge";
											o.spans[layer.oid].innerText = o.layerObjects[layer.oid].length;
											td2.appendChild(o.spans[layer.oid]);
											tr.appendChild(td2);
											
											container.appendChild(tr);
										}
										else{
											//old Layer
											o.layerObjects[layer.oid].push(object);
											o.layerObjectIds[layer.oid].push(object.model.roid+":"+object.oid);
											o.spans[layer.oid].innerText = o.layerObjects[layer.oid].length;
										}
									});
								});
							}
						});						
    				});
    				o.loadOids(model, oids);
    				resolve(model);
                });
    		});
    	};
    	
    	this.loadObjects = function(apiModel, objects){
    		return new Promise(function(resolve, reject) {
    			var model = new BimServerModel(apiModel);

				var oids = [];
				objects.forEach(function(object){
					oids.push(object.oid);
				});
				o.loadOids(model, oids);
				resolve(model);
    		});
    	};
    	
    	this.loadOids = function(model, oids){
            var oidToGuid = {};
            var guidToOid = {};

            var oidGid = {};
            
            oids.forEach(function(oid){
            	model.apiModel.get(oid, function(object){
            		if (object.object._rgeometry != null) {
            			var gid = object.object._rgeometry._i;
            			var guid = object.object.GlobalId;
            			oidToGuid[oid] = guid;
            			guidToOid[guid] = oid;
            			oidGid[gid] = oid;
            		}
            	});
            });
            
            bimSurfer._idMapping.toGuid.push(oidToGuid);
            bimSurfer._idMapping.toId.push(guidToOid);
    		
    		var viewer = bimSurfer.viewer;
    		viewer.taskStarted();
	
    		viewer.createModel(model.apiModel.roid);
	
	        var loader = new BimServerGeometryLoader(model.api, viewer, model, model.apiModel.roid, o.globalTransformationMatrix);
	
	        loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
				if (progress == "start") {
					console.log("Started loading geometries");
					bimSurfer.fire("loading-started");
				} else if (progress == "done") {
					console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
					bimSurfer.fire("loading-finished");
	                viewer.taskFinished();
				}
	        });
	
	        loader.setLoadOids(oidGid);
	
	        // viewer.clear(); // For now, until we support multiple models through the API
	
	        viewer.on("tick", function () { // TODO: Fire "tick" event from xeoViewer
				loader.process();
				// console.log('tick');
	        });
			// console.log('start');
	        loader.start();
    	}
    	
    	this.setGlobalTransformationMatrix = function(globalTransformationMatrix) {
    		o.globalTransformationMatrix = globalTransformationMatrix;
		}
		
	}
	

    
    BimServerModelLoader.prototype = Object.create(BimServerModelLoader.prototype);

    return BimServerModelLoader;
});