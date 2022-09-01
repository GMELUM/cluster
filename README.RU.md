# @elum/cluster

# Язык: [RU](./README.RU.md) | [EN](./README.md)

# Установка

### YARN

    yarn add @elum/cluster

### NPM

	npm i -s @elum/cluster

# Использование

## Cluster

Cluster это класс для создания дочернего процесса.

Он оборачивает стандартные события и методы из `node:cluster` для простого взаимодействия между основным процессом и дочерним.

Callback переданный в Cluster является телом дочернего процесса.
****
### **cluster** :
Первый аргумент в callback имеет инициализированный Cluster.
  ****
### **events** :
Функция, которая принимает обратный вызов для обработки событий от Мастера. **Сallback получает события, не ожидающие ответа.**

****
```ts
import { Cluster } from "@elum/cluster"

new Cluster((cluster, events) => {

	events((
		type, // тип события 
		value, // данные события
		reply // функция для отправки ответа
	) => { reply({ result: true }) });

	const result = await cluster.send("CLIENT_ADD", { clientId: 1 });
		// result - ответ от Master'a

	cluster.send("CLIENT_ADD", { clientId: 1 }, (data) => {
		// data - ответ от Master'a
	})

}).start();
```

## Master
Master это класс для создания основного процесса.

Он оборачивает стандартные события и методы из `node:cluster` для простого взаимодействия между основным процессом и дочерним.

Callback переданный в Master является телом основного процесса.
****
### **master** 
Первый аргумент в callback имеет инициализированный Master.

 ****
### **events** 
Функция, которая принимает обратный вызов для обработки событий от Cluster'a. **Сallback получает события, не ожидающие ответа.**
****
```ts
import { Master } from "@elum/cluster"

new Master((master, events) => {

	events((
		type, // тип события 
		value, // данные события
		reply // функция для отправки ответа
	) => { reply({ result: true }) });
    
    const cluster = master.newCluster(); // создание нового дочернего процесса

    // send request and get promise response
	const result = await master.send(cluster, "CLIENT_ADD", { clientId: 1 });
		// result - ответ от Cluster'a

    // send request and get callback response
	master.send(cluster, "CLIENT_ADD", { clientId: 1 }, (data) => {
		// data - ответ от Cluster'a
	})

}).start();
```

## Пример
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
## TypeScript
Cluster и Master принимают интерфейсы обоих классов в дженерик.
Пользовательский интерфейс должен расширяться из готовых `BridgeMaster` и `BridgeCluster`.

```ts
import {
	Cluster,
	Master,
	BridgeCluster,
	BridgeMaster
} from "@elum/cluster";

interface CustomBridgeCluster extends BridgeCluster {
	"CLUSTER_EVENTS": [
		{ title: string }, // Тип запроса в первом индексе
		{ 
			data: {
				access: boolean;
			} 
		}  // Тип ответа в втором индексе
	]
}

interface CustomBridgeMaster extends BridgeMaster {
	"MASTER_EVENTS": [
		{ clientId: number }, // Тип запроса в первом индексе
		{ result: boolean }  // Тип ответа в втором индексе
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
```