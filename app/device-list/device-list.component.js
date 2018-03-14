'use strict';

// Register `deviceList` component, along with its associated controller and template
angular.module('deviceList').component('deviceList', {
    templateUrl: 'device-list/device-list.template.html',
    controller: ['Device', 'NgMap',
        function DeviceListController(Device, NgMap) {
            var self = this;
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

            // web sockets code
            self.options = {
                hostname: "189.207.202.64",
                port: 3001
            };
            // self.optionsBB = {
            //     hostname: "189.207.202.64",
            //     port: 3001
            // };
            var socket = socketCluster.connect(self.options);
            socket.on('connect', function () {
                console.log('CONNECTED');
                console.log(socket.state);
            });
            // var socketBB = socketCluster.connect(self.optionsBB);
            // socketBB.on('connect', function () {
            //     console.log('CONNECTED2');
            //     console.log(socketBB.state);
            // });

            self.markers = [];
            this.devices = Device.query(function(devices){
                for(var i = 0; i < devices.length; i++){
                    var device = devices[i];
                    var m = new google.maps.Marker({
                        position: new google.maps.LatLng(device.peripheral_gps_data[0].lat,device.peripheral_gps_data[0].lng),
                        map: self.map,
                        title: device.label,
                        id: device.idDevice,
                        imei: device.auth_device
                    });
                    self.markers[device.auth_device] = m;

                    console.log("matching device: " + devices[i].auth_device);
                    var g = socket.subscribe(devices[i].auth_device);
                    g.watch(function(data) {
                        console.log(data);
                        var m = self.markers[data.device_id];
                        console.log(m);
                        if(m != undefined) {
                            m.setPosition(new google.maps.LatLng( data.latitude,data.longitude));
                        }
                    });
                }
            });
        }
    ]
});
