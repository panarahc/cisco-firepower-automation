//static UUIDs
uuids = {
	"name": "Maximum Detection",
	"id": "d224e29c-6c27-11e0-ac9d-988fc3da9be6",
	"name": "Connectivity Over Security",
	"id": "abbad193-46bd-4535-ade6-73cc7e76fb7b",
	"name": "Balanced Security and Connectivity",
	"id": "abba00a0-cf29-425c-9d75-49699aadc898",
	"name": "Security Over Connectivity",
	"id": "abba9b63-bb10-4729-b901-2e2aa0f4491c"
}

response codes = {
	accessPolicies: 201,
	deviceRecord: 202,
	physicalinterfaces: 200 //FTD physical interface
}

// license examples
// firepower device
license_caps: [ 
    "MALWARE",
    "URLFilter",
    "PROTECT",
    "CONTROL",
    "VPN"
    ]
// ftd device
"license_caps": [  
  "BASE",
  "MALWARE",
  "URLFilter",
  "THREAT"
]