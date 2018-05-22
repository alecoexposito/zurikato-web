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
            };
            self.rotateMarker = function(m, degrees) {
                var icon2 = m.icon;
                icon2.rotation = degrees;
                m.setIcon(icon2);
            };
            self.playSpeed = 500;
            self.playMarker = null;
            self.speedChangeValue = 100; // 200 milliseconds
            self.playIncreaseSpeed = function playIncreaseSpeed() {
                if(self.playSpeed > 0)
                    self.playSpeed -= self.speedChangeValue;
                console.log("current speed: ", self.playSpeed);
            };
            self.playDecreaseSpeed = function playDecreaseSpeed() {
                self.playSpeed += self.speedChangeValue;
            };
            self.paused = false;
            self.pausedPos = 0;
            self.pausePlay = function pausePlay() {
                self.paused = true;
            }
            self.playHistoricsButton = function playHistoricsButton() {
                    self.paused = false;
                    self.playHistorical(self.historics, self.pausedPos);
                    self.pausedPos = 0;
            };
            self.playHistorical = function playHistorical(historical, pos) {
                var len = historical.length;
                if(pos == len) {
                    return;
                }
                if(self.paused == true) {
                    self.pausedPos = pos;
                    return;
                }
                var position = new google.maps.LatLng(parseFloat(historical[pos].lat),parseFloat(historical[pos].lng));
                var rotation = parseFloat(historical[pos].orientation_plain);
                if(self.playMarker == null) {
                    var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
                    var icon = {
                        path: car,
                        scale: .7,
                        strokeColor: 'white',
                        strokeWeight: .10,
                        fillOpacity: 1,
                        fillColor: '#404040',
                        offset: '1%',
                        rotation: rotation
                        // anchor: new google.maps.Point(10, 0) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
                    };

                    self.playMarker = new google.maps.Marker({
                        position: position,
                        map: self.map,
                        // label: 'P',
                        icon: icon,

                    });
                } else {
                    self.playMarker.setPosition(position);
                    self.rotateMarker(self.playMarker, rotation);
                }
                $timeout(function() {
                        self.playHistorical(historical, pos + 1);
                }, self.playSpeed);
            };
            var historical = $http.get('http://189.207.202.64:3007/api/v1/devices/' + $routeParams.deviceId + '/history?start_date=' + $routeParams.start + '&end_date=' + $routeParams.end)
            self.historics = null;
            historical.then(function(result) {
                self.historics = result.data;
                if(self.historics == "") {
                    alert("This device has no activity");
                    return;
                }
                console.log("historics", self.historics);
                self.drawHistorical(self.historics, 0);
                var beginMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat(self.historics[0].lat),parseFloat(self.historics[0].lng)),
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
