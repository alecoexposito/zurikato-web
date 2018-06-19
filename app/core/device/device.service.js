'use strict';

angular.
  module('core.device').
  factory('Device', ['$resource', '$localStorage',
    function($resource, $localStorage) {
      return $resource('http://69.64.32.172:3007/api/v1/users/:userId/devices', {}, {
        query: {
          method: 'GET',
          isArray: true,
          // params: {userId: 'phones'},
          headers: { 'Authorization': 'Bearer ' + $localStorage.currentUser.token }
        }
      });

    }
  ]);












// function($resource) {
//     return $resource('http://69.64.32.172:3007/api/v1/devices/1/history?start_date=2018-03-07%2014:20:00&end_date=2018-03-08%2014:20:00', {}, {
//         historical: {
//             method: 'GET',
//             // params: {phoneId: 'phones'},
//             isArray: true,
//             // headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RlckBnbWFpbC5jb20iLCJsYWJlbCI6InRlc3RlciIsInBhc3MiOiIkMmEkMTAkdTh3RzJGNXVQR0MxM0Y4WE1nWS9XZVcvVU1WOC8wNmFnNnR2LnB2YWZRYWR6b1kydnhzSi4iLCJwYXJlbnQiOiIxIiwidXNlclR5cGUiOiIyIiwiYWN0aXZlIjoiMSIsInRlbGVwaG9uZSI6IjIzMTMyMzIxMzIxMzEiLCJzYWx0IjoiJDJhJDEwJHU4d0cyRjV1UEdDMTNGOFhNZ1kvV2UiLCJpYXQiOjE1MTYxMTg5MjEsImV4cCI6MTUxNjcyMzcyMX0.zBGZCzAqddY9qVWdr27Ny0Kgv2YgYOAmdHixl-3mctY' }
//         }
//     });
// }