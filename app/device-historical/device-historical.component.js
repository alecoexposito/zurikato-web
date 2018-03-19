'use strict';

// Register `deviceHistorical` component, along with its associated controller and template
angular.module('deviceHistorical').component('deviceHistorical', {
    templateUrl: 'device-historical/device-historical.template.html',
    controller: ['Device', '$http', '$timeout', 'NgMap', '$routeParams',
        function DeviceHistoricalController(Device, $http, $timeout, NgMap, $routeParams) {
            var self = this;
            var map = null;
            var pos = null;
            self.coordinates = [];
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    // console.log(map.getCenter());
                    // console.log('shapes', map.shapes);
                    self.map = map;
                    // self.directionsService = new google.maps.DirectionsService({
                    //     map: self.map
                    // });
                    // self.directionsDisplay = new google.maps.DirectionsRenderer({
                    //     map: map,
                    //     suppressMarkers: true
                    // });
                    return map;
                });
            };
            self.displayHideMenu = function displayHideMenu() {
                $("#left-menu").toggle("fast");
            };
            self.findMarkerByImei = function findMarkerByImei(imei) {
                var markers = self.map.markers;
                console.log(markers);
                if(markers == undefined)
                    return false;
                for (var k = 0; k < markers.length; k++) {
                    var m = markers[k];
                    if(m.imei = imei)
                        return m;
                }
                return false;
            };
            self.getMap();
            self.drawHistorical = function drawHistorical(historical, pos){

                var len = historical.length;
                if(pos == len)
                    return;

                var point = [parseFloat(historical[pos].lat), parseFloat(historical[pos].lng)];
                self.coordinates.push(point);

                google.maps.event.trigger(self.map, 'resize');

                $timeout(function() {
                        self.drawHistorical(historical, pos + 1);
                }, 500);
            }
            var historical = $http.get('http://189.207.202.64:3007/api/v1/devices/' + $routeParams.deviceId + '/history?start_date=' + $routeParams.start + '&end_date=' + $routeParams.end)
            historical.then(function(result) {
                var historics = result.data;
                if(historics == "") {
                    alert("This device has no activity");
                    return;
                }
                self.drawHistorical(historics, 0);
            });
        }
    ]
});
