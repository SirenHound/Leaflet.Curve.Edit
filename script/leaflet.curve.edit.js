L.DivIconStyled = L.DivIcon.extend({
  createIcon: function(){
    var r = L.DivIcon.prototype.createIcon.apply(this);
    for (var styleOption in this.options.styleOptions){
      r.style[styleOption] = this.options.styleOptions[styleOption];
    }//.backgroundColor = "yellow";
    return r;
  }
});

L.Curve.include({
  getLatLngs: function(){
    return this._coords.filter(function(coord){
      return Array.isArray(coord);
    }).map(function(coord){
      return L.latLng(coord);
    });
  },
  /** Create markers from the points defining this curve and assign them as types
  */
  getTypedMarkers: function (){
    var icons = {
      qControl: new L.DivIconStyled({styleOptions:{backgroundColor: 'yellow'}}),
      cControl1: new L.DivIconStyled({styleOptions:{backgroundColor: 'yellow'}}),
      cControl2: new L.DivIconStyled({styleOptions:{backgroundColor: 'orange'}}),
      vAnchor: new L.DivIconStyled({styleOptions:{backgroundColor: 'green'}}),
      hAnchor: new L.DivIconStyled({styleOptions:{backgroundColor: 'pink'}})
    };
    
	var prev;
	var layers = [];
	var runSwitch = function(coord, i, coords){
		var markers = [];
		var guiLayers = [];
		switch (coord){
			case "M": case "L": // Single point
				markers.push(new L.Marker(coords[i+1], {type: "anchor", icon: new L.DivIcon()}));
				break;
			case "V":
				var backBy = 1; // How far back to look for the other half of the coordinate
				switch (prev) {
					case "M": case "L":
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][1]], {type: "anchor", icon: icons.vAnchor}));
					break;
					case "V":// Need to go back further!
//					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][0]], {type: "anchor", icon: icons.vAnchor}));
					break;
					case "H":
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][0]], {type: "anchor", icon: icons.vAnchor}));
					break;
					default:
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][1]], {type: "anchor", icon: icons.vAnchor}));
				}
				break;
			case "H":
				var backBy = 1; // How far back to look for the other half of the coordinate
				switch (prev) {
					case "M": case "L":
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
						break;
					case "V":
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
						break;
					case "H":// Need to go back further!
						break;
					default:
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
				}
				break;
			case "Q":// Quadratic has 2 coords
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.qControl}));
				markers.push(new L.Marker(coords[i+2], {type: "anchor", icon: new L.DivIcon()}));
				guiLayers.push(new L.Polyline([coords[i-1], coords[i+1]], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+1], coords[i+2]], {color: 'yellow'}));
				break;
			case "C":// Cubic has 3 coords
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.cControl1}));
				markers.push(new L.Marker(coords[i+2], {type: "control1", icon: icons.cControl2}));
				markers.push(new L.Marker(coords[i+3], {type: "anchor", icon: new L.DivIcon()}));
				// first coord works with previous point. coords has already calculated point from partials (V, H)
				guiLayers.push(new L.Polyline([coords[i-1], coords[i+1]], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+2], coords[i+3]], {color: 'yellow'}));
				break;
			case "S":// S is shortcut C. Will fail following M L V H
				var reflCoord = [2*coords[i-1][0] - coords[i-2][0], 2*coords[i-1][1] - coords[i-2][1]];
				markers.push(new L.Marker(reflCoord, {type: "control1", icon: icons.cControl1}));
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.cControl2}));
				markers.push(new L.Marker(coords[i+2], {type: "anchor", icon: new L.DivIcon()}));
				// first coord works with previous point. coords has already calculated point from partials (V, H)
				guiLayers.push(new L.Polyline([coords[i-2], reflCoord], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+2], coords[i+3]], {color: 'yellow'}));
				break;
		}
		return markers.concat(guiLayers);
	};
	
	var coords = this._coords;
	for (var i = 0; i < coords.length;i++){
	//this._coords.forEach(function(coord, i, coords){
		var coord = coords[i];
		
		if ("string" === typeof coord){

			layers = layers.concat(runSwitch(coord, i, coords));
			switch (coord){
			case "M": case "L": case "V": case "H": // Single point (or Array)
				i++;
				break;
			case "S": case "Q":// 2 coords
				i += 2;
				break;
			case "C":// 3 coords
				i += 3;
				break;
			default:
				i++;
			}
			
			prev = coord;
		}
		else{
			layers = layers.concat(runSwitch(prev, i-1, coords));
			switch (prev){
			case "M": case "L": case "V": case "H": // Single point (or Array)
				i++;
				break;
			case "S": case "Q":// 2 coords
				i += 2;
				break;
			case "C":// 3 coords
				i += 3;
				break;
			default:
				i++;
			}
			
		}
	}
    return layers; //markers.concat(guiLayers);
  }

});
