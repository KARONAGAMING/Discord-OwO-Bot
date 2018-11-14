/* Checks the current ram every hour.
 * It resets the all shards if we have less than 0.75GB of ram left
 */
const si = require('systeminformation');
var Manager;
/* Interval to check (1H) */
const interval = 3600000;
/* Minimum ram (0.75GB) */
const resetbyte = 805306368;
/* Shard reset delay (15s) */
const resetDelay = 15000;

/* Initial constrution */
exports.check = function(ShardingManager){
	Manager = ShardingManager;
	setInterval(ramCheck,interval);
}

/* Checks ram and initial resetShards() if not enough */
async function ramCheck(){
	let ram = (await si.mem()).available;
	console.log("CURRENT RAM: "+(ram/(1024*1024*1024))+"G");
	if(ram<=resetbyte){
		console.log("NOT ENOUGH RAM. RESETTING SHARDS");
		resetShards();
	}
}

/* Assigns delays to shard resets */
function resetShards(){
	for(var i=0;i<Manager.totalShards;i++){
		var func = resetShard(i);
		setTimeout(func,(i+1)*resetDelay);
	}
}

/* Resets a shard via broadcastEval */
function resetShard(id){
	var num = id;
	return function(){
		Manager.broadcastEval(`
			if(this.shard.id==${num}){
				console.log("["+this.shard.id+"] Shard is restarting!");
				process.exit(0);
			}
		`);
	}
}
