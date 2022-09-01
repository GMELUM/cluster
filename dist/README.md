# @elum/cluster

# Language: [RU](./README.RU.md) | [EN](./README.md)

# Installation

### YARN

    yarn add @elum/cluster

### NPM

	npm i -s @elum/cluster

# Getting Started

## Cluster

Cluster this is class for created child process.

It wraps default events and methods from `node:cluster` 
for simple interactions between the main process and the child.

Callback from argument Cluster is body to child process.
****
### **cluster** :
 first argument in callback has an initialized from Cluster.
  ****
### **events** :
 function that accepts a callback to handle events from the Master. **Сallback receives events that are not waiting for a response.**

****
```ts
import { Cluster } from "@elum/cluster"

new Cluster((cluster, events) => {

	events((
		type, // type events 
		value, // data events
		reply // function on send response
	) => { reply({ result: true }) });

	const result = await cluster.send("CLIENT_ADD", { clientId: 1 });
		// result - response from Master

	cluster.send("CLIENT_ADD", { clientId: 1 }, (data) => {
		// data - response from Master
	})

}).start();
```

## Master

Master this is class for created main process.

It wraps default events and methods from `node:cluster` 
for simple interactions between the main process and the child.

Callback from argument Cluster is body to main process.
****
### **master** 
first argument in callback has an initialized from Master.

 ****
### **events** 
 function that accepts a callback to handle events from the Master. **Сallback receives events that are not waiting for a response.**

****
```ts
import { Master } from "@elum/cluster"

new Master((master, events) => {

	events((
		type, // type events 
		value, // data events
		reply // function on send response
	) => { reply({ result: true }) });
    
    const cluster = master.newCluster(); // created new cluster

    // send request and get promise response
	const result = await master.send(cluster, "CLIENT_ADD", { clientId: 1 });
		// result - response from Cluster

    // send request and get callback response
	master.send(cluster, "CLIENT_ADD", { clientId: 1 }, (data) => {
		// data - response from Cluster
	})

}).start();
```

## Example
```ts
/** ./index.js */

import process from  "node:process";
import cluster from  "cluster";

try {
	cluster.isPrimary  ?
		import("Master") :
		import("Cluster")
}
catch (error) {
	console.log(error);
	process.exit(1);
}
```
```ts
/** ./Cluster.js */

import { Cluster } from "@elum/cluster";
new Cluster((cluster, events) => {
    events((type, value, reply) => {
	    switch(type) {
		    case "MASTER_EVENTS": reply({ result: true }); break;
		}
	})
	const result = await cluster.send("CLUSTER_EVENTS", { title: "Cluster NodeJS" });
	// result = { data: { access: true } }
}).start();
```
```ts
/** ./Master.js */

import { Master } from "@elum/cluster";
new Master((master, events) => {
    events((cluster, type, value, reply) => {
	    switch(type) {
		    case "CLUSTER_EVENTS": reply({ data: { access: true } }); break;
		}
	})
    const cluster = master.newCluster();
	const result = await master.send(cluster, "MASTER_EVENTS", { clientId: 1 });
	// result = { result: true }
	
}).start();
```
## TypeScrypt
Cluster and Master accept generic interfaces for both Master and Cluster.
The user interface must extends from the prepared type.



```ts
import {
	Cluster,
	Master,
	BridgeCluster,
	BridgeMaster
} from "@elum/cluster";

interface CustomBridgeCluster extends BridgeCluster {
	"CLUSTER_EVENTS": [
		{ title: string }, // request type on first index
		{ 
			data: {
				access: boolean;
			} 
		}  // response type on second index
	]
}

interface CustomBridgeMaster extends BridgeMaster {
	"MASTER_EVENTS": [
		{ clientId: number }, // request type on first index
		{ result: boolean }  // response type on second index
	]
}

new Cluster<CustomBridgeMaster,CustomBridgeCluster>((cluster, events) => {
	events((type, value, reply) => ***)
	const result = await cluster.send("CLUSTER_EVENTS", { title: "Cluster NodeJS" });
	// result = { data: { access: true } }
}).start();

new Master<CustomBridgeMaster,CustomBridgeCluster>((master, events) => {
    events((cluster, type, value, reply) => ***);
    const cluster = master.newCluster();
	const result = await master.send(cluster, "MASTER_EVENTS", { clientId: 1 });
	// result = { result: true }
	
}).start();
```