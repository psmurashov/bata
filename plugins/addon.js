(function () {
    'use strict';
	
	var plugins = Lampa.Storage.get('plugins','[]')
	plugins.forEach(function(plug) {
		plug.url = (plug.url + '').replace('https://psmurashov.github.io/bata/plugins/addon.js', 'https://bylampa.github.io/addon.js').replace('https://psmurashov.github.io/bata/plugins/addon.js', 'https://bylampa.github.io/addon.js');
	})	
	Lampa.Storage.set('plugins',plugins)
	
