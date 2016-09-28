///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/aspect',
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/portalUtils',
    'jimu/dijit/Message',
    'esri/units',
    'esri/dijit/Measurement',
    "esri/symbols/jsonUtils"
  ],
  function(
    declare,
    lang,
    aspect,
    Deferred,
    _WidgetsInTemplateMixin,
    BaseWidget,
    PortalUtils,
    Message,
    esriUnits,
    Measurement,
    jsonUtils) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'Measurement',
      measurement: null,
      _pcDef: null,

      startup: function() {
        // start the widget
        if (this.measurement || this._pcDef) {
          return;
        }
        this.inherited(arguments);

        var json = this.config.measurement;

        json.map = this.map;
        if (json.lineSymbol) {
          json.lineSymbol = jsonUtils.fromJson(json.lineSymbol);
        }
        if (json.pointSymbol) {
          json.pointSymbol = jsonUtils.fromJson(json.pointSymbol);
        }

        this._processConfig(json).then(lang.hitch(this, function(measurementJson) {
          
          this.measurement = new Measurement(measurementJson, this.measurementDiv);

          this.own(aspect.after(this.measurement, 'setTool', lang.hitch(this, function() {
            
            if (this.measurement.activeTool) {
              this.disableWebMapPopup();              
            } else {
              this.enableWebMapPopup();
            }
          })));

          this.measurement.startup();
          // catch the measurement result
          this.measurement.on("measure", function(evt){            
            document.getElementsByClassName('dijitContentPane result')[0].innerHTML = "";
            if(evt.toolName == "area"){
              var outputArea = "<i>Roman (actus quadratus): </i>" + (evt.values* 0.000793651).toFixed(3) + "<br/><i>Square Meter: </i>" + evt.values.toFixed(3) + "<br/><i>Hectares: </i>" + (evt.values/10000).toFixed(3) +  "<br/><i>Acres: </i>" + (evt.values * 0.00024711).toFixed(3);
              document.getElementsByClassName('dijitContentPane result')[0].innerHTML = outputArea;
            }
            else{
              console.log(evt)
              document.getElementsByClassName('dijitContentPane result')[0].style.display = "none";
            }                       
          });

          this.measurement.on("measure-start", function(evt){                        
            if(evt.toolName == "distance"){
              document.getElementsByClassName('dijitContentPane result')[0].style.display = "none";
            }
          });

          this.measurement.on("measure-end", function(evt){
            //this.setTool(evt.toolName, false);
            document.getElementsByClassName('dijitContentPane result')[0].innerHTML = "";
            if(evt.toolName == "area"){              
              var outputArea = "<i>Roman (actus quadratus): </i>" + (evt.values* 0.000793651).toFixed(3) + "<br/><i>Square Meter: </i>" + evt.values.toFixed(3) + "<br/><i>Hectares: </i>" + (evt.values/10000).toFixed(3) +  "<br/><i>Acres: </i>" + (evt.values * 0.00024711).toFixed(3);
              document.getElementsByClassName('dijitContentPane result')[0].innerHTML = outputArea;
            }
            else{              
              document.getElementsByClassName('dijitContentPane result')[0].style.display = "inline";
              outputDistance = "<i>Roman Foot (Pes): </i>" + (evt.values/ 0.296).toFixed(3) + "<br/><i>Roman Mile </i>: " +  (evt.values/ 1480).toFixed(3) + "<br/><i>Gallic Leuga: </i>" +  (evt.values/ 2200).toFixed(3) + "<br /><i>Byzantine foot: </i>" + (evt.values/ 0.3123).toFixed(3) + "<br /><i>Byzantine Mile: </i>" + (evt.values/ 1581).toFixed(3) + "<br /><i>Meters: </i>" + (evt.values).toFixed(3);
              document.getElementsByClassName('dijitContentPane result')[0].innerHTML = outputDistance;
            }            
          });

        }), lang.hitch(this, function(err) {
          new Message({
            message: err.message || err
          });
        }));
      },

      _processConfig: function(configJson) {
        this._pcDef = new Deferred();
        if (configJson.defaultLengthUnit && configJson.defaultAreaUnit) {
          this._pcDef.resolve(configJson);
        } else {
          PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function(units) {
            configJson.defaultAreaUnit = units === 'english' ?
              esriUnits.SQUARE_MILES : esriUnits.SQUARE_KILOMETERS;
            configJson.defaultLengthUnit = units === 'english' ?
              esriUnits.MILES : esriUnits.KILOMETERS;
            this._pcDef.resolve(configJson);
          }), lang.hitch(this, function(err) {
            console.error(err);
            configJson.defaultAreaUnit = esriUnits.SQUARE_MILES;
            configJson.defaultLengthUnit = esriUnits.MILES;
            this._pcDef.resolve(configJson);           
          }));
        }

        return this._pcDef.promise;
      },



      disableWebMapPopup: function() {
        this.map.setInfoWindowOnClick(false);

      },

      enableWebMapPopup: function() {
        this.map.setInfoWindowOnClick(true);

      },

      onDeActive: function() {
        this.onClose();
      },

      onClose: function() {
        if (this.measurement && this.measurement.activeTool) {
          this.measurement.clearResult();
          this.measurement.setTool(this.measurement.activeTool, false);
        }
      },

      destroy: function() {
        if (this.measurement) {
          this.measurement.destroy();
        }
        this.inherited(arguments);
      }
    });
    return clazz;
  });