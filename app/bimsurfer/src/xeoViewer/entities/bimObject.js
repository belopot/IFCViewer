define(["../../../lib/xeogl"], function () {

    "use strict";

    /**
     Custom xeoEngine component that represents a BIMSurfer object within a xeoEngine scene.

     An object consists of a set of xeogl.Entity's that share components between them.

     The components control functionality for the Entity's as a group, while the Entity's
     themselves each have their own xeogl.Geometry.

     This way, we are able to have BIM objects containing multiple geometries.

     @class BIMObject
     @module XEO
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
     @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this xeogl.BIMObject.
     @extends Component
     */
    xeogl.BIMObject = xeogl.Component.extend({

        /**
         JavaScript class name for this xeogl.BIMObject.

         @property type
         @type String
         @final
         */
        type: "xeogl.BIMObject",

        // Constructor

        _init: function (cfg) {

            // Model this object belongs to, will be null when no model
            this.model = cfg.model; // xeogl.BIMModel

            // Modelling transform component
            this.transform = this.create({
                type: "xeogl.Transform",// http://xeoengine.org/docs/classes/Transform.html
                matrix: cfg.matrix
            });

            // Visibility control component.
            // this.visibility = this.create({
            //     type: "xeogl.Visibility", // http://xeoengine.org/docs/classes/Visibility.html
            //     visible: true
            // });

            // Material component
            this.material = this.create({
                type: "xeogl.PhongMaterial", // http://xeoengine.org/docs/classes/Material.html
                diffuse: [Math.random(), Math.random(), Math.random()], // Random color until we set for type
                alpha: 1.0,
                alphaMode: "opaque",
                backfaces: true
            });

            this.ghostMaterial = this.create({
                type: "xeogl.EmphasisMaterial",
                edges: false,
                edgeAlpha: 1.0,
                edgeColor: [0.227451, 0.227451, 0.227451],
                edgeWidth: 2,
                vertices: false,
                vertexAlpha: 1.0,
                vertexColor: [0.6, 1.0, 0.6],
                vertexSize: 10,
                fill: true,
                fillColor: [0,0,0],
                fillAlpha: 1
            });

            this.highlightMaterial = this.create({
                type: "xeogl.EmphasisMaterial",
                edges: true,
                edgeAlpha: 1.0,
                edgeColor: [0, 0, 1],
                edgeWidth: 2,
                vertices: true,
                vertexAlpha: 1.0,
                vertexColor: [0, 0, 1],
                vertexSize: 5,
                fill: true,
                fillColor: [0, 0, 1],
                fillAlpha: 0.7
            });

            // Create a xeogl.Entity for each xeogl.Geometry
            // Each xeogl.Entity shares the components defined above

            // TODO: If all geometries are of same primitive, then we can combine them

            this.entities = [];
            var entity;

            // console.log("ddd",cfg.geometryIds);
            for (var i = 0, len = cfg.geometryIds.length; i < len; i++) {
                entity = this.create({ // http://xeoengine.org/docs/classes/Entity.html
                    type: "xeogl.Entity",
                    meta: {
                        objectId: this.id
                    },
                    geometry: "geometry." + cfg.geometryIds[i],
                    transform: this.transform,
                    visible: true,
                    material: this.material,
                    ghostMaterial: this.ghostMaterial,
                    ghosted: true,
                    highlightMaterial: this.create({
                        type: "xeogl.EmphasisMaterial",
                        edges: true,
                        edgeAlpha: 1.0,
                        edgeColor: [0, 0, 1],
                        edgeWidth: 2,
                        vertices: true,
                        vertexAlpha: 1.0,
                        vertexColor: [0, 0, 1],
                        vertexSize: 5,
                        fill: true,
                        fillColor: [0, 0, 1],
                        fillAlpha: 0.7
                    }),
                    highlighted: false,
                    layer: 3
                });

                this.entities.push(entity);
            }
        },
        
        add: function(geometryId){
            // console.log(ddd,geometryId);
            var entity = this.create({ // http://xeoengine.org/docs/classes/Entity.html
                type: "xeogl.Entity",
                meta: {
                    objectId: this.id
                },
                geometry: "geometry." + geometryId,
                transform: this.transform,
                visible: true,
                material: this.material,
                ghostMaterial: this.ghostMaterial,
                ghosted: true,
                highlightMaterial: this.create({
                    type: "xeogl.EmphasisMaterial",
                    edges: true,
                    edgeAlpha: 1.0,
                    edgeColor: [0, 0, 1],
                    edgeWidth: 2,
                    vertices: true,
                    vertexAlpha: 1.0,
                    vertexColor: [0, 0, 1],
                    vertexSize: 5,
                    fill: true,
                    fillColor: [0, 0, 1],
                    fillAlpha: 0.7
                }),
                highlighted: false,
                layer: 3
            });

            this.entities.push(entity);
        },

        // Define read-only properties of xeogl.BIMObject

        _props: {

            // World-space bounding volume
            // worldBoundary: {
            //     get: function () {
            //         return this.entities[0].worldBoundary
            //     }
            // },
        }
    });
});
