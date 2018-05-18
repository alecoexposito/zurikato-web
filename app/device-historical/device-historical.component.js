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

            self.shapeClick = function shapeClick(event ){
                console.log(event);
                // return;
                var minDist = Number.MAX_VALUE;
                var index = -1;
                for (var i=0; i<this.getPath().getLength(); i++){
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(event.latLng, this.getPath().getAt(i));
                    if (distance < minDist) {
                        minDist = distance;
                        index = i;
                    }
                }
                console.log("coordinates closest", self.coordinates[index]);
                var content = "<p style='white-space: nowrap; margin-bottom: 3px;'>Velocidad: " + self.coordinates[index].speed + " </p>" +
                    "<p style='white-space: nowrap; margin-bottom: 3px; mx-1'>Fecha y hora: " + self.coordinates[index].day + "</p>";
                self.infoWindow.setContent(content);
                self.infoWindow.setPosition(event.latLng);
                self.infoWindow.setMap(self.map);
                self.infoWindow.open();

            };

            self.infoWindow = new SnazzyInfoWindow({
                content: 'Nothing to show',
                // marker: m,
                // backgroundColor: m.backgroundColor,
                padding: '4px',
                // openOnMarkerClick: false,
                closeOnMapClick: true,
                closeWhenOthersOpen: true,
                showCloseButton: true,
                // fontColor: 'white',
                maxWidth: 300,
                // maxHeight: 35,
                pointer: '7px',
                // wrapperClass: 'label-window label-' + m.imei
                // disableAutoPan: true
                position: null,
                map: self.map
            });


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
                if(pos == len) {
                    var lastPos = len - 1;
                    var endMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(parseFloat(historical[lastPos].lat),parseFloat(historical[lastPos].lng)),
                        map: self.map,
                        label: 'B',
                        // id: device.idDevice,
                        // imei: device.auth_device,
                        // icon: "/img/car-marker48.png",
                    });
                    return;

                }

                var point = [parseFloat(historical[pos].lat), parseFloat(historical[pos].lng)];
                var pointObj = {
                    day: moment(historical[pos].day, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss"),
                    lat: parseFloat(historical[pos].lat),
                    lng: parseFloat(historical[pos].lng),
                    speed: historical[pos].speed + ' Km/h'
                };
                self.coordinates.push(pointObj);

                google.maps.event.trigger(self.map, 'resize');
                self.drawHistorical(historical, pos + 1);

                // $timeout(function() {
                //         self.drawHistorical(historical, pos + 1);
                // }, 0);
            }
            var historical = $http.get('http://189.207.202.64:3007/api/v1/devices/' + $routeParams.deviceId + '/history?start_date=' + $routeParams.start + '&end_date=' + $routeParams.end)
            historical.then(function(result) {
                var historics = result.data;
                if(historics == "") {
                    alert("This device has no activity");
                    return;
                }
                self.drawHistorical(historics, 0);
                var beginMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat(historics[0].lat),parseFloat(historics[0].lng)),
                    map: self.map,
                    label: 'A',
                    // id: device.idDevice,
                    // imei: device.auth_device,
                    // icon: "/img/car-marker48.png",
                });

            });
        }
    ]
});
