'use strict';

angular.module('sharedVideo').component('sharedVideo', {
    templateUrl: 'shared-video/shared-video.template.html',
    controller: ['$http', '$timeout', '$routeParams',
        function SharedScreenController($http, $timeout, $routeParams) {
            var self = this;
            self.currentIdDevice = null;
            self.currentImei = null;
            self.currentIdDevice = $routeParams.id;
            // web sockets code
            self.options = {
                secure: false,
                hostname: window.__env.webSocketIp,
                port: window.__env.webSocketPort
            };
            self.socket = socketCluster.connect(self.options);
            self.socket.on('connect', function () {
                self.cameraChannel = self.socket.subscribe("camera_channel");
                self.cameraVideoChannel = self.socket.subscribe("camera_" + self.currentIdDevice + "_channel");
                self.cameraChannel.publish({ type: 'start-streaming', message: 'enviado desde la web', id: self.currentIdDevice });
                self.cameraVideoChannel.watch(function(data) {
                    // console.log("camera video in: ", data);
                    let base64Start = "data:image/jpeg;base64, ";
                    var imgElem = document.getElementById("cameraImage");
                    imgElem.setAttribute("src", base64Start + data.image);
                });
            });


        }
    ]
});
