(function () {
    'use strict';

    angular
        .module('phonecatApp')
        .controller('Login.IndexController', Controller);

    function Controller($location, AuthenticationService, $localStorage, $cookies) {
        var vm = this;

        vm.login = login;
        vm.options = {
            secure: false,
            hostname: window.__env.webSocketIp,
            port: window.__env.webSocketPort
        };
        vm.socket = socketCluster.connect(vm.options);
        initController();

        function initController() {

            console.log("Trying to connect");

            // $localStorage.socket = socket;
            vm.socket.on('connect', function () {
                console.log('CONNECTED');
                console.log(vm.socket.state);
            });
            // reset login status
            console.log("before clear markers: ", Object.keys($localStorage.markers));

            clearMarkers();
            console.log("after clear markers: ", Object.keys($localStorage.markers));
            clearDevices();
            AuthenticationService.Logout();
        }

        function login() {
            vm.loading = true;
            AuthenticationService.Login(vm.username, vm.password, function (result) {
                if (result === true) {
                    $location.path('/');
                } else {
                    vm.error = 'Credenciales incorrectas';
                    vm.loading = false;
                }
            });
        }

        function clearDevices() {
            if($localStorage.devices == undefined)
                return;
            for (var k = 0; k < $localStorage.devices.length; k++) {
                var d = $localStorage.devices.pop();
                vm.socket.unsubscribe(d.auth_device);
                vm.socket.unsubscribe("alarms_" + d.auth_device);
            }
        }

        function clearMarkers() {
            if ($localStorage.markers == undefined)
                return;
            Object.keys($localStorage.markers).forEach(function (key, index) {
                this[key].setMap(null);
                this[key].labelWindow.close();
                delete this[key];

            }, $localStorage.markers);
        }
    }
})();