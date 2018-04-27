'use strict';

// Register `deviceList` component, along with its associated controller and template
angular.module('deviceList').component('deviceList', {
    templateUrl: 'device-list/device-list.template.html',
    controller: ['Device', '$http', 'NgMap', '$localStorage',
        function DeviceListController(Device, $http, NgMap, $localStorage) {
            var self = this;
            self.currentUser = $localStorage.currentUser;
            self.start = null;
            self.end = null;
            self.currentIdDevice = null;
            self.currentImei = null;
            self.todayStart = moment().set({hour:0,minute:0,second:0,millisecond:0});
            self.yesterdayStart = moment().subtract(1, 'days').set({hour:0,minute:0,second:0,millisecond:0});
            self.yesterdayEnd = moment().subtract(1, 'days').set({hour:23,minute:59,second:0,millisecond:0});
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";

            self.groups = [];
            var groupsQuery = $http.get('http://189.207.202.64:3007/api/v1/users/' + $localStorage.currentUser.id + '/groups');
            groupsQuery.then(function(result) {
                // self.groups = result.data;
                for(var i = 0; i < result.data.length; i++) {
                    // console.log(result.data[i]);
                    self.addToGroups(result.data[i]);
                }
                console.log(self.groups);
            });

            self.addToGroups = function addToGroups(data) {
                for(var j = 0; j < self.groups.length; j++) {
                    var g = self.groups [j];
                    var groupId = data.group_id != undefined ? data.group_id : -1;
                    if(g.group_id == groupId) {
                        g.devices.push({
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device
                        });
                        return;
                    }
                }
                groupId = -1;
                if(data.group_id != undefined) {
                    groupId = data.group_id;
                    self.groups.unshift({
                        group_id: groupId,
                        group_label: groupId == -1 ? 'No Group' : data.group_label,
                        devices: [{
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device
                        }]
                    });
                } else
                    self.groups.push({
                        group_id: groupId,
                        group_label: groupId == -1 ? 'No Group' : data.group_label,
                        devices: [{
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device
                        }]
                    });

            };

            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    // console.log(map.getCenter());
                    // console.log('shapes', map.shapes);
                    self.map = map;
                    if(self.devices.length > 0) {
                        self.initializeMarkers(self.devices);
                    }
                    console.log("map initialized");
                    return map;
                });
            };
            self.getCurrentDate = function getCurrentDate() {
                return moment();
            };
            self.markerOptionClick = function markerOptionClick(param) {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                console.log(invoker.length);
                if (invoker.length > 0) {
                    console.log("setting currentIdDevice");
                    self.currentIdDevice = invoker.parent().attr("id-device");
                    self.currentImei = invoker.parent().attr("imei");
                } else {
                    self.currentImei = param;
                }
                var m = self.findMarkerByImei(self.currentImei);
                var lat = m.getPosition().lat();
                var lng = m.getPosition().lng();
                self.map.panTo(new google.maps.LatLng(lat, lng));
            };
            $('#myModal').on('shown.bs.modal', function (e) {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                self.currentIdDevice = invoker.parent().attr("id-device");
                console.log("current id device: " + self.currentIdDevice);
                self.currentImei = invoker.parent().attr("imei");

                $('#historical-custom').daterangepicker({
                    opens: "center",
                    timePicker: true,
                    "timePicker24Hour": true,
                    "autoApply": true,
                    locale: {
                        format: 'MM/DD/YYYY H:mm ',
                        applyLabel: '<i class="fa fa-arrow-right"></i> Go'
                    },
                    // "ranges": {
                    //     // 'Last half hour': [moment().subtract(30, 'minutes'), moment()],
                    //     // 'Last hour': [moment().subtract(1, 'hours'), moment()],
                    //     // 'Last three hours': [moment().subtract(3, 'hours'), moment()],
                    //     'Today': [moment().set({hour:0,minute:0,second:0,millisecond:0}), moment()],
                    //     'Yesterday': [moment().subtract(1, 'days').set({hour:0,minute:0,second:0,millisecond:0} ), moment().set({hour:23,minute:59,second:0,millisecond:0}).subtract(1, 'days')],
                    //     // 'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    // },
                    "alwaysShowCalendars": true,
                    "startDate": moment().subtract(3, 'hours'),
                    "endDate": moment()
                }, function(start, end, label) {
                    console.log('New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
                    self.start = start;
                    self.end = end;
                    window.open('#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD H:mm") + '/' + self.end.format("YYYY-MM-DD H:mm"),'_blank');
                    // $("#modal-historical").attr("href", '#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD H:mm") + '/' + self.end.format("YYYY-MM-DD H:mm"));
                    $('#myModal').modal('hide');
                });
                var drp = $('#historical-custom').data('daterangepicker');
                self.start = drp.startDate;
                self.end = drp.endDate;
                // $("#modal-historical").attr("href", '#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD H:mm") + '/' + self.end.format("YYYY-MM-DD H:mm"));

            })
            self.showRangeModal = function showRangeModal() {
            };
            self.historicalRangeClick = function historicalRangeClick(range) {
                if(range == "today"){
                    self.start = moment().set({hour:0,minute:0,second:0,millisecond:0}).utc();
                    self.end = moment().utc();
                }else {
                    self.start = moment().subtract(1, 'days').set({hour:0,minute:0,second:0,millisecond:0}).utc();
                    self.end = moment().subtract(1, 'days').set({hour:23,minute:59,second:0,millisecond:0}).utc();
                }
                var linkUrl = '#!device/' + self.currentIdDevice + '/historical/' + moment(self.start).utc().format("YYYY-MM-DD H:mm") + '/' + moment(self.end).utc().format("YYYY-MM-DD H:mm");
                $('#myModal').modal('hide');
                window.open(linkUrl, '_blank');
            };
            self.historicalCustomClick = function historicalCustomClick() {
                // $('#historical-dates').show("fast");
                $('#historical-custom').data('daterangepicker').toggle();
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
                var m = $localStorage.markers[imei];
                if(m == undefined)
                    return false;
                else
                    return m;
            };

            self.getMap();

            // web sockets code
            self.options = {
                secure: false,
                hostname: "189.207.202.64",
                port: 3001
            };
            // self.optionsBB = {
            //     hostname: "189.207.202.64",
            //     port: 3001
            // };
            console.log("Trying to connect");
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

            $localStorage.markers = [];
            self.markersInitialized = false;
            this.devices = Device.query({userId: $localStorage.currentUser.id}, function(devices){
                if(self.map != undefined)
                    self.initializeMarkers(devices);


            });

            self.initializeMarkers = function initializeMarkers(devices) {
                for(var i = 0; i < devices.length; i++){
                    var device = devices[i];
                    if(device.peripheral_gps_data[0] == undefined)
                        continue;
                    self.initialLatitude = device.peripheral_gps_data[0].lat;
                    self.initialLongitude = device.peripheral_gps_data[0].lng;
                    console.log("going to create the marker: ", self.map);
                    var m = new google.maps.Marker({
                        position: new google.maps.LatLng(device.peripheral_gps_data[0].lat,device.peripheral_gps_data[0].lng),
                        map: self.map,
                        title: device.label,
                        id: device.idDevice,
                        imei: device.auth_device,
                        icon: "/img/car-marker48.png",
                    });
                    $localStorage.markers[device.auth_device] = m;

                    console.log("matching device: " + devices[i].auth_device);
                    var g = socket.subscribe(devices[i].auth_device);
                    var alarmsSocket = socket.subscribe("alarms_" + devices[i].auth_device);
                    g.watch(function(data) {
                        console.log(data);
                        var m = $localStorage.markers[data.device_id];
                        console.log(m);
                        if(m != undefined) {
                            m.setPosition(new google.maps.LatLng( data.latitude,data.longitude));
                        }
                    });

                    alarmsSocket.watch(function(data) {
                        console.log("entro una alarma!!!!");
                        console.log(data);
                    });
                }
                self.markersInitialized = true;
            };
        }
    ]
});
