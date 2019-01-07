(function() {
    angular.module('sample')
        .controller('usingPromiseObjController', UsingPromiseObjController);

    function UsingPromiseObjController($scope, $q) {
        var self = this;
        /*list of countries and it's first letter*/
        this.countries = [{ name: 'India', fl: 'I' }, { name: 'China', fl: 'C' }, { name: 'America', fl: 'A' }];
        /*call back method for chip delete*/
        this.deleteChip = function(val) {
            return true;
        }
        /*call back method for chip*/
        this.render = function(val) {
            var index = 0,
                isDuplicate = false,
                obj = { name: val, fl: val.charAt(0) };

            var deferred = $q.defer();

            for (index; index < self.countries.length; index++) {
                isDuplicate = self.countries[index].name === val;
                if (isDuplicate)
                    break;
            }

            setTimeout(function() {
                isDuplicate ? deferred.reject(obj) : deferred.resolve(obj);
            }, getDelay());

            return deferred.promise;
        };

        function getDelay() {
            return (Math.floor(Math.random() * 5) + 1) * 1000;
        }
    }
})();
