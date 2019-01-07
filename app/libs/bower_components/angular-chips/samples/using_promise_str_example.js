(function() {
    angular.module('sample')
        .controller('usingPromiseStrController', UsingPromiseStrController);

    function UsingPromiseStrController($scope, $q) {
        var self = this;
        self.list = ['orange', 'apple', 'grapes'];
        /*call back method for chip*/
        self.render = function(val) {
            var deferred = $q.defer();
            setTimeout(function() {
                self.list.indexOf(val) === -1 ? deferred.resolve(val) : deferred.reject(val);
            }, getDelay());
            return deferred.promise;
        };
        /*call back method for chip delete*/
        self.deleteChip = function(val) {
            return true;
        }

        function getDelay(){
            return (Math.floor(Math.random() * 5) + 1) * 1000;
        }
    }
})();
