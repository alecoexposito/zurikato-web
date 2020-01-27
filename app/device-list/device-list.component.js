'use strict';

// Register `deviceList` component, along with its associated controller and template
angular.module('deviceList').component('deviceList', {
    templateUrl: 'device-list/device-list.template.html',
    controller: ['Device', '$http', 'NgMap', '$location', '$localStorage', '$timeout',
        function DeviceListController(Device, $http, NgMap, $location, $localStorage, $timeout) {
            var self = this;
            self.currentUser = $localStorage.currentUser;
            self.start = null;
            self.end = null;
            self.currentIdDevice = null;
            self.currentImei = null;
            self.currentModel = null;
            self.todayStart = moment().set({hour:0,minute:0,second:0,millisecond:0});
            self.yesterdayStart = moment().subtract(1, 'days').set({hour:0,minute:0,second:0,millisecond:0});
            self.yesterdayEnd = moment().subtract(1, 'days').set({hour:23,minute:59,second:0,millisecond:0});
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.geocoder = new google.maps.Geocoder();
            self.groups = [];
            self.currentMenuImei = null;
            self.menuTree = [];
            self.fences = [];//JSON.parse($localStorage.currentUser.fences);
            self.polygonInfoWindow = new SnazzyInfoWindow({
                content: "",
                // marker: m,
                // backgroundColor: m.backgroundColor,
                padding: '10px',
                // openOnMarkerClick: false,
                closeOnMapClick: true,
                closeWhenOthersOpen: true,
                showCloseButton: true,
                // fontColor: 'white',
                maxWidth: 1000,
                // maxHeight: 35,
                pointer: '7px',
                wrapperClass: 'area-info-window',
                // disableAutoPan: true
                position: null,
                map: self.map
            });
            // jQuery("body").on("click", ".area-info-window", function() {
            //     console.log("estoy aki");
            //     self.editPolygonInfo();
            // });
            self.features = null;

            $('#watchVideoModal').on('show.bs.modal', function (e) {
                console.log("levantando modal");

                var cameraFullUrl = window.__env.cameraUrl + self.currentIdDevice  + "/camera.jpg";
                console.log("url", cameraFullUrl);
                self.cameraOn = true;

                self.cameraVideoChannel = socket.subscribe("camera_" + self.currentIdDevice + "_channel");
                self.cameraVideoChannel.watch(function(data) {
                    if(data.image && data.idCamera == self.currentIdCamera) {
                        self.cameraVideoChannel.publish({
                            type: 'feedback',
                            idCamera: self.currentIdCamera
                        });
                        let base64Start = "data:image/jpeg;base64, ";
                        var imgElem = document.getElementById("cameraImage");
                        imgElem.setAttribute("src", base64Start + data.image);
                    }
                });

            });
            $('#watchVideoModal').on('hide.bs.modal', function (e) {
                console.log("deteniendo streaming modal");
                self.cameraOn = false;
                self.cameraChannel.publish({ type: 'stop-streaming', message: 'enviado desde la web', id: self.currentIdDevice, idCamera: self.currentIdCamera });
                var imgElem = document.getElementById("cameraImage");
                imgElem.setAttribute("src", "");
                self.cameraVideoChannel.unsubscribe("camera_" + self.currentIdDevice + "_channel");
            });

            $('#watchVideoBackupModal').on('shown.bs.modal', function (e) {
                jQuery("#video-dates-div").fadeIn();
                $('#video-dates').daterangepicker({
                    opens: "center",
                    timePicker: true,
                    timePicker24Hour: true,
                    timePickerSeconds: true,
                    autoApply: true,
                    // autoUpdateInput: false,
                    locale: {
                        format: 'MM/DD/YYYY HH:mm:ss ',
                        applyLabel: '<i class="fa fa-check"></i> Aceptar',
                        cancelLabel: '<i class="fa fa-times"></i> Cancelar'
                    },
                    alwaysShowCalendars: true,
                    startDate: moment(),
                    endDate: moment()
                }, function(start, end, label) {

                });
                $('#video-dates').on('apply.daterangepicker', function(ev, picker) {
                    var start = picker.startDate;
                    var end = picker.endDate;
                    var playlistName = moment().valueOf();
                    self.playlistName = playlistName;

                    var id = self.currentIdDevice;
                    var idCamera = self.currentIdCamera;
                    self.cameraChannel.publish({
                        type: 'start-video-backup',
                        message: 'enviado desde la web',
                        id: id,
                        initialDate: start.format("YYYY-MM-DD_HH-mm-ss") + "_hls.ts",
                        endDate: end.format("YYYY-MM-DD_HH-mm-ss") + "_hls.ts",
                        playlistName: playlistName,
                        idCamera: idCamera
                    });

                    // setTimeout(function() {
                    //
                    // }, 6000);

                    self.playlistChannel = socket.subscribe(playlistName + '_channel');
                    self.playlistChannel.watch(function(data) {
                        console.log("enviado en el playlist channel: ", data);
                        if(data.type == "no-video-available") {
                            self.noVideo = true;
                            jQuery("#waitingVideo").fadeOut();
                            // jQuery("#video1").hide();
                            jQuery("#video-dates-div").fadeIn();
                            jQuery("#no-video-message").fadeIn();
                        } else if (data.type == "play-recorded-video") {
                            console.log('play-recorded-video');
                            // jQuery(".vjs-download-button").removeClass("download-hidden");
                        } else if(data.type == "download-ready") {
                            jQuery(".vjs-download-button span").removeClass("fa-spinner fa-spin").addClass("fa-download");

                            var link = document.createElement('a');
                            link.download = "video.mp4";
                            link.href = self.downloadUrl;
                            link.target = "_blank";
                            link.click();
                            console.log(self.downloadUrl);
                        } else if(data.type == "backup-initialized") {
                            if(self.noVideo == true) {
                                self.noVideo = false;
                                // jQuery("#video1").hide();
                                return;
                            }
                            jQuery("#waitingVideo").fadeOut();
                            var cameraFullUrl = window.__env.cameraUrl + self.currentIdDevice  + "/" + self.playlistName;

                            self.downloadUrl = cameraFullUrl + "/download.mp4";
                            jQuery("#no-video-message").fadeOut();
                            jQuery("#video1 source").attr("src", cameraFullUrl + "/playlist.m3u8");
                            jQuery("#video1").show();

                            var player = videojs("video1", {
                                plugins: {
                                    alecoRangeslider: {
                                        downloadUrl: cameraFullUrl,
                                        downloadCallback: function(minTime, maxTime) {
                                            console.log("begin download");
                                            self.cameraChannel.publish({
                                                id: id,
                                                type: 'begin-download',
                                                message: 'enviado desde la web',
                                                initialTime: minTime,
                                                endTime: maxTime,
                                                playlistName: playlistName
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    });

                    jQuery("#waitingVideo").show();
                    jQuery("#video-dates-div").fadeOut();
                    // setTimeout(function(){
                    //     jQuery("#waitingVideo").fadeOut();
                    //     jQuery("#video1 source").attr("src", "http://187.162.125.161:3009/cameras/" + id + "/video/" + playlistName + "/playlist.m3u8");
                    //     jQuery("#video1").show();
                    //     var player = videojs("video1");fa-downloadfa-download
                    //     // player.src({ type: 'application/x-mpegURL', src: "http://187.162.125.161:3009/cameras/" + id + "/video/" + playlistName + "/playlist.m3u8" });
                    // }, 3000);
                    // player.stop();
                })
                var drp = $('#video-dates').data('daterangepicker');
                self.start = drp.startDate;
                self.end = drp.endDate;
            });


            $('#watchVideoBackupModal').on('hide.bs.modal', function (e) {
                jQuery("#no-video-message").fadeOut();
                jQuery("#waitingVideo").fadeOut();
                self.cameraChannel.publish({ type: 'stop-video-backup', message: 'enviado desde la web', id: self.currentIdDevice, playlistName: self.playlistName });
                var player = videojs('video1');
                player.dispose();
                var v = $("#videoToClone").clone();
                v.attr("id", "video1");
                $("#video-modal-body").append(v);
            });

            $('#cameraAutoplay').on('show.bs.modal', function (e) {
                var inAutoplay = jQuery("i[id-camera=" + self.currentIdCamera + "]").attr("in_autoplay");
                var autoplayInterval = jQuery("i[id-camera=" + self.currentIdCamera + "]").attr("autoplay_interval");
                console.log(inAutoplay, autoplayInterval);
                if(inAutoplay != "null" && inAutoplay != "false" && inAutoplay != "0")
                    document.getElementById("isInAutoplay").checked = inAutoplay;
                else
                    document.getElementById("isInAutoplay").checked = false;

                document.getElementById("cameraShowInterval").value = autoplayInterval;
            });


            self.test = function test() {

                html2canvas(document.querySelector("body"), {
                    useCORS: true
                }).then(canvas => {
                    var dataUrl = canvas.toDataURL();
                    // var imageFoo = document.createElement('img');
                    // imageFoo.src = dataUrl;
                    // $("#beforeMap").append(imageFoo);
                    var docDefinition = { content: [
                        'Pdf text',
                            {
                                image: dataUrl,
                                width: '500'
                            }
                        ] };

                    pdfMake.createPdf(docDefinition).open();
                });

                self.deviceCharts = function deviceCharts() {
                    // alert("jejejeje");
                };

            };
            self.generateSharedLink = function generateSharedLink() {
                jQuery("#load-link").show();
                jQuery("#show-link").hide("fast");
                var expirationDate = jQuery("#shareDate").data("DateTimePicker").date();
                var ids = jQuery("#chosenDevices").val();
                var saveShareQuery = $http.post(window.__env.apiUrl + 'save-share', {
                    expirationDate: expirationDate,
                    ids: ids
                });

                saveShareQuery.then(function(result) {
                    jQuery("#load-link").hide("fast");
                    jQuery("#shared-link").val(window.__env.webUrl + 'sharedscreen/' + result.data.id + '/' + result.data.url_hash);
                    jQuery("#show-link").show("fast");
                });

            };
            jQuery("#copy-button").click(function() {
                jQuery("#shared-link")[0].select();
                document.execCommand("copy");
            });
            $('#createShareLink').on('shown.bs.modal', function (e) {
                jQuery("#chosenDevices").html("");
                jQuery("#load-link").hide();
                jQuery("#shared-link").val("");
                jQuery("#show-link").hide("fast");
                jQuery("#shareDate").datetimepicker({
                    icons: {
                        time: 'fa fa-clock',
                        date: 'fa fa-calendar',
                        up: 'fa fa-chevron-up',
                        down: 'fa fa-chevron-down',
                        previous: 'fa fa-chevron-left',
                        next: 'fa fa-chevron-right',
                        today: 'fa fa-screenshot',
                        clear: 'fa fa-trash',
                        close: 'fa fa-remove'
                    },
                    minDate: 'now'
                });
                // console.log($localStorage.devices);

                for(var i = 0; i < $localStorage.devices.length; i++) {
                    var d = $localStorage.devices[i];
                    var opt = jQuery("<option></option>").val(d.idDevice).html(d.label);
                    if(self.currentImei == d.auth_device)
                        opt.attr("selected", true);
                    jQuery("#chosenDevices").append(opt);
                }
                jQuery("#chosenDevices").select2();
            });
            self.enableFenceEditionMode = function enableFenceEditionMode() {
                self.map.mapDrawingManager[0].setOptions({drawingControl:true});
                self.fences.forEach(function(elem) {
                    elem.setMap(self.map);
                });
                $("#enableFenceEditionButton").hide();
                $(".fence-edit-btn").show();
            };
            self.disableFenceEditionMode = function disableFenceEditionMode() {
                self.map.mapDrawingManager[0].setOptions({drawingControl:false});
                self.fences.forEach(function(elem) {
                    elem.setMap(null);
                });
                $("#enableFenceEditionButton").show();
                $(".fence-edit-btn").hide();
            };
            self.logOutOption = function logOutOption() {
                self.map.data.forEach(function(feat) {
                    self.map.data.remove(feat);
                });
                self.fences.forEach(function(fence) {
                    fence.setMap(null);
                });
                delete self.fences;
                self.fences = [];
                $location.path("/login");
            };
            self.updateFences = function updateImeis() {
                var fences2 = self.getGeoJson();
                jQuery("#saveFencesIcon").removeClass("fa-check").addClass("fa-spinner fa-spin");
                var fencesUpdate = $http.put(window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/updfences', {fences: fences2});
                fencesUpdate.then(function(result) {
                    jQuery("#saveFencesIcon").removeClass("fa-spinner fa-spin").addClass("fa-check");
                    $localStorage.currentUser.fences = fences2;
                    self.disableFenceEditionMode();

                });
            };
            jQuery("body").on("click", ".clear-radios-button", function() {
                self.clearRadiosRow(this);
            });
            self.clearRadiosRow = function clearRadiosRow(elem) {
                jQuery(elem).parent().find("label.active").removeClass("active");
            };
            self.setDevicesToFences = function setDevicesToFences() {
                jQuery("ul#fence-list li").each(function(index) {
                    var imei = self.currentImei;
                    var pos = jQuery(this).attr("fence-index");
                    var arr = jQuery(this).find("label.active input");
                    if(arr.length > 0) {
                        if(arr.hasClass('enter-alarm')) {
                            self.addDeviceToFence(self.fences[pos], imei, true);
                        } else {
                            self.addDeviceToFence(self.fences[pos], imei, false);
                        }
                    }
                });
            };
            self.getGeoJson = function getGeoJson() {
                // self.map.data.toGeoJson(function(data){
                //     self.features = data;
                // });
                self.features.features.length = 0;
                for(var i = 0; i < self.fences.length; i++) {
                    var polygon = self.fences[i];
                    var geoJson = self.getGeoJsonFromFence(polygon, false);

                    self.features.features.push(geoJson);
                }
                return JSON.stringify(self.features);
            };
            self.incremental = 0;
            self.getGeoJsonFromFence = function getGeoJsonFromFence(fence, withHeader) {
                var geoJson = {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[]]
                    },
                    properties: {
                        fill: "#2622e2",
                    }
                }
                for (let point of fence.getPath().getArray()) {
                    geoJson.geometry.coordinates[0].push([point.lng(), point.lat()]);
                }
                var point = fence.getPath().getArray()[0];
                geoJson.geometry.coordinates[0].push([point.lng(), point.lat()]);
                geoJson.properties = {
                    id: Date.now() + self.incremental++,
                    title: fence.title,
                    description: fence.description,
                    devices: JSON.stringify(fence.devices)
                };
                if(withHeader) {
                    var headerGeoJson = {
                        type: "FeatureCollection",
                        features: [geoJson]
                    };
                    return headerGeoJson;
                }
                return geoJson;
            };
            self.addFeatureToData = function addFeatureToData(event) {
                // if(event.type == google.maps.drawing.OverlayType.POLYGON) {
                //     var feat = new google.maps.Data.Feature({
                //         geometry: new google.maps.Data.Polygon([event.overlay.getPath().getArray()])
                //     });
                //     feat.setProperty("title", "test");
                //     self.map.data.add(feat);
                // }
                //
                //
                // google.maps.event.addListener(self.map.data, 'click', function(e) {
                //     self.fenceClick(e, this);
                // });

            };
            self.alarmFenceMarker = function alarmFenceMarker(m) {
                for(var i = 0; i < self.fences.length; i++) {
                    var f = self.fences[i];
                    var d = f.devices.find(function(elem) {
                        if(elem.imei == m.imei)
                            return elem;
                    });
                    if(d == undefined)
                        continue;
                    var isContained = google.maps.geometry.poly.containsLocation(m.getPosition(), f);
                    if(d.alarmOnEntering) {
                        if(isContained && !d.alreadyAlarmed){
                            d.alreadyAlarmed = true;
                            self.alarmFence(f, m, true);
                        } else if(!isContained && d.alreadyAlarmed){
                            d.alreadyAlarmed = false;
                        }
                    }else {
                        if(!isContained && !d.alreadyAlarmed) {
                            d.alreadyAlarmed = true;
                            self.alarmFence(f, m, false);
                        } else if(isContained && d.alreadyAlarmed) {
                            d.alreadyAlarmed = false;
                        }
                    }
                }
            };
            self.alarmFence = function alarmFence(fence, marker, enteringAlarm) {
                var geoJson = self.getGeoJsonFromFence(fence, true);
                var markerPos = marker.getPosition();
                var latitude = markerPos.lat();
                var longitude = markerPos.lng();
                var speed = marker.speed;
                var alarmType = enteringAlarm ? 'enter-fence' : 'exit-fence';
                var linkUrl = '#!device/alarm/' + latitude + "/" + longitude + "/" + speed + "/" + alarmType;
                var d = self.findDeviceByImei(marker.imei);
                // self.alarmMarker(m, alarmType, false);
                var width = (window.screen.width * 25)/100;
                var height = (window.screen.height * 25)/100;
                self.openAlarmWindow(linkUrl, width, height, d, geoJson);

            };
            self.addFencePolygon = function addFencePolygon(polygon) {
                polygon.devices = [];
                polygon.id = Date.now() + self.incremental;
                polygon.title = "Sin nombre";
                polygon.description = "Sin descripción";
                // var fence = {
                //     type: 'polygon',
                //     shape: polygon
                // };
                google.maps.event.addListener(polygon, 'click', function(e) {
                    self.fenceClick(e, this);
                });
                self.fences.push(polygon);
            };
            self.editPolygonInfo = function editPolygonInfo() {
                jQuery("#titleLabel, #descriptionLabel, #infoEdit").hide();
                jQuery("#titleInput, #descriptionInput, #infoSave").show();
            };
            self.savePolygonInfo = function savePolygonInfo() {
                var title = jQuery("#titleInput").val();
                var description = jQuery("#descriptionInput").val();
                self.clickedPolygon.title = title;
                self.clickedPolygon.description = description;
                self.polygonInfoWindow.close();
            };
            self.clickedPolygon = null;
            self.fenceClick = function fenceClick(e, polygon){
                self.clickedPolygon = polygon;
                var content = "<div class='mr-3'>" +
                    "<h5 class='' style='white-space: nowrap' id='titleLabel'>" +
                    polygon.title +
                    "</h5>" +
                    "<div><input id='titleInput' class='border rounded' type='text' style='display: none; padding: 5px;' value='" +
                    polygon.title +
                    "'></div>" +
                    "<div class='text-muted mb-2' style='white-space: nowrap' id='descriptionLabel'>" +
                    polygon.description +
                    "</div> " +
                    "<div><textarea id='descriptionInput' class='rounded my-2 border' style='display: none; padding: 5px;'>" +
                    polygon.description +
                    "</textarea></div>" +
                    "<button type='button' class='btn btn-sm btn-outline-secondary float-right infoEdit' id='infoEdit'><i class='fa fa-cog'> Editar</i></button>" +
                    "<button type='button' class='btn btn-sm btn-outline-secondary float-right infoSave' id='infoSave' style='display: none'><i class='fa fa-check'> Guardar</i></button>" +
                    "</div>";
                var a = $(content).find(".infoEdit").click(function() {
                    self.editPolygonInfo();
                }).parent();
                a = $(a).find(".infoSave").click(function() {
                    self.savePolygonInfo();
                }).parent();

                self.polygonInfoWindow.setContent(a[0]);
                self.polygonInfoWindow.setMap(self.map);
                self.polygonInfoWindow.setPosition(e.latLng);
                self.polygonInfoWindow.open();
            }
            /**
             *
             * @param fence
             * @param m
             * @param Boolean alarmOnEntering
             */
            self.addDeviceToFence = function addDeviceToFence(polygon, imei, alarmOnEntering) {
                var d = polygon.devices.find(function(elem) {
                    if(elem.imei == imei)
                        return elem;
                });
                if(d == undefined) {
                    var device = self.findDeviceByImei(imei);

                    d = {
                        alarmOnEntering: alarmOnEntering,
                        imei: imei,
                        label: device.label,
                        alreadyAlarmed: false
                    };
                    polygon.devices.push(d);
                } else {
                    d.alarmOnEntering = alarmOnEntering;
                }
            };

            var groupsQuery = "";
            console.log("current user: ", $localStorage.currentUser);
            if($localStorage.currentUser.roles.indexOf("ROLE_ADMIN_USER") >= 0) {
                groupsQuery = $http.get(window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/groups/' + false + "/" + true);
            }else if($localStorage.currentUser.username == "admin") {
                groupsQuery = $http.get(window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/groups/' + true + "/" + false);
            } else {
                groupsQuery = $http.get(window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/groups/' + false + "/" + false);
            }

            groupsQuery.then(function(result) {
                // self.groups = result.data;
                for(var i = 0; i < result.data.length; i++) {
                    self.addToGroups(result.data[i]);
                }
                // self.generateMenu();
            });
            self.hideMenu = function hideMenu() {
                $timeout(function() {
                    $("#left-menu").hide("fast");
                }, 1000);
            };
            self.updateTreeColors = function updateTreeColors() {
                console.log("updating colors");
                var nodes = $('#treeMenu').treeview('getNodes');
                var l = Object.keys(nodes).length;
                for(var i = 0; i < l; i++) {
                    if(nodes[i].level == 2) {
                        var m = self.findMarkerByImei(nodes[i].dataAttr.imei);
                        if(m.backgroundColor != undefined)
                            jQuery("li.node-treeMenu[data-imei='" + nodes[i].dataAttr.imei + "']").css('color', m.backgroundColor);
                    }
                }
            };
            self.generateMenu = function generateMenu() {
                console.log("generarting menu");
                var data2 = [];
                for(var i = 0; i < self.groups.length; i++) {
                    var root = {
                        text: self.groups[i].group_label,
                        nodes: []
                    }
                    var devices = self.groups[i].devices;
                    var imeis = $localStorage.currentUser.automatic_imeis;
                    if(imeis == undefined)
                        imeis = "";
                    let lastId = 0;
                    for(var j = 0; j < devices.length; j++) {
                        if(lastId == devices[j].id) {
                            root.nodes[root.nodes.length - 1].nodes.push({
                                text: devices[j].camera_name + "<i class='fa fa-ellipsis-v float-right px-1 test-toolbar' in_autoplay='" + devices[j].camera_in_autoplay + "' autoplay_interval='" + devices[j].camera_autoplay_interval + "' id-camera='" + devices[j].id_camera + "' url-camera='" + devices[j].url_camera + "' data-toolbar='camera-menu-options' id='" + devices[j].id + "' data-toolbar-style='dark' device-model = '" + devices[j].device_model + "' id-device = '" + devices[j].id + "' imei = '" + devices[j].auth_device + "'></i>",
                                url_camera: devices[j].url_camera,
                                name: devices[j].camera_name,
                                class: 'camera-for-' + devices[j].id
                            });
                            lastId = devices[j].id;
                            continue;
                        }
                        lastId = devices[j].id;

                        var checked = imeis.indexOf(devices[j].auth_device) != -1;
                        var elem = {
                            text: devices[j].label + "<i class='fa fa-ellipsis-v float-right px-1 test-toolbar' data-toolbar='device-menu-options' id='" + devices[j].id + "' data-toolbar-style='dark' device-model = '" + devices[j].device_model + "' id-device = '" + devices[j].id + "' imei = '" + devices[j].auth_device + "'></i>",
                            // state: {
                            //     checked: checked
                            // },
                            dataAttr: {
                                imei: devices[j].auth_device,
                                device_id: devices[j].id,
                                device_model: devices[j].device_model
                            }
                        };
                        if(devices[j].url_camera != null) {
                            elem.nodes = [{
                                text: devices[j].camera_name + "<i class='fa fa-ellipsis-v float-right px-1 test-toolbar' in_autoplay='" + devices[j].camera_in_autoplay + "' autoplay_interval='" + devices[j].camera_autoplay_interval + "' id-camera='" + devices[j].id_camera + "' url-camera='" + devices[j].url_camera + "' name-camera='" + devices[j].camera_name + "' data-toolbar='camera-menu-options' id='" + devices[j].id + "' data-toolbar-style='dark' device-model = '" + devices[j].device_model + "' id-device = '" + devices[j].id + "' imei = '" + devices[j].auth_device + "'></i>",
                                url_camera: devices[j].url_camera,
                                name: devices[j].camera_name,
                                class: 'camera-for-' + devices[j].id
                            }];
                        }
                        root.nodes.push(elem);
                    }
                    data2.push(root);
                }
                jQuery('#treeMenu').treeview({
                    data: data2,
                    levels: 3,
                    collapseIcon: 'fa fa-minus',
                    expandIcon: 'fa fa-plus',
                    showCheckbox: true,
                    uncheckedIcon: 'fa fa-square',
                    checkedIcon: 'fa fa-check',
                    partiallyCheckedIcon: 'fa fa-square',
                    hierarchicalCheck: true,
                    // backColor: 'transparent',
                    borderColor: 'transparent',
                    // showTags: true,
                    // tagsClass: 'tag tag-pill bg-primary float-right ml-1 p-1',
                    //events
                    onNodeSelected: function(event, data) {
                        var imei = data.dataAttr.imei;
                        self.currentImei = imei;
                        self.currentIdDevice =  data.dataAttr.device_id;
                        self.currentModel = data.dataAttr.device_model;
                        self.markerOptionClick(imei);
                    },
                    onNodeChecked: function(event, data) {
                        self.addMarkerToAutomatic(data.dataAttr.imei);
                        self.updateImeis();

                    },
                    onNodeUnchecked: function(event, data) {
                        self.removeMarkerFromAutomatic(data.dataAttr.imei);
                        self.updateImeis();
                    },
                    onRendered: function(event, nodes) {
                        $timeout(function() {
                            self.checkAutomatedMarkers();
                            self.updateTreeColors();
                        }, 300);
                    }
                });
            };
            self.checkAutomatedMarkers = function checkAutomatedMarkers() {
                var imeis = $localStorage.currentUser.automatic_imeis;
                if(imeis == undefined)
                    imeis = "";
                var nodes = $('#treeMenu').treeview('getNodes');
                var l = Object.keys(nodes).length;

                for(var i = 0; i < l; i++) {
                    if(nodes[i].level == 2 && imeis.indexOf(nodes[i].dataAttr.imei) != -1) {
                        $('#treeMenu').treeview('checkNode', [ nodes[i], { silent: false } ]);
                    }
                }

            };

            self.automaticOn = false;
            self.automaticTime = 5000; // time in milliseconds for automatic to change
            self.automaticPos = 0;
            self.automaticMarkers = [];
            self.getSelectedImeis = function getSelectedImeis() {
                var automaticImeis = "";
                for(var i = 0; i < self.automaticMarkers.length; i++) {
                    var imei = self.automaticMarkers[i].imei;
                    if(automaticImeis != "")
                        automaticImeis = automaticImeis + "," + imei;
                    else
                        automaticImeis = imei;
                }
                return automaticImeis;
            },
            self.updateImeis = function updateImeis() {
                var imeis = self.getSelectedImeis();
                var imeisUpdate = $http.put(window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/updimeis/' + imeis);
                imeisUpdate.then(function(result) {
                    $localStorage.currentUser.automatic_imeis = imeis;
                });
            };
            self.setIntervalToMarker = function setIntervalToMarker() {
                var m = self.findMarkerByImei(self.currentImei);
                if(m)
                    m.automaticTime = jQuery("#automaticWaitInterval").val() * 1000;
            };
            self.toggleAutomatic = function toggleAutomatic() {
                if(self.automaticOn){
                    self.stopAutomatic();
                } else {
                    self.startAutomatic();
                }
            };
            self.stopAutomatic = function stopAutomatic() {
                jQuery("#toggle-automatic-button i").removeClass("fa-pause-circle").addClass("fa-play-circle");
                self.automaticOn = false;
            };
            self.startAutomatic = function startAutomatic() {
                jQuery("#toggle-automatic-button i").removeClass("fa-play-circle").addClass("fa-pause-circle");
                self.automaticOn = true;
                self.playAutomatic();
            };
            self.addMarkerToAutomatic = function addMarkerToAutomatic(imei) {
                var m = self.findMarkerByImei(imei);
                self.automaticMarkers.push(m);
            };
            self.removeMarkerFromAutomatic = function removeMarkerFromAutomatic(imei) {
                for(var i = 0; self.automaticMarkers.length; i++) {
                    if(self.automaticMarkers[i].imei == imei){
                        self.automaticMarkers.splice(i, 1);
                        break;
                    }
                }
            };
            self.playAutomatic = function playAutomatic() {
                if(!self.automaticOn)
                    return;
                if(self.automaticMarkers.length == 0) {
                    self.stopAutomatic();
                    return;
                }
                if(self.automaticPos >= self.automaticMarkers.length) {
                    self.automaticPos = 0;
                }
                var marker = self.automaticMarkers[self.automaticPos++];
                var nextMarkerTime = self.automaticTime;
                if(marker.automaticTime != undefined && marker.automaticTime != false)
                    nextMarkerTime = marker.automaticTime;

                self.updateAddressAndDetail(marker);
                var position = marker.getPosition();
                self.map.setZoom(16);
                self.map.panTo(position);
                $timeout(function() {
                    self.playAutomatic();
                }, nextMarkerTime);

            }


            self.addToGroups = function addToGroups(data) {
                for(var j = 0; j < self.groups.length; j++) {
                    // console.log("adding to group: ", data);
                    var g = self.groups [j];
                    var groupId = data.group_id != undefined ? data.group_id : -1;
                    if(g.group_id == groupId) {
                        g.devices.push({
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device,
                            device_model: data.device_model,
                            url_camera: data.url_camera,
                            camera_name: data.camera_name,
                            id_camera: data.id_camera,
                            camera_in_autoplay: data.camera_in_autoplay,
                            camera_autoplay_interval: data.camera_autoplay_interval
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
                            auth_device: data.auth_device,
                            device_model: data.device_model,
                            url_camera: data.url_camera,
                            camera_name: data.camera_name,
                            id_camera: data.id_camera,
                            camera_in_autoplay: data.camera_in_autoplay,
                            camera_autoplay_interval: data.camera_autoplay_interval
                        }]
                    });
                } else
                    self.groups.push({
                        group_id: groupId,
                        group_label: groupId == -1 ? 'Sin Grupo' : data.group_label,
                        devices: [{
                            id: data.device_id,
                            label: data.device_label,
                            auth_device: data.auth_device,
                            device_model: data.device_model,
                            url_camera: data.url_camera,
                            camera_name: data.camera_name,
                            id_camera: data.id_camera,
                            camera_in_autoplay: data.camera_in_autoplay,
                            camera_autoplay_interval: data.camera_autoplay_interval
                        }]
                    });

            };

            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    self.map = map;
                    var devicesUrl = "";
                    if($localStorage.currentUser.roles.indexOf("ROLE_ADMIN_USER") >= 0) {
                        devicesUrl = window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/devices/' + false + "/" + true;
                    } else if($localStorage.currentUser.username == "admin") {
                        devicesUrl = window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/devices/' + true + '/' + false;
                    } else {
                        devicesUrl = window.__env.apiUrl + 'users/' + $localStorage.currentUser.id + '/devices/' + false + '/' + false;
                    }
                    $http.get(devicesUrl).then(result => {
                        var devices = result.data;
                        console.log("devices from database2: ",    devices);
                        $localStorage.devices = devices;
                        if($localStorage.devices.length > 0 && self.markersInitialized == false) {
                            self.initializeMarkers($localStorage.devices);
                        }

                    });


                    self.fences = [];
                    self.fenceIds = [];
                    google.maps.event.addListener(self.map.data, 'addfeature', function (event) {
                        if (event.feature.getGeometry().getType() === 'Polygon') {
                            var posExists = false;
                            if(self.fenceIds.indexOf(event.feature.getProperty("id")) != -1) {
                                posExists = true;
                            } else {
                                posExists = false;
                            }
                            // for(var i = 0; i < self.fenceIds.length; i++) {
                            //     var fence = self.fences[i];
                            //     console.log(i, fence);
                            //     if(self.fenceIds.indexOf(event.feature.getProperty("id")) != -1) {
                            //         console.log("DENTRO DEL IFFFFFFF");
                            //         posExists = true;
                            //         break;
                            //     }
                            //     posExists = false;
                            // }
                            // var pos = self.fences.findIndex(function(fence) {
                            //     console.log("fence id: ", fence.id);
                            //     return (fence.id != undefined && fence.id == event.feature.getProperty("id"));
                            // });
                            if(posExists)
                                return;
                            var polyPath = event.feature.getGeometry().getAt(0).getArray();
                            var poly = new google.maps.Polygon({
                                paths: polyPath,
                                fillColor: 'red',
                                strokeWeight: 1,
                                editable: true,
                                draggable: true,
                                id: event.feature.getProperty("id"),
                                title: event.feature.getProperty("title"),
                                description: event.feature.getProperty("description"),
                                devices: JSON.parse(event.feature.getProperty("devices"))
                            });

                            // poly.setMap(self.map);
                            google.maps.event.addListener(poly, 'click', function(e) {
                                self.fenceClick(e, this);
                            });

                            self.fences.push(poly);
                            self.fenceIds.push(poly.id);
                        }
                    });
                    google.maps.event.addListener(self.map, 'click', function() {
                        self.hideMenu();
                    });
                    var fs = $localStorage.currentUser.fences;
                    self.map.data.setStyle({
                        visible: false
                    });

                    self.map.data.forEach(function(feat) {
                        self.map.data.remove(feat);
                    });
                    self.map.data.addGeoJson(JSON.parse(fs));
                    self.map.data.toGeoJson(function(data){
                        self.features = data;
                    });

                    return map;
                });
            };
            self.getCurrentDate = function getCurrentDate() {
                return moment();
            };
            self.setAutomaticWaitTime = function setAutomaticWaitTime() {
                console("setting automatic wait time for this device");
            }
            self.markerOptionClick = function markerOptionClick(imei) {
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
            $('#myModal').on('shown.bs.modal', function (e) {
                $('#historical-custom').daterangepicker({
                    opens: "center",
                    timePicker: true,
                    "timePicker24Hour": true,
                    "autoApply": true,
                    locale: {
                        format: 'MM/DD/YYYY HH:mm ',
                        applyLabel: '<i class="fa fa-arrow-right"></i> Ir'
                    },
                    "alwaysShowCalendars": true,
                    "startDate": moment().hour('00').minute('00'),
                    "endDate": moment().hour('23').minute('00')
                }, function(start, end, label) {
                    self.start = start;
                    self.end = end;
                    window.open('#!device/' + self.currentIdDevice + '/historical/' + self.start.format("YYYY-MM-DD HH:mm") + '/' + self.end.format("YYYY-MM-DD HH:mm"),'_blank');
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
                var linkUrl = '#!device/' + self.currentIdDevice + '/historical/' + moment(self.start).utc().format("YYYY-MM-DD HH:mm") + '/' + moment(self.end).utc().format("YYYY-MM-DD HH:mm");
                $('#myModal').modal('hide');
                window.open(linkUrl, '_blank');
            };
            self.historicalCustomClick = function historicalCustomClick() {
                // $('#historical-dates').show("fast");
                $('#historical-custom').data('daterangepicker').toggle();
            };
            self.displayHideMenu = function displayHideMenu() {
                console.log("begininig function displayHideMenu");
                if(jQuery("#treeMenu ul").length == 0) {
                    self.generateMenu();
                    $('i[data-toolbar="device-menu-options"]').toolbar({
                        content: '#device-menu-options',
                        position: 'right',
                        // event: 'click',
                        hideOnClick: true
                    });
                    $('i[data-toolbar="camera-menu-options"]').toolbar({
                        content: '#camera-menu-options',
                        position: 'right',
                        // event: 'click',
                        hideOnClick: true
                    });
                    jQuery('i[data-toolbar="device-menu-options"], i[data-toolbar="camera-menu-options"]').on('toolbarShown',
                        function( event ) {
                            var idDevice = jQuery(this).attr("id-device");
                            var imei = jQuery(this).attr("imei");
                            var model = jQuery(this).attr("device-model");
                            var urlCamera = jQuery(this).attr("url-camera");
                            var idCamera = jQuery(this).attr("id-camera");
                            var nameCamera = jQuery(this).attr("name-camera");
                            self.currentIdDevice = idDevice;
                            self.currentImei = imei;
                            self.currentModel = model;
                            self.currentUrlCamera = urlCamera;
                            self.currentIdCamera = idCamera;
                            self.currentNameCamera = nameCamera;
                            if(model == 'GT06') {
                                $(".video-option, .video-backup-option").hide();
                                $(".video-option").attr("data-toggle", "modal");
                            } else if(model == "MDVR") {
                                $(".video-option").show();
                                $(".video-option").removeAttr("data-toggle");
                                $(".video-backup-option").hide();
                            } else {
                                self.currentCameras = [];
                                jQuery(".camera-for-" + idDevice).each(function() {
                                    let idCamera = $(this).find("i").attr("id-camera");
                                    let urlCamera = $(this).find("i").attr("url-camera");
                                    let camera = {
                                        idCamera: idCamera,
                                        urlCamera: urlCamera
                                    };
                                    self.currentCameras.push(camera);
                                });
                                $("#menu-camera-camera, #menu-camera-video").show();
                                $("#menu-device-camera, #menu-device-video").hide();
                                $(".video-option").attr("data-toggle", "modal");
                            }
                        }
                    );
                    jQuery('i[data-toolbar="device-menu-options"], i[data-toolbar="camera-menu-options"]').on('toolbarItemClick',
                        function( event, itemClicked ) {
                            if(jQuery(itemClicked).attr("id") == "device-charts") {
                                window.open('#!device/' + self.currentIdDevice + '/charts', '_blank');
                            } else if(jQuery(itemClicked).attr("id") == "menu-device-camera" || jQuery(itemClicked).attr("id") == "menu-camera-camera") {
                                if(self.currentModel == "MDVR") {
                                    var resp = $http.get(window.__env.apiUrl + 'mdvr/video-url/' + self.currentImei);
                                    resp.then(function(result) {
                                        console.log("respuesta: ", result);
                                        var urlCamera = result.data.url;
                                        window.open(urlCamera, '_blank');
                                    });
                                } else {
                                    if(jQuery(itemClicked).attr("id") == "menu-device-camera") {
                                        self.menuCameraClickAll(self.currentIdDevice, self.currentCameras);
                                        window.open('#!device/' + self.currentIdDevice + '/cameras', '_blank');
                                    } else
                                        self.menuCameraClick(self.currentIdDevice, self.currentUrlCamera, self.currentIdCamera);
                                }
                            } else if(jQuery(itemClicked).attr("id") == "menu-device-video") {
                                self.menuVideoClick(self.currentIdDevice);
                            } else if(jQuery(itemClicked).attr("id") == "menu-device-obd") {
                                self.obdMenu(self.currentIdDevice);
                            }
                        }
                    );
                }
                $("#left-menu").toggle("fast");
            };
            self.centerMarkerClick = function centerMarkerClick() {

            };
            self.openAlarm = function openAlarm(alarm) {
                var alarmType = alarm.device_info;
                var imei = alarm.device_id;
                var latitude = alarm.latitude;
                var longitude = alarm.longitude;
                var speed = alarm.speed;
                var orientation_plain = alarm.orientation_plain;
                if(alarmType == 100 || alarmType == '000') {
                    var s;
                    if(alarmType == 100)
                        s = document.getElementById("panicAlarmAudio");
                    else
                        s = document.getElementById("speedAlarmAudio");
                    s.play();

                    var linkUrl = '#!device/alarm/' + latitude + "/" + longitude + "/" + speed + "/" + alarmType;
                    var d = self.findDeviceByImei(imei);
                    var m = self.findMarkerByImei(imei);
                    self.alarmMarker(m, alarmType, false);
                    var width = (window.screen.width * 25)/100;
                    var height = (window.screen.height * 25)/100;
                    self.openAlarmWindow(linkUrl, width, height, d);
                }
            };
            self.openAlarmWindow = function openAlarmWindow(linkUrl, width, height, d, geoJson) {
                var w = window.open(linkUrl, 'newwindow-' + Date.now(), 'width=' + width + ',height=' + height + '  ');
                w.device = d;
                w.company_name = $localStorage.currentUser.company_name;
                console.log("current user", $localStorage.currentUser);
                if(geoJson){
                    w.geoJson = geoJson;
                }
            };
            self.alarmMarker = function alarmMarker(m, alarmType, isTimeout) {
                if(!isTimeout) {
                    var backgroundColor = "";
                    if(alarmType == 100) {
                        backgroundColor = '#D93444'; // rojo boton de panico
                    } else if(alarmType === '000') {
                        backgroundColor = '#E1B300'; // amarillo exceso de velocidad
                    }
                    if(m.labelWindow != undefined){
                        m.labelWindow._opts.backgroundColor = backgroundColor;
                        m.alarmed = true;
                        $timeout(function() {
                            self.alarmMarker(m, null, true);
                        }, 60000);
                    }
                } else {
                    m.labelWindow._opts.backgroundColor = m.backgroundColor;
                    m.alarmed = false;
                    m.labelWindow.close();
                    m.labelWindow.open();
                }
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
                hostname: window.__env.webSocketIp,
                port: window.__env.webSocketPort
            };
            var socket = socketCluster.connect(self.options);
            // $localStorage.socket = socket;
            socket.on('connect', function () {
                console.log("socket connected");
            });
            socket.on('error', function(e) {
                console.log("error connecting: ", e);
            });

            var mdvr = socket.subscribe('mdvr_channel');
            mdvr.watch(function(data) {
                console.log("recibido del tracker: ", data);
            });

            self.cameraChannel = socket.subscribe('camera_channel');
            self.cameraChannel.watch(function(data) {
                console.log("enviado en el camera channel: ", data);
                // let base64Start = "data:image/jpeg;base64, ";
                // var imgElem = document.getElementById("cameraImage");
                // imgElem.setAttribute("src", base64Start + data.image);
            });
            self.cameraSingleChannel = socket.subscribe("camera_single_channel");
            self.cameraSingleChannel.watch(function(data) {
                if (data.type == "single-camera") {
                    console.log(data);
                    // let base64Start = "data:image/jpeg;base64, ";
                    var vehicle = data.vehicle;
                    var cameraName = data.name;
                    var image = new Image();
                    image.src = "data:image/jpg;base64," + data.image;
                    image.style = "height: 95%; padding-botton: 1px";
                    self.openCameraAutoplayWindow(image, cameraName, vehicle);
                    // var imgElem = document.getElementById("cameraImage");
                    // imgElem.setAttribute("src", base64Start + data.image);
                }
            });

            // self.obdChannel = socket.subscribe('obd_channel');
            // self.obdChannel.watch(function(data) {
            //     if(data.type == 'obd-info-response') {
            //         console.log("from python: ", data.message);
            //     }
            // });


            // var socketBB = socketCluster.connect(self.optionsBB);
            // socketBB.on('connect', function () {
            // });
            $localStorage.markers = {};
            self.markersInitialized = false;
            console.log("voy a pedir los devices");

            // if(self.map != undefined) {
            // }


            self.initialLatitude = null;
            self.initialLongitude = null;
            self.initializeMarkers = function initializeMarkers(devices) {

                console.log("devices en el initialize markers: ", devices);
                self.markersInitialized = true;

                for(var i = 0; i < devices.length; i++) {
                    var device = devices[i];
                        if(device.peripheral_gps_data[0] == undefined)
                        continue;
                    if(self.initialLatitude == null) {
                        self.initialLatitude = device.peripheral_gps_data[0].lat;
                        self.initialLongitude = device.peripheral_gps_data[0].lng;
                    }
                    var local = moment.utc(device.peripheral_gps_data[0].updatedAt).toDate();
                    var lastUpdate = moment(local).format("DD/MM/YYYY HH:mm:ss");
                    var offText =  moment(local).fromNow();
                    var speed = device.peripheral_gps_data[0].speed;
                    var gpsStatus = device.peripheral_gps_data[0].gps_status == 1 ? 'Off' : 'On';
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

                    var content = "<p style='white-space: nowrap'>" + device.label + "<span id='offtext-" + device.idDevice + "'></span></p>";
                    if(m.gpsStatus == "Off") {
                        var offText = self.getOffText(moment.utc(device.peripheral_gps_data[0].updatedAt));
                        content = "<p style='white-space: nowrap'>" + device.label + "<span id='offtext-" + device.idDevice + "'> - " + offText + "</span></p>";
                    }
                    var infoWindow = new SnazzyInfoWindow({
                        content: content,
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
                        panOnOpen: false,
                    });
                    m.labelWindow = infoWindow;
                    infoWindow.open();
                    // var selector = "#offtext-" + m.id;
                    // if(m.gpsStatus == 'Off') {
                    //     console.log("voy a poner off: ", offText);
                    //     // m.labelWindow.setContent(m.labelWindow.getContent() + "(" + offText + ")");
                    //     // console.log("en un off: ", selector);
                    //     $(selector).html("(" + offText + ")");
                    // } else {
                    //     $(selector).html("");
                    // }


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
                        self.alarmFenceMarker(this);
                    });

                    // if(device.auth_device != "345807163")
                    $localStorage.markers[device.auth_device] = m;
                    var g = null;
                    var alarmsSocket = null;
                    if(devices[i].mdvr_number == null) {
                        g = socket.subscribe(devices[i].auth_device);
                        alarmsSocket = socket.subscribe("alarms_" + devices[i].auth_device);
                    } else {
                        g = socket.subscribe(devices[i].mdvr_number);
                        alarmsSocket = socket.subscribe("alarms_" + devices[i].mdvr_number);
                    }
                    g.watch(function(data) {
                        var imei = data.device_id;
                        if(data.mdvr_number != undefined)
                            imei = self.findImeiByMdvrNumber(data.device_id);
                        var m = $localStorage.markers[imei];
                        if(m != undefined) {
                            var lastUpdate;
                            var offText = "";

                            if(data.mdvr_number) {
                                lastUpdate = data.date;
                                var momentDate = moment(lastUpdate, "YYYY-MM-DD HH:mm:s.S")
                                lastUpdate = momentDate.format("DD/MM/YYYY HH:mm:ss");
                                offText = self.getOffText(momentDate);
                            } else if(data.date) {
                                lastUpdate = self.getDateByHex(data.date);
                            } else {
                                lastUpdate = moment().format("YYYY-MM-DD HH:mm:ss");
                            }
                            m.setPosition(new google.maps.LatLng( data.latitude,data.longitude));
                            m.speed = data.speed;
                            m.orientation = data.orientation_plain;
                            m.gpsStatus = data.gps_status == 1 ? 'Off' : 'On';
                            var selector = "#offtext-" + m.id;
                            if(m.gpsStatus == 'Off') {
                                $(selector).html(" - " + offText);
                            } else {
                                $(selector).html("");
                            }
                            m.lastUpdate = lastUpdate;
                            self.rotateMarker(m, data.orientation_plain);
                            self.updateMarkerColor(m);
                            if(self.currentMenuImei == data.device_id) {
                                self.map.panTo(new google.maps.LatLng(data.latitude, data.longitude));
                                self.updateMarkerColor(m);
                                self.getAddress(data.latitude, data.longitude, true, m.backgroundColor);
                                self.refreshDetailWindow(m);
                                self.updateTreeColors();
                            }
                            self.alarmFenceMarker(m);
                        }
                    });

                    alarmsSocket.watch(function(data) {
                        console.log(data);
                        if(data.imei) {
                            var m = $localStorage.markers[data.imei.trim()];
                            var alarmData =  {
                                device_info: 100,
                                device_id: data.imei.trim(),
                                latitude: m.getPosition().lat(),
                                longitude: m.getPosition().lng(),
                                speed: m.speed,
                                orientation_plain: m.orientation,
                            };
                            console.log("alarma recibida: ", alarmData)
                            self.openAlarm(alarmData);
                        } else {
                            self.openAlarm(data);
                        }
                    });
                }

                for(var i = 0; i < devices.length; i++) {
                    // console.log("imei: ", devices[i].auth_device)
                    let m = $localStorage.markers[devices[i].auth_device];
                    // console.log("last update: ", m.lastUpdate)
                    if(m.lastUpdate == "") {
                        // console.log("Fecha no valida. Desactivalo...");
                        m.gpsStatus = 'Off';
                        self.updateMarkerColor(m);
                    } else {
                        var momentDate = moment(m.lastUpdate, "DD/MM/YYYY HH:mm:ss");
                        // console.log("desde: ", momentDate.fromNow());
                        // console.log("en segundos: ", moment().diff(momentDate, 'seconds'));
                        let diffInSeconds = moment().diff(momentDate, 'seconds');
                        if(diffInSeconds > 60) {
                            // console.log("Desactivalo...");
                            m.gpsStatus = 'Off';
                            self.updateMarkerColor(m);
                        }

                    }
                }
                self.updateTreeColors();

                setInterval(function() {
                    for(var i = 0; i < devices.length; i++) {
                        // console.log("imei: ", devices[i].auth_device)
                        let m = $localStorage.markers[devices[i].auth_device];
                        // console.log("last update: ", m.lastUpdate)
                        if(m.lastUpdate == "") {
                            // console.log("Fecha no valida. Desactivalo...");
                            m.gpsStatus = 'Off';
                            self.updateMarkerColor(m);
                        } else {
                            var momentDate = moment(m.lastUpdate, "DD/MM/YYYY HH:mm:ss");
                            // console.log("desde: ", momentDate.fromNow());
                            // console.log("en segundos: ", moment().diff(momentDate, 'seconds'));
                            let diffInSeconds = moment().diff(momentDate, 'seconds');
                            if(diffInSeconds > 60) {
                                // console.log("Desactivalo...");
                                m.gpsStatus = 'Off';
                                self.updateMarkerColor(m);
                            }

                        }
                    }
                    self.updateTreeColors();
                }, 60000);
            };

            self.findImeiByMdvrNumber = function findImeiByMdvrNumber(mdvrNumber) {
                if($localStorage.devices == undefined)
                    return false;
                for (var k = 0; k < $localStorage.devices.length; k++) {
                    var d = $localStorage.devices[k];
                    if(d.mdvr_number == mdvrNumber)
                        return d.auth_device.toString();
                }
                return false;
            };

            self.rotateMarker = function(m, degrees) {
                var icon2 = m.icon;
                icon2.rotation = degrees;
                m.setIcon(icon2);
            };
            self.updateMarkerColor = function updateMarkerColor(m) {
                // if(m.labelWindow != undefined)
                //     m.labelWindow._opts.backgroundColor = 'blue';
                var backgroundColor = '#1C9918'; // default for when is moving
                if(m.gpsStatus === 'Off')
                    backgroundColor = '#6A7272'; // dark for status off
                else if(m.speed == 0)
                    backgroundColor = '#248DFD'; // blue for stopped '#E1B300';
                m.backgroundColor = backgroundColor;
                if(m.labelWindow != undefined && (m.alarmed == undefined || m.alarmed == false)){
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
                if(str != undefined) {
                    var year = parseInt(str.substr(0, 2), 16).toString();
                    var month = parseInt(str.substr(2, 2), 16).toString();
                    var day = parseInt(str.substr(4, 2), 16).toString();
                    var hour = parseInt(str.substr(6, 2), 16).toString();
                    var min = parseInt(str.substr(8, 2), 16).toString();
                    var sec = parseInt(str.substr(10, 2), 16).toString();
                    var dateStr = year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;
                    var dateFormatted = moment(dateStr, "YY/M/D H:m:s").format("DD/MM/YYYY HH:mm:ss");
                    return dateFormatted;
                } else {
                    return "";
                }
            };

            self.getOffText = function getOffText(momentDate){

                var offText = momentDate.fromNow();
                offText = offText.replace("hace", "Off")
                    .replace("horas", "Hrs")
                    .replace("hora", "Hr")
                    .replace("en", "Off")
                ;
                return offText;
            };

            self.menuCameraClick = function menuCameraClick(id, urlCamera = null, idCamera = null) {
                self.cameraChannel.publish({
                    type: 'start-streaming',
                    message: 'enviado desde la web',
                    id: id,
                    urlCamera: urlCamera,
                    idCamera: idCamera
                });
            };

            self.menuCameraClickAll = function menuCameraClickAll(id, cameras) {
                self.cameraChannel.publish({
                    type: 'start-streaming',
                    message: 'enviado desde la web',
                    id: id,
                    cameras: cameras,
                    multiple: true
                });
            };

            self.menuVideoClick = function menuVideoClick(id) {
                console.log("camera click, device id: ", id);

            };


            self.makeFullScreen = function(id) {
                var divObj = document.getElementById(id);
                //Use the specification method before using prefixed versions
                if (divObj.requestFullscreen) {
                    divObj.requestFullscreen();
                }
                else if (divObj.msRequestFullscreen) {
                    divObj.msRequestFullscreen();
                }
                else if (divObj.mozRequestFullScreen) {
                    divObj.mozRequestFullScreen();
                }
                else if (divObj.webkitRequestFullscreen) {
                    divObj.webkitRequestFullscreen();
                } else {
                    console.log("Fullscreen API is not supported");
                }

            };

        //    code for minimize modal

            var $content, $modal, $apnData, $modalCon;

            $content = $(".min");

            $(".modalMinimize").on("click", function() {
                $modalCon = $(this).closest(".mymodal").attr("id");
                $apnData = $(this).closest(".mymodal");
                $modal = "#" + $modalCon;
                $(".modal-backdrop").addClass("display-none");
                $($modal).toggleClass("min");

                if ($($modal).hasClass("min")) {
                    $(this).closest(".minmaxCon").addClass("big-z-index").append($apnData);
                    $(this).find("i").toggleClass('fa-minus').toggleClass('fa-clone');
                } else {
                    $(".modal-backdrop").removeClass("display-none");
                    $(".container").append($apnData);
                    $(this).find("i").toggleClass('fa-clone').toggleClass('fa-minus');
                    $(this).closest(".minmaxCon").removeClass("big-z-index");
                }
            });

            $("body").on("click", ".min button.minimize-close", function() {
                $(this).closest(".minmaxCon").find(".modalMinimize i").toggleClass('fa-clone').toggleClass('fa-minus');
                $(this).closest(".minmaxCon").removeClass("big-z-index");
                $(this).closest(".min").toggleClass("min");
            });

            self.openCameraAutoplayWindow = function(image, name, vehicle) {
                // var w = window.open(linkUrl, 'newwindow-' + Date.now(), 'width=' + width + ',height=' + height + '  ');
                // w.device = d;
                var width = (window.screen.width * 35)/100;
                var height = (window.screen.height * 55)/100;
                console.log("test")
                var w = window.open("image", 'newwindow-' + Date.now(), 'width=' + width + ',height=' + height + '  ');

                w.document.write("<p style='text-align: center;'>Veh&iacute;culo: " + vehicle + " --- C&aacute;mara: " + name +  "</p>");
                w.document.write("<div style='width: 100%; text-align: center;'>" + image.outerHTML + "</div>");
            };

            self.setIntervalToCamera = function setIntervalToCamera() {

                var isInAutoplay = jQuery("#isInAutoplay")[0].checked;
                var interval = null;
                if(isInAutoplay) {
                    interval = jQuery("#cameraShowInterval").val();
                    jQuery.post(window.__env.apiUrl + "cameras/" + self.currentIdCamera + "/setAutoplay", {interval: interval}, function(data) {
                        self.cameraSingleChannel.publish({
                            type: 'load-camera-autoplay',
                        });
                    });
                } else {
                    jQuery.get(window.__env.apiUrl + "cameras/" + self.currentIdCamera + "/removeAutoplay", function (data) {
                        self.cameraSingleChannel.publish({
                            type: 'load-camera-autoplay',
                        });

                    });
                }

                jQuery("i[id-camera=" + self.currentIdCamera + "]").attr("in_autoplay", isInAutoplay);
                jQuery("i[id-camera=" + self.currentIdCamera + "]").attr("autoplay_interval", interval);
            };

        }
    ]
});
