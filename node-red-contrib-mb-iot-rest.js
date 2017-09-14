module.exports = function (RED) {

	function MB_IOT_REST_API_NODE(config) {

		RED.nodes.createNode(this, config);
		var node = this;

		this.on('input', function (msg) {

			if (msg.payload === undefined || msg.payload === null) {
				msg.payload = 'no payload.';
				node.send(msg);
				return;
			}

			var request = require('request');
			var querystring = require('querystring');
			var baseUrl = 'http://localhost:8787/motionboard';
			var pathName = '/rest/tracking/data/upload/public';

			var millis = new Date().getTime();
			var uniqueId = millis.toString(16) + Math.floor(1000 * Math.random()).toString(16);
			var loginId = msg.loginId === undefined ? 'id-' + uniqueId : msg.loginId;
			var dispUserName = 'nodered';
			
			// URL, PARAM
			var queryJson = {};
			if (msg.mb != null) {
				baseUrl = msg.mb.url == null ? baseUrl : msg.mb.url;
				queryJson = {
					id: uniqueId,
					name: dispUserName,
					tenant: (msg.mb.tenant == null ? 'fill_tenant' : msg.mb.tenant),
					authkey: (msg.mb.authkey == null ? 'fill_authkey' : msg.mb.authkey),
					template: (msg.mb.template == null ? 'fill_template' : msg.mb.template)
				}
			} else {
				baseUrl = config.url == null ? baseUrl : config.url;
				queryJson = {
					id: uniqueId,
					name: dispUserName,
					tenant: (config.tenant == null ? 'fill_system' : config.tenant),
					authkey: (config.authkey == null ? 'fill_authkey' : config.authkey),
					template: (config.template == null ? 'fill_template' : config.template)
				}
			}
			if (baseUrl.endsWith('/')) {
				baseUrl = baseUrl.substr(0, baseUrl.length - 1);
			}

			// BODY
			var b = createBody(msg.simple, millis, loginId, queryJson.template, msg.payload);
			var optionsUrl = baseUrl + pathName + '?' + querystring.stringify(queryJson);
			var options = {
				method: 'POST',
				url: optionsUrl,
				headers: {
					'Content-type': 'application/json'
				},
				json: b
			};

			request.post(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					msg.payload = body;
					node.send(msg);
				} else {
					msg.payload = body;
					node.send(msg);
				}
			});
		});
	}

	function createBody(simple, millis, loginId, template, payload) {
		var b = {};
		if (simple != null && simple) {

			if (Object.keys(payload).length === 0) {
				payload = 'empty payload.';
				node.send(msg);
				return;
			}

			b.loginId = loginId;
			b.name = 'mbnode';
			b.template = template;
			b.version = millis;
			b.retry = true;
			b.locations = [];
			b.msg = [];
			b.status = [];

			var time = payload.time === undefined ? millis : payload.time;
			if (payload.time !== undefined) delete payload['time'];

			// LOCATION
			if (payload.lat !== undefined && payload.lon !== undefined) {
				var locationValues = {
					time: time,
					uptime: payload.uptime === undefined ? millis : payload.uptime,
					lat: payload.lat,
					lon: payload.lon,
					accuracy: payload.accuracy === undefined ? 0 : payload.accuracy
				};
				b.locations.push(locationValues);
				delete payload['lat'];
				delete payload['lon'];
				if (payload.uptime !== undefined) delete payload['uptime'];
				if (payload.accuracy !== undefined) delete payload['accuracy'];
			}

			// STATUS
			if (Object.keys(payload).length !== 0) {
				var statusValues = [];
				Object.keys(payload).forEach(function (key) {
					var statusEntry = {
						name: key,
						type: typeOf(payload[key]),
						value: payload[key]
					};
					statusValues.push(statusEntry);
				});
				var statusDict = {
					time: time,
					enabled: 'true',
					values: statusValues
				};
				b.status.push(statusDict);
			}
		}
		return b;
	}

	function typeOf(obj) {
		var typeStr = typeof (obj);
		if ('boolean' === typeStr) {
			return '1';
		} else if ('string' === typeStr) {
			return '2';
		} else if ('number' === typeStr) {
			return '3';
		} else {
			return '2';
		}
	}

	RED.nodes.registerType('node-red-contrib-mb-iot-rest', MB_IOT_REST_API_NODE);
}
