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
            hostname: "189.207.202.64",
            port: 3001
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
            // console.log(Object.keys($localStorage.markers));
            clearMarkers();
            clearDevices();
            AuthenticationService.Logout();
        }

        function login() {
            vm.loading = true;
            AuthenticationService.Login(vm.username, vm.password, function (result) {
                if (result === true) {
                    $location.path('/');
                } else {
                    vm.error = 'Username or password is incorrect';
                    vm.loading = false;
                }
            });
        }

        function clearDevices() {
            if($localStorage.devices == undefined)
                return;
            for (var k = 0; k < $localStorage.devices.length; k++) {
                var d = $localStorage.devices[k];
                vm.socket.unsubscribe(d.auth_device);
                vm.socket.unsubscribe("alarms_" + d.auth_device);
            }
        }

        function clearMarkers() {
            if ($localStorage.markers == undefined)
                return;
            Object.keys($localStorage.markers).forEach(function (key, index) {
                this[key].setMap(null);

                delete this[key];

            }, $localStorage.markers);
        }
    }
})();