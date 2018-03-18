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
        when('/device/:deviceId/historical', {
            template: '<device-historical></device-historical>'
        }).
        otherwise('/devices');
    }
  ]);
