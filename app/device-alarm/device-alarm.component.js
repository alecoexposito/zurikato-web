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
            // self.label = $routeParams.label;
            self.coordinates = [];
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
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
