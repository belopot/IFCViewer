define(["../../../lib/xeogl"], function () {

    "use strict";

    xeogl.HighlightEffect = xeogl.Component.extend({

        type: "xeogl.HighlightEffect",

        _init: function (cfg) {
            // this._emissiveColor = (cfg.color || [0.2, 0.9, 0.2]).slice(0,3);
            // this._opacity = cfg.color && cfg.color.length > 3 ? cfg.color[3] : 0.25;

            this.highlightedBimObjects = [];
            this.cntHighlightedBimObject = 0;
        },

        add: function (bimObject) {
            this.highlightedBimObjects[this.cntHighlightedBimObject] = [];
            var entities = bimObject.entities;
            //console.log(entities);
            if (entities) {
                for (var i = 0, len = entities.length; i < len; i++) {
                    entities[i].highlighted = true;
                    this.highlightedBimObjects[this.cntHighlightedBimObject][i] = entities[i];
                }
                this.cntHighlightedBimObject++;
            }
        },

        clear: function () {

            for(var i=0; i < this.cntHighlightedBimObject; i++){
                for(var j=0, len = this.highlightedBimObjects[i].length; j<len; j++){
                    this.highlightedBimObjects[i][j].highlighted = false;
                }
            }
            this.highlightedBimObjects = [];
            this.cntHighlightedBimObject = 0;
        },
    });
});
