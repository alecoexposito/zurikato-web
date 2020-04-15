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
            self.coordinatesShape = [];
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.geocoder = new google.maps.Geocoder();
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
                    self.map.addListener('click', function() {
                        self.clearClosestMarkers();
                    })
                    return map;
                });
            };

            self.getAllAddresses = function getAllAddresses() {
                var addresses = [];
                var counter = 0;
                for(var i = 0; i < 100; i++) {
                    if(i > 0 && self.coordinates[i].lat == self.coordinates[i-1].lat && self.coordinates[i].lng == self.coordinates[i-1].lng) {
                        addresses.push(addresses[addresses.length - 1]);
                        continue;
                    }

                    var latLng = new google.maps.LatLng(parseFloat(self.coordinates[i].lat),parseFloat(self.coordinates[i].lng));
                    var address = self.getAddressByLocation(latLng);
                    addresses.push(address);
                }
                return addresses;
            };
            self.getAddressByLocation = function getAddressByLocation(latLng) {
                console.log("get address for: ", latLng);
                return new Promise(function(resolve, reject) {
                    self.geocoder.geocode({
                        'latLng': latLng
                    }, function (results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            if (results[0]) {
                                resolve(results[0]);
                            } else {
                                reject(new Error('Couldn\'t find the location '));
                            }
                        } else {
                            console.log(status);
                            reject(new Error('Couldn\'t find the location '));
                        }
                    });
                });

            };

            self.setAddressesToCoordinates = function setAddressesToCoordinates() {
                var addresses = self.getAllAddresses();
                Promise.all(addresses).then(function(values) {
                    console.log("promesas: ", values);
                });
            }

             self.exportToPdf = function exportToPdf() {
                self.drawPoints();
                 $("#pdf-loader").removeClass("fa-file-pdf").addClass("fa-spinner fa-spin");
                 $("#historicControls").hide();
                setTimeout(function() {
                    var pdfCoordinates = [];
                    var lastDay = null;
                    var consec = 1;
                    for(var i = 0; i < self.coordinates.length; i++) {
                        if(lastDay == null || lastDay != self.coordinates[i].day){
                            pdfCoordinates.push("\nFecha: " + self.coordinates[i].day + "\n--------------------------------\n");
                            consec = 1;
                        }
                        var latLngForAddress = new google.maps.LatLng(self.coordinates[i].lat, self.coordinates[i].lng);
                        var address = "por ver";
                        lastDay = self.coordinates[i].day;
                        pdfCoordinates.push(consec + "- Hora: " + self.coordinates[i].time + "     Velocidad: " +  self.coordinates[i].speed + " ");
                        var linkToMap = 'http://www.google.com/maps/place/' + self.coordinates[i].lat + ',' + self.coordinates[i].lng;
                        pdfCoordinates.push({text: ' Ver en mapa \n', link: linkToMap});
                        consec++;
                    }
                    html2canvas(document.querySelector("body"), {
                        useCORS: true,
                        imageTimeout: 30000
                    }).then(canvas => {
                        for(var j = 0; j < self.pointWindows.length; j++)
                            self.pointWindows[j].close();
                        $("#historicControls").show();
                        $("#pdf-loader").removeClass("fa-spinner fa-spin").addClass("fa-file-pdf");
                    var dataUrl = canvas.toDataURL();
                    var docDefinition = { content: [
                            {
                                text: 'Zurikato',
                                style: 'header'
                            },{
                                text: 'Recorrido exportado'
                            },{
                                image: dataUrl,
                                width: '500'
                            },{
                                text: 'Coordenadas',
                                style: 'header'
                            },{
                                text: pdfCoordinates,
                                style: 'small'
                            }
                        ],
                        styles: {
                            header: {
                                fontSize: 18,
                                bold: true
                            },
                            subheader: {
                                fontSize: 15,
                                bold: true
                            },
                            quote: {
                                italics: true
                            },
                            small: {
                                fontSize: 8
                            }
                        }
                    };

                        pdfMake.createPdf(docDefinition).open();
                    });

                }, 5000);
            };

            self.closestMarkers = [];
            self.shapeClick = function shapeClick(event ){
                var minDist = Number.MAX_VALUE;
                var index = -1;
                self.geocoder.geocode({
                    'latLng': event.latLng
                }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        // console.log("results from ")
                        if (results[0]) {
                            jQuery("#address-info").html(results[0].formatted_address);
                            return results[0];
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                });
                var closestFive = [];
                for (let i=0; i<this.getPath().getLength(); i++){
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(event.latLng, this.getPath().getAt(i));
                    if ((distance < minDist)) {
                        minDist = distance;
                        index = i;
                        closestFive = self.addClosestFive(closestFive,  index);
                    }
                }
                var polyline = this;
                self.openClosestMarkers(closestFive, polyline);
            };

            self.clearClosestMarkers = function clearClosestMarkers() {
              for (let i = 0; i < self.closestMarkers.length; i++) {
                let element = self.closestMarkers[i];
                element.setMap(null);
              }
              self.closestMarkers = [];
              self.infoWindow.close();
            }
            self.openClosestMarkers = function openClosestMarkers(closestFive, polyline) {
              self.clearClosestMarkers();
              for(let i = 0; i < closestFive.length; i++) {
                var closestMarker = new google.maps.Marker({
                  position: polyline.getPath().getAt(closestFive[i]),
                  map: self.map,
                  // label: 'C',
                  index: closestFive[i]
                });
                closestMarker.addListener('mouseover', function() {
                  let index = this.index;
                  var content = "<p style='white-space: nowrap; margin-bottom: 3px;'>Velocidad: " + self.coordinatesShape[index].speed + " </p>" +
                      "<p style='white-space: nowrap; margin-bottom: 3px; mx-1'>Fecha y hora: " + self.coordinatesShape[index].day + " " + self.coordinatesShape[index].time + "</p>" +
                      "<p id='address-info'><i class='fa fa-spinner fa-spin'></i> cargando...</p>";
                  self.infoWindow.setContent(content);
                  self.infoWindow.setPosition(this.getPosition());
                  self.infoWindow.setMap(self.map);
                  self.infoWindow.open();
                });
                self.closestMarkers.push(closestMarker);
              }
            }

            self.addClosestFive = function addClosestFive(closestFive, element) {
              if(closestFive.length == 5) {
                closestFive.shift();
              }
              closestFive.push(element);
              return closestFive;
            }

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
                map: self.map,
                callbacks: {
                  afterClose: function() {
                    self.clearClosestMarkers();
                  }
                }
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
            var inc = 0;
            self.drawHistorical = function drawHistorical(historical, pos){
                inc++;
                var len = historical.length;
                if(pos == len) {
                    var lastPos = len - 1;
                    var endMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(parseFloat(historical[lastPos].lat),parseFloat(historical[lastPos].lng)),
                        map: self.map,
                        // label: 'B',
                        // id: device.idDevice,
                        // imei: device.auth_device,
                        icon: "/img/transparent-end.png",
                    });
                    return;

                }

                var point = [parseFloat(historical[pos].lat), parseFloat(historical[pos].lng)];
                var utcDate = moment.utc(historical[pos].day, "YYYY-MM-DD HH:mm:ss").toDate();
                var day = moment(utcDate).local().format("DD/MM/YYYY");
                var time = moment(utcDate).local().format("HH:mm:ss");
                var pointObj = {
                    day: day,
                    time: time,
                    lat: parseFloat(historical[pos].lat),
                    lng: parseFloat(historical[pos].lng),
                    speed: historical[pos].speed + ' Km/h'
                };
                // console.log("point: ", pointObj);
                self.coordinates.push(pointObj);
                if(pos > 0) {
                    let latBefore = parseFloat(historical[pos - 1].lat);
                    let lngBefore = parseFloat(historical[pos - 1].lng);
                    let latNow = parseFloat(historical[pos].lat);
                    let lngNow = parseFloat(historical[pos].lng);
                    // if(latBefore != latNow || lngBefore != lngNow) {
                    //     self.coordinatesShape.push(pointObj);
                    // }
                    if(historical[pos - 1].day !== historical[pos].day) {
                        self.coordinatesShape.push(pointObj);
                    }
                }

                google.maps.event.trigger(self.map, 'resize');
                var is_thousand = !(inc % 1000);
                if(is_thousand) {
                    $timeout(function() {
                        self.drawHistorical(historical, pos + 1);
                    }, 0);
                } else {
                    self.drawHistorical(historical, pos + 1);
                }
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
            };
            self.playDecreaseSpeed = function playDecreaseSpeed() {
                self.playSpeed += self.speedChangeValue;
            };
            self.paused = false;
            self.pausedPos = 0;
            self.pausePlay = function pausePlay() {
                self.paused = true;
            };
            self.reset = false;
            self.resetPlay = function resetPlay() {
                self.reset = true;
            };
            self.finished = false;
            self.playHistoricsButton = function playHistoricsButton() {
                if(self.finished == true) {
                    self.playSpeed = 500;
                    self.paused = false;
                    self.pausedPos = 0;
                    self.finished = false;
                    self.playHistorical(self.historics, 0);
                }
                if(self.playMarker != null && self.paused == false)
                    return;
                self.paused = false;
                self.playHistorical(self.historics, self.pausedPos);
                self.pausedPos = 0;
            };
            self.playHistorical = function playHistorical(historical, pos) {
                var len = historical.length;
                if(pos == len) {
                    self.finished = true;
                    return;
                }
                if(self.paused == true) {
                    self.pausedPos = pos;
                    return;
                }
                if(self.reset == true) {
                    pos = 0;
                    self.reset = false;
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
            var historical = $http.get(window.__env.apiUrl + 'devices/' + $routeParams.deviceId + '/history?start_date=' + $routeParams.start + '&end_date=' + $routeParams.end)
            self.historics = null;
            historical.then(function(result) {
                self.historics = result.data;
                if(self.historics == "") {
                    alert("Este dispositivo no tiene actividad");
                    return;
                }
                // console.log("historics", self.historics);
                self.drawHistorical(self.historics, 0);
                var beginMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat(self.historics[0].lat),parseFloat(self.historics[0].lng)),
                    map: self.map,
                    // label: 'A',
                    // id: device.idDevice,
                    // imei: device.auth_device,
                    icon: "/img/transparent-start.png",
                });
                // self.setAddressesToCoordinates();
            });
            self.pointWindows = [];
                self.drawPoints = function drawPoints() {
                var bounds = new google.maps.LatLngBounds();
                var everyCount = parseInt(self.coordinates.length / 100);
                if(everyCount <= 2) {
                    bounds.extend(new google.maps.LatLng(self.coordinates[0]));
                    bounds.extend(new google.maps.LatLng(self.coordinates[self.coordinates.length - 1]));
                } else {
                    for(var i = 0; i < self.coordinates.length; i+=everyCount) {
                        var latLng = new google.maps.LatLng(self.coordinates[i]);
                        // var marker = new google.maps.Marker({
                        //     position: latLng,
                        //     map: self.map,
                        //     title: i.toString(),
                        //     label: i.toString()
                        // });

                        var numberWindow = new SnazzyInfoWindow({
                            content: i.toString(),
                            padding: '2px',
                            // openOnMarkerClick: false,
                            closeOnMapClick: false,
                            // closeWhenOthersOpen: true,
                            showCloseButton: false,
                            backgroundColor: 'black',
                            fontColor: 'white',
                            fontSize: '10px',
                            maxWidth: 300,
                            // maxHeight: 35,
                            pointer: '7px',
                            // wrapperClass: 'label-window label-' + m.imei
                            // disableAutoPan: true,
                            position: latLng,
                            map: self.map
                        });
                        self.pointWindows.push(numberWindow);
                        numberWindow.open();

                        bounds.extend(latLng);
                    }
                }
                // Don't zoom in too far on only one marker
                // if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                //     var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
                //     var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
                //     bounds.extend(extendPoint1);
                //     bounds.extend(extendPoint2);
                // }

                self.map.fitBounds(bounds);
            };
        }
    ]
});
