const _ = require("lodash");

var servicesURL = {
    activedirectory: "/ers/config/activedirectory",
    networkdevicegroup: "/ers/config/networkdevicegroup"
}

var adMethods = function(uuid) {
    servicesURL.activedirectoryjoin: "/ers/config/activedirectory/" + uuid + "/join",
    servicesURL.activedirectoryjoinall: "/ers/config/activedirectory/" + uuid + "/joinAllNodes",
    servicesURL.activedirectoryleave: "/ers/config/activedirectory/" + uuid + "/leave",
    servicesURL.activedirectoryleaveall: "/ers/config/activedirectory/" + uuid + "/leaveAllNodes",
    servicesURL.deletejoinpoint: "/ers/config/activedirectory/" + uuid
}

var adDomain = function(username, password, nodename) {
    {
        OperationAdditionalData: {
            additionalData: [{
                    name: "username",
                    value = username
                },
                {
                    name: "password",
                    value = password
                }
            ]
        }
    }
}

var joinPoint = function(name, domain) {
    {
        ERSActiveDirectory: {
            name = name,
            domain = domain
        }
    }
}

var createJoinPoint = function(name, domain) {
    var newJoinPoint = new joinPoint(name, domain);
}

var deleteJoinPoint = function() {

}

var joinDomain = function(username, password, nodename) {
    if (typeof nodename !== "undefined") {
        var newDomain = new adDomain(username, password, nodename);
    } else {
        var newDomain = new adDomain(username, password);
        //call joinAllNodes
    }
}


module.exports = {
    createJoinPoint,
    joinDomain
}