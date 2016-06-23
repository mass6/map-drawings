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
    zoomLevel: 15  		  // <-- EdIT This
}
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// END OF MAP SETTINGS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Identify the map
var SGQA = '_map';
var answerInput = $('#answer' + SGQA);
var answerObject = {};

//Edit form to be displayed with new marker
var EditForm =
    '<div class="marker-info-win" style="min-width: 500px;">' +
    '<div class="marker-inner-win">' +
    '<div class="wrapper">' +
    '<div class="row">' +
    '<div class="col-md-6">' +
    '<div id="pano-div" style="height:200px;background:yellow"></div>' +
    '</div>' +
    '<div class="col-md-6">' +
    '<form action=" " method="POST" name="SaveMarker" id="SaveMarker" class="">' +
    '<div class="form-group">' +
    '<label for="issue-description">Describe the situation</label>' +
    '<textarea class="form-control save-description" rows="6" name="issue-description"></textarea>' +
    '</div>' +
    '<div class="form-group actions">' +
    '<button type="button" name="save-marker" class="save-marker btn btn-info" style="float: right;" title="Save info">Save</button>' +
    '<button name="remove-marker" class="remove-marker btn btn-danger" title="Delete point">Delete point</button>' +
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

    var panoDiv;
    var panorama;
    var pov;

    answerInput.hide();

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

    function getPanorama(element, position, povSetting) {
        if (typeof povSetting === 'undefined') {
            povSetting = {
                heading: 34,
                pitch: 10
            };
        }
        panorama = new google.maps.StreetViewPanorama(element, {
            position: position,
            pov: povSetting
        });
        panorama.addListener('pov_changed', function () {
            pov = panorama.getPov();
        });
        panorama.addListener('pano_changed', function () {
            //marker.setPosition(panorama.getPosition());
        });

        return panorama;
    }

    var map;
    //variables to improve drawing
    var drawingManager;
    var markersArray = [];


    var selectedShape;

//functions added to improve the drawing
    function clearSelection() {
        if (selectedShape) {
            selectedShape.setIcon('./images/mapping/custompin_blue.png');
        }
        selectedShape = null;
    }

    function setSelection(shape) {
        clearSelection();
        selectedShape = shape;
        //shape.setIcon(image);
    }//setSelection

    var image = './images/mapping/custompin_small.png';
//first map



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
                drawingModes: [google.maps.drawing.OverlayType.MARKER, google.maps.drawing.OverlayType.POLYGON]
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
        google.maps.event.addListener(drawingManager, 'markercomplete', function (marker) {
            marker.setDraggable(true);
            marker.setIcon(image);
            marker.setTitle('New Point');
            var position = marker.getPosition();
            var markerIndex = markersArray.push(marker) - 1;


            var contentString = $(EditForm);
            var InfoOpenDefault = true;
            //Create an infoWindow
            var infowindow = new google.maps.InfoWindow({
                maxWidth: 600
            });
            infowindow.setContent(contentString[0]); //this makes sure the infowindow is resized
            google.maps.event.addListener(infowindow,'closeclick',function(){
                if (!marker.saved) {
                    marker.setMap(null); //removes the marker
                }
            });

            panoDiv = contentString.find('div#pano-div')[0];
            panorama = getPanorama(panoDiv, position);
            map.setStreetView(panorama);
            map.setOptions({
                streetViewControl: true
            });


            // pov = panorama.getPov();
            // panorama.addListener('pov_changed', function () {
            //     pov = panorama.getPov();
            //     console.log(pov);
            //     console.log(panorama.getPano());
            // });
            // panorama.addListener('pano_changed', function () {
            //     console.log(panorama.getPano());
            // });


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
                    var mDescription = contentString.find('textarea.save-description')[0].value; //description input field value
                    descriptionArray.push(mDescription);
                    //call save marker function
                    save_marker(marker, markerIndex, panorama, mDescription);
                    infowindow.close();
                    //$('div.marker-inner-win').css('height', '150px');
                    map.setOptions({
                        streetViewControl: false
                    });
                    panorama.setVisible(false);
                });//event when click on 'Save'
            }//if there is a save button
            //add click listener on marker
            google.maps.event.addListener(marker, 'click', function (el) {
                panorama = getPanorama(panoDiv, marker.getPosition(), answerObject[markerIndex].pov);
                panorama.addListener('position_changed', function () {
                    marker.setPosition(panorama.getPosition())
                });
                marker.saved = true;
                // pov = panorama.getPov();
                // panorama.addListener('pov_changed', function () {
                //     pov = panorama.getPov();
                // });
                map.setStreetView(panorama);
                map.setOptions({
                    streetViewControl: true
                });
                // panorama.setVisible(false);

                infowindow.open(map, marker); // click on marker opens info window
                google.maps.event.addListener(infowindow,'closeclick',function(){

                    map.setOptions({
                        streetViewControl: false
                    });
                    panorama.setVisible(false);
                });
                setSelection(marker);
            });
            // google.maps.event.addListener(marker, 'click', function() {


            //          });
            if (InfoOpenDefault) { //whether info window should be open by default
                infowindow.open(map, marker);
            }
            // Switch back to non-drawing mode after drawing a shape.
            drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user mouses down on it.

            setSelection(marker);
            // Handle the drag end case for the marker, which becomes unselected
            google.maps.event.addListener(marker, "dragend", function () {
                setSelection(marker);
                panorama = getPanorama(panoDiv, marker.getPosition());
                map.setStreetView(panorama);
            });
            google.maps.event.addListener(marker, "drag", function () {
                setSingleTimer(function() {
                    panorama = getPanorama(panoDiv, marker.getPosition());
                    map.setStreetView(panorama);
                });
            });

            map.setOptions({
                streetViewControl: false
            });
            panorama.setVisible(true);

        });
    }


    //############### Remove Marker Function ##############
    function remove_marker(marker, index, descriptionArray) {
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
    function save_marker(Marker, markerIndex, panorama, mDescription) {
        //Save new marker using jQuery Ajax
        var mlatlong = Marker.getPosition().toUrlValue(); //get marker position
        var mzoom = map.getZoom();
        var myData = {
            mindex: markerIndex,
            latlong: mlatlong,
            zoom: mzoom,
            pano: panorama.getPano(),
            pov: panorama.getPov(),
            description: mDescription
        };
        Marker.setDraggable(false); //set marker to fixed
        Marker.setIcon('./images/mapping/custompin_blue.png');
        answerObject[myData.mindex] = myData;
        answerInput.val(JSON.stringify(answerObject));
    }


    initialize();

});
