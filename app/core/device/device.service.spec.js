'use strict';

describe('Device', function() {
  var $httpBackend;
  var Device;
  var devicesData = [
    {name: 'Device X'},
    {name: 'Device Y'},
    {name: 'Device Z'}
  ];

  // Add a custom equality tester before each test
  beforeEach(function() {
    jasmine.addCustomEqualityTester(angular.equals);
  });

  // Load the module that contains the `Device` service before each test
  beforeEach(module('core.device'));

  // Instantiate the service and "train" `$httpBackend` before each test
  beforeEach(inject(function(_$httpBackend_, _Device_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('devices/devices.json').respond(devicesData);

    Device = _Device_;
  }));

  // Verify that there are no outstanding expectations or requests after each test
  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fetch the devices data from `/devices/devices.json`', function() {
    var devices = Device.query();

    expect(devices).toEqual([]);

    $httpBackend.flush();
    expect(devices).toEqual(devicesData);
  });

});
