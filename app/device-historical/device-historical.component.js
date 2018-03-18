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
            self.initMap = function initMap() {
                var pointA = new google.maps.LatLng(51.7519, -1.2578),
                    pointB = new google.maps.LatLng(50.8429, -0.1313),
                    myOptions = {
                        zoom: 7,
                        center: pointA
                    },
                    map = new google.maps.Map(document.getElementById('map-canvas'), myOptions),
                    // Instantiate a directions service.
                    directionsService = new google.maps.DirectionsService,
                    directionsDisplay = new google.maps.DirectionsRenderer({
                        map: map,
                        suppressMarkers: true
                    }),
                    markerA = new google.maps.Marker({
                        position: pointA,
                        title: "point A",
                        label: "A",
                        map: map
                    }),
                    markerB = new google.maps.Marker({
                        position: pointB,
                        title: "point B",
                        label: "B",
                        map: map
                    });

                // get route from A to B
                self.calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB);

            };



            self.calculateAndDisplayRoute = function calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB) {

                console.log("pointA: " + pointA);
                console.log("pointB: " + pointB);
                directionsService.route({
                    origin: pointA,
                    destination: pointB,
                    travelMode: google.maps.TravelMode.DRIVING
                }, function(response, status) {

                    // var coordLat = response.routes[0].overview_path[100].lat();
                    // var coordLng = response.routes[0].overview_path[100].lng();
                    // var pointC = new google.maps.LatLng(parseFloat(coordLat), parseFloat(coordLng));
                    // console.log(coordLat + ", " + coordLng);

                    if (status == google.maps.DirectionsStatus.OK) {
                        for(var k = 0; k < response.routes[0].overview_path.length; k++){
                            var coordLat = response.routes[0].overview_path[k].lat();
                            var coordLng = response.routes[0].overview_path[k].lng();
                            var point = new google.maps.LatLng(parseFloat(coordLat), parseFloat(coordLng));
                            self.coordinates.push(point);
                            google.maps.event.trigger(self.map, 'resize');
                        }
                        // directionsDisplay.setDirections(response);
                    } else {
                        console.log('Directions request failed due to ' + status);
                    }
                });
            };

            // initMap();











            self.wayPoints = [
                { location: { lat:19.28765111111111, lng: -99.58733333333333}, stopover: true},
                { location: { lat:19.289728888888888, lng: -99.59220444444445}, stopover: true}
            ];
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
            }
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
                // if(historical[pos].lat === undefined)
                //     continue;
                    // location = {
                    //     lat: parseFloat(historics[j].lat),
                    //     lng: parseFloat(historics[j].lng)
                    // };

                    var point = [parseFloat(historical[pos].lat), parseFloat(historical[pos].lng)];
                    self.coordinates.push(point);

                google.maps.event.trigger(self.map, 'resize');

                // if(historics[j].lat === undefined)
                //     continue;

                // var pointA = new google.maps.LatLng(parseFloat(historical[pos].lat), parseFloat(historical[pos].lng));
                // var pointB = new google.maps.LatLng(parseFloat(historical[pos+1].lat), parseFloat(historical[pos+1].lng));
                // self.calculateAndDisplayRoute(self.directionsService, self.directionsDisplay, pointA, pointB);

                $timeout(function() {
                        self.drawHistorical(historical, pos + 1);
                }, 800);
            }
            var historical = $http.get('http://189.207.202.64:3007/api/v1/devices/' + $routeParams.deviceId + '/history?start_date=2018-03-15%2007:20:00&end_date=2018-03-15%2014:20:00')
            historical.then(function(result) {
                var historics = result.data;
                self.drawHistorical(historics, 0);
                // var coordinates = [];
                // var location = {};
                // for(var j = 0; j < historics.length -1; j++){
                //     if(historics[j].lat === undefined)
                //         continue;
                //     var pointA = new google.maps.LatLng(parseFloat(historics[j].lat), parseFloat(historics[j].lng));
                //     var pointB = new google.maps.LatLng(parseFloat(historics[j+1].lat), parseFloat(historics[j+1].lng));
                //     self.calculateAndDisplayRoute(self.directionsService, self.directionsDisplay, pointA, pointB);
                // }



                // self.originLocation = historics[0].lat + ", " + historics[0].lng;
                // self.destinationLocation = historics[historics.length-1].lat + ", " + historics[historics.length-1].lng;
                // self.coordinates = coordinates;
                // console.log(self.coordinates);
                // console.log(self.wayPoints);
            });
        }
    ]
});
