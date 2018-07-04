
# 记一次vue ssr导致的node内存溢出问题排查，解决过程
---

Node:  v8.11.2

Vue: 2.2.6

Vue-server-renderer: 2.2.6


## 起因
线上文章、社区等项目不定时会告警，登录终端查看日志后发现

`FATAL ERROR：CALL_AND_RETRY_LAST  Allocation failed -  javaScript heap out of memory`

好吧，Node内存溢出。

观察上下文， 通常伴随服务端渲染出错日志，初步怀疑vue ssr问题导致内存溢出

[image:8EB03540-DED5-4589-A715-25678BC9E6B8-829-000043A8BB01A549/4860BFA6501837A1721731125E06ACB1.png]

[image:06D51703-1345-4A1D-BFB0-9EB74A8D3AE2-829-0000441BDDF72C6F/3640-E9B1A1192D2C.png]


## 问题定位

[谷歌：vue ssr out of memory](https://www.google.com.hk/search?safe=strict&hl=zh-CN&source=hp&ei=yCg8W_v0G4b48QWcw7-QCw&q=vue+ssr+out+of+memory&oq=vue+ssr+out+of+m&gs_l=psy-ab.3.0.33i160k1.64.6766.0.8002.19.18.1.0.0.0.135.1742.13j5.18.0....0...1c.1.64.psy-ab..0.18.1634...0j0i131k1j0i12k1j0i12i10k1j0i30k1.0.OJvo8jTsCbQ)

[image:F0F26708-4FF4-460A-8F46-B41E4FFAED2E-829-0000450D43CF6701/5F0D38C5-EA2F-4919-84DC-4DAFB5A83C6A.png]

[从第一条开始看起](https://github.com/vuejs/vue/issues/5975)

[image:9FCFA410-4962-499E-B0E5-3986F325FBF8-829-0000451B64384FC4/C777A571-C6B9-4C6F-BC66-78162443D39E.png]


vue、vue-server-render版本2.2.3

服务端渲染使用时，computed如果定义了一个function并且没有正确返回时，导致memory leak 发生。

[作者给的vue-memory-leak项目链接地址](https://github.com/freeozyl80/vue-memory-leak)

查看readme， 上述情况发生后，vue$2和watcher对象不会被自动回收，导致内存一直增长


[image:62293E5F-F3E3-49C4-996C-1516E0155652-829-00004560BDF690DA/1530669716805.jpg]


线上项目使用的vue、vue-server-render版本2.2.6使用这个demo看一下会不会是相同的原因。

1. 修改vue、vue-server-renderer版本为2.2.6，

2. 安装监控node内存的工具包

`npm i v8-profiler-node8 -S`

[image:480BDD43-4522-4756-9001-A5A9D4ED05E7-829-000045906232DCBB/B61048A3-F689-424F-A809-21C6FF32AE7D.png]


3. 编写代码，生成内存快照

App.js中添加如下代码，每隔15秒生成一次快照

```
*var*fs = require('fs');
*var*profiler = require('v8-profiler-node8');
*var*count = 0;

/setInterval/(*function*(){
	*var*snapshot1 = profiler.takeSnapshot();
	snapshot1.export(*function*(error, result) {
		fs.writeFileSync(`snapshot-2.4.1-${count}.heapsnapshot`, result);
		snapshot1.delete();
	});
	count++
}, 1000 * 15);

```

4. 通过chrome自带的devtools查看内存快照


[image:C0E643DC-24A9-4A47-862C-C2888D713C6A-829-000045CE9182A39C/E6AF894E-D315-4EFF-ABD6-EDF67AD16449.png]


[image:C65F1497-AD81-4BB3-9CE0-FE800A97BC30-829-000045DB7B15DF4F/3A16D72D-95CC-42AD-B98F-F2BE7A0268F0.png]


[image:00D21171-B7E3-4189-9DBD-38B277282D4F-829-000045E3F95B3F43/D7307136-6E24-40B2-8D56-1ED297767134.png]

比较内存快照后发现，确实存在这个问题。

## 解决
[继续看iss](https://github.com/vuejs/vue/issues/5975)

[image:8A1E0A67-E1E1-426E-88B8-3F302E2CB3CC-829-00004612F736CBAE/C0479124-0213-49A2-AB7D-23DB7B337D01.png]

[问题已经被修复，查看一下](https://github.com/jskrzypek/vue/commit/69bf519e1ec7c60cecfe9e1c6b0f37f9a24a21eb)

fix: #5988

[修复版本v2.4.0](https://github.com/vuejs/vue/releases/tag/v2.4.0)

显示从2.4.0起bug修复

[image:87A8AD88-7257-4805-9D8D-6AECDD041D8D-829-0000464FC3F0C0F7/B9A67A0C-8861-4D21-B6C5-A9CA449661A2.png]

[image:8D51A46F-AF40-4FFC-8E47-8649D811BC66-829-0000465FA9A2645E/DCCB2EDF-5F6F-41F9-9CAA-9F00A9C05433.png]

修改vue、vue-server-render版本到v2.4.1版本后查看内存快照，确实问题已经解决

[image:7E1AEF4F-64FA-48AD-9977-92883DDA43D1-829-000046B1642EF2C7/829746E8-1FC7-45D4-94D3-EA3E109FAA6B.png]



两种修复方式

	1.  不实用computed(需修改代码)
	2. 更新vue和vue-server-render版本到v2.4.0版本及以上(只需改版本，重新构建就好，可能会有兼容性问题。)
对比，先尝试第二种，发布test站没有发现问题。
最终采用第二种方式解决

测试项目代码地址

End---------------

