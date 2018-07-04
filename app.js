'use strict';

const path = require('path');
const Vue = require('vue/dist/vue.runtime.common.js');
const VueRender = require('vue-server-renderer').createRenderer();

var fs = require('fs');
var profiler = require('v8-profiler-node8');
var count = 0;

setInterval(function(){
	var snapshot1 = profiler.takeSnapshot();
	snapshot1.export(function(error, result) {
		fs.writeFileSync(`snapshot-2.4.1-${count}.heapsnapshot`, result);
		snapshot1.delete();
	});
	count++
}, 1000 * 15);

// var snapshot1 = profiler.takeSnapshot();
// var snapshot2 = profiler.takeSnapshot();
//
// console.log(snapshot1.getHeader(), snapshot2.getHeader());
//
// console.log(snapshot1.compare(snapshot2));
//
// // Export snapshot to file file
// snapshot1.export(function(error, result) {
// 	fs.writeFileSync('snapshot1.json', result);
// 	snapshot1.delete();
// });
//
// // Export snapshot to file stream
// snapshot2.export()
// 	.pipe(fs.createWriteStream('snapshot2.json'))
// 	.on('finish', snapshot2.delete);



var timer = setInterval(function(argument) {
	const App = {
		template: '<div>{{test}}</div>',
		computed: {
			"test": function() {
				throw 'erro happened';
				return 1;
			}
		}
	}
	const vm = new Vue(App);

	VueRender.renderToString(vm, function(error, html) {
		if (error) {
			console.log('error happened', error)
		} else {
			console.log(html);
		}
	})
}, 10);