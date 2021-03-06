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
        when('/sharedscreen/:shareid/:urlhash', {
            template: '<shared-screen></shared-screen>'
        }).
        when('/sharedvideo/:id', {
            template: '<shared-video></shared-video>'
        }).
        when('/login', {
            templateUrl: 'login/index.view.html',
            controller: 'Login.IndexController',
            controllerAs: 'vm'
        }).
        when('/device/:deviceId/charts', {
            template: '<device-charts></device-charts>'
        }).
        otherwise('/devices');
    }
  ]).run(run);
  function run($rootScope, $http, $location, $localStorage, $cookies) {
      // keep user logged in after page refresh
      if ($localStorage.currentUser) {
          $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.currentUser.token;
      }

      // redirect to login page if not logged in and trying to access a restricted page
      $rootScope.$on('$locationChangeStart', function (event, next, current) {
          var publicPages = ['/login'];
          var restrictedPage = true;
          if(publicPages.indexOf($location.path()) !== -1 || $location.path().indexOf("sharedscreen") !== -1 || $location.path().indexOf("sharedvideo") !== -1) {
              restrictedPage = false;
          }
          if (restrictedPage && !$cookies.get("auth_token")) {
              $location.path('/login');
          }
      });
  }
