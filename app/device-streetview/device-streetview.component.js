'use strict';

angular.module('deviceList').component('deviceStreetview', {
    templateUrl: 'device-streetview/device-streetview.template.html',
    controller: ['Device', '$http', '$routeParams',
        function DeviceStreetviewController(Device, $http, $routeParams) {
            var self = this;
            console.log("ENTRANDO EN EL COMPONENTE STREETVIEW");
            self.lat = parseFloat($routeParams.latitude);
            self.lng = parseFloat($routeParams.longitude);
            self.rotation = parseFloat($routeParams.rotation);
            self.auth_device = $routeParams.deviceId;
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById('pano'), {
                position: { lat: self.lat, lng: self.lng },
                pov: { heading: parseFloat(self.rotation), pitch: 0 },
                motionTracking: false,
                motionTrackingControl: false,
                linksControl: false
              }
            );
            self.options = {
              secure: false,
              hostname: window.__env.webSocketIp,
              port: window.__env.webSocketPort
            };

            self.socket = socketCluster.connect(self.options);
            self.socket.on('connect', function () {
                console.log('CONNECTED', self);
                var g = self.socket.subscribe(self.auth_device);
                g.watch(function (data) {
                  console.log("actualizando marker: ", data);
                  panorama.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
                  panorama.setPov({ heading: data.orientation_plain, pitch: 0 });
                });
            });




        }
    ]
});
