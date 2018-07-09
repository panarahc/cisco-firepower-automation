// configure interfaces
// configure zones
// configure ha pairs/groups
// deploy config changes

// advanced config:
// Nat policies
// amp file policies
// create a standard URL filtering policy
// error handling

//support for simultaenous users
// On registration something like...
// create a unique UUID for a new socket connection
// fpwr[UUID] = new ManagedObject(params);
// the CRUD functions would need to know the UUID of the user

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
		if (typeof msg !== "undefined"){
			fpwr.registerAPI(msg.fpmcip, msg.fpmcuser, msg.fpmcpass);
		}
	});

    socket.on("fpmc-profile", function(msg) {
        if (typeof msg !== "undefined"){
            fpwr.serverversion(msg.fpmcip);
        }
    });
	socket.on("acpolicy-post", function(msg) {
		if (typeof msg !== "undefined"){
			fpwr.acPolicyPost(msg.acpolicy, msg.acpolicydesc);
		}
	});

    socket.on("acpolicy-getID", function(msg) {
        if (typeof msg !== "undefined"){
            fpwr.acPolicyGet(fpwr.servicesURL.accesspolicies,  msg.acpolicy);
        }
    });

    socket.on("device-post", function(msg) {
        if (typeof msg !== "undefined"){
            fpwr.devicePost(msg.devicename, msg.hostname, msg.devicenat, msg.devicekey, msg.devicepol, msg.lic);
        }
    });

    socket.on("new-automation", function(msg) {
        if (typeof msg !== "undefined") {
            console.log("automation received", new Date().toTimeString());
            fpwr.tasklist = msg;
            fpwr.checktask();
        }
    })
});

http.listen(port, function() {
    console.log("listening on:", port);
});

var fpwr = {
    servicesURL: {},
    fpmcTokenURL: "/api/fmc_platform/v1/auth/generatetoken",
    ftdTokenURL: "/api/fdm/v1/fdm/token",
    currentTaskUUID: "",
    tasklist: [],
    timeoutCounter: 0,
    username: "automate",
    password: "automate",
    authToken: "", // used in requests to the FPMC API
    authRefreshToken: "", // used in requests to refresh the FPMC token
    domain_uuid: "", // used in all FPMC REST requests
    getOptions:{
        method: "GET",
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true,
    },
    putOptions:{
        method: "PUT",
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true,
        simple: true
    },
    ftd_token_opts: {
        "grant_type": "password",
        "username": "automate",
        "password": "automate"
    } // used to request a token from the FTD API
};

fpwr.runtask = function() {
    console.log("running new task", new Date().toTimeString());
    if (typeof fpwr.tasklist[0] == "undefined"){
        console.log("Congratulations! You have reached the end of the internet.", new Date().toTimeString());
    } else {
        var currenttask = fpwr.tasklist[0];
        var keynames = Object.keys(currenttask);
        switch (keynames[0]){
            case "fpmccredentials":
                var server = currenttask[keynames[0]].fpmcip,
                    username = currenttask[keynames[0]].fpmcuser,
                    password = currenttask[keynames[0]].fpmcpass;
                fpwr.registerAPI(server, username, password);
                break;
            case "accesspoliciespost":
                var policyname = currenttask[keynames[0]].acpolicy,
                    policydesc = currenttask[keynames[0]].acdesc;
                fpwr.acPolicyPost(policyname, policydesc);
                break;
            case "devicerecordpost":
                    var devicename = currenttask[keynames[0]].devicename,
                        hostname = currenttask[keynames[0]].hostname,
                        nat = currenttask[keynames[0]].devicenat,
                        key = currenttask[keynames[0]].devicekey,
                        policy = currenttask[keynames[0]].devicepol,
                        lic = currenttask[keynames[0]].lic;
                    fpwr.devicePost(devicename, hostname, nat, key, policy, lic);
                break;
            case "devicephysicalintfput":
                var mode = currenttask[keynames[0]].mode,
                    duplex = currenttask[keynames[0]].duplex,
                    speed = currenttask[keynames[0]].speed,
                    enabled = currenttask[keynames[0]].enabled,
                    logicalname = currenttask[keynames[0]].logicalname,
                    MTU = currenttask[keynames[0]].MTU,
                    ipv4method = currenttask[keynames[0]].ipv4method,
                    ipv4 = currenttask[keynames[0]].ipv4,
                    ipv4mask = currenttask[keynames[0]].ipv4mask,
                    physicalinterface = currenttask[keynames[0]].physicalinterface,
                    devicename = currenttask[keynames[0]].devicename;
                fpwr.deviceinterfaceput(devicename, physicalinterface, mode, duplex, speed, enabled, MTU, logicalname, ipv4method, ipv4, ipv4mask);
                break;
            default:
                console.log("Yes, we have no bananas today", new Date().toTimeString());
        }
    }
}

fpwr.checktask = function() {
    console.log("checking task", new Date().toTimeString());
    if (fpwr.timeoutCounter > 10){
        console.log("too many timeouts", new Date().toTimeString());
    } else if (fpwr.currentTaskUUID !== "") {
        fpwr.timeoutCounter++;
        fpwr.gettaskstatus();
        setTimeout(fpwr.checktask, 30000);
    } else {
        fpwr.timeoutCounter = 0;
        fpwr.runtask();
    }
}

fpwr.gettaskstatus = async function() {
    fpwr.getOptions.uri = fpwr.fpmc_server + fpwr.servicesURL.taskstatuses + "/" + fpwr.currentTaskUUID;
    console.log("debug: entered gettaskstatus");
    fpmcAPI(fpwr.getOptions)
    .then( () => {
        console.log("not yet", fpwr.timeoutCounter, "/10", new Date().toTimeString());
    })
    .catch(function(err){
        console.log("debug: no task found....  Resetting");
        fpwr.currentTaskUUID = "";
    })
}

fpwr.serverversion = function (server){
    fpwr.getAPI(fpwr.servicesURL.serverversion, 200, "serverversion", "profile-result");
}

fpwr.acPolicyPost = function(name, desc) {
    console.log("building new access policy", new Date().toTimeString());
    var policy = new fpwr.ACPolicy(name, desc);
    fpwr.postAPI(fpwr.servicesURL.accesspolicies, policy, 201, "acPolicyPost", "acpolicypost-result");
}

fpwr.devicePost = async function(name, hostname, nat, key, policy, lic) {
    console.log("building new device record", new Date().toTimeString());
    var uridev = fpwr.servicesURL.devicerecords;
    var polUUID = await fpwr.getUUIDbyName(fpwr.servicesURL.accesspolicies, policy);
    var device = new fpwr.deviceRecord(name, hostname, nat, key, lic, polUUID);
    fpwr.postAPI(uridev, device, 202, "devicePost", "devicepost-result");
}

fpwr.deviceinterfaceput = async function(devicename, physicalinterface, mode, duplex, speed, enabled, MTU, logicalname, ipv4method, ipv4, ipv4mask) {
    console.log("updating device interface", new Date().toTimeString());
    var cUUID = await fpwr.getUUIDbyName(fpwr.servicesURL.devicerecords, devicename);
    var intfurl = fpwr.servicesURL.devicerecords + "/" + cUUID + "/physicalinterfaces";
    fpwr.getOptions.uri = fpwr.fpmc_server + fpwr.servicesURL.devicerecords + "/" + cUUID + "/physicalinterfaces";
    fpmcAPI(fpwr.getOptions)
    .then(async(response) => {
        if (fpwr.timeoutCounter > 10 ) {
            console.log("debug: too many timeouts");
        } else if (response.statusCode === 404) {
            console.log("device not ready yet");
            fpwr.timeoutCounter++;
            setTimeout(fpwr.runtask, 45000);
        } else if (response.statusCode === 200) {
            fpwr.timeoutCounter = 0;
            var oUUID = await fpwr.getUUIDbyName(intfurl, physicalinterface);
            var newintf = new fpwr.ngfwPhysicalIntf(mode, duplex, speed, enabled, MTU, logicalname, ipv4method, ipv4, ipv4mask, physicalinterface, oUUID);
            var putURL = fpwr.servicesURL.devicerecords + "/" + cUUID + "/physicalinterfaces" + "/" + oUUID;
            fpwr.putAPI(putURL, newintf, 200, "deviceinterfaceput", "interfaceput-result"); 
        }
    })
    .catch((err)=>{
        console.log("debug: something else happened", fpwr.timeoutCounter);
        fpwr.timeoutCounter++;
        setTimeout(fpwr.runtask, 45000);
    })
}
 
fpwr.getUUIDbyName = async function(url, name) {
    fpwr.getOptions.uri = fpwr.fpmc_server + url;
    var UUIDobj = await fpmcAPI(fpwr.getOptions);
    _.forEach(UUIDobj.body.items, (value, index) => {
        if (value.name === name) UUID = value.id;
    });
    return UUID;
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
        json: true,
        simple: false
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
            console.log(response.body.error.messages);
        }
    })
    .catch(function(err){
    	console.log(err);
    });
}

fpwr.postAPI = function(url, postData, responseCode, callingFunction, successMessage) {
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
        json: true,
        simple: false
    }
    fpmcAPI(options)
    .then(function(response) {
        if (response.statusCode === responseCode) {
            console.log(response.statusCode, "success", successMessage);
            fpwr.tasklist.shift();
            fpwr.socketResponse(successMessage, response.body);
            if (response.body.metadata.hasOwnProperty("task")){
                fpwr.currentTaskUUID = response.body.metadata.task.id;
                console.log("running task ID", fpwr.currentTaskUUID);
            }
            fpwr.checktask();
        } else {
            console.log(response.statusCode, response.statusMessage);
            console.log(response.body.error.messages);
            return false;
        }
    })
    .catch(function(err){
            console.log(err.message);
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
        body: putData,
        resolveWithFullResponse: true,
        rejectUnauthorized: false,
        requestCert: true,
        json: true,
        simple: true
    }
    fpmcAPI(options)
    .then(function(response) {
        if (response.statusCode === responseCode) {
            console.log(response.statusCode, "success", successMessage);
            fpwr.tasklist.shift();
            fpwr.socketResponse(successMessage, response.body);
            if (response.body.metadata.hasOwnProperty("task")){
                fpwr.currentTaskUUID = response.body.metadata.task.id;
                console.log("running task ID", fpwr.currentTaskUUID);
            }
            fpwr.checktask();
        } else {
            console.log(response.statusCode, response.statusMessage);
            console.log(response.body.error.messages);
            return false;
        }
    })
    .catch(function(err){
            console.log(err.message);
    });
}

fpwr.registerAPI = function(server, username, password){
    console.log("Registering:", server, username);
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
            fpwr.getOptions.headers = { 
                "X-auth-access-token": fpwr.authToken };
            fpwr.putOptions.headers = { 
                "X-auth-access-token": fpwr.authToken };
            fpwr.methods(response.headers["domain_uuid"]);
            fpwr.tasklist.shift();
            fpwr.registered(response);
            fpwr.checktask();
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

fpwr.ngfwPhysicalIntf = function(mode, duplex, speed, enabled, MTU, logicalname, ipv4method, ipv4, ipv4mask, name, UUID) {
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
    this.ifname = logicalname,
    this.name = name,
    this.id = UUID
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
    this.interfaceMode = interfaceMode
    if (typeof intfid !== "undefined"){
        this.interfaces = [
            {
                type: "PhysicalInterface",
                id: intfid,
                name: intfname
            }
        ] 
    }

}

fpwr.registered = function() {
	io.to(fpwr.currentClient).emit("register-success", fpwr);
}

fpwr.socketResponse = function(socketEvent, object) {
	io.to(fpwr.currentClient).emit(socketEvent, object);
}