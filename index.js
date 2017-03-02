(function () {
	'use strict';
	var topics = module.parent.require('./topics');
	var user = module.parent.require('./user');
	var plugin = {
		init: function (params, callback) {
			var router = params.router;
			var middleware = params.middleware;

			callback();
		},

		parse: function (data, callback) {
			console.log('hide post')
			if (!data || !data.postData || !data.postData.content) {
				return callback(null, data);
			}

			topics.getPids(data.postData.tid, function (err, pids) {
				if (err) {
					return callback(null, data);
				}
				pids[0] = pids[0].toString();
				// console.log(pids);

				user.getPostIds(data.uid, 0, -1, function (err, postIds) {

					// console.log(postIds);
					// console.log(intersect(pids, postIds).length);
					if(data.uid == data.postData.uid) {
						data.postData.content = plugin.parseUnLockedContent(data.postData.content);
					} else if( intersect(pids, postIds).length > 0 ) {
						data.postData.content = plugin.parseUnLockedContent(data.postData.content);
					} else {
						data.postData.content = plugin.parseLockedContent(data.postData.content);
					}
					
					console.log(data);
					callback(null, data);
				});
			});
			function intersect(a, b) {
			    var t;
			    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
			    return a.filter(function (e) {
			        return b.indexOf(e) > -1;
			    });
			}
			
		},

		parseLockedContent: function (content) {
			var tailStr = '[/hide]';
			var lockedInfo = '<div class="lockedInfo"><span>本帖部分内容已隐藏，请登入并回覆，以查看隐藏内容！</span></div>'
			while (content.indexOf("[hide]") >= 0){

				var head = content.indexOf('[hide]');
				var tail = content.indexOf('[/hide]');
				if (tail <= 0) 
					break;
				content = replaceAt(head, tail, content, lockedInfo);

			}
			var head = content.indexOf('[hide]');
			var tail = content.indexOf('[/hide]');
			return content;

			function replaceAt(headIndex, tailIndex, content, character) {
				console.log(content.substr(tailIndex, content.length));
    			return content.substr(0, headIndex) + character + content.substr(tailIndex + tailStr.length, content.length);
    		}
		},

		parseUnLockedContent: function (content) {
			while (content.indexOf('[hide]') >= 0){
				var tail = content.indexOf('[/hide]');
				if (tail <= 0) 
					break;
				content = content.replace('[hide]', '<div class="lockedInfo"><h4>本帖隐藏的內容</h4>');
				content = content.replace('[/hide]', '</div>');
			}
			return content;
		}
	};
	module.exports = plugin;
}) ();