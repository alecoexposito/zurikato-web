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
            self.imei = $routeParams.imei;
            self.m = null;
            // self.devices = $localStorage.devices;
            self.device = window.device;
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
                // console.log('CONNECTED');
                console.log(self.socket.state);
            });
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
                    console.log("creating the marker for alarm");
                    self.m = new google.maps.Marker({
                        position: new google.maps.LatLng(self.latitude, self.longitude),
                        map: self.map,
                        title: self.imei,
                        // id: device.idDevice,
                        imei: self.imei,
                        icon: "/img/car-marker48.png",
                    });
                    console.log("matching device for alarm");
                    var g = self.socket.subscribe(self.imei);
                    g.watch(function (data) {
                        if (self.m != null) {
                            self.m.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
                        }
                    });

                    return map;
                });
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

                var data = "P," + d.label + "254" + d.sim + "254" + d.auth_device + "254" + d.idDevice +
                    "254" + secondsDiff + "254" + self.latitude + "254" + self.longitude + d.peripheral_gps_data[0].speed +
                    "254" + d.peripheral_gps_data[0].orientation_plain + "254" + 1 + "254" + 1;
                var pad = "0000000" + data.length.toString(16);
                var start = pad.slice("-8");
                console.log("start", start);
                $http.get('/api/alert-c5', {params: {data: start + data}}).then(function (result) {
                    console.log(result);
                });
            };

            self.getMap();

        }
    ]
});
