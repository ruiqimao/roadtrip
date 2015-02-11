BING_API_KEY = '';

var curLocation = '';

$(document).ready(function() {
	$('#origin-box').focus();
});

$('#origin-box').keypress(function(e) {
	if(e.which == 13 && !$('#go-button').is(':disabled')) {
		$('#go-button').click();
		return false;
	}
});

$('#go-button').click(function() {
	var origin = encodeURIComponent($('#origin-box').val().trim());
	if(origin != '') {
		$('#go-button').text('PLANNING YOUR TRIP...');
		$('#go-button').attr('disabled', true);
		$('#loader').slideDown();
		$.ajax({
			url:'http://rt.ruiqimao.com:5000/5/' + origin,
			method:'GET',
			dataType:'json',
			success:function(data) {
				displayTrip(data[0]);
			},
			error:function() {
				$('#go-button').removeAttr('disabled');
				$('#go-button').text('LET\'S GO');
				$('#loader').slideUp();
			}
		});
	} else if(curLocation != '') {
		$('#origin-box').val(curLocation);
		$(this).click();
	}
});

function displayTrip(data) {
	console.log(data);
	var start = data[0];
	var bounds = [start['lat'] - 2, start['lng'] - 2, start['lat'] + 2, start['lng'] + 2];
	var waypointStrings = [];
	for(var i = 0; i < data.length; i ++) {
		waypointStrings.push('waypoint.' + (i + 1) + '=' + data[i]['lat'] + ',' + data[i]['lng']);
	}
	var url = 'http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/Routes/Driving?' + waypointStrings.join('&') + '&mapSize=600,600&key=' + BING_API_KEY;
	$('#map').load(function() {
		$('.route').empty();
		var wpString = [];
		for(var i = 0; i < data.length; i ++) {
			var waypoint = data[i];
			wpString.push('pos.' + waypoint['lat'] + '_' + waypoint['lng']);
			var waypointDiv = $('<div class="waypoint"><div class="waypoint-side"><div class="waypoint-icon"></div><div class="waypoint-bar"></div></div><div class="waypoint-info-button"><img src="images/icons/about.png" /></div>' + waypoint['name'] + '<div class="waypoint-info"></div></div>');
			if(i == data.length - 1) waypointDiv.find('.waypoint-bar').remove();
			var waypointInfoButton = waypointDiv.find('.waypoint-info-button');
			var waypointInfo = waypointDiv.find('.waypoint-info');
			waypointInfo.append('<img class="waypoint-info-map" src="http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/' + waypoint['lat'] + ',' + waypoint['lng'] + '/15?mapSize=600,150&pushpin=' + waypoint['lat'] + ',' + waypoint['lng'] + '&key=' + BING_API_KEY + '" />');
			waypointInfo.append('<a class="waypoint-info-navigate" target="_blank" href="http://www.bing.com/maps/?where1=' + waypoint['lat'] + ',' + waypoint['lng'] + '">NAVIGATE HERE</a>');
			waypointInfo.append('<a class="waypoint-info-hotels" target="_blank" href="http://www.findhotelgps.com/search/gps/' + waypoint['lat'] + '/' + waypoint['lng'] + '/15">FIND HOTELS</a>');
			waypointInfo.append('<b>Coordinates: </b>' + waypoint['lat'] + ', ' + waypoint['lng']);
			waypointInfoButton.click(function() {
				var infoBox = $(this).parent().find('.waypoint-info');
				infoBox.slideToggle();
			});
			$('.route').append(waypointDiv);
		}
		$('.total-results-button').attr('href','http://bing.com/maps/?rtp=' + wpString.join('~'));
		$('#screen-initial').fadeOut();
		$('#screen-results').fadeIn();
		setTimeout(function() {
			$('#go-button').removeAttr('disabled');
			$('#go-button').text('LET\'S GO');
			$('#loader').slideUp();
		}, 400);
	});
	$('#map').attr('src', url);
}

$('#show-map-button').click(function() {
	if($(this).text() == 'SHOW MAP') $(this).text('HIDE MAP');
	else $(this).text('SHOW MAP');
	$('#map').slideToggle();
});

if(navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(setLocation);
}

function setLocation(position) {
	curLocation = position.coords.latitude + ',' + position.coords.longitude;
}
