
// Identify the map
	var SGQA = '{SGQ}';
	var answerInput = $('#answer'+SGQA);
	var answerObject = {
	};

	


$(document).ready(function () {
	var map
	//variables to improve drawing
    var drawingManager;
	var markersArray = [];


	//Edit form to be displayed with new marker
	var EditForm = '<p><div class="marker-edit scrollFix">' +
                '<form action=" " method="POST" name="SaveMarker" id="SaveMarker" class="form-inline">' + 
				'<div id="infotext" class="form-group">' +
				
				'<label for="prescategory" style="margin:0px">You were: </label>'+
				'<select name="prescategory" id="ResCategory" class="save-rescategory form-control">' +
				'<option selected="selected" disabled="true">-- Select --</option>' +
				'<option value="Pedestrian">Pedestrian</option>' +
				'<option value="Bike">Bike</option>' +
				'<option value="Motorized vehicles">Motorized vehicles</option>' +
				'</select>' +
				
				'<label for="pcategory" style="margin:0px">Conflict with:</label>'+
				'<select name="pcategory" id="Category" class="save-category form-control">' +
				'<option selected="selected" disabled="true">-- Select --</option>' +
				'<option value="Pedestrian">Pedestrian</option>' +
				'<option value="Bike">Bike</option>' +
				'<option value="Motorized vehicles">Motorized vehicles</option>' +
				'<option value="Design">Design</option>' +
				'<option value="Maintenance">Maintenance</option>' +
				'</select>' +
				
				'<p>Describe the situation</p>' +
				'<textarea class="form-control save-description" rows="3"></textarea>' +
				'</div>'+
                '</form></div></p>'+
				'<button type="button" name="save-marker" class="save-marker btn btn-info" style="float: right;" title="Save info">Save</button>';	
	

	var selectedShape;

//functions added to improve the drawing
function clearSelection(){
	if (selectedShape){
		selectedShape.setIcon('/images/mapping/custompin_blue.png');
	}
	selectedShape = null;
}

function setSelection(shape){
	clearSelection();
	selectedShape = shape;
	//shape.setIcon(image);
}//setSelection

var image = '/images/mapping/custompin_small.png';
//first map

function initialize() {

		if (typeof google === 'undefined') {
			setTimeout(function() {
				console.log('waiting for map to load');
				return initialize();
			}, 500);
			return;
		}

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
			//minZoom: 7,
            center: new google.maps.LatLng(38.6487895, -90.3107962),
			    mapTypeControl: true,
				mapTypeControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
    			},
				panControl: false,
				zoomControl: true,
    			zoomControlOptions: {
    			    style: google.maps.ZoomControlStyle.SMALL,
    			    position: google.maps.ControlPosition.TOP_RIGHT
    			},
    			scaleControl: true
   		});

		//########Create a drawing manager####
        drawingManager = new google.maps.drawing.DrawingManager({
			drawingMode: null,
			drawingControl: true,
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT,
				drawingModes: [google.maps.drawing.OverlayType.MARKER] 
				//google.maps.drawing.OverlayType.CIRCLE]
				//drawingModes: [google.maps.drawing.OverlayType.MARKER]
			},
			map: map,
			markerOptions: {
				icon: image
			}
		});
		drawingManager.setMap(map);
		
		//########  When marker is created in map  ########
		google.maps.event.addListener(drawingManager, 'markercomplete', function(marker) {
			marker.setDraggable(true);
			marker.setIcon(image);
			var position = marker.getPosition();		
			var markerIndex = markersArray.push(marker) - 1;			
			var contentString = $('<div class="marker-info-win">' +
            '<div class="marker-inner-win"><span class="info-content">' + 
			EditForm +
            '</span><button name="remove-marker" class="remove-marker btn btn-danger" title="Delete point">Delete point</button>' +
            '</div></div>');
			var InfoOpenDefault=true;
			//Create an infoWindow
			var infowindow = new google.maps.InfoWindow({
				maxWidth:450
			});
			infowindow.setContent(contentString[0]); //this makes sure the infowindow is resized
			//Find remove button in infoWindow
			var removeBtn = contentString.find('button.remove-marker')[0];
			var saveBtn = contentString.find('button.save-marker')[0];
			var descriptionArray = [];
			//add click listener to remove marker button
			google.maps.event.addDomListener(removeBtn, "click", function (event) {
				remove_marker(marker, markerIndex, descriptionArray);
				event.preventDefault();//prevent reload of the page
			});
			//if there is a savebutton, add click listener
			if (typeof saveBtn !== 'undefined') { //continue only when save button is present
				//if there is a savebutton = not save yet
				//add click listener to save marker button
				google.maps.event.addDomListener(saveBtn, "click", function (event) {
					var mReplace = contentString.find('span.info-content'); //html to be replaced after success
					var mCategory = contentString.find('select.save-category')[0].value; //actvity selected
					var mResCategory = contentString.find('select.save-rescategory')[0].value; //actvity selected
					var mDescription = contentString.find('textarea.save-description')[0].value; //description input field value
					descriptionArray.push(mDescription);					
							//call save marker function
							save_marker(marker, markerIndex,  mCategory, mResCategory, mDescription, mReplace); 
							infowindow.close();
							$('div.marker-inner-win').css('height', '150px');
				});//event when click on 'Save'
			}//if there is a save button
			//add click listener on marker		 
			google.maps.event.addListener(marker, 'click', function () {
				infowindow.open(map, marker); // click on marker opens info window
			});
			if(InfoOpenDefault){ //whether info window should be open by default
				infowindow.open(map,marker);
			}
			// Switch back to non-drawing mode after drawing a shape.
            drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user mouses down on it.
            google.maps.event.addListener(marker, 'click', function() {
			  setSelection(marker);
            });
            setSelection(marker);
			// Handle the drag end case for the marker, which becomes unselected
			google.maps.event.addListener(marker, "dragend",function(){
                setSelection(marker);
            });
        });//event markercomplete	
} //initialize    



    //############### Remove Marker Function ##############
    function remove_marker(marker, index, descriptionArray) {
    	console.log(index);
		//prevent reload of the page because the button is on a tab
        //if marker is draggable do nothing
        if (marker.getDraggable()) {
		marker.setMap(null); //just remove new marker
        } else {//if they are not, save the data
            var mlatlong = marker.getPosition().toUrlValue(); //get marker position
			var mDescription = descriptionArray[index];
            var myData = {
                del: 'true',
				mindex: index,
				description: mDescription,
				latlong: mlatlong
			}; //post variables
			delete answerObject[myData.mindex];
        	answerInput.val(JSON.stringify(answerObject));
        	marker.setMap(null);
        }
    }



 	//############### Save Marker Function ##############
    function save_marker(Marker, markerIndex, mCategory, mResCategory, mDescription, replaceWin) {
		//Save new marker using jQuery Ajax
        var mlatlong = Marker.getPosition().toUrlValue(); //get marker position
		var mzoom = map.getZoom();
        var myData = {
			mindex: markerIndex,
            latlong: mlatlong,
			zoom: mzoom,
            respondenttype: mResCategory,
            vehicletype: mCategory,
            description: mDescription
        };
        Marker.setDraggable(false); //set marker to fixed
		Marker.setIcon('/images/mapping/custompin_blue.png');
        answerObject[myData.mindex] = myData;
        answerInput.val(JSON.stringify(answerObject));


		//setmarkerico(Marker,mActivity);
		Marker.setIcon('/images/mapping/custompin_blue.png');
    }


    initialize();

});