'use strict';

angular.
  module('core.device').
  factory('Device', ['$resource',
    function($resource) {
      return $resource('http://189.207.202.64:3007/api/v1/users/2/devices', {}, {
        query: {
          method: 'GET',
          // params: {phoneId: 'phones'},
          isArray: true,
          headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RlckBnbWFpbC5jb20iLCJsYWJlbCI6InRlc3RlciIsInBhc3MiOiIkMmEkMTAkdTh3RzJGNXVQR0MxM0Y4WE1nWS9XZVcvVU1WOC8wNmFnNnR2LnB2YWZRYWR6b1kydnhzSi4iLCJwYXJlbnQiOiIxIiwidXNlclR5cGUiOiIyIiwiYWN0aXZlIjoiMSIsInRlbGVwaG9uZSI6IjIzMTMyMzIxMzIxMzEiLCJzYWx0IjoiJDJhJDEwJHU4d0cyRjV1UEdDMTNGOFhNZ1kvV2UiLCJpYXQiOjE1MTYxMTg5MjEsImV4cCI6MTUxNjcyMzcyMX0.zBGZCzAqddY9qVWdr27Ny0Kgv2YgYOAmdHixl-3mctY' }
        }
      });

    }
  ]);












// function($resource) {
//     return $resource('http://189.207.202.64:3007/api/v1/devices/1/history?start_date=2018-03-07%2014:20:00&end_date=2018-03-08%2014:20:00', {}, {
//         historical: {
//             method: 'GET',
//             // params: {phoneId: 'phones'},
//             isArray: true,
//             // headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RlckBnbWFpbC5jb20iLCJsYWJlbCI6InRlc3RlciIsInBhc3MiOiIkMmEkMTAkdTh3RzJGNXVQR0MxM0Y4WE1nWS9XZVcvVU1WOC8wNmFnNnR2LnB2YWZRYWR6b1kydnhzSi4iLCJwYXJlbnQiOiIxIiwidXNlclR5cGUiOiIyIiwiYWN0aXZlIjoiMSIsInRlbGVwaG9uZSI6IjIzMTMyMzIxMzIxMzEiLCJzYWx0IjoiJDJhJDEwJHU4d0cyRjV1UEdDMTNGOFhNZ1kvV2UiLCJpYXQiOjE1MTYxMTg5MjEsImV4cCI6MTUxNjcyMzcyMX0.zBGZCzAqddY9qVWdr27Ny0Kgv2YgYOAmdHixl-3mctY' }
//         }
//     });
// }