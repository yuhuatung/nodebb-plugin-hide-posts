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
			if (!data || !data.postData || !data.postData.content) {
				return callback(null, data);
			}

			if (data.uid == 0){
				data.postData.content = plugin.parseLockedDownloadContent(data.postData.content);
			}
			topics.getPids(data.postData.tid, function (err, pids) {
				if (err) {
					return callback(null, data);
				}
				if (pids.length > 0 ) {
					pids[0] = pids[0].toString();
					
					user.getPostIds(data.uid, 0, -1, function (err, postIds) {
						if (data.uid == data.postData.uid) {
							data.postData.content = plugin.parseUnLockedContent(data.postData.content);
						} else if ( intersect(pids, postIds).length > 0 ) {
							data.postData.content = plugin.parseUnLockedContent(data.postData.content);
						} else {
							data.postData.content = plugin.parseLockedContent(data.postData.content);
						}
						callback(null, data);
					});
				} else {
					callback(null, data);
				}
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
			while (content.indexOf("[hide]") >= 0) {

				var head = content.indexOf('[hide]');
				var tail = content.indexOf('[/hide]');
				if (tail <= 0) {
					break;
				} else if (tail < head) {
					var lastTail = content.lastIndexOf('[/hide]');
					if (head < lastTail) {
						content = replaceAt(head, lastTail, content, lockedInfo);
						break;
					} else {
						break;
					}
				}
				content = replaceAt(head, tail, content, lockedInfo);
			}
			return content;

			function replaceAt(headIndex, tailIndex, content, character) {
    			return content.substr(0, headIndex) + character + content.substr(tailIndex + tailStr.length, content.length);
    		}
		},

		parseUnLockedContent: function (content) {
			var tailStr = '[/hide]';
			var tempTail = 0;
			while (content.indexOf('[hide]') >= 0){
				var head = content.indexOf('[hide]');
				var tail = content.indexOf('[/hide]');
				if (head < tempTail) {
					break;
				} else if (tail <= 0) {
					break;
				} else if (tail < head) {
					var lastTail = content.lastIndexOf('[/hide]');
					if(head < lastTail){
						content = content.replace('[hide]', '<div class="lockedInfo"><h4>本帖隐藏的內容</h4>');
						var newLastTail = content.lastIndexOf('[/hide]');
						content = content.substr(0, newLastTail) + '</div>' + content.substr(newLastTail + tailStr.length, content.length);
					}
					break;
				}
				content = content.replace('[hide]', '<div class="lockedInfo"><h4>本帖隐藏的內容</h4>');
				content = content.replace('[/hide]', '</div>');
				tempTail = tail;
			}
			return content;
		},

		parseLockedDownloadContent: function (content) {
			var tailStr = '</a>';
			var lockedInfo = '<div class="lockedInfo"><span>本帖下載内容已隐藏，请登入以查看隐藏内容！</span></div>'
			while (content.indexOf('<a href') >= 0) {
				var head = content.indexOf('<a href');
				var tail = content.lastIndexOf('</a>');
				content = replaceAt(head, tail, content, lockedInfo);
			}
			return content;

			function replaceAt(headIndex, tailIndex, content, character) {
				return content.substr(0, headIndex) + character + content.substr(tailIndex + tailStr.length, content.length);
			}
		}
	};
	module.exports = plugin;
}) ();