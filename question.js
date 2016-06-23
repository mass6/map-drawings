// Drag the marker to calculate the travel distance and time from Parliament Hill, Ottawa. 

<script type="text/javascript" charset="utf-8">	
	
	$(document).ready(function(){
		
		// Identify the map
		var mapSGQA = '{SGQ}';
		var currentMap = gmaps[''+mapSGQA+'_c'];
			
		// Wait for the map to load
		google.maps.event.addListenerOnce(currentMap, 'idle', function(){ 
			
			// Some variable definitions
			var currentMarker = gmaps['marker__'+mapSGQA+'_c'];
			var answerInput = $('#answer'+mapSGQA+'_c');
			var defaultPosition = $(answerInput).val();
			var startLat = $('#answer'+mapSGQA+'_c').val().split(' ')[0];
			var startLng = $('#answer'+mapSGQA+'_c').val().split(' ')[1];
			var startLatLng = new google.maps.LatLng(startLat, startLng);
			var originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=O|FFFF00|000000';


			// Listener on the map events
			google.maps.event.addListener(currentMap, 'click', function() {
				calculateDistances(startLatLng, currentMarker.getPosition());
			});
			google.maps.event.addListener(currentMarker, 'dragend', function() {
				calculateDistances(startLatLng, currentMarker.getPosition());
			});
			google.maps.event.addListener(currentMap, 'rightclick', function() {
				calculateDistances(startLatLng, currentMarker.getPosition());
			});
			
			// Insert the results element
			$(answerInput).after('<div class="distanceResults" />');
			
		});
	});

	function calculateDistances(origin, destination) {
		var service = new google.maps.DistanceMatrixService();
		service.getDistanceMatrix({
			origins: [origin],
			destinations: [destination],
			travelMode: google.maps.TravelMode.DRIVING,
			unitSystem: google.maps.UnitSystem.METRIC,
			avoidHighways: false,
			avoidTolls: false
		}, callback);
	}

	function callback(response, status) {
		if (status != google.maps.DistanceMatrixStatus.OK) {
			alert('Error was: ' + status);
		} else {
			var origins = response.originAddresses;
			var destinations = response.destinationAddresses;
		
			var outputDiv = $('.questiontext');
			outputDiv.innerHTML = '';
	
			for (var i = 0; i < origins.length; i++) {
				var results = response.rows[i].elements;
				for (var j = 0; j < results.length; j++) {
					$('.distanceResults').html('Start address: '+origins[i]+'<br />\
												End address: '+destinations[j]+'<br />\
												Distance: '+results[j].distance.text+'<br />\
												Time: '+results[j].duration.text+'');
				}
			}
		}
	}
</script>