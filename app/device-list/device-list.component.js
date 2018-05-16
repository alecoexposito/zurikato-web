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
            self.geocoder = new google.maps.Geocoder();
            self.groups = [];
            self.currentMenuImei = null;
            var groupsQuery = $http.get('http://189.207.202.64:3007/api/v1/users/' + $localStorage.currentUser.id + '/groups');
            groupsQuery.then(function(result) {
                // self.groups = result.data;
                for(var i = 0; i < result.data.length; i++) {
                    // console.log(result.data[i]);
                    self.addToGroups(result.data[i]);
                }
                // console.log(self.groups);
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
                    if($localStorage.devices.length > 0) {
                        self.initializeMarkers($localStorage.devices);
                    }
                    // console.log(self.addressWindow);
                    console.log("map initialized");
                    return map;
                });
            };
            self.getCurrentDate = function getCurrentDate() {
                return moment();
            };
            self.markerOptionClick = function markerOptionClick(param, $event) {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                console.log(invoker.length);
                if (invoker.length > 0) {
                    console.log("setting currentIdDevice");
                    self.currentIdDevice = invoker.parent().attr("id-device");
                    self.currentImei = invoker.parent().attr("imei");
                } else {
                    self.currentImei = param;
                }
                console.log($event.currentTarget);
                if(jQuery($event.currentTarget).parent().hasClass("active")) {
                    jQuery($event.currentTarget).parent().removeClass("active");
                    self.currentMenuImei = null;
                }else{
                    jQuery($event.currentTarget).closest("#left-menu").find("li").removeClass("active");
                    jQuery($event.currentTarget).parent().addClass("active");
                    self.currentMenuImei = param;
                }
                var m = self.findMarkerByImei(self.currentImei);
                var lat = m.getPosition().lat();
                var lng = m.getPosition().lng();
                self.updateMarkerColor(m);
                self.getAddress(lat, lng, true, m.backgroundColor);
                self.map.setZoom(16);
                self.map.panTo(new google.maps.LatLng(lat, lng));
                self.refreshDetailWindow(m, true);
            };
            $('#myModal').on('shown.bs.modal', function (e) {
                var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                self.currentIdDevice = invoker.parent().attr("id-device");
                if(self.currentIdDevice == undefined)
                    return;
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
                console.log("opening alarm window");
            };
            self.centerMarkerClick = function centerMarkerClick() {

            };
            self.openAlarm = function openAlarm(alarm) {
                console.log("in method: ", alarm);
                var alarmType = alarm.device_info;
                var imei = alarm.device_id;
                var latitude = alarm.latitude;
                var longitude = alarm.longitude;
                console.log("opening tab: ", latitude);
                var linkUrl = '#!device/alarm/' + latitude + "/" + longitude + "/" + imei;
                console.log(linkUrl);
                var d = self.findDeviceByImei(imei);
                var w = window.open(linkUrl, 'newwindow', 'width=1024,height=768');
                w.device = d;
            };
            self.findDeviceByImei = function findDeviceByImei(imei) {
                console.log($localStorage.devices);
                if($localStorage.devices == undefined)
                    return false;
                for (var k = 0; k < $localStorage.devices.length; k++) {
                    var d = $localStorage.devices[k];
                    if(d.auth_device == imei)
                        return d;
                }
                return false;
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
            console.log("Trying to connect");
            var socket = socketCluster.connect(self.options);
            // $localStorage.socket = socket;
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
            $localStorage.devices = Device.query({userId: $localStorage.currentUser.id}, function(devices){
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
                    var local = moment.utc(device.peripheral_gps_data[0].updatedAt).toDate();
                    var lastUpdate = moment(local).format("YYYY-MM-DD HH:mm:ss");
                    var speed = device.peripheral_gps_data[0].speed;
                    var gpsStatus = device.peripheral_gps_data[0].gps_status == 0 ? 'On' : 'Off';
                    // var image = "http://127.0.0.1:8000/img/car-marker48.png";
                    var rotation = parseInt(device.peripheral_gps_data[0].orientation_plain);
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
                    var m = new google.maps.Marker({
                        position: new google.maps.LatLng(device.peripheral_gps_data[0].lat,device.peripheral_gps_data[0].lng),
                        map: self.map,
                        title: device.label,
                        id: device.idDevice,
                        imei: device.auth_device,
                        icon: icon,
                        speed: speed,
                        lastUpdate: lastUpdate,
                        gpsStatus: gpsStatus
                    });

                    self.updateMarkerColor(m);
                    var infoWindow = new SnazzyInfoWindow({
                        content: device.label,
                        marker: m,
                        backgroundColor: m.backgroundColor,
                        padding: '7px',
                        openOnMarkerClick: false,
                        closeOnMapClick: false,
                        closeWhenOthersOpen: false,
                        showCloseButton: false,
                        fontColor: 'white',
                        maxWidth: 100,
                        pointer: '7px',
                        // disableAutoPan: true
                    });
                    m.labelWindow = infoWindow;
                    infoWindow.open();
                    // var contentDetail = "<div style='width: 300px'>" +
                    //     "<h6 class='' style='color: white'>" +
                    //     "" + m.title + "</h6>" +
                    //     "<p>Estado: " + m.gpsStatus + "</p>" +
                    //     "<p>Velocidad: " + m.speed + " Km/h</p>" +
                    //     "<p>Ultima coordenada: " + m.lastUpdate + "</p>" +
                    //     "</div>";
                    // var detailInfo = new SnazzyInfoWindow({
                    //     content: contentDetail,
                    //     marker: m,
                    //     backgroundColor: m.backgroundColor,
                    //     padding: '7px',
                    //     openOnMarkerClick: true,
                    //     closeOnMapClick: false,
                    //     closeWhenOthersOpen: true,
                    //     showCloseButton: true,
                    //     fontColor: 'white',
                    //     maxWidth: 350,
                    //     pointer: '7px',
                    //     // width: 300
                    // });
                    // m.detailWindow = detailInfo;

                    google.maps.event.addListener(m, 'click', function() {
                        var lat = this.getPosition().lat();
                        var lng = this.getPosition().lng();
                        console.log(this);
                        console.log("latlng: ", lat + "---" + lng);
                        self.refreshDetailWindow(m);
                        self.updateMarkerColor(this);
                        self.getAddress(lat, lng, true, this.backgroundColor);
                        self.refreshDetailWindow(this, true);
                        // self.rotateMarker(this, 45);
                        self.map.setZoom(20);
                        self.map.setCenter(this.getPosition());
                        console.log(this.icon);
                        // self.openDetailInfo(this);
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
                            m.speed = data.speed;
                            m.orientation = data.orientation_plain;
                            m.gpsStatus = data.gps_status == 0 ? 'On' : 'Off';
                            m.lastUpdate = self.getDateByHex(data.date);
                            self.rotateMarker(m, data.orientation_plain);
                            if(self.currentMenuImei == data.device_id){
                                self.map.panTo(new google.maps.LatLng(data.latitude, data.longitude));
                                self.updateMarkerColor(m);
                                self.getAddress(data.latitude, data.longitude, true, m.backgroundColor);
                                self.refreshDetailWindow(m);
                            }
                        }
                    });

                    alarmsSocket.watch(function(data) {
                        // console.log("entro una alarma!!!!");
                        console.log(data);
                        self.openAlarm(data);
                    });
                }
                self.markersInitialized = true;
            };

            self.rotateMarker = function(m, degrees) {
                var icon2 = m.icon;
                icon2.rotation = degrees;
                m.setIcon(icon2);
            };
            self.updateMarkerColor = function updateMarkerColor(m) {
                console.log("gps status when updating color: ", m.gpsStatus);
                var backgroundColor = '#1C9918';
                if(m.gpsStatus === 'Off')
                    backgroundColor = '#6A7272';
                else if(m.speed == 0)
                    backgroundColor = '#E1B300';
                m.backgroundColor = backgroundColor;
                if(m.labelWindow != undefined)
                    m.labelWindow.backgroundColor = backgroundColor;
            };
            self.getAddress = function getAddress(latitude, longitude, showOnMap, backgroundColor) {
                var latlng = new google.maps.LatLng(latitude, longitude);
                if(backgroundColor)
                    jQuery("#address-control div").css("background-color", backgroundColor);
                jQuery("#address-p").html('<i class="fa fa-spinner fa-spin"></i> cargando...');
                self.geocoder.geocode({
                    'latLng': latlng
                }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            if(showOnMap) {
                                jQuery("#address-p").html(results[0].formatted_address);
                                jQuery("#address-control").show("fast");
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

            self.refreshDetailWindow = function refreshDetailWindow(m, open) {

                var contentDetail = "<div class='rounded-top' style='width: 300px'>" +
                    "<h6 class=''>" +
                    "" + m.title + "</h6>" +
                    "<p>Estado: " + m.gpsStatus + "</p>" +
                    "<p>Velocidad: " + m.speed + " Km/h</p>" +
                    "<p>Ultima coordenada: " + m.lastUpdate + "</p>" +
                    "</div>";
                // m.detailWindow.setContent(contentDetail);
                // if(open){
                    jQuery("#detail-control div").html(contentDetail);
                    jQuery("#detail-control").css("background-color", m.backgroundColor).show("fast");
                    // m.detailWindow.open();
                // }
            };
            self.getDateByHex = function getDateByHex(str) {
                var year = parseInt(str.substr(0, 2), 16).toString();
                var month = parseInt(str.substr(2, 2), 16).toString();
                var day = parseInt(str.substr(4, 2), 16).toString();
                var hour = parseInt(str.substr(6, 2), 16).toString();
                var min = parseInt(str.substr(8, 2), 16).toString();
                var sec = parseInt(str.substr(10, 2), 16).toString();
                var dateStr = year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;
                console.log(dateStr);
                var dateFormatted = moment(dateStr, "YY/M/D H:m:s").format("YYYY/MM/DD HH:mm:ss");
                return dateFormatted;
            };


        }
    ]
});
