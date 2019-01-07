(function() {
	var filesaver = angular.module('FileSaver', []);
	filesaver.factory('FileSaver', ['$window', function($window) {
		return $window.saveAs;
	}]);
})();
