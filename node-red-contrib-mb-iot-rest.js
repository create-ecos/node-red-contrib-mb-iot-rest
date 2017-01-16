module.exports = function(RED) {
	
    function MB_IOT_REST_API_NODE(config) {
    	
        RED.nodes.createNode(this,config);
        var node = this;
        
        this.on('input', function(msg) {
        	
        	var request = require('request');
        	var urlBuilder = require('url');
        	
        	var uniqueId = new Date().getTime().toString(16)+Math.floor(1000*Math.random()).toString(16);
        	var dispUserName = 'nodered';
        	urlBuilder.protocol = 'http:';
        	urlBuilder.pathname = '/motionboard/rest/tracking/data/upload/public'
        	if(msg.mb != null) {
        		if(msg.mb.protocol != null && msg.mb.protocol == 'HTTPS') {
        			urlBuilder.protocol = 'https:';
        		}
        		if(msg.mb.port != null) {
        			urlBuilder.port = msg.mb.port;
        		}
        		urlBuilder.hostname = msg.mb.host == null ? 'localhost' : msg.mb.host;
        		urlBuilder.query = {
        			id : uniqueId,
        			name : dispUserName,
        			tenant : (msg.mb.tenant == null ? 'fill_tenant' : msg.mb.tenant),
        			authkey : (msg.mb.authkey == null ? 'fill_authkey' : msg.mb.authkey),
        			template : (msg.mb.template == null ? 'fill_template' : msg.mb.template)
        		}
        	} else {
        		urlBuilder.hostname = config.host == null ? 'host' : config.mbhost;
        		if(config.protocol != null && config.protocol == 'HTTPS') {
        			urlBuilder.protocol = 'https:';
        		}
        		if(config.port != null) {
        			urlBuilder.port = config.port;
        		}
        		urlBuilder.hostname = config.host == null ? 'localhost' : config.host;
        		urlBuilder.query = {
        			id : uniqueId,
        			name : dispUserName,
        			tenant : (config.tenant == null ? 'fill_system' : config.tenant),
        			authkey : (config.authkey == null ? 'fill_authkey' : config.authkey),
        			template : (config.template == null ? 'fill_template' : config.template)
        		}
        	}        	
        	
        	var optionsUrl = urlBuilder.format(urlBuilder);
        	var options = {
				method: 'POST',
				url: optionsUrl,
				headers: {
					'Content-type': 'application/json'
				},
				json: msg.body
			};
			request.post(options, function(error, response, body){
				if (!error && response.statusCode == 200) {
					console.log(body);
					msg.payload = body;
					node.send(msg);
					context.done(null);
				} else {
					console.log('error: ' + body);
					msg.payload = body;
					node.send(msg);
					context.done("Failed");
				}
			});
		});
    }
    
    RED.nodes.registerType('node-red-contrib-mb-iot-rest', MB_IOT_REST_API_NODE);
}
