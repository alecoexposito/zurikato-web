'use strict';

// Register `deviceList` component, along with its associated controller and template
angular.module('deviceList').component('deviceList', {
    templateUrl: 'device-list/device-list.template.html',
    controller: ['Device', 'NgMap',
        function DeviceListController(Device, NgMap) {
            var self = this;
            this.devices = Device.query();
            this.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBHsRJFKmB3_E_DGrluQKMRIYNdT8v8CwI";
            self.getMap = function getMap() {
                NgMap.getMap().then(function (map) {
                    // console.log(map.getCenter());
                    // console.log('markers', map.markers);
                    // console.log('shapes', map.shapes);
                    return map;
                });
            }
            var map = self.getMap();


        }
    ]
});
