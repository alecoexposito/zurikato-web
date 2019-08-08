'use strict';

// Register `deviceHistorical` component, along with its associated controller and template
angular.module('deviceCameras').component('deviceCameras', {
    templateUrl: 'device-cameras/device-cameras.template.html',
    controller: ['Device', '$http', '$timeout', '$routeParams',
        function DeviceCamerasController(Device, $http, $timeout, $routeParams) {
            var self = this;
            self.init = function init() {
                self.options = {
                    secure: false,
                    hostname: window.__env.webSocketIp,
                    port: window.__env.webSocketPort
                };
                self.socket = socketCluster.connect(self.options);
                // $localStorage.socket = socket;
                self.socket.on('connect', function () {
                    console.log("socket connected");
                    self.cameraVideoChannel = self.socket.subscribe("camera_" + $routeParams.deviceId + "_channel");
                    self.cameraVideoChannel.watch(function(data) {
                        console.log("en el video channel all:  ", data);
                        if(data.image) {
                            self.cameraVideoChannel.publish({
                                type: 'feedback',
                                idCamera: data.idCamera
                            });

                            // console.log("camera video in: ", data);
                            let base64Start = "data:image/jpeg;base64, ";
                            var imgElem = document.getElementById("camera-" + data.idCamera);
                            if(imgElem)
                                imgElem.setAttribute("src", base64Start + data.image);
                        }
                    });
                });
                self.socket.on('error', function(e) {
                    console.log("error connecting: ", e);
                });


            };
            jQuery(document).ready(function(){
                self.init();
            });

        }
    ]
});
