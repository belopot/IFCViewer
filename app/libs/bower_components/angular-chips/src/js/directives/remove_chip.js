(function() {
    angular.module('angular.chips')
        .directive('removeChip', RemoveChip);
    /*
     *  Will remove the chip
     *  remove-chip="callback(chip)"> call back will be triggered before remove
     *  Call back method should return true to remove or false for nothing
     */
    function RemoveChip() {
        return {
            restrict: 'A',
            require: '^?chips',
            link: function(scope, iElement, iAttrs, chipsCtrl) {

                function getCallBack(scope, prop) {
                    var target;
                    if (prop.search('\\(') > 0) {
                        prop = prop.substr(0, prop.search('\\('));
                    }
                    if (prop !== undefined) {
                        if (prop.split('.').length > 1) {
                            var levels = prop.split('.');
                            target = scope;
                            for (var index = 0; index < levels.length; index++) {
                                target = target[levels[index]];
                            }
                        } else {
                            target = scope[prop];
                        }
                    }
                    return target;
                };

                /*
                 * traverse scope hierarchy and find the scope
                 */
                function findScope(scope, prop) {
                    var funStr = prop.indexOf('.') !== -1 ? prop.split('.')[0] : prop.split('(')[0];
                    if (!scope.hasOwnProperty(funStr)) {
                        return findScope(scope.$parent, prop)
                    }
                    return scope;
                };

                function deleteChip() {
                    // don't delete the chip which is loading
                    if (typeof scope.chip !== 'string' && scope.chip.isLoading)
                        return;
                    var callBack, deleteIt = true;
                    if (iAttrs.hasOwnProperty('removeChip') && iAttrs.removeChip !== '') {
                        callBack = getCallBack(findScope(scope, iAttrs.removeChip), iAttrs.removeChip);
                        deleteIt = callBack(scope.chip);
                    }
                    if (deleteIt)
                        chipsCtrl.removeChip(scope.chip, scope.$index);
                };

                iElement.on('click', function() {
                    deleteChip();
                });

                scope.$on('chip:delete', function() {
                    deleteChip();
                });

            }
        }
    }
})();
