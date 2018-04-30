'use strict';

describe('deviceAlarm', function() {

  // Load the module that contains the `deviceAlarm` component before each test
  beforeEach(module('deviceAlarm'));

  // Test the controller
  describe('deviceAlarmController', function() {
    var $httpBackend, ctrl;

    beforeEach(inject(function($componentController, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('devices/devices.json')
                  .respond([{name: 'Nexus S'}, {name: 'Motorola DROID'}]);

      ctrl = $componentController('deviceAlarm');
    }));

    it('should create a `devices` property with 2 devices fetched with `$http`', function() {
      jasmine.addCustomEqualityTester(angular.equals);

      expect(ctrl.devices).toEqual([]);

      $httpBackend.flush();
      expect(ctrl.devices).toEqual([{name: 'Nexus S'}, {name: 'Motorola DROID'}]);
    });

    it('should set a default value for the `orderProp` property', function() {
      expect(ctrl.orderProp).toBe('age');
    });

  });

});
