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

const express = require("express"),
    app = express(),
    http = require("http").createServer(app),
    io = require("socket.io")(http),
    cookieParser = require("cookie-parser"),
    session = require("express-session"),
    OathRestClient = require("oauth-rest-client"),
    bodyParser = require("body-parser"),
    fpmcAPI = require("request-promise"),
    ftdRequest = require("request-promise"),
    _ = require("lodash"),
    port = process.env.PORT || 8080;

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.set("view engine", "ejs");

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/fpmcapi", function(req, res) {
    res.render("fpmcapi");
});

app.get("/unit", function(req, res, next) {
	res.render("unit");
});

io.on("connection", function(socket){

	socket.on("client-ready", function() {
		console.log(socket.id);
		fpwr.currentClient = socket.id;
	});

	socket.on("fpmc-register", function(msg) {
		if (typeof msg !== undefined){
			fpwr.registerAPI(msg.fpmcip, msg.fpmcuser, msg.fpmcpass);
		}
	});

    socket.on("fpmc-profile", function(msg) {
        if (typeof msg !== undefined){
            fpwr.serverversion(msg.fpmcip);
        }
    });
	socket.on("acpolicy-post", function(msg) {
		if (typeof msg !== undefined){
            console.log(msg);
			fpwr.acPolicyPost(msg.acpolicy, msg.acpolicydesc);
		}
	});

    socket.on("device-post", function(msg) {
        if (typeof msg !== undefined){
            fpwr.devicePost(msg.devicename, msg.hostname, msg.devicenat, msg.devicekey, msg.devicepol, msg.lic);
        }
    });
});

http.listen(port, function() {
    console.log("listening on:", port);
});

var fpwr = {
    servicesURL: {},
    fpmcTokenURL: "/api/fmc_platform/v1/auth/generatetoken",
    ftdTokenURL: "/api/fdm/v1/fdm/token",
    username: "automate",
    password: "automate",
    authToken: "", // used in requests to the FPMC API
    authRefreshToken: "", // used in requests to refresh the FPMC token
    domain_uuid: "", // used in all FPMC REST requests
    ftd_token_opts: {
        "grant_type": "password",
        "username": "automate",
        "password": "automate"
    } // used to request a token from the FTD API
};

fpwr.serverversion = function (server){
    fpwr.getAPI(fpwr.servicesURL.serverversion, 200, "serverversion", "profile-result");
}

fpwr.acPolicyPost = function(name, desc) {
    var policy = new fpwr.ACPolicy(name, desc);
    fpwr.postAPI(fpwr.servicesURL.accesspolicies, policy, 201, "acPolicyPost", "acpolicypost-result");
}

fpwr.devicePost = async function(name, hostname, nat, key, policy, lic) {
    var uridev = fpwr.servicesURL.devicerecords;
    var device = new fpwr.deviceRecord(name, hostname, nat, key, lic);
    fpwr.postAPI(uridev, device, 202, "devicePost", "devicepost-result");
}

fpwr.getAPI = function(url, responseCode, callingFunction, successMessage, id) {
    if (typeof id !== "undefined"){
        url = url + "/" + id;
    }
    var options = {
    	method: "GET",
        uri: fpwr.fpmc_server + url,
        headers: { "X-auth-access-token": fpwr.authToken },
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true
    }
    fpmcAPI(options)
    .then(function(response) {
        if (response.statusCode === responseCode) {
            console.log(response.statusCode, callingFunction);
            if (typeof successMessage !== "undefined") {
                fpwr.socketResponse(successMessage, response.body);
            } else {
                return response;
            }            
        } else {
            console.log(response.statusCode, response.statusMessage);
        }
    })
    .catch(function(err){
    	console.log(err);
    });
}

fpwr.postAPI = function(url, postData, responseCode, callingFunction, successMessage, id) {
    if (typeof id !== "undefined"){
        url = url + "/" + id;
    }
    var options = {
        method: "POST",
        uri: fpwr.fpmc_server + url,
        headers: {
            "X-auth-access-token": fpwr.authToken,
            "Content-Type": "application/json"
        },
        body: postData,
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true
    }
    fpmcAPI(options)
    .then(function(response) {
        if (response.statusCode === responseCode) {
            console.log(response.statusCode, "success", successMessage);
            fpwr.socketResponse(successMessage, response.body);
        } else {
            console.log(response.statusCode, response.statusMessage);
            console.log(response.body.description);
            return false;
        }
    })
    .catch(function(err){
        console.log(err);
    });
}

fpwr.putAPI = function(url, putData, responseCode, callingFunction, successMessage, id) {
    if (typeof id !== "undefined"){
        url = url + "/" + id;
    }
    var options = {
        method: "PUT",
        uri: fpwr.fpmc_server + url,
        headers: {
            "X-auth-access-token": fpwr.authToken,
            "Content-Type": "application/json"
        },
        body: postData,
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true
    }
    fpmcAPI(options)
    .then(function(response) {
        if (response.statusCode === responseCode) {
            console.log(response.statusCode, "success", successMessage);
            let data = JSON.parse(response.body);
            return data;
        } else {
            console.log(response.statusCode, response.statusMessage);
            console.log(response.body.description);
            return false;
        }
    })
    .catch(function(err){
        console.log(err);
    });
}

fpwr.registerAPI = function(server, username, password){
    fpwr.fpmc_server = "https://" + server;
    fpwr.username = username;
    fpwr.password = password;
    fpwr.fpmcAuth = "Basic " + new Buffer(username + ":" + password).toString("base64");
	var options = {
		method: "POST",
		uri: fpwr.fpmc_server + fpwr.fpmcTokenURL,
		headers: { "Authorization": fpwr.fpmcAuth },
		resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true
	}
	fpmcAPI(options)
	.then(function(response) {
		if (response.statusCode === 204){
			fpwr.authToken = response.headers["x-auth-access-token"];
            fpwr.authRefreshToken = response.headers["x-auth-refresh-token"];
            fpwr.domain_uuid = response.headers["domain_uuid"];
            fpwr.methods(response.headers["domain_uuid"]);
            console.log(response.statusCode, "successfully registered");
            fpwr.registered(response);
		} else {
			console.log(response.statusCode, response.statusMessage);
		}
	})
	.catch(function (err) {
		console.log(err);
	});
}

fpwr.methods = function(uuid) {
    fpwr.servicesURL = {
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
    this.license_caps = licArray || ["BASE", "THREAT"]

    if (typeof accessPolicyUUID !== "undefined") {
        this.accessPolicy = {
            id: accessPolicyUUID,
            type: "AccessPolicy"
        }
    }
}

fpwr.ngipsPhysicalIntf = function(name, id, enabled, type) {
    this.name = "s1p4",
    this.type = "FPPhysicalInterface",
    this.id = "fpphysicalinterfaceUUID2",
    this.enabled = 1,
    this.interfaceType = "INLINE"
}

fpwr.ngfwPhysicalIntf = function(mode, duplex, speed, enabled, MTU, ifname, name, uuid, ipv4method, ipv4, ipv4mask) {
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

fpwr.getUUIDByName = function(uri, name) {

}

fpwr.registered = function() {
	io.to(fpwr.currentClient).emit("register-success", fpwr);
}

fpwr.socketResponse = function(socketEvent, object) {
	io.to(fpwr.currentClient).emit(socketEvent, object);
}