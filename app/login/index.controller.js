(function () {
    'use strict';

    angular
        .module('phonecatApp')
        .controller('Login.IndexController', Controller);

    function Controller($location, AuthenticationService, $localStorage) {
        var vm = this;

        vm.login = login;

        initController();

        function initController() {
            // reset login status
            // console.log(Object.keys($localStorage.markers));
            clearMarkers();
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

       function clearMarkers() {
           Object.keys($localStorage.markers).forEach(function(key, index) {
               this[key].setMap(null);
               delete this[key];

           }, $localStorage.markers);
           console.log("markers cleared ");
           // console.log($localStorage.markers);
        }
    }
})();