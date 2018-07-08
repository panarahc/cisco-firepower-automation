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

{
  "links": {
    "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords?offset=0&limit=1"
  },
  "items": [
    {
      "id": "621deb54-80a3-11e8-97ac-dd9127b40102",
      "type": "Device",
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102"
      },
      "name": "FTDv-Edge1"
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 1,
    "count": 1,
    "pages": 1
  }
}

{
  "id": "621deb54-80a3-11e8-97ac-dd9127b40102",
  "type": "Device",
  "links": {
    "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102"
  },
  "name": "FTDv-Edge1",
  "description": "NOT SUPPORTED",
  "model": "Cisco Firepower Threat Defense for KVM",
  "modelId": "B",
  "modelNumber": "75",
  "modelType": "Sensor",
  "healthStatus": "green",
  "sw_version": "6.2.3",
  "healthPolicy": {
    "id": "138e8de6-80a7-11e8-98cf-2913995f68ed",
    "type": "HealthPolicy",
    "name": "Initial_Health_Policy 2018-07-05 22:59:30"
  },
  "hostName": "10.255.0.11",
  "license_caps": [
    "THREAT"
  ],
  "keepLocalEvents": false,
  "prohibitPacketTransfer": true,
  "metadata": {
    "readOnly": {
      "state": false
    },
    "domain": {
      "name": "Global",
      "id": "e276abec-e0f2-11e3-8169-6d9ed49b625f",
      "type": "domain"
    }
  }
}

{
  "links": {
    "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces?offset=0&limit=10"
  },
  "items": [
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935749"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/0",
      "id": "0CC78D19-EE00-0ed3-0000-008589935749"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935750"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/1",
      "id": "0CC78D19-EE00-0ed3-0000-008589935750"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935751"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/2",
      "id": "0CC78D19-EE00-0ed3-0000-008589935751"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935752"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/3",
      "id": "0CC78D19-EE00-0ed3-0000-008589935752"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935753"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/4",
      "id": "0CC78D19-EE00-0ed3-0000-008589935753"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935754"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/5",
      "id": "0CC78D19-EE00-0ed3-0000-008589935754"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935755"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/6",
      "id": "0CC78D19-EE00-0ed3-0000-008589935755"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935756"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/7",
      "id": "0CC78D19-EE00-0ed3-0000-008589935756"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935757"
      },
      "type": "PhysicalInterface",
      "name": "GigabitEthernet0/8",
      "id": "0CC78D19-EE00-0ed3-0000-008589935757"
    },
    {
      "links": {
        "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/621deb54-80a3-11e8-97ac-dd9127b40102/physicalinterfaces/0CC78D19-EE00-0ed3-0000-008589935758"
      },
      "type": "PhysicalInterface",
      "name": "Diagnostic0/0",
      "id": "0CC78D19-EE00-0ed3-0000-008589935758"
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 10,
    "count": 10,
    "pages": 1
  }
}

{
  "metadata": {
    "timestamp": 1531006219110,
    "domain": {
      "name": "Global",
      "id": "e276abec-e0f2-11e3-8169-6d9ed49b625f"
    }
  },
  "links": {
    "self": "https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/6350b2cc-80a3-11e8-b8ad-f19a641f91b7/physicalinterfaces/0CC78D19-EE00-0ed3-0000-012884902069"
  },
  "type": "PhysicalInterface",
  "mode": "NONE",
  "hardware": {
    "duplex": "AUTO",
    "speed": "AUTO"
  },
  "enabled": true,
  "MTU": 1500,
  "ifname": "OUTSIDE",
  "fragmentReassembly": false,
  "enableDNSLookup": false,
  "enableAntiSpoofing": false,
  "ipv4": {
    "static": {
      "address": "10.255.255.12",
      "netmask": "24"
    }
  },
  "ipv6": {
    "enableDHCPAddrConfig": false,
    "enableDHCPNonAddrConfig": false,
    "dadAttempts": 1,
    "nsInterval": 1000,
    "reachableTime": 0,
    "enableRA": true,
    "raLifeTime": 1800,
    "raInterval": 200,
    "enableAutoConfig": false,
    "enableIPV6": false,
    "enforceEUI64": false
  },
  "managementOnly": false,
  "name": "GigabitEthernet0/0",
  "id": "0CC78D19-EE00-0ed3-0000-012884902069"
}

{ metadata: 
   { timestamp: 1531006431430,
     domain: { name: 'Global', id: 'e276abec-e0f2-11e3-8169-6d9ed49b625f' } },
  links: 
   { self: 'https://10.255.0.10/api/fmc_config/v1/domain/e276abec-e0f2-11e3-8169-6d9ed49b625f/devices/devicerecords/6350b2cc-80a3-11e8-b8ad-f19a641f91b7/physicalinterfaces/0CC78D19-EE00-0ed3-0000-012884902069' },
  type: 'PhysicalInterface',
  mode: 'NONE',
  hardware: { duplex: 'auto', speed: 'auto' },
  enabled: 'true',
  MTU: '1500',
  fragmentReassembly: false,
  ipv4: { static: { address: '10.255.255.12', netmask: '24' } },
  ipv6: 
   { enableDHCPAddrConfig: false,
     enableDHCPNonAddrConfig: false,
     dadAttempts: 1,
     nsInterval: 1000,
     reachableTime: 0,
     enableRA: true,
     raLifeTime: 1800,
     raInterval: 200,
     enableAutoConfig: false,
     enableIPV6: false,
     enforceEUI64: false },
  managementOnly: false,
  name: 'GigabitEthernet0/0',
  id: '0CC78D19-EE00-0ed3-0000-012884902069',
  ifname: 'OUTSIDE' }
