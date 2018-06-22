'use strict';

angular.module('sharedScreen').component('sharedScreen', {
    templateUrl: 'shared-screen/shared-screen.template.html',
    controller: ['$http', '$timeout', 'NgMap', '$routeParams',
        function SharedScreenController($http, $timeout, NgMap, $routeParams) {
            var self = this;
            self.currentIdDevice = null;
            self.currentImei = null;
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.geocoder = new google.maps.Geocoder();
            self.markers = [];
            self.test = function test() {
                var groupsQuery = $http.get(window.__env.apiUrl + 'shared-screen/1');
                groupsQuery.then(function(result) {
                    console.log("result: ", result);
                });

            };
            console.log("testing");

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
                        group_label: groupId == -1 ? 'Sin Grupo' : data.group_label,
                        devices: [{
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device
                        }]
                    });
                } else
                    self.groups.push({
                        group_id: groupId,
                        group_label: groupId == -1 ? 'Sin Grupo' : data.group_label,
                        devices: [{
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device
                        }]
                    });

            };

            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
                    // if(self.devices.length > 0) {
                    //     self.initializeMarkers(self.devices);
                    // }
                    // google.maps.event.addListener(self.map, 'click', function() {
                    //     self.hideMenu();
                    // });

                    return map;
                });
            };
            self.getCurrentDate = function getCurrentDate() {
                return moment();
            };
            self.markerOptionClick = function markerOptionClick(imei) {
                // var invoker = $('div[data-toolbar="device-menu-options"].pressed');
                // if (invoker.length > 0) {
                //     self.currentIdDevice = invoker.attr("id-device");
                //     self.currentImei = invoker.attr("imei");
                // } else {
                //     self.currentImei = imei;
                // }
                // if(jQuery($event.currentTarget).parent().hasClass("active")) {
                //     jQuery($event.currentTarget).parent().removeClass("active");
                //     self.currentMenuImei = null;
                // }else{
                //     jQuery($event.currentTarget).closest("#left-menu").find("li").removeClass("active");
                //     jQuery($event.currentTarget).parent().addClass("active");
                //     self.currentMenuImei = param;
                // }
                self.currentMenuImei = imei;
                var m = self.findMarkerByImei(imei);
                var lat = m.getPosition().lat();
                var lng = m.getPosition().lng();
                self.updateMarkerColor(m);
                self.getAddress(lat, lng, true, m.backgroundColor);
                self.map.setZoom(16);
                self.map.panTo(new google.maps.LatLng(lat, lng));
                self.refreshDetailWindow(m, true);
            };
            self.centerMarkerClick = function centerMarkerClick() {

            };
            self.findDeviceByImei = function findDeviceByImei(imei) {
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
                var m = self.markers[imei];
                if(m == undefined)
                    return false;
                else
                    return m;
            };

            self.getMap();

            // web sockets code
            self.options = {
                secure: false,
                hostname: window.__env.webSocketIp,
                port: window.__env.webSocketPort
            };
            var socket = socketCluster.connect(self.options);
            socket.on('connect', function () {
            });
            // var socketBB = socketCluster.connect(self.optionsBB);
            // socketBB.on('connect', function () {
            // });
            self.share = null;
            self.markersInitialized = false;
            self.devices = [];
            var shareQuery = $http.get(window.__env.apiUrl + 'shared-screen/' + $routeParams.shareid);
            shareQuery.then(function(result) {
                self.share = result.data;
                self.devices = self.share.devices;
                self.initializeMarkers(self.devices);
                console.log("result: ", result);
            });
            // self.devices = Device.query({userId: $localStorage.currentUser.id}, function(devices){
            //     if(self.map != undefined)
            //         self.initializeMarkers(devices);
            // });
            self.initialLatitude = null;
            self.initialLongitude = null;
            self.initializeMarkers = function initializeMarkers(devices) {
                for(var i = 0; i < devices.length; i++){
                    var device = devices[i];
                    if(device.peripheral_gps_data[0] == undefined)
                        continue;
                    if(self.initialLatitude == null) {
                        self.initialLatitude = device.peripheral_gps_data[0].lat;
                        self.initialLongitude = device.peripheral_gps_data[0].lng;
                    }
                    var local = moment.utc(device.peripheral_gps_data[0].updatedAt).toDate();
                    var lastUpdate = moment(local).format("DD/MM/YYYY HH:mm:ss");
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
                        content: "<p style='white-space: nowrap'>" + device.label + "</p>",
                        marker: m,
                        backgroundColor: m.backgroundColor,
                        padding: '4px',
                        openOnMarkerClick: false,
                        closeOnMapClick: false,
                        closeWhenOthersOpen: false,
                        showCloseButton: false,
                        fontColor: 'white',
                        maxWidth: 800,
                        maxHeight: 35,
                        pointer: '7px',
                        wrapperClass: 'label-window label-' + m.imei,
                        panOnOpen: false
                    });
                    m.labelWindow = infoWindow;
                    infoWindow.open();


                    google.maps.event.addListener(m, 'click', function() {
                        var lat = this.getPosition().lat();
                        var lng = this.getPosition().lng();
                        self.refreshDetailWindow(m);
                        self.updateMarkerColor(this);
                        self.getAddress(lat, lng, true, this.backgroundColor);
                        self.refreshDetailWindow(this, true);
                        // self.rotateMarker(this, 45);
                        self.map.setZoom(20);
                        self.map.setCenter(this.getPosition());
                        // self.openDetailInfo(this);
                    });

                    self.markers[device.auth_device] = m;

                    var g = socket.subscribe(devices[i].auth_device);
                    g.watch(function(data) {
                        var m = self.markers[data.device_id];
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

                }
                self.markersInitialized = true;
            };

            self.rotateMarker = function(m, degrees) {
                var icon2 = m.icon;
                icon2.rotation = degrees;
                m.setIcon(icon2);
            };
            self.updateMarkerColor = function updateMarkerColor(m) {
                var backgroundColor = '#1C9918'; // default for when is moving
                if(m.gpsStatus === 'Off')
                    backgroundColor = '#6A7272'; // dark for statos off
                else if(m.speed == 0)
                    backgroundColor = '#248DFD'; // blue for stopped '#E1B300';
                m.backgroundColor = backgroundColor;
                if(m.labelWindow != undefined && m.alarmed == false){
                    m.labelWindow._opts.backgroundColor = backgroundColor;
                }
            };
            self.updateAddressAndDetail = function updateAddressAndDetail(m) {
                self.getAddress(m.getPosition().lat(), m.getPosition().lng(), true, m.backgroundColor);
                self.refreshDetailWindow(m, true);
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
                var contentDetail = "" +
                    "<p class='' style='font-size: 14px'><strong>" +
                    "" + m.title + "</strong> " +
                    "Estado: " + m.gpsStatus + ", " +
                    "Velocidad: " + m.speed + " Km/h, " +
                    "Último reporte: " + m.lastUpdate + "" +
                    "";

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
                var dateFormatted = moment(dateStr, "YY/M/D H:m:s").format("DD/MM/YYYY HH:mm:ss");
                return dateFormatted;
            };

        }
    ]
});
