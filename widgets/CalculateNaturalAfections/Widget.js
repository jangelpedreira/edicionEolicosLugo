///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
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
define(['dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'dijit/form/NumberTextBox',
  'dijit/form/NumberSpinner',
  'dijit/form/ComboBox',
  'dijit/form/TextBox',
  'dijit/form/Textarea',
  'dijit/form/Select',
  'dojo/dom',
  'dojo/dom-attr',
  'dojo/_base/json',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/dom-style',
  'dojo/on',
  'esri/tasks/Geoprocessor',
  'esri/tasks/JobInfo',
  'esri/request'
],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, NumberTextBox,
    NumberSpinner, ComboBox, TextBox, Textarea, Select, dom, domAttr, dojoJson,
    html, lang, domStyle, on, Geoprocessor, JobInfo, esriRequest) {

    var urlServicioGeoprocSincrono = "https://localhost:6443/arcgis/rest/services/Geoprocesamiento/calcularAfeccionesAmbientalesSincrono/GPServer/Calcular%20afecciones%20ambientales%20de%20las%20infraestructuras%20de%20parques%20e%C3%B3licos";
    var urlServicioGeoprocAsincrono = "https://localhost:6443/arcgis/rest/services/Geoprocesamiento/calcularAfeccionesAmbientalesAsincrono/GPServer/Calcular%20afecciones%20ambientales%20de%20las%20infraestructuras%20de%20parques%20e%C3%B3licos";

    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-calculateNaturalAfections',

      //this property is set by the framework when widget is loaded.
      name: 'CalculateNaturalAfections',
      symbol: null,

      //methods to communication with app container:

      postCreate: function () {
        console.log("IN -- postCreate");
        this.inherited(arguments);
        console.log("OUT -- postCreate");
      },

      setTipoInfraestructura: function (event) {
        console.log("IN -- setTipoInfraestructura");
        var tipoInfraestructura = this.comboTiposInfraest.value;
        console.log("Tipo infraestructura: " + tipoInfraestructura);
        if (tipoInfraestructura == "LINA") {
          // Ocultar el parámetro Expediente
          dojo.byId("rowDistanciaBuffer").style.display = "none";
        }
        else {
          // Mostrar el parámetro Expediente
          dojo.byId("rowDistanciaBuffer").style.display = "flex"
        }

        console.log("OUT -- setTipoInfraestructura");
      },

      setExpedientes: function (event) {
        console.log("IN -- setExpedientes");
        var calculoExpedientes = this.comboExpedientes.value;
        console.log("Afecciones para: " + calculoExpedientes);
        if (calculoExpedientes == "Todos los expedientes")
          // Ocultar el parámetro Expediente
          dojo.byId("rowExpediente").style.display = "none";
        else
          // Mostrar el parámetro Expediente
          dojo.byId("rowExpediente").style.display = "flex"
        //domStyle.set(this.txtDistanciaBuffer, "display","visible");

        console.log("OUT -- setExpedientes");
      },

      setCalculoAfecciones: function (value) {
        console.log("IN -- setCalculoAfecciones");
        console.log("Cálculo de las afecciones para: " + value);
        console.log("OUT -- setCalculoAfecciones")
      },

      calcularAfecciones: function () {
        console.log("IN -- calcularAfecciones");

        var that = this;

        dojo.byId('estadoGeoproceso').textcontent = "";
        dojo.byId('resultadoGeoproceso').textcontent = "";

        // Obtenemos la referencia al formulario
        var form = this.formulario;

        // Validamos los datos introducidos por el usuario en el formulario
        if (form.validate()) {
          // Los datos introducidos son válidos
          console.log("Los datos del formulario son válido");

          // Se obtienen los valores de la longitud, latitud y radio introducidos en el formulario
          var tipoInfraestructura = this.comboTiposInfraest.value;
          console.log("Tipo de infraestructura: " + tipoInfraestructura);
          var expedientesCalculo = this.comboExpedientes.value;
          console.log("Afecciones para: " + expedientesCalculo);
          var numExpediente = null;
          if (expedientesCalculo == "Un expediente")
            numExpediente = this.txtExpediente.value;
          console.log("Expediente: " + numExpediente);
          var distanciaBuffer = null;
          if (tipoInfraestructura == "PARQUE")
            distanciaBuffer = this.txtDistanciaBuffer.value;
          console.log("Distancia buffer: " + distanciaBuffer);
          var operacion = "CONSULTAR_AFECCIONES";
          console.log("Operación: " + operacion);
          //var tipoPatrimonio = this.comboTiposPatrimonio.value;
		  var tipoPatrimonio = "AMBIENTAL"
          //console.log("Tipo de patrimonio " + tipoPatrimonio);

          var tipoGeoproceso = "ASINCRONO";

          // Deshabilitar los controles del formulario
          this.disableFormElements();

          if (tipoGeoproceso == 'ASINCRONO') {

            var urlServicio = urlServicioGeoprocAsincrono;
            this.gp = new Geoprocessor(urlServicio);

            var params = {
              "tipoInfraestructura": tipoInfraestructura,
              "numExpediente": numExpediente,
              "distanciaBuffer": distanciaBuffer,
              "operacion": operacion,
              "tipoPatrimonio": tipoPatrimonio
            };

            console.log("Ejecutar geoproceso: " + this.gp.url + " - Parámetros: " + params);
            this.estadoGeoproceso.textContent = "Procesando ...."
            
            //gp.execute(params, mostrarResultados);
            this.gp.submitJob(params);
     
            //Fires when a synchronous GP task is completed
            this.own(on(this.gp, 'execute-complete', lang.hitch(this, this.onExecuteComplete)));

            //Fires when an asynchronous GP task using submitJob is complete.
            this.own(on(this.gp, 'job-complete', lang.hitch(this, this.onJobComplete)));

            this.own(on(this.gp, 'job-cancel', lang.hitch(this, this.onJobCancel)));

            //Fires when a job status update is available.
            this.own(on(this.gp, 'status-update', lang.hitch(this, this.onStatusUpdate)));

            //Fires when the result of an asynchronous GP task execution is available.
            this.own(on(this.gp, 'get-result-data-complete', lang.hitch(this, this.onGetResultDataComplete)));

            this.own(on(this.gp, 'error', lang.hitch(this, this.onError)));
          }
          else {
            var urlServicio = urlServicioGeoprocSincrono;

            this.gp = new Geoprocessor(urlServicio);

            var params = {
              "tipoInfraestructura": tipoInfraestructura,
              "numExpediente": numExpediente,
              "distanciaBuffer": distanciaBuffer,
              "operacion": operacion,
              "tipoPatrimonio": tipoPatrimonio
            };

            console.log("Ejecutar geoproceso: " + this.gp.url + " - Parámetros: " + params);
          
            this.estadoGeoproceso.textContent = "Procesando ...."

            this.gp.execute(params, mostrarResultados, errorCallback);

            function errorCallback(error) {
              console.log("IN -- errorCallback (Geoproceso síncrono");
              this.estadoGeoproceso.textContent = error.message;
              this.estadoGeoproceso.style.color = "red";
              console.log(error.message);
              
              this.resultadoGeoproceso.textContent = error;
              dojo.byId("resultadoGeoproceso").style.color = "red";
              console.log("OUT -- errorCallback (Geoproceso síncrono)");
            }

            function mostrarResultados(results, messages) {
              var mensaje = "";
              mensaje = "Geoproceso finalizado correctamente";
              console.log(mensaje);
              this.estadoGeoproceso.textContent = mensaje;
              console.log("Nº de entidades: " + results.length);

              if (results.length > 0) {
                for (i = 0; i < results.length; i++) {
                  mensaje = "Nº de afecciones calculadas: " + results[i].value.features.length
                  console.log(mensaje);
                  this.resultadoGeoproceso.textContent = mensaje;
                  for (j = 0; j < results[i].value.features.length; j++) {
                    console.log("Feature " + j + ":" + results[i].value.features[j]);
                  }
                }
                console.log("Resultado: \n" + dojoJson.toJson(results, true));
              } else {
                mensaje = "No se ha calculado ninguna afección";
                console.log(mensaje);
                this.resultadoGeoproceso.textContent = mensaje;
              }
              //do something with the results
              console.log("Mensajes: " + messages);
            }
          }
        } else {
          // Los datos introducidos NO son válidos 
          console.log("Los datos del formulario NO son válidos");
        }

        console.log("OUT -- calcularAfecciones");
      },

      // Función de callback, que se invoca cada cierto tiempo para mostrar
      // el estado del geoproceso
      onStatusUpdate: function (jobInfo) {
        console.log("IN -- oStatusUpdate");

        console.log(jobInfo.jobInfo.jobStatus);
        console.log(jobInfo.jobInfo.jobId);
        var mensajeStatus = '';
        switch (jobInfo.jobInfo.jobStatus) {
          case JobInfo.STATUS_CANCELLED:
            mensajeStatus = "El geoproceso ha sido cancelado.";
            break;
          case JobInfo.STATUS_CANCELLING:
            mensajeStatus = "El geoproceso está siendo cancelado.";
            break;
          case JobInfo.STATUS_DELETED:
            mensajeStatus = "El geoproceso ha sido borrado.";
            break;
          case JobInfo.STATUS_DELETING:
            mensajeStatus = "El geoproceso está siendo borrado.";
            break;
          case JobInfo.STATUS_EXECUTING:
            mensajeStatus = "Procesando ....";
            break;
          case JobInfo.STATUS_FAILED:
            mensajeStatus = "El geoproceso ha fallado.";
            break;
          case JobInfo.STATUS_NEW:
            mensajeStatus = "El geoproceso es nuevo.";
            break;
          case JobInfo.STATUS_SUBMITTED:
            mensajeStatus = "Los datos se han enviado al geoproceso para su ejecución.";
            break;
          case JobInfo.STATUS_SUCCEEDED:
            mensajeStatus = "El geoproceso ha finalizado correctamente."
            break;
          case JobInfo.STATUS_TIMED_OUT:
            mensajeStatus = "El geoproceso ha superado el tiempo de ejecucuón."
            break;
          case JobInfo.STATUS_WAITING:
            mensajeStatus = "El geoproceso está esperando a ser atendido."
            break;
        }
        console.log("Estado: " + mensajeStatus);

        this.estadoGeoproceso.textContent = mensajeStatus;
        console.log("OUT -- onStatusUpdate");
      },

      onJobCancel: function () {
        console.log("IN -- onJobCancel");
        mensaje = "El geoproceso ha sido cancelado";
        console.log("Resultado: " + mensaje);
        this.resultadoGeoproceso.textContent = mensaje;
        this.enableFormElements();
        console.log("OUT -- onJobCancel");
      },

      onError: function(error) {
        console.log("IN -- onError");
        console.log("Error: " + error.error.message);
        this.resultadoGeoproceso.textContent = error.error.message;
        this.enableFormElements();
        console.log("OUT -- onError");
      },

      onJobComplete: function(jobInfo) {
        console.log("IN -- onJobComplete");
        this.enableFormElements();
        this.gp.getResultData(jobInfo.jobInfo.jobId, "result");
        console.log("OUT -- onJobComplete");
      },

      onGetResultDataComplete: function(result) {
        console.log("IN -- onGetResultDataComplete");
        console.log("Geoproceso finalizado correctamente");
        var mensaje = "Número de afecciones calculadas: " + result.result.value.features.length;
        console.log(mensaje);
        console.log("Resultado: \n" + dojoJson.toJson(result.result.value.features, true));
        dojo.byId('resultadoGeoproceso').textContent = mensaje;
        console.log("OUT -- onGetResultDataComplete");
      },

      enableFormElements: function () {
        console.log("IN -- enableFormElements");
        html.removeClass("comboTiposInfraest", 'jimu-state-disabled');
        html.removeClass("comboExpedientes", 'jimu-state-disabled');
        html.removeClass("txtExpediente", 'jimu-state-disabled');
        html.removeClass("txtDistanciaBuffer", 'jimu-state-disabled');
        html.removeClass("btnCalcularAfecciones", 'jimu-state-disabled');
        console.log("OUT -- enableFormElements");
      },
      
      disableFormElements: function () {
        console.log("IN -- disableFormElements");
        html.addClass("comboTiposInfraest", 'jimu-state-disabled');
        html.addClass("comboExpedientes", 'jimu-state-disabled');
        html.addClass("txtExpediente", 'jimu-state-disabled');
        html.addClass("txtDistanciaBuffer", 'jimu-state-disabled');
        html.addClass("btnCalcularAfecciones", 'jimu-state-disabled');
        console.log("OUT -- disableFormElements");
      },

      // startup: function() {
      //  this.inherited(arguments);
      //  this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      //  console.log('startup');
      // },

      // onOpen: function(){
      //   console.log('onOpen');
      // },

      onClose: function () {
      console.log('IN --onClose');

      // Al cerrar el widget, se elimina el círculo que se hubiera dibujado previamente
      //this.map.graphics.clear();

      console.log("OUT --onClose");
    },

      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }
      //methods to communication between widgets:

    });
  });