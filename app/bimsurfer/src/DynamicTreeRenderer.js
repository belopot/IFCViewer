define(["./EventHandler", "./Request", "./Utils"], function(EventHandler, Request, Utils) {
    
    function DynamicTreeRenderer(args) {
        
        var self = this;        
        EventHandler.call(this);
        
        var TOGGLE = self.TOGGLE = 0;
        var SELECT = self.SELECT = 1;
        var SELECT_EXCLUSIVE = self.SELECT_EXCLUSIVE = 2;
        var DESELECT = self.DESELECT = 3;
        
        var fromXml = false;
        
        var domNodes = {};
        var selectionState = {};
        var treenodeids = [];

        this.getOffset = function(elem) {
            return 0;
        };
        
        this.setSelected = function(ids, mode) {
            if (mode == SELECT_EXCLUSIVE) {
                self.setSelected(self.getSelected(true), DESELECT);
            }
            
            ids.forEach(function(id) {        
                var s = null;
                if (mode == TOGGLE) {
                    s = selectionState[id] = !selectionState[id];
                } else if (mode == SELECT || mode == SELECT_EXCLUSIVE) {
                    s = selectionState[id] = true;
                } else if (mode == DESELECT) {
                    s = selectionState[id] = false;
                }
                if(domNodes[id]){
                    domNodes[id].className = s ? "label selected" : "label";
                }
            });
            
            var desiredViewRange = self.getSelected().map(function(id) {
                return self.getOffset(domNodes[id]);
            });
            
            if (desiredViewRange.length) {
                desiredViewRange.sort()
                desiredViewRange = [desiredViewRange[0], desiredViewRange[desiredViewRange.length-1]];
            
                var domNode = parent.document.getElementById(args['domNode']);
                var currentViewRange = [domNode.scrollTop, domNode.scrollTop + domNode.offsetHeight];
                
                if (!(desiredViewRange[0] >= currentViewRange[0] && desiredViewRange[1] <= currentViewRange[1])) {
                    if ( (desiredViewRange[1] - desiredViewRange[0]) > (currentViewRange[1] - currentViewRange[0]) ) {
                        domNode.scrollTop = desiredViewRange[0];
                    } else {
                        var l = parseInt((desiredViewRange[1] + desiredViewRange[0]) / 2. - (currentViewRange[1] - currentViewRange[0]) / 2., 10);
                        l = Math.max(l, 0);
                        l = Math.min(l, domNode.scrollHeight - domNode.offsetHeight);
                        domNode.scrollTop = l;
                    }
                }
            }
            
            this.fire("selection-changed", [self.getSelected(true)])
        };
        
        this.getSelected = function(b) {
            b = typeof(b) === 'undefined' ? true: !!b;
            var l = [];
            Object.keys(selectionState).forEach(function (k) {
                if (!!selectionState[k] === b) {
                    l.push(k);
                }
            });
            return l;
        };
        
        var models = [];
        
        this.addModel = function(args) {
            models.push(args);
            if (args.src) {
                fromXml = true;
            }
        };
        
        this.qualifyInstance = function(modelId, id) {
            if (fromXml) {
                return id;
            } else {
                return modelId + ":" + id;
            }
        };

        this.parseTreeNodeId = function(id){
            return id.substring(id.indexOf('_')+1, id.lastIndexOf('_'))-1; 
        };

        this.addAction = function(){
            var tree = parent.document.getElementById(args.domNode);
            atags = tree.getElementsByTagName('li');
            atags[0].addEventListener("dblclick", function(e){
                mid = treenodeids[self.parseTreeNodeId(e.target.id)];
                self.setSelected([mid], SELECT_EXCLUSIVE);
                self.fire("click", [mid, self.getSelected(true)]);
            });
        };

        this.build = function() {
            var build = function(modelId, d, n) {
                var qid = self.qualifyInstance(modelId, fromXml ? n.guid : n.id);
                var label = document.createElement("li");
                label.className = "label";
                //console.log((n.children || []).length);
                label.appendChild(document.createTextNode(n.name!==''?n.name:'Unknown'));
                label.setAttribute('data-jstree', '{ "opened" : true }');
                if((n.children || []).length===0){
                    label.setAttribute('data-jstree', '{ "icon" : "/bimsurfer/examples/css/icon.png" }');
                }
                d.appendChild(label);
                domNodes[qid] = label;
                treenodeids.push(qid);
                
                for (var i = 0; i < (n.children || []).length; ++i) {
                    if((n.children || []).length===0)
                        build(modelId, d, n);
                    var child = n.children[i];
                    if (fromXml) {
                        if (child["xlink:href"]) continue;
                        if (child.type === "IfcOpeningElement") continue;
                    }
                    var d2 = document.createElement("ul");
                    d2.className = "item";
                    label.appendChild(d2);
                    build(modelId, d2, child);
                }
            };
            models.forEach(function(m) {
                var d = document.createElement("ul");
                d.className = "item";
                if (m.tree) {
                    build(m.id, d, m.tree);
                } else if (m.src) {
                    Request.Make({url: m.src}).then(function(xml) {
                        var json = Utils.XmlToJson(xml, {'Name': 'name', 'id': 'guid'});
                        var project = Utils.FindNodeOfType(json.children[0], "decomposition")[0].children[0];
                        build(m.id || i, d, project);
                    });
                }
                parent.document.getElementById(args.domNode).appendChild(d);
            });
        };
        
    }
    
    DynamicTreeRenderer.prototype = Object.create(EventHandler.prototype);

    return DynamicTreeRenderer;
    
});