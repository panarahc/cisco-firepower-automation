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
    username = "automate",
    password = "automate",
    port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.set("view engine", "ejs");

var fpwr = {
    fpmc_server: "https://10.255.0.12",
    ftd_token_url: "https://10.255.0.10/api/fdm/v1/fdm/token",
    username: "automate",
    password: "automate",
    fpmcAuth: "Basic " + new Buffer(username + ":" + password).toString("base64"),
    authToken: "", // used in requests to the FPMC API
    authRefreshToken: "", // used in requests to refresh the FPMC token
    domain_uuid: "", // used in all FPMC REST requests
    ftd_token_opts: {
        "grant_type": "password",
        "username": "automate",
        "password": "automate"
    } // used to request a token from the FTD API
};



// Basic workflow
// Attempt to load auth tokens from file.  Refresh if necessary
// Create a basic ACPolicy (complete)
// Add devices and record UUIDs
// configure interfaces
// configure zones
// configure ha pairs/groups
// deploy config changes

// advanced config:
// Nat policies
// amp file policies
// create a standard URL filtering policy

var fpwr_servicesURL = {};

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
        console.log(response.statusCode, "successfully registered");
        fpwr.postACPolicy();
    } else {
        console.log(response.statusCode, response.statusMessage);
    }
});

fpwr.methods = function(uuid) {
    fpwr_servicesURL = {
        deployabledevices: "/api/fmc_config/v1/domain/" + uuid + "/deployment/deployabledevices",
        devicegrouprecords: "/api/fmc_config/v1/domain/" + uuid + "/devicegroups/devicegrouprecords",
        devicerecords: "/api/fmc_config/v1/domain/" + uuid + "/devices/devicerecords",
        hosts: "/api/fmc_config/v1/domain/" + uuid + "/object/hosts/",
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
        serverversion: "/api/fmc_platform/v1/info/serverversion"
    }
}

fpwr.devicerecordsURL = function(domainUUID, containerUUID) {
    this.fpphysicalinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/fpphysicalinterfaces",
    this.fplogicalinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/fplogicalinterfaces",
    this.inlinesets = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/inlinesets",
    this.virtualswitches = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/virtualswitches",
    this.physicalinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/physicalinterfaces",
    this.redundantinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/redundantinterfaces",
    this.etherchannelinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/etherchannelinterfaces",
    this.subinterfaces = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/subinterfaces",
    this.staticroutes = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/routing/staticroutes",
    this.ipv4staticroutes = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/routing/ipv4staticroutes",
    this.ipv6staticroutes = "/api/fmc_config/v1/domain/" + domainUUID + "/devices/devicerecords/" + containerUUID + "/routing/ipv6staticroutes"
}

fpwr.ACPolicy = function(name, description, iName, iuuid, vName, vuuid, logBegin, logEnd, send) {
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
    // update this to include zones afterwards
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
    this.name = name,
    this.id = uuid
    if (ipv4method === "dhcp") {
        this.ipv4 = {
            dhcp: {
                enableDefaultRouteDHCP: true,
                dhcpRouteMetric: 1
            }
        }
    } else {
        this.ipv4 = {
            "static": {
                address: ipv4,
                netmask: ipv4mask
            }
        }
    }
}

fpwr.securityzone = function(name, description, interfaceMode, intfid, intfname) {
    //Passive, Inline, Switched, Routed, ASA
    this.type = "SecurityZone",
    this.name = name,
    this.interfaceMode = interfaceMode,
    this.interfaces = [
    	{
	        type: "PhysicalInterface",
	        id: intfid,
	        name: intfname
    	}
    ]
}

fpwr.getDeviceIDByName = function(deviceName) {
    var allDevices = getAPI(fpwr_servicesURL.devicerecords, 200, "getDeviceIDByName", "success");
    if (typeof allDevices !== "undefined") {
        var foundID = _.forEach(allDevices.items, function(value, key) {
                if (value.name === deviceName) {
                    return value.id;
                }
        });
        return foundID;
    }
}

fpwr.getInterfaceIDbyName = function(intfName, deviceName) {
    var tmpDevice = new fpwr.devicerecordsURL(fpwr.domain_uuid, fpwr.getAPI(fpwr_servicesURL.devicerecords, deviceName, 200));
    var deviceID = fpwr.getAPI(fpwr_servicesURL.devicerecords, id, 200);
    var interfaceID = fpwr.getAPI(url, intfName, 200);
}

fpwr.postACPolicy = function() {
    var policy = new fpwr.ACPolicy("API Post", "It worked!!!");
    fpmcAPI.post({
        url: fpwr.fpmc_server + fpwr_servicesURL.accesspolicies,
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
            let data = JSON.parse(response.body);
            fpwr.ACPolicybase = { name: data.name, id: data.id }
            fpwr.postDeviceRecord();
        } else {
            let data = JSON.parse(response.body);
            console.log(response.statusCode, response.statusMessage);
            console.log(data.description);
        }
    });
}

fpwr.postDeviceRecord = function() {
    if (typeof fpwr.ACPolicybase.id !== "undefined") {
        var device = new fpwr.deviceRecord("FTDv-EDGE2", "10.255.0.10", "cisco123", "cisco123", ["BASE", "THREAT"], fpwr.ACPolicybase.id),
            url = fpwr.fpmc_server + fpwr_servicesURL.devicerecords,
            responseCode = 202,
            successMessage = "Device successfully registered";
        fpwr.postAPI(url, device, responseCode, "postDeviceRecord", successMessage);
    } else {
        console.log("AC Policy is missing");
    }
}

fpwr.putAPI = function(url, postData, responseCode, callingFunction, successMessage) {

}

fpwr.postAPI = function(url, postData, responseCode, callingFunction, successMessage) {
    fpmcAPI.post({
        url: url,
        headers: {
            "X-auth-access-token": fpwr.authToken,
            "Content-Type": "application/json"
        },
        rejectUnauthorized: false,
        requestCert: true,
        body: JSON.stringify(postData)
    }, function(error, response, body) {
        if (error) {
            console.log(callingFunction, error);
            return false;
        } else if (response.statusCode === responseCode) {
            console.log(response.statusCode, "success", successMessage);
            let data = JSON.parse(response.body);
            console.log(fpwr.getDeviceIDByName("FTDv-EDGE2"));
        } else {
            console.log(response.statusCode, response.statusMessage);
            console.log(response.body.description);
            return false;
        }
    });
}

fpwr.getAPI = function(url, responseCode, callingFunction, successMessage, id) {
    fpmcAPI.get({
        url: url + id,
        headers: { "X-auth-access-token": fpwr.authToken },
        rejectUnauthorized: false,
        requestCert: true,
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        } else if (response.statusCode === responseCode) {
            console.log(response.statusCode, callingFunction, successMessage);
            let data = JSON.parse(response.body);
            return (data);
        } else {
            console.log(response.statusCode, response.statusMessage);
        }
    });
}

http.listen(port, function() {
    console.log("listening on:", port);
});

fpwr.getACPolicyByAPI = function(id) {
    if (typeof id !== "undefined") {
        fpmcRequest.get({
            url: fpwr.fpmc_server + fpwr_servicesURL.accesspolicies + "/" + id,
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
    }
}