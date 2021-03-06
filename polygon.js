/**
 * MAP SETTINGS
 * Here you can specify the initial map setting
 *
 * 1. Position: Latitude and Longitude settings
 * 2. Zoom level:  0-22,  (higher number is more zoomed in)
 *
 *  * @type {{position: {lat: number, long: number}, zoomLevel: number}}
 */
var settings = {
    position: {
        lat: 55.6773329,  // <-- EdiT This
        long: 12.5514528  // <-- EdIT This
    },
    polygon: {
        borderColor: '#000000',
        fillColor: '#ff0000'
    },
    zoomLevel: 15,  	  // <-- EdIT This
    testMode: true       // <-- Change this true to see the output when testing
};
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// END OF MAP SETTINGS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Identify the map
var SGQA = '_map';
var answerInput = $('#answer' + SGQA);
var answerObject = {
};

//Edit form to be displayed with new marker
var EditForm =
    '<div class="marker-info-win" style="min-width: 200px;">' +
    '<div class="marker-inner-win">' +
    '<div class="wrapper">' +
    '<div class="row">' +
    '<div class="col-md-12">' +
    '<form action=" " method="POST" name="SaveMarker" id="SaveMarker" class="">' +
    '<div class="form-group">' +
    '<label for="issue-description">Comments</label>' +
    '<textarea class="form-control save-description" rows="4" name="issue-description"></textarea>' +
    '</div>' +
    '<div class="form-group actions">' +
    '<button type="button" name="save-marker" class="save-marker btn btn-success btn-sm" title="Save info">Save</button>' +
    '<button name="remove-marker" class="remove-marker btn btn-danger btn-sm" title="Delete point" style="margin-left:6px;">Delete point</button>' +
    '</div>' +
    '</form>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';


var timerSet = false;

function setSingleTimer(callback) {
    if (!timerSet) {
        timerSet = true;
        setTimeout(function() {
            callback();
            timerSet = false;
        },20);
    }
}


$(document).ready(function () {

    if (!settings.testMode) {
        answerInput.hide();
    }

    (function includeGoogle() {
        if (typeof google === 'undefined') {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBQLesy7ouvgb_5jsUbrehh0qHgjZkSlmc&libraries=drawing";
            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            head.appendChild(script);
        }
    })();

    var map;
    //variables to improve drawing
    var drawingManager;

//functions added to improve the drawing
    function getCoordates(polygon) {
        var coordinates=[];
        polygon.getPath().forEach(function(latLng){
            coordinates.push({
                lat: latLng.lat(),
                lng: latLng.lng(),
            });
        })

        return coordinates;
    }


    function initialize() {

        if (typeof google === 'undefined') {
            setTimeout(function () {
                console.log('loading map...');
                return initialize();
            }, 10);
            return;
        }

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: settings.zoomLevel,
            //minZoom: 7,
            center: new google.maps.LatLng(settings.position.lat, settings.position.long),
            streetViewControl: false,
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
                drawingModes: [google.maps.drawing.OverlayType.POLYGON]
            },
            polygonOptions: {
                strokeColor: settings.polygon.borderColor,
                fillColor: settings.polygon.fillColor
            },
            map: map
        });
        drawingManager.setMap(map);

        //########  When polygon is created in map  ########
        google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {
            polygon.setDraggable(true);
            var coordinates = getCoordates(polygon);
            var contentString = $(EditForm);
            var InfoOpenDefault = true;
            //Create an infoWindow
            var infowindow = new google.maps.InfoWindow({
                maxWidth: 300,
                position: coordinates[0]
            });
            infowindow.setContent(contentString[0]); //this makes sure the infowindow is resized
            google.maps.event.addListener(infowindow,'closeclick',function(){
                if (!polygon.saved) {
                    polygon.setMap(null); //removes the polygon
                }
            });

            //Find remove button in infoWindow
            var removeBtn = contentString.find('button.remove-marker')[0];
            var saveBtn = contentString.find('button.save-marker')[0];
            var descriptionArray = [];
            //add click listener to remove marker button
            google.maps.event.addDomListener(removeBtn, "click", function (event) {
                infowindow.close();
                remove_polygon(polygon, descriptionArray);
                event.preventDefault();//prevent reload of the page
            });
            //if there is a savebutton, add click listener
            if (typeof saveBtn !== 'undefined') { //continue only when save button is present
                //if there is a savebutton = not save yet
                //add click listener to save marker button
                google.maps.event.addDomListener(saveBtn, "click", function (event) {
                    var mDescription = contentString.find('textarea.save-description')[0].value; //description input field value
                    descriptionArray.push(mDescription);
                    //call save marker function
                    save_polygon(polygon, mDescription);
                    infowindow.close();

                });//event when click on 'Save'
            }//if there is a save button
            //add click listener on marker
            google.maps.event.addListener(polygon, 'click', function (el) {
                polygon.saved = true;
                infowindow.open(map, polygon); // click on marker opens info window
            });

            if (InfoOpenDefault) { //whether info window should be open by default
                infowindow.open(map, polygon);
            }
            // Switch back to non-drawing mode after drawing a shape.
            drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user mouses down on it.

            // Handle the drag end case for the marker, which becomes unselected
            google.maps.event.addListener(polygon, "dragend", function () {
                infowindow.setPosition(getCoordates(polygon)[0]);
                save_polygon(polygon);
            });
        });
    }

    //############### Remove Marker Function ##############
    function remove_polygon(polygon, descriptionArray) {
        answerObject = {
        };
        answerInput.val(JSON.stringify(answerObject));
        polygon.setMap(null);
    }

    //############### Save Marker Function ##############
    function save_polygon(polygon, mDescription) {
        var description = mDescription;
        if (typeof mDescription === 'undefined') {
            description = answerObject.description;
        }
        answerObject = {
                coordinates: getCoordates(polygon),
                description: description
        };
        answerInput.val(JSON.stringify(answerObject));
    }

    initialize();
});
