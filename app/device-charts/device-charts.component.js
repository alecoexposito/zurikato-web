'use strict';

// Register `deviceHistorical` component, along with its associated controller and template
angular.module('deviceCharts').component('deviceCharts', {
    templateUrl: 'device-charts/device-charts.template.html',
    controller: ['Device', '$http', '$timeout', 'NgMap', '$routeParams',
        function DeviceChartsController(Device, $http, $timeout, NgMap, $routeParams) {
            var self = this;
            self.chart = null;
            self.chart2 = null;
            self.chart3 = null;
            self.ajaxDistance = function(start, end) {
                var records = $http.get(window.__env.apiUrl + 'devices/' + $routeParams.deviceId + '/coordinatesByDates?start_date=' + start.utc().format("YYYY-MM-DD HH:mm") + '&end_date=' + end.utc().format("YYYY-MM-DD HH:mm"))
                records.then(function(result) {
                    let chartData = self.chartDistanceData(result.data);
                    self.loadChart(self.chart3, chartData);
                });
            };
            self.chartDistanceData = function(data) {
                let coordinatesArray = [];
                var lastDay = null;
                var groupDistance = 0;
                var resultArray = [];
                for(var i = 0; i < data.length - 1; i++) {
                    if(lastDay == null) {
                        lastDay = data[i].day;
                    }
                    if(lastDay != data[i].day){
                        let distance = google.maps.geometry.spherical.computeLength(coordinatesArray);
                        let obj = {
                            label: lastDay,
                            data: (distance / 1000).toFixed(2)
                        }
                        resultArray.push(obj);
                        // coordinatesArray.length = 0;
                        lastDay = data[i].day;
                    }
                    let lat1 = data[i].lat;
                    let lng1 = data[i].lng;
                    let latLng1 = new google.maps.LatLng(lat1,lng1);
                    coordinatesArray.push(latLng1);
                }
                return resultArray;

            }
            self.ajaxSpeedAverage = function(start, end) {
                var records = $http.get(window.__env.apiUrl + 'devices/' + $routeParams.deviceId + '/speedAverage?start_date=' + start.utc().format("YYYY-MM-DD HH:mm") + '&end_date=' + end.utc().format("YYYY-MM-DD HH:mm"))
                records.then(function(result) {
                    self.loadChart(self.chart, result.data);
                });
            };
            self.ajaxAlarmsByType = function(start, end) {
                var records = $http.get(window.__env.apiUrl + 'devices/' + $routeParams.deviceId + '/alarmsByType?start_date=' + start.utc().format("YYYY-MM-DD HH:mm") + '&end_date=' + end.utc().format("YYYY-MM-DD HH:mm"))
                records.then(function(result) {
                    self.loadChart(self.chart2, result.data);
                });
            };
            self.loadChart = function(chart, data) {
                chart.data.labels.length = 0;
                chart.data.datasets.forEach((dataset) => {
                    dataset.data.length = 0;
                });
                for(var i = 0; i < data.length; i++) {
                    let l = data[i].label;
                    // l = l.substr(l.length - 2, 2);
                    // l = isNaN(l) == false ? data[i].label + "" : data[i].label;
                    chart.data.labels.push(l);
                    chart.data.datasets.forEach((dataset) => {
                        dataset.data.push(data[i].data);
                    });
                }
                chart.update();
            };
            self.init = function init() {
                $('#chartsDates').daterangepicker({
                    opens: "center",
                    timePicker: true,
                    "timePicker24Hour": true,
                    "autoApply": true,
                    locale: {
                        format: 'MM/DD/YYYY HH:mm ',
                        applyLabel: '<i class="fa fa-arrow-right"></i> Go'
                    },
                    "alwaysShowCalendars": true,
                    "startDate": moment().hour('00').minute('00'),
                    "endDate": moment().hour('23').minute('59')
                }, function(start, end, label) {
                    self.ajaxSpeedAverage(start, end);
                    self.ajaxAlarmsByType(start, end);
                    self.ajaxDistance(start, end);
                });

                self.ajaxSpeedAverage(moment().hour('00').minute('00'), moment().hour('23').minute('59'));
                self.ajaxAlarmsByType(moment().hour('00').minute('00'), moment().hour('23').minute('59'));
                self.ajaxDistance(moment().hour('00').minute('00'), moment().hour('23').minute('59'));


                var ctx = document.getElementById('speedOverTime').getContext('2d');
                self.chart = new Chart(ctx, {
                    // The type of chart we want to create
                    type: 'line',
                    options: {
                        title: {
                            text: 'Velocidades Alcanzadas',
                            display: true,
                            position: 'top',
                            fontSize: 20
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    fontStyle: 'bold'
                                }
                            }],
                            yAxes: [{
                                ticks: {
                                    fontStyle: 'bold',
                                }
                            }]
                        }
                    },

                    // The data for our dataset
                    data: {
                        labels: [],
                        datasets: [{
                            label: "Velocidad (Km/h)",
                            backgroundColor: 'rgb(255, 99, 132)',
                            borderColor: 'rgb(255, 99, 132)',
                            fill: false,
                            data: [],
                        }]
                    },

                    // Configuration options go here
                });

                var ctx2 = document.getElementById('alarmsByType').getContext('2d');
                self.chart2 = new Chart(ctx2, {
                    // The type of chart we want to create
                    type: 'bar',

                    // The data for our dataset
                    data: {
                        labels: [],
                        datasets: [{
                            label: "Cantidad de alarmas",
                            backgroundColor: 'rgb(255, 99, 132)',
                            borderColor: 'rgb(255, 99, 132)',
                            fill: false,
                            data: [],
                        }]
                    },

                    // Configuration options go here
                    options: {
                        title: {
                            text: 'Alarmas por tipo',
                            display: true,
                            position: 'top',
                            fontSize: 20
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    stepSize: 1,
                                    fontStyle: 'bold',
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    fontStyle: 'bold',
                                    fontSize: '16'
                                }
                            }]
                        }
                    }
                });

                var ctx3 = document.getElementById('distanceByDates').getContext('2d');
                self.chart3 = new Chart(ctx3, {
                    // The type of chart we want to create
                    type: 'line',

                    // The data for our dataset
                    data: {
                        labels: [],
                        datasets: [{
                            label: "Cantidad de kilometros",
                            backgroundColor: 'rgb(255, 99, 132)',
                            borderColor: 'rgb(255, 99, 132)',
                            fill: false,
                            data: [],
                        }]
                    },

                    // Configuration options go here
                    options: {
                        title: {
                            text: 'Kilometros recorridos',
                            display: true,
                            position: 'top',
                            fontSize: 20
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    fontStyle: 'bold'
                                }
                            }],
                            yAxes: [{
                                ticks: {
                                    fontStyle: 'bold'
                                }
                            }]
                        }

                    }
                });


            };
            jQuery(document).ready(function(){
                self.init();
            });

        }
    ]
});
