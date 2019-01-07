(function() {
    angular.module('sample')
        .controller('customRenderingController', CustomRendering);

    function CustomRendering() {
        /*list of countries and it's first letter*/
        this.countries = [{ name: 'India', fl: 'I' }, { name: 'China', fl: 'C' }, { name: 'America', fl: 'A' }];
        /*call back method for chip*/
        this.render = function(val) {
            return { name: val, fl: val.charAt(0) }
        };
        /*call back method for chip delete*/
        this.deleteChip = function(val) {
            return true;
        }
    }
})();
