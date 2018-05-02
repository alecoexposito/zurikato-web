'use strict';

angular.module('deviceAlarm').component('deviceAlarm', {
    templateUrl: 'device-alarm/device-alarm.template.html',
    controller: ['Device', '$http', '$timeout', 'NgMap', '$routeParams',
        function DeviceAlarmController(Device, $http, $timeout, NgMap, $routeParams) {
            var self = this;
            var map = null;
            var pos = null;
            self.latitude = $routeParams.latitude;
            self.longitude = $routeParams.longitude;
            self.imei = $routeParams.imei;
            self.m = null;
            // self.label = $routeParams.label;
            self.coordinates = [];
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.options = {
                secure: false,
                hostname: "189.207.202.64",
                port: 3001
            };
            console.log("Trying to connect");
            self.socket = socketCluster.connect(self.options);
            self.socket.on('connect', function () {
                console.log('CONNECTED');
                console.log(self.socket.state);
            });
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
                    console.log("creating the marker for alarm");
                    self.m = new google.maps.Marker({
                        position: new google.maps.LatLng(self.latitude,self.longitude),
                        map: self.map,
                        title: self.imei,
                        // id: device.idDevice,
                        imei: self.imei,
                        icon: "/img/car-marker48.png",
                    });
                    console.log("matching device for alarm");
                    var g = self.socket.subscribe(self.imei);
                    g.watch(function(data) {
                        if(self.m != null) {
                            self.m.setPosition(new google.maps.LatLng( data.latitude,data.longitude));
                        }
                    });

                    return map;
                });
            };
            // self.displayHideMenu = function displayHideMenu() {
            //     $("#left-menu").toggle("fast");
            // };
            // self.findMarkerByImei = function findMarkerByImei(imei) {
            //     var markers = self.map.markers;
            //     console.log(markers);
            //     if(markers == undefined)
            //         return false;
            //     for (var k = 0; k < markers.length; k++) {
            //         var m = markers[k];
            //         if(m.imei = imei)
            //             return m;
            //     }
            //     return false;
            // };
            self.getMap();
        }
    ]
});
