(function () {
    'use strict';

    angular
        .module('core.authentication')
        .factory('AuthenticationService', Service);

    function Service($http, $localStorage, $cacheFactory, $cookies) {
        var service = {};

        service.Login = Login;
        service.Logout = Logout;
        return service;

        function Login(username, password, callback) {
            $http.post('http://189.207.202.64:3007/api/v1/login', { email: username, pass: password })
                .success(function (response) {
                    // login successful if there's a token in the response
                    if (response.auth_token) {
                        // store username and token in local storage to keep user logged in between page refreshes
                        $localStorage.currentUser = { username: username, token: response.auth_token, id: response.id, automatic_imeis: response.automatic_imeis };
                        SaveTokenInCookie(response.auth_token);
                        // add jwt token to auth header for all requests made by the $http service
                        $http.defaults.headers.common.Authorization = 'Bearer ' + GetTokenFromCookie();
                        // execute callback with true to indicate successful login
                        callback(true);
                    } else {
                        // execute callback with false to indicate failed login
                        callback(false);
                    }
                })
                .error(function(response) {
                    callback(false);
                });
        }

        function SaveTokenInCookie(t) {
            $cookies.put("auth_token", t);
        }

        function GetTokenFromCookie() {
            return $cookies.get('auth_token');
        }

        function Logout() {
            // remove user from local storage and clear http auth header
            delete $localStorage.currentUser;
            $cookies.remove("auth_token");
            $cacheFactory.get('$http').removeAll();
            $http.defaults.headers.common.Authorization = '';
        }
    }
})();