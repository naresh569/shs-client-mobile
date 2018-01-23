
angular.module('starter.filters', [])

.filter('FilterByStatus', function() {
    return function(switches, filter) {
        return switches.filter(function (v, i, a) {
        if (filter === "inactive") {
            return v.status === "0"
        }
        
        if (filter === "active") {
            return v.status !== "0";
        }

        return true;
        });
    };
});