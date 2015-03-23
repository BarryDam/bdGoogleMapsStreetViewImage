var bdGoogleMapsStreetViewImage = function(getConfig) {
	// create new instance when directely called
	if (! this instanceof bdGoogleMapsStreetViewImage) 
		return new bdGoogleMapsStreetViewImage(getConfig);
	// Private object
	objPrivate = {
		element			: null,
		getElement : function()
		{
			if (objPrivate.element === null)
				objPrivate.element = document.getElementById(objPrivate.config.elementID);
			return objPrivate.element;
		},
		
		config  : {
			elementID	: null,
			ApiKey		: false,		// you need a "Street View Image API" get yours @ https://code.google.com/apies/console/
			width		: '500px',		// default maximum of 640px
			height		: '500px',		// default maximum of 640px
			lat			: '50.904145',	// latitude,
			lng			: '5.991091'	// longitude

		},
		maxWidth  : 640,
		maxHeight : 640,
		setConfig : function(getConfig)
		{
			if (typeof getConfig !== 'object' || Object.keys(getConfig).length === 0)
				return; 
			for (var i in getConfig)
				objPrivate.config[i] = getConfig[i];				
			// calc width height > max of 640px
			var width	= parseInt(objPrivate.config.width.replace('px', ''), 10),
				height	= parseInt(objPrivate.config.height.replace('px', ''), 10);
			if (width > objPrivate.maxWidth || height > objPrivate.maxHeight) {
				if (width == height) {
					width	= objPrivate.maxWidth;
					height	= objPrivate.maxHeight;
				} else if(width > height) {
					height	= (objPrivate.maxHeight/width)*height;
					width	= objPrivate.maxWidth;
				} else {
					width	= (objPrivate.maxWidth/height)*width;
					height	= objPrivate.maxHeight;
				}
				objPrivate.config.width  = Math.ceil(width)+'px';
				objPrivate.config.height = Math.ceil(height)+'px';
			}
		},
		
		triggerEvent : function(strEvent, data)
		{	
			var objDetail = (typeof data == 'object') ? data : null ;
			// predefined events
			switch (strEvent) {
				case 'link-changed' :
					objDetail = {'link' : objPrivate.image.getURL()};
					break;

				default : 
					// nothing
					break;
			}
			var event = new CustomEvent(
				strEvent, 
				{
					detail		: objDetail,
					bubbles		: true,
					cancelable	: true
				}
			);
			objPrivate.getElement().dispatchEvent(event);
		},

		map : {
			googleMapObject : null,
			
			init : function()
			{
				// set dimensions
				objPrivate.map.setWidth(objPrivate.config.width);
				objPrivate.map.setHeight(objPrivate.config.height);
				// stop when lat and long are not set
				if (! objPrivate.config.lat || ! objPrivate.config.lng) {
					console.error('lat lng not set');
					return;
				}
				// create the map
				var arrOptions  = {
					position : new google.maps.LatLng(objPrivate.config.lat, objPrivate.config.lng),
					pov : { 
						heading : 270,
						pitch: 0
					},
					visible: true,
					panControl: true, //
					zoomControl: true, //
					addressControl : false,
					linksControl : true,
					scaleControl: true

				};
				objPrivate.map.googleMapObject = new google.maps.StreetViewPanorama(objPrivate.getElement(), arrOptions);
				objPrivate.image.create();
				//google.maps.event.addListener(objPrivate.map.googleMapObject, 'zoom_changed', objPrivate.image.create);
				google.maps.event.addListener(objPrivate.map.googleMapObject, 'pano_changed', objPrivate.image.create);
				google.maps.event.addListener(objPrivate.map.googleMapObject, 'pov_changed', objPrivate.image.create);
				google.maps.event.addListener(objPrivate.map.googleMapObject, 'position_changed', objPrivate.image.create);				
				console.log(objPrivate.map.googleMapObject.getPosition().lat(), objPrivate.map.googleMapObject.getPosition().lng());
			},

			setLatLng : function(getLat, getLng)
			{
				if (! getLat || ! getLng)
					return;
				objPrivate.map.googleMapObject.setOptions({
					position : new google.maps.LatLng(getLat, getLng)
				});
			},

			setWidth : function(getWidth)
			{
				objPrivate.config.width = getWidth;
				objPrivate.getElement().style.width = getWidth;
			},

			setHeight : function(getHeight)
			{
				objPrivate.config.height = getHeight;
				objPrivate.getElement().style.height = getHeight;
			}
		},
		

		image : {
			url : 'http://',
			getURL : function()
			{
				return objPrivate.image.url;
			},
			timeoutCreate : null,
			create : function()
			{
				if (objPrivate.image.timeoutCreate)
					clearTimeout(objPrivate.image.timeoutCreate);
				objPrivate.image.timeoutCreate = setTimeout(function(){
					objPrivate.image.url = 'https://maps.googleapis.com/maps/api/streetview?';
					objPrivate.image.url += 'size='+objPrivate.config.width.replace('px','')+'x'+objPrivate.config.height.replace('px','');
					if (typeof objPrivate.map.googleMapObject.getPano() == 'undefined')
						return;
					objPrivate.image.url += '&pano='+objPrivate.map.googleMapObject.getPano();
					objPrivate.image.url += '&key='+objPrivate.config.ApiKey;
					objPrivate.image.url += '&fov='+90/Math.max(1, objPrivate.map.googleMapObject.getPov().zoom);
					objPrivate.image.url += '&heading='+objPrivate.map.googleMapObject.getPov().heading;
					objPrivate.image.url += '&pitch='+objPrivate.map.googleMapObject.getPov().pitch;
					objPrivate.triggerEvent('link-changed');	
				}, 100);
			}
		}
	};
	objPrivate.setConfig(getConfig);
	// public object
	this.init = function(getConfig)
	{
		// trigger error when elemntID is not set
		if (objPrivate.config.elementID === null) {
			console.error('elementID not set in config');
			return;		
		}
		// check for apikey
		if (! objPrivate.config.ApiKey) {
			console.error('You need a valid "Street View Image API" ApiKey get yours @ https://code.google.com/apies/console/');
			return;
		}
		// time out if google maps api is not loaded yet
		if (typeof(google) == 'undefined' || typeof(google.maps)=='undefined') {
			var that = this;
			setTimeout(function(){
				that.init();
			}, 500);
			return;
		}
		// create streetview object
		objPrivate.map.init();
		// trigger ready
		setTimeout(function(){
			objPrivate.triggerEvent('ready');
		},10);
		
	};
	this.getElement = function()
	{
		return objPrivate.getElement();
	};
	this.setLatLng = function(getLat, getLng)
	{
		objPrivate.map.setLatLng(getLat, getLng);
	};

};

/**
 * jQuery Plugin
 */
if (typeof jQuery != 'undefined') {
	(function($){ 
		var intNextID = 1,
			namespace = '.bd.googlemapsstreetviewimage',
			arrEvents = ['ready', 'link-changed'];
		$.fn.bdGoogleMapsStreetViewImage = function(getConfig) {
			this.each(function(){
				var $this = $(this);
				// create an ID if not present
				if (! $this.attr('id')) {
					$this.attr('id', 'bdGoogleMapsStreetViewImage-'+intNextID);
					intNextID++;
				}
				// build the config
				var configDimensionsDefault = {};
				if ($this.width() && $this.height()) {
					configDimensionsDefault = {
						width	: $this.width()+'px',
						height	: $this.height()+'px',
					};
				}

				var config = $.extend(
					configDimensionsDefault, 
					getConfig, 
					{
						elementID : $this.attr('id')
					}
				);
				// exec bdGoogleMapsStreetViewImage 
				var o = new bdGoogleMapsStreetViewImage(config);
				for(var i in arrEvents) {
					o.getElement().addEventListener(arrEvents[i], function(event){
						// stop immediate so that we can bound extra data passed by custom event
						event.stopImmediatePropagation();
						var data = (event.detail !== null) ? event.detail :  null ;
						// plugin specific ( with namespace)
						$this.trigger(event.type+namespace, [data]);
					}, false);	
				}				
				// initialize bdGoogleMapsStreetViewImage
				o.init(); 
				// store in object data
				$this.data('bdGoogleMapsStreetViewImage', o);
			});
		};
	})(jQuery);
}
