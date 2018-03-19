'use strict';

// Register `deviceList` component, along with its associated controller and template
angular.module('deviceList').component('deviceList', {
    templateUrl: 'device-list/device-list.template.html',
    controller: ['Device', '$http', 'NgMap',
        function DeviceListController(Device, $http, NgMap) {
            var self = this;
            self.start = null;
            self.end = null;
            self.currentIdDevice = null;
            self.currentImei = null;
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    // console.log(map.getCenter());
                    // console.log('shapes', map.shapes);
                    self.map = map;
                    return map;
                });
            };
            self.markerOptionClick = function markerOptionClick() {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                self.currentIdDevice = invoker.parent().attr("id-device");
                self.currentImei = invoker.parent().attr("imei");
                var m = self.findMarkerByImei(self.currentImei);
                var lat = m.getPosition().lat();
                var lng = m.getPosition().lng();
                self.map.panTo(new google.maps.LatLng(lat, lng));
            };
            $('#myModal').on('shown.bs.modal', function (e) {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                self.currentIdDevice = invoker.parent().attr("id-device");
                self.currentImei = invoker.parent().attr("imei");

                $('#historical-dates').daterangepicker({
                    timePicker: true,
                    "timePicker24Hour": true,
                    "autoApply": true,
                    locale: {
                        format: 'MM/DD/YYYY H:mm '
                    },
                    "ranges": {
                        'Last half hour': [moment().subtract(30, 'minutes'), moment()],
                        'Last hour': [moment().subtract(1, 'hours'), moment()],
                        'Last three hours': [moment().subtract(3, 'hours'), moment()],
                        'Today': [moment(), moment()],
                        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                        // 'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    },
                    "alwaysShowCalendars": true,
                    "startDate": moment().subtract(3, 'hours'),
                    "endDate": new Date()
                }, function(start, end, label) {
                    console.log('New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD') + ' (predefined range: ' + label + ')');
                    self.start = start;
                    self.end = end;
                    $("#modal-historical").attr("href", '#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD H:mm") + '/' + self.end.format("YYYY-MM-DD H:mm"));
                });
                var drp = $('#historical-dates').data('daterangepicker');
                self.start = drp.startDate;
                self.end = drp.endDate;
                $("#modal-historical").attr("href", '#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD H:mm") + '/' + self.end.format("YYYY-MM-DD H:mm"));

            })
            self.showRangeModal = function showRangeModal() {
            };
            self.displayHideMenu = function displayHideMenu() {
                $('div[data-toolbar="device-menu-options"]').toolbar({
                    content: '#device-menu-options',
                    position: 'right',
                    event: 'click',
                    hideOnClick: true
                });
                $("#left-menu").toggle("fast");
            };
            self.centerMarkerClick = function centerMarkerClick() {

            };
            self.findMarkerByImei = function findMarkerByImei(imei) {
                var m = self.markers[imei];
                if(m == undefined)
                    return false;
                else
                    return m;
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
