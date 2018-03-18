'use strict';

describe('deviceHistorical', function() {

  // Load the module that contains the `deviceHistorical` component before each test
  beforeEach(module('deviceHistorical'));

  // Test the controller
  describe('deviceHistoricalController', function() {
    var $httpBackend, ctrl;

    beforeEach(inject(function($componentController, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('devices/devices.json')
                  .respond([{name: 'Nexus S'}, {name: 'Motorola DROID'}]);

      ctrl = $componentController('deviceHistorical');
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
