angular.module('starter.services', [])

.factory("CONFIG", function() {
    var appTitle = "SMART HOME"
    var timeout = {
        delay: 1000,
        error: 3000
    }
    var server = {
        url: "http://192.168.0.90:5690"
    }
    var message = {
        errorNetwork : "Network Unavailable!"
    }

    return {
        appTitle: appTitle,
        server: server,
        timeout: timeout,
        message: message
    };
})

.factory("DEVICE", function ($cordovaPreferences, $q) {

    var key = "ssh-device-details";

    var self = this;

    self.uuid = "";
    self.isRegistered = false;

    self.init = function () {
        var defered = $q.defer();

        // Notes: window.device.uuid will be available after
        // platform.ready event.
        // This init function will be called in platform.ready
        // Default settings for DEVICE
        self.uuid = window.device.uuid;
        self.isRegistered = false;
        
        $cordovaPreferences.fetch(key)
        .then(function (value) {
            console.log(" > value", value);
            if (value) {
                value = JSON.parse(value);
                self.uuid = value.uuid ? value.uuid : window.device.uuid;
                self.isRegistered = value.isRegistered ? true : false;
                defered.resolve();
            } else {
                console.log(" > device details not set..");
                defered.resolve();
            }
        }, function () {
            console.log(" > device details not found..");
            defered.resolve();
        });

        return defered.promise;
    };

    self.setRegSuccess = function () {

        self.isRegistered = true;

        $cordovaPreferences.store(key, JSON.stringify({
            uuid: self.uuid,
            isRegistered: self.isRegistered
        })).then(function () {
            console.log(" > Storing the device details - success");
        }, function () {
            console.log(" > Storing the device details - failure");
        });
    };

    return self;
})

.factory("SERVER", function ($http, CONFIG, SESSION) {
    
    // if (SESSION.isUserLoggedIn()) {
    //     $http.defaults.headers.common.Authorization = "" + SESSION.getToken();
    // }

    var server = CONFIG.server;
    return {
        register: function (data) {
            console.log(" > register data", data);
            return $http.post(server.url + "/register", data);
        },
        login: function (loginData) {
            console.log(" > login data", loginData);
            return $http.post(server.url + "/authenticate", loginData);
        },
        getSessionDetails: function () {
            return $http.get(server.url + "/session", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getOverview: function () {
            return $http.get(server.url + "/overview", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getAllBlocks: function () {
            return $http.get(server.url + "/blocks", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getAllSwitches: function () {
            return $http.get(server.url + "/switches", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getBlock: function (block) {
            return $http.get(server.url + "/blocks/" + block.bid, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getSwitches : function (block) {
            return $http.get(server.url + "/blocks/" + block.bid + "/switches", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getSwitch: function (sw) {
            return $http.get(server.url + "/switches/" + sw.sid, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        changeSwitchDetails: function (sid, data) {
            return $http.put(server.url + "/switches/" + sid, data, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        changeSwitchStatus: function (sid, data) {
            return $http.put(server.url + "/switches/" + sid + "/changeStatus", data, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        changeSwitchLockStatus: function (sid, data) {
            return $http.put(server.url + "/switches/" + sid + "/changeLockStatus", data, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },

        getAllUsers: function () {
            return $http.get(server.url  +"/users", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        getUser: function (data) {
            if (data && data.id) {
                return $http.get(server.url + "/users/" + data.id, {
                    headers: {
                        "Authorization": "" + SESSION.getToken()
                    }
                });
            }

            return $http.get(server.url + "/user", {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });            
        },
        changeUserDetails: function (uid, data) {
            return $http.put(server.url + "/users/" + uid, data, {
                headers: {
                    "Authorization": "" + SESSION.getToken()
                }
            });
        },
        deactivateUser: function (u) {
            console.log(" > details:", u);
            users.forEach(function (each, index) {
                if (each.id == u.id) {
                    users[index].active = u.active;
                }
            });
            console.log(" > users:", users);
        }
    };
})

.factory("SESSION", function($q) {
    var isUserLoggedIn = false;
    var token = "";
    var userId = 0;

    var start = function(details) {
        var defered = $q.defer();
        if (!details) {
            console.log(" > No required details for session start..");
            defered.reject();
        } else {
            token = details.token;
            userId = details.userId;
            isUserLoggedIn = true;
            defered.resolve();
        }
        return defered.promise;
    };

    var refresh = function () {
    };

    var end = function () {
        isUserLoggedIn = false;
        token = "";
        userId = 0;

        console.log(" > Session ended..");
    };

    return {
        start : start,
        refresh: refresh,
        end: end,
        isUserLoggedIn: function () {
            return isUserLoggedIn;
        },
        getToken: function () {
            return token;
        },
        getUserId: function () {
            return userId;
        }
    }
})

.factory("USER", function (SERVER, SESSION, $q) {
    var details = {
        _id: 0,
        name: "",
        username: "",
        accessLevel: 0,
        deactivated: false
    };

    function init() {
        var defered = $q.defer();
        SERVER.getUser({
            id: SESSION.getUserId()
        }).then(function (res) {
            console.log(" > response:", res)
            if (!res || !res.data) {
                return;
            }
            details._id = res.data._id;
            details.name = res.data.name;
            details.username = res.data.username;
            details.accessLevel = res.data.accessLevel;
            details.deactivated = res.data.deactivated;
            console.log(" > Getting user details..", details);
            defered.resolve();
        }, function (err) {
            console.log(" > Error while trying to get user profile", err);
            defered.reject();
        });
        return defered.promise;
    }
    
    return {
        details: details,
        isAdmin : function () {
            console.log(" > is admin:", details.accessLevel);
            return details.accessLevel === 2;
        },
        isGeneralUser: function () {
            return details.accessLevel === 1;
        },
        init: init
    };
})
    
.factory("DB", function() {
    return {

    };
});
