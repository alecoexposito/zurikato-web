'use strict';

angular.module('deviceAlarm').component('deviceAlarm', {
    templateUrl: 'device-alarm/device-alarm.template.html',
    controller: ['Device', '$http', '$timeout', 'NgMap', '$routeParams', '$localStorage',
        function DeviceAlarmController(Device, $http, $timeout, NgMap, $routeParams, $localStorage) {
            var self = this;
            var map = null;
            var pos = null;
            self.latitude = $routeParams.latitude;
            self.longitude = $routeParams.longitude;
            self.speed = $routeParams.speed;
            self.alarmType = $routeParams.alarmType;
            self.m = null;
            self.backgroundColor = '#D93444';
            // self.devices = $localStorage.devices;
            self.device = window.device;
            self.geoJson = window.geoJson;
            console.log("geojson stringified", self.geoJson);
            // self.label = $routeParams.label;
            self.coordinates = [];
            self.geocoder = new google.maps.Geocoder();
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.options = {
                secure: false,
                hostname: window.__env.webSocketIp,
                port: window.__env.webSocketPort
            };
            self.setBackgroundColor = function setBackgroundColor() {
                if(self.alarmType == 100) {
                    self.backgroundColor = '#D93444'; // rojo boton de panico
                } else if(self.alarmType == '000' || self.alarmType == "enter-fence" || self.alarmType == "exit-fence") {
                    self.backgroundColor = '#E1B300'; // amarillo exceso de velocidad
                }
            };
            console.log("Trying to connect");
            self.socket = socketCluster.connect(self.options);
            self.socket.on('connect', function () {
                // console.log('CONNECTED');
                console.log(self.socket.state);
            });
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
                    self.map.data.addGeoJson(self.geoJson);
                    console.log("creating the marker for alarm");
                    var local = moment.utc(self.device.peripheral_gps_data[0].updatedAt).toDate();
                    var lastUpdate = moment(local).format("DD/MM/YYYY HH:mm:ss");
                    // var speed = self.device.peripheral_gps_data[0].speed;
                    var gpsStatus = self.device.peripheral_gps_data[0].gps_status == 0 ? 'On' : 'Off';
                    var rotation = parseInt(self.device.peripheral_gps_data[0].orientation_plain);

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
                    self.m = new google.maps.Marker({
                        position: new google.maps.LatLng(self.latitude, self.longitude),
                        map: self.map,
                        title: self.device.label,
                        // id: device.idDevice,
                        imei: self.device.auth_device,
                        // icon: "/img/car-marker48.png",
                        icon: icon,
                        speed: self.speed,
                        lastUpdate: lastUpdate,
                        gpsStatus: gpsStatus
                    });
                    console.log("marker created: ", self.m);
                    console.log("device: ", self.device);
                    // #1C9918
                    var infoWindow = new SnazzyInfoWindow({
                        content: "<p style='white-space: nowrap'>" + self.m.title + "</p>",
                        marker: self.m,
                        backgroundColor: '#D93444',
                        padding: '7px',
                        openOnMarkerClick: false,
                        closeOnMapClick: false,
                        closeWhenOthersOpen: false,
                        showCloseButton: false,
                        fontColor: 'white',
                        maxWidth: 100,
                        maxHeight: 40,
                        pointer: '7px',
                        wrapperClass: 'label-window label-' + self.m.imei
                        // disableAutoPan: true
                    });
                    self.m.labelWindow = infoWindow;
                    infoWindow.open(self.map, self.m);
                    // self.refreshDetailWindow(self.m);
                    console.log("pidiendo dir inicial");
                    google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
                        self.updateColor();
                        self.getAddress(self.latitude, self.longitude, true);
                        self.refreshDetailWindow(self.m);
                        // alert("ahora");
                    });
                    self.updateColor = function updateColor() {
                        self.setBackgroundColor();
                        jQuery("#address-control div").css("background-color", self.backgroundColor);
                        jQuery("#detail-control div").css("background-color", self.backgroundColor);
                        self.m.labelWindow._opts.backgroundColor = self.backgroundColor;
                        self.m.labelWindow.close();
                        self.m.labelWindow.open();
                        console.log("waiting to change title: ", self.alarmType);
                        if(self.alarmType == '000') {
                            jQuery("#upperTitle").html("Exceso de velocidad");
                        } else if (self.alarmType == "enter-fence") {
                            jQuery("#upperTitle").html("Entrada a zona restringida");
                        } else {
                            jQuery("#upperTitle").html("Botón de Pánico Activado");
                        }
                    }
                    var g = self.socket.subscribe(self.device.auth_device);
                    g.watch(function (data) {
                        if (self.m != null) {
                            self.m.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
                            self.m.speed = data.speed;
                            self.m.orientation = data.orientation_plain;
                            self.m.gpsStatus = data.gps_status == 0 ? 'On' : 'Off';
                            self.m.lastUpdate = self.getDateByHex(data.date);
                            self.rotateMarker(self.m, data.orientation_plain);
                            self.map.panTo(new google.maps.LatLng(data.latitude, data.longitude));
                            self.updateColor();
                            self.getAddress(data.latitude, data.longitude, true);
                            self.refreshDetailWindow(self.m);
                        }
                    });

                    return map;
                });
            };
            self.getDateByHex = function getDateByHex(str) {
                var year = parseInt(str.substr(0, 2), 16).toString();
                var month = parseInt(str.substr(2, 2), 16).toString();
                var day = parseInt(str.substr(4, 2), 16).toString();
                var hour = parseInt(str.substr(6, 2), 16).toString();
                var min = parseInt(str.substr(8, 2), 16).toString();
                var sec = parseInt(str.substr(10, 2), 16).toString();
                var dateStr = year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;
                var dateFormatted = moment(dateStr, "YY/M/D H:m:s").format("YYYY/MM/DD HH:mm:ss");
                return dateFormatted;
            };
            self.refreshDetailWindow = function refreshDetailWindow(m) {
                var contentDetail = "" +
                    "<p class='' style='font-size: 14px'><strong>" +
                    "" + self.m.title + "</strong> " +
                    "Estado: " + self.m.gpsStatus + ", " +
                    "Velocidad: " + self.m.speed + " Km/h, " +
                    "Último reporte: " + moment(self.m.lastUpdate, 'HH:mm:ss DD/MM/YYYY').format("DD/MM/YYYY HH:mm:ss") + "" +
                    "";

                // m.detailWindow.setContent(contentDetail);
                // if(open){
                $timeout(function() {
                    jQuery("#detail-control div").html(contentDetail);
                    jQuery("#detail-control").css("background-color", self.backgroundColor).show("fast");
                }, 500);
                // m.detailWindow.open();
                // }
            };
            self.getAddress = function getAddress(latitude, longitude, showOnMap) {
                var latlng = new google.maps.LatLng(latitude, longitude);
                self.geocoder.geocode({
                    'latLng': latlng
                }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            console.log(results[0]);
                            if(showOnMap) {
                                jQuery("#address-p").html(results[0].formatted_address);
                                if(self.alarmType == '000') {
                                    jQuery("#upperTitle").html("Exceso de velocidad");
                                } else if (self.alarmType == "enter-fence") {
                                    jQuery("#upperTitle").html("Entrada a zona restringida");
                                } else {
                                    jQuery("#upperTitle").html("Botón de Pánico Activado");
                                }
                                jQuery("#address-control").show("fast");
                                self.address = results[0].formatted_address;
                            }
                            return results[0];
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                });
            };
            self.rotateMarker = function rotateMarker(m, degrees) {
                var icon2 = m.icon;
                icon2.rotation = degrees;
                m.setIcon(icon2);
            };
            self.alertC5 = function alertC5() {
                var d = self.device;
                if (d == undefined) {
                    console.log("Device undefined");
                    return;
                }
                console.log("device alarmed: ", d);
                var milisecondsMidnight = moment.utc().set({hour: 0, minute: 0, second: 0, millisecond: 0}).valueOf();
                var milisecondsNow = moment.utc();
                var secondsDiff = (milisecondsNow - milisecondsMidnight) / 1000;
                var speed = (d.peripheral_gps_data[0].speed * 3600)/1000;

                var data = "254P254" + d.label + ", " + d.user.company_name + "254" + d.sim + "254" + d.auth_device + "254" + d.economic_number +
                    "254" + secondsDiff + "254" + self.latitude + "254" + self.longitude + d.peripheral_gps_data[0].speed +
                    "254" + d.peripheral_gps_data[0].orientation_plain + "254" + 1 + "254" + 1;
                var pad = "0000000" + data.length.toString(16);
                var start = pad.slice("-8");
                console.log("start", start + data);
                $http.get('/api/alert-c5', {params: {data: start + data}}).then(function (result) {
                    console.log(result);
                });
            };

            self.getMap();

        }
    ]
});
