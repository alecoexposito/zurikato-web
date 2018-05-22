'use strict';

angular.
  module('phonecatApp').
  config(['$locationProvider' ,'$routeProvider',
    function config($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');

      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        }).
        when('/devices', {
          template: '<device-list></device-list>'
        }).
        when('/device/:deviceId/historical/:start/:end', {
            template: '<device-historical></device-historical>'
        }).
        when('/device/alarm/:latitude/:longitude/:speed/:alarmType', {
            template: '<device-alarm></device-alarm>'
        }).
        when('/login', {
          templateUrl: 'login/index.view.html',
          controller: 'Login.IndexController',
          controllerAs: 'vm'
        }).
        otherwise('/devices');
    }
  ]).run(run);
  function run($rootScope, $http, $location, $localStorage) {
      // keep user logged in after page refresh
      if ($localStorage.currentUser) {
          $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.currentUser.token;
      }

      // redirect to login page if not logged in and trying to access a restricted page
      $rootScope.$on('$locationChangeStart', function (event, next, current) {
          var publicPages = ['/login'];
          var restrictedPage = publicPages.indexOf($location.path()) === -1;
          if (restrictedPage && !$localStorage.currentUser) {
              $location.path('/login');
          }
      });
  }