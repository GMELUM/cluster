import {
	Cluster,
	Master,
	BridgeCluster,
	BridgeMaster
} from "./dist";

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

new Cluster<CustomBridgeMaster,CustomBridgeCluster>(async (cluster, events) => {
	events((type, value, reply) => { /** *** */ })
	const result = await cluster.send("CLUSTER_EVENTS", { title: "Cluster NodeJS" });
	// result = { data: { access: true } }
}).start();

new Master<CustomBridgeMaster,CustomBridgeCluster>(async (master, events) => {
    events((cluster, type, value, reply) => { /** *** */ });
    const cluster = master.newCluster();
	const result = await master.send(cluster, "MASTER_EVENTS", { clientId: 1 });
	// result = { result: true }
	
}).start();