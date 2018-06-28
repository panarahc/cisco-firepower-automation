const express = require("express"),
    app = express(),
    http = require("http").createServer(app),
    cookieParser = require("cookie-parser"),
    session = require("express-session"),
    OathRestClient = require("oauth-rest-client"),
    bodyParser = require("body-parser"),
    fpmcAPI = require("request"),
    ftdRequest = require("request"),
    _ = require("lodash"),
    username = "api",
    password = "admin123",
    port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.set("view engine", "ejs");

var fpwr = {
    fpmc_server: "https://10.255.0.12",
    ftd_token_url: "https://10.255.0.10/api/fdm/v1/fdm/token",
    username: "admin",
    password: "admin",
    fpmcAuth: "Basic " + new Buffer(username + ":" + password).toString("base64"),
    authToken: "", // used in requests to the FPMC API
    authRefreshToken: "", // used in requests to refresh the FPMC token
    domain_uuid: "", // used in all FPMC REST requests
    ftd_token_opts: {
        "grant_type": "password",
        "username": "api",
        "password": "admin123"
    } // used to request a token from the FTD API
};

var fpwr_services = {};

fpmcAPI.post({
    url: fpwr.fpmc_server + "/api/fmc_platform/v1/auth/generatetoken",
    headers: { "Authorization": fpwr.fpmcAuth },
    rejectUnauthorized: false,
    requestCert: true,
}, function(error, response, body) {
    if (error) {
        console.log(error);
    } else if (response.statusCode === 204) {
        fpwr.authToken = response.headers["x-auth-access-token"];
        fpwr.authRefreshToken = response.headers["x-auth-refresh-token"];
        fpwr.domain_uuid = response.headers["domain_uuid"];
        fpwr.methods(response.headers["domain_uuid"]);
        console.log(response.statusCode, "success");
        fpwr.postACPolicy();
    } else {
        console.log(response.statusCode, response.statusMessage);
    }
});

fpwr.methods = function(uuid) {
    fpwr_services = {
        deployabledevices: "/api/fmc_config/v1/domain/" + uuid + "/deployment/deployabledevices",
        devicegrouprecords: "/api/fmc_config/v1/domain/" + uuid + "/devicegroups/devicegrouprecords",
        devicerecords: "/api/fmc_config/v1/domain/" + uuid + "/devices/devicerecords",
        hosts: "/api/fmc_config/v1/domain/" + uuid + "/object/hosts",
        icmpv4objects: "/api/fmc_config/v1/domain/" + uuid + "/object/icmpv4objects",
        isesecuritygrouptags: "/api/fmc_config/v1/domain/" + uuid + "/object/isesecuritygrouptags",
        networkaddresses: "/api/fmc_config/v1/domain/" + uuid + "/object/networkaddresses",
        networkgroups: "/api/fmc_config/v1/domain/" + uuid + "/object/networkgroups",
        networks: "/api/fmc_config/v1/domain/" + uuid + "/object/networks",
        ranges: "/api/fmc_config/v1/domain/" + uuid + "/object/ranges",
        securityzones: "/api/fmc_config/v1/domain/" + uuid + "/object/securityzones",
        variablesets: "/api/fmc_config/v1/domain/" + uuid + "/object/variablesets",
        accesspolicies: "/api/fmc_config/v1/domain/" + uuid + "/policy/accesspolicies",
        filepolicies: "/api/fmc_config/v1/domain/" + uuid + "/policy/filepolicies",
        intrusionpolicies: "/api/fmc_config/v1/domain/" + uuid + "/policy/intrusionpolicies",
        snmpalerts: "/api/fmc_config/v1/domain/" + uuid + "/policy/snmpalerts",
        syslogalerts: "/api/fmc_config/v1/domain/" + uuid + "/policy/syslogalerts",
        policyassignments: "/api/fmc_config/v1/domain/" + uuid + "/assignment/policyassignments",
        taskstatuses: "/api/fmc_config/v1/domain/" + uuid + "/job/taskstatuses",
        serverversion: "/api/fmc_platform/v1/info/serverversion",
    }
}

fpwr.ACPolicy = function(name, description, iName, iuuid, vName, vuuid, logBegin, logEnd, send) {
    //response 201
    this.type = "AccessPolicy",
        this.name = name,
        this.description = description,
        this.defaultAction = {
            intrusionPolicy: {
                name: iName || "Balanced Security and Connectivity",
                id: iuuid || "abba00a0-cf29-425c-9d75-49699aadc898",
                type: "IntrusionPolicy"
            },
            variableSet: {
                name: vName || "Default Set",
                id: vuuid || "76fa83ea-c972-11e2-8be8-8e45bb1343c0",
                type: "VariableSet"
            },
            type: "AccessPolicyDefaultAction",
            logBegin: true,
            logEnd: false,
            sendEventsToFMC: true
        }
}

fpwr.deviceRecord = function(name, hostname, natID, key, licArray, accessPolicyUUID) {
    // response 202
    // [ FIREPOWER DEVICE
    // MALWARE,
    // URLFilter,
    // PROTECT,
    // CONTROL,
    // VPN
    // ]

    // "license_caps": [  FTD DEVICE
    //   "BASE",
    //   "MALWARE",
    //   "URLFilter",
    //   "THREAT"
    // ],
    this.name = name,
        this.hostName = hostname,
        this.natID = natID || "cisco123",
        this.regKey = key,
        this.type = "Device",
        this.license_caps = licArray || ["BASE", "THREAT"],
        this.accessPolicy = {
            id: accessPolicyUUID,
            type: "AccessPolicy"
        }
}

fpwr.ngipsPhysicalIntf = function(name, id, enabled, type) {
    this.name = "s1p4",
        this.type = "FPPhysicalInterface",
        this.id = "fpphysicalinterfaceUUID2",
        this.enabled = 1,
        this.interfaceType = "INLINE"
}

fpwr.ngfwPhysicalIntf = function(mode, duplex, speed, enabled, MTU, ifname, ipv4method, ipv4, ipv4mask, name, uuid) {
    // create a method to add an interface to a zone afterwards
    // PUT only, response 200
    this.type = "PhysicalInterface",
        this.mode = mode,
        this.hardware = {
            duplex: duplex,
            speed: speed
        },
        this.enabled = enabled,
        this.MTU = MTU,
        this.managementOnly = false,
        this.ifname = ifname,
        this.ipv4 = {
            dhcp: {
                address: ipv4,
                netmask: ipv4mask
            },
        },
        this.name = name,
        this.id = uuid
}

fpwr.postACPolicy = function() {
    var policy = new fpwr.ACPolicy("API Post", "It worked!!!");
    console.log(fpwr_services.accesspolicies);
    fpmcAPI.post({
        url: fpwr.fpmc_server + fpwr_services.accesspolicies,
        headers: {
            "X-auth-access-token": fpwr.authToken,
            "Content-Type": "application/json"
        },
        rejectUnauthorized: false,
        requestCert: true,
        body: JSON.stringify(policy)
    }, function(error, response, body) {
        if (error) {
            console.log("postACPolicy", error);
        } else if (response.statusCode === 201) {
            console.log(response.statusCode, "success", "postACPolicy");
        } else {
            console.log(response.statusCode, response.statusMessage);
        }
    });
}

http.listen(port, function() {
    console.log("listening on:", port);
});

// ftdRequest.post({
//	headers: {"Content-Type" : "application/json"},
//	rejectUnauthorized: false,
//	requestCert: true,
//	url: fpwr.ftd_token_url,
//	json: true,
//	body: fpwr.ftd_token_opts
//}, function(error, response, body) {
//	if (error) {
//		console.log(error);
//	} else {
//		console.log(response);
//	}
//});

fpwr.getACPolicyByID = function(id) {
    if (typeof id !== "undefined") {
        fpmcRequest.get({
            url: fpwr.fpmc_server + fpwr_services.accesspolicies + "/" + id,
            headers: { "X-auth-access-token": fpwr.authToken },
            rejectUnauthorized: false,
            requestCert: true,
        }, function(error, response, body) {
            if (error) {
                console.log(error);
            } else if (response.statusCode === 200) {
                console.log(response.statusCode, "success");
                console.log(JSON.parse(response.body));
            } else {
                console.log(response.statusCode, response.statusMessage);
            }
        });
    } else {
        fpmcRequest.get({
            url: fpwr.fpmc_server + fpwr_services.accesspolicies,
            headers: { "X-auth-access-token": fpwr.authToken },
            rejectUnauthorized: false,
            requestCert: true,
        }, function(error, response, body) {
            if (error) {
                console.log(error);
            } else if (response.statusCode === 200) {
                console.log(response.statusCode, "success");
                var policies = JSON.parse(response.body);
                _(policies.items).forEach(function(value, index) {
                    fpwr.getACPolicyByID(value.id);
                })
            } else {
                console.log(response.statusCode, response.statusMessage);
                console.log(response.body);
            }
        });
    }
}