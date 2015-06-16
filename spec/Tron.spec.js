describe('Tron', function () {

    var Tron = require('../lib/Tron');

    var anyFunction = jasmine.any(Function);
    var anyString = jasmine.any(String);

    it('should contain all API methods and attributes', function () {
        expect(Tron).toBeDefined();
        expect(Tron.Expression).toEqual(anyFunction);
        expect(Tron.Scheduler).toEqual(anyFunction);
        expect(Tron.version).toEqual(anyString);
    });
});