/* global $, document, nDig */
/* exported clear_blocks, new_block */
var uiBlocksCount = 0;
var blocks = [];
var block_height = 0;

var block_width_px = 32;				//width of the block in px (match this to css)
var block_margin_px = 15;				//desired margin of the block
var block_left_px = block_width_px + block_margin_px;
var moveBlocks = null;					//interval var

$(document).on('ready', function () {
    startTheShow();

});

function initChatbot(){// cirrently not to be used as this is just medium for communication
  //Init chatbot
  var bin = {"project":"4b52b4fb-1aa7-4ef0-b529-b6ee57427cd6"};
    $.ajax({
      url: 'https://conversation.pullstring.ai/v1/conversation',
      type: "POST",
      data: JSON.stringify(bin),
      contentType: "application/json",
      headers: {
      "Authorization": "Bearer b38b9820-cf32-46a1-9639-986a74ae33af"
      },
      success: function (res) {
      localStorage.setItem("conv",res.conversation);
        console.log("chatbot initialized");
      },
      error: function(error) {
        console.log("chatbot init failed: "+error);
      }
    });
}
function startTheShow() {
    moveBlocks = setInterval(function () {
        move_on_down();
    }, 2000);
}

function new_block(id) {											//rec a new block
    id = Number(id);
    if (!blocks[id]) {											//if its a new block, build it

        if (uiBlocksCount > 0) {									//build missing blocks, except on load (so we dont start at block 0)
            for (var prev = block_height + 1; prev < id; prev++) {
                console.log('building missing block', prev);
                blocks[prev] = { block_height: prev };
                build_block(prev);								//build the missing blocks
            }
        }

        if (id > block_height) {									//only draw blocks that are newer
            blocks[id] = { block_height: id };
            build_block(id);									//build this new block
            block_height = id;
        }
    }
    move_on_down();
}

function build_block(id) {										//build and append the block html
    var sizeClass = '';
    if (id >= 1000000) {
        sizeClass = 'million';									//figure out a size thats okay
    } else if (id >= 1000) {
        sizeClass = 'thousands';
    } else {
        id = nDig(id, 3);
    }

    var html = '<div class="block ' + sizeClass + '">' + id + '</div></div>';
    $('#blockWrap').append(html);

    // move the block left (number_of_blocks * blocks_width) + 2 blocks_width
    $('.block:last').animate({ opacity: 1, left: (uiBlocksCount * block_left_px) + block_left_px * 2 }, 600, function () {
        $('.lastblock').removeClass('lastblock');
        $('.block:last').addClass('lastblock');
    });
    uiBlocksCount++;
}

function move_on_down() {										//move the blocks left
    if (uiBlocksCount > 12) {
        $('.block:first').animate({ opacity: 0 }, 800, function () {
            $('.block:first').remove();
        });
        $('.block').animate({ left: '-=' + block_left_px }, 800, function () { });
        uiBlocksCount--;

        if (uiBlocksCount > 12) {								//fast mode, clear the blocks!
            clearInterval(moveBlocks);
            setTimeout(function () {
                move_on_down();
            }, 900);											//delay should be longer than animation delay
        }
        else {
            startTheShow();
        }
    }
}


function onLoad(){
  var chainHeight = null;
  localStorage.clear();
  localStorage.setItem("chainHeight",0);
  var i = 1;
  function checkBlock(){
    $.ajax({url: "http://neoplatform.bcone.com/chain", success: function(result){
     chainHeight = result.height;
    if(chainHeight != null){
      if(localStorage.getItem("chainHeight")>0 && localStorage.getItem("chainHeight") != chainHeight) {
        localStorage.setItem("chainHeight",chainHeight);//Block keeps executing for everypoll
        new_block(i);
        fetchTransaction(i);
        i++;


      } else {
          localStorage.setItem("chainHeight",chainHeight); // for initially when it was 0 to initialize to some value
      }
      if(i==1){//Block executes 1 time initially
        new_block(i);
        fetchTransaction(i);
        i++;

      }
        }
        //if(chainHeight != null)
        //callBlocks(chainHeight);
         // }});
      }
    });
  }


  function fetchTransaction(i){
    var chainQueryURL = "http://neoplatform.bcone.com/chaincode";
    var responseJson = null;

    var jsonData = {}
    jsonData.jsonrpc = "2.0";
    jsonData.method = "query";
    jsonData.id = 5;
    var paramsData = {}
    paramsData.type = 1;
    paramsData.chaincodeID = {}
    paramsData.chaincodeID.name = "9515e8035d5e8566fc2061e592572181a0c2d8143672d89177304c724b5f1c511dee56aee2b50e930ac3783ab8da8417aa51065e342bf3a3a150e1bfebde3c62"
    paramsData.ctorMsg = {}
    paramsData.ctorMsg.function = "query";
    paramsData.ctorMsg.args = [];
    paramsData.secureContext = "test_user0";

    jsonData.params = paramsData;

    $.ajax({url: chainQueryURL,
       type: "POST",
       dataType: "json",
       data: JSON.stringify(jsonData),
       contentType: "application/json",
       success: function(result){
       responseJson =  JSON.parse(result.result.message);
       console.log(responseJson);
       updateTruckDataToUI(responseJson, i);
 },
      error: function(err){
        console.log(err);
      }});

  }

  function updateTruckDataToUI(data, i){

      function getJSTime(unix_timestamp){
        // Create a new JavaScript Date object based on the timestamp
      // multiplied by 1000 so that the argument is in milliseconds, not seconds.
      var date = new Date(unix_timestamp*1000);
      // Hours part from the timestamp
      var hours = date.getHours();
      // Minutes part from the timestamp
      var minutes = "0" + date.getMinutes();
      // Seconds part from the timestamp
      var seconds = "0" + date.getSeconds();

      // Will display time in 10:30:23 format
      var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
      return formattedTime;

      }


    $("#truck1Title").html('');
    $("#truck1BelowTitle").text(data.Truck1.name)
    $("#truck1Title")//.append( "<div class='truckData topMargin'><b> Status: </b>"+data.Truck1.status+"</div>" )
  //  .append( "<div class='truckData'> Time: "+getJSTime(data.Truck1.time)+"</div>" )
  //  .append( "<div class='truckData addHeight'> Address: "+data.Truck1.address+"</div>" )
  //  .append( "<div class='truckData'> Shock: "+data.Truck1.shock+"</div>" )
    .append("<div id='truck1' class='donut-size'>      <div class='pie-wrapper'>        <span class='label'>          <span class='num'>0</span><span class='smaller'>%</span>        </span>        <div class='pie'>          <div class='left-side half-circle'></div>          <div class='right-side half-circle'></div>        </div>        <div class='shadow'></div>      </div></div>")
    .append("<div id='temp' class='tempT1'>   <img class='thermoHt' src=" + "images/thermometer.png" + ">  </div>")
    .append("<div id='temp' class='mapT1 popup' >   <img class='thermoHt'  src=" + "images/map.png" + ">    </img>    <div class='popuptext' id='myPopup'  >    </div>            </div>")
    .append("<div id='temp' class='paletT1'>   <img class='thermoHt' src=" + "images/palet0.png" + ">  </div>");

    $("#truck2Title").html('');
    $("#truck2BelowTitle").text(data.Truck2.name)
    $("#truck2Title")//.append( "<div class='truckData topMargin'> Status: "+data.Truck2.status+"</div>" )
  //  .append( "<div class='truckData'> Time: "+getJSTime(data.Truck2.time)+"</div>" )
  //  .append( "<div class='truckData addHeight'> Address: "+data.Truck2.address+"</div>" )
  //  .append( "<div class='truckData'> Shock: "+data.Truck2.shock+"</div>" )
    .append("<div id='truck2' class='donut-size'>      <div class='pie-wrapper'>        <span class='label'>          <span class='num'>0</span><span class='smaller'>%</span>        </span>        <div class='pie'>          <div class='left-side half-circle'></div>          <div class='right-side half-circle'></div>        </div>        <div class='shadow'></div>      </div></div>")
    .append("<div id='temp' class='tempT2'>   <img class='thermoHt' src=" + "images/thermometer.png" + ">  </div>")
    .append("<div id='temp' class='mapT2'>   <img class='thermoHt' src=" + "images/map.png" + "> </img> </div>")
    .append("<div id='temp' class='paletT2'>   <img class='thermoHt' src=" + "images/palet0.png" + ">  </div>");

      $("#truck3Title").html('');
    $("#truck3BelowTitle").text(data.Truck3.name)
    $("#truck3Title")//.append( "<div class='truckData topMargin'> Status: "+data.Truck2.status+"</div>" )
  //  .append( "<div class='truckData'> Time: "+getJSTime(data.Truck3.time)+"</div>" )
  //  .append( "<div class='truckData addHeight'> Address: "+data.Truck3.address+"</div>" )
    //.append( "<div class='truckData'> Shock: "+data.Truck3.shock+"</div>" )
    .append("<div id='truck3' class='donut-size'>      <div class='pie-wrapper'>        <span class='label'>          <span class='num'>0</span><span class='smaller'>%</span>        </span>        <div class='pie'>          <div class='left-side half-circle'></div>          <div class='right-side half-circle'></div>        </div>        <div class='shadow'></div>      </div></div>")
.append("<div id='temp' class='tempT3'>   <img class='thermoHt' src=" + "images/thermometer.png" + ">  </div>")
.append("<div id='temp' class='mapT3'>   <img class='thermoHt' src=" + "images/map.png" + "> </img>  </div>")
.append("<div id='temp' class='paletT3'>   <img class='thermoHt' src=" + "images/palet0.png" + ">  </div>");

  $("#truck4Title").html('');
    $("#truck4BelowTitle").text(data.Truck4.name)
    $("#truck4Title")//.append( "<div class='truckData topMargin'> Status: "+data.Truck2.status+"</div>" )
  //  .append( "<div class='truckData'> Time: "+getJSTime(data.Truck4.time)+"</div>" )
    //.append( "<div class='truckData addHeight'> Address: "+data.Truck4.address+"</div>" )
    //.append( "<div class='truckData'> Shock: "+data.Truck4.shock+"</div>" )
    .append("<div id='truck4' class='donut-size'>      <div class='pie-wrapper'>        <span class='label'>          <span class='num'>0</span><span class='smaller'>%</span>        </span>        <div class='pie'>          <div class='left-side half-circle'></div>          <div class='right-side half-circle'></div>        </div>        <div class='shadow'></div>      </div></div>")
.append("<div id='temp' class='tempT4'>   <img class='thermoHt' src=" + "images/thermometer.png" + ">  </div>")
.append("<div id='temp' class='mapT4'>   <img class='thermoHt' src=" + "images/map.png" + "> </img>  </div>")
.append("<div id='temp' class='paletT4'>   <img class='thermoHt' src=" + "images/palet0.png" + ">  </div>");
      //Setting temperature


      function myMap(){
          var popup = document.getElementById("myPopup");
            popup.classList.toggle("show");

      }

      $(".mapT1").click(function(){myMap()});
      $(".mapT2").click(function(){myMap()});
      $(".mapT3").click(function(){myMap()});
      $(".mapT4").click(function(){myMap()});



      var mapOptions = {
          center: new google.maps.LatLng(51.5, -0.12),
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.HYBRID
      }
    var map = new google.maps.Map(document.getElementById("myPopup"), mapOptions);


      $(".tempT1").append("<br>2 degrees");
        $(".tempT2").append("<br>5 degrees");
          $(".tempT3").append("<br>1.4 degrees");
            $(".tempT4").append("<br>2.2 degrees");

            $(".mapT1").append("<br>"+data.Truck2.address);
            $(".mapT2").append("<br>"+data.Truck2.address);
            $(".mapT3").append("<br>"+data.Truck2.address);
            $(".mapT4").append("<br>"+data.Truck2.address);

      setTimeout(function(){
        var threshold = 2.8/3*100;
      updateDonutChart('#truck1', Math.floor(data.Truck1.shock/3*100), true);
      updateDonutChart('#truck2', Math.floor(data.Truck2.shock/3*100), true);
      updateDonutChart('#truck3', Math.floor(data.Truck3.shock/3*100), true);
      updateDonutChart('#truck4', Math.floor(data.Truck4.shock/3*100), true);

      if(data.Truck1.shock>2.8){
        console.log("inside truck1 issue");
        //alert("Contract breached: Truck 1 shock level crossed 2.5G threshold");
        $('.error').text('Truck1 has breached contract').fadeIn(400).delay(3000).fadeOut(800);
        var notifhtml = buildNotifHtml(data.Truck1, i, "Truck1");
        $('.notifContent').append(notifhtml);
        makeBlockRed();

      }

      if(data.Truck2.shock>2.8){
        console.log("inside truck2 issue");
      //  alert("Contract breached: Truck 2 shock level crossed 2.5G threshold");
        $('.error').text('Truck2 has breached contract').fadeIn(400).delay(3000).fadeOut(800);
        var notifhtml = buildNotifHtml(data.Truck2, i, "Truck2");
        $('.notifContent').append(notifhtml);
        makeBlockRed();
      }

      if(data.Truck3.shock>2.8){
        console.log("inside truck3 issue");
      //  alert("Contract breached: Truck 3 shock level crossed 2.5G threshold");
        $('.error').text('Truck3 has breached contract').fadeIn(400).delay(3000).fadeOut(800);
        var notifhtml = buildNotifHtml(data.Truck3, i, "Truck3");
        $('.notifContent').append(notifhtml);
        makeBlockRed();
      }

      if(data.Truck4.shock>2.8){
        console.log("inside truck4 issue");
      //  alert("Contract breached: Truck 4 shock level crossed 2.5G threshold");
        $('.error').text('Truck4 has breached contract').fadeIn(400).delay(3000).fadeOut(800);
        var notifhtml = buildNotifHtml(data.Truck4, i , "Truck4");
        $('.notifContent').append(notifhtml);
        makeBlockRed();
      }


      updateLeftMenuBlock(data);
      //Transaction appended to transaction areaa on every call
        // var html = build_a_tx(data, i);
        // $('.txContent').append(html);
        //
        // if(i>4){
        //     $('.txContent').children('li:first').remove();
        //
        //   }

 }, 600);
  }

      function updateLeftMenuBlock(data){
        $('.txContent').children('li').remove();


        var html = '';

        html += '<li class="timeline"  >';
        html +=   '</span>' + 'Payment Advance' + '</span> <div></div>'
        html += '<div id="T1Adv"></div>';

        html +=  '</span>' + 'Violations' + '</span> <div></div>'
        html +=  '<div id="T1Violations"></div>';

        html +=   '</span>' + 'Penalty Cut' + '</span> <div></div>'
        html += '<div id="T1Penalty"></div>';

        html += '<div id="T1line"></div>'

        html += '</li>'

        $('.txContent').append(html);

        $('#T1Adv').LineProgressbar({
          fillBackgroundColor: '#C3CD59',
          radius: '9px',
          percentage: 30 // in %
        });
        $('#T1Violations').LineProgressbar({
          fillBackgroundColor: '#C3CD59',
          radius: '9px',
          percentage: 30 // in %
        });
        $('#T1Penalty').LineProgressbar({
          fillBackgroundColor: 'rgb(217, 83, 79)',
          radius: '9px',
          percentage: 2 // in %
        });

        var html = ''

        html += '<li class="timeline"  >';
        html +=   '</span>' + 'Payment Advance' + '</span> <div></div>'
        html += '<div id="T2Adv"></div>';

        html +=  '</span>' + 'Violations' + '</span> <div></div>'
        html +=  '<div id="T2Violations"></div>';

        html +=   '</span>' + 'Penalty Cut' + '</span> <div></div>'
        html += '<div id="T2Penalty"></div>';
        html += '<div id="T2line"></div>'

        html += '</li>'

        $('.txContent').append(html);

        $('#T2Adv').LineProgressbar({
          fillBackgroundColor: '#40C0B8',
          radius: '9px',
          percentage: 30 // in %
        });
        $('#T2Violations').LineProgressbar({
            fillBackgroundColor: '#40C0B8',
            radius: '9px',
          percentage: 30 // in %
        });
        $('#T2Penalty').LineProgressbar({
          fillBackgroundColor: 'rgb(217, 83, 79)',
          radius: '9px',
          percentage: 2 // in %
        });

var html = ''

        html += '<li class="timeline"  >';
        html +=   '</span>' + 'Payment Advance' + '</span> <div></div>'
        html += '<div id="T3Adv"></div>';

        html +=  '</span>' + 'Violations' + '</span> <div></div>'
        html +=  '<div id="T3Violations"></div>';

        html +=   '</span>' + 'Penalty Cut' + '</span> <div></div>'
        html += '<div id="T3Penalty"></div>';
        html += '<div id="T3line"></div>'

        html += '</li>'

        $('.txContent').append(html);

        $('#T3Adv').LineProgressbar({
            fillBackgroundColor: '#FCB823',
            radius: '9px',
          percentage: 30 // in %
        });
        $('#T3Violations').LineProgressbar({
            fillBackgroundColor: '#FCB823',
            radius: '9px',
          percentage: 30 // in %
        });
        $('#T3Penalty').LineProgressbar({
        fillBackgroundColor: 'rgb(217, 83, 79)',
        radius: '9px',
          percentage: 2 // in %
        });


var html = ''

        html += '<li class="timeline"  >';
        html +=   '</span>' + 'Payment Advance' + '</span> <div></div>'
        html += '<div id="T4Adv"></div>';

        html +=  '</span>' + 'Violations' + '</span> <div></div>'
        html +=  '<div id="T4Violations"></div>';

        html +=   '</span>' + 'Penalty Cut' + '</span> <div></div>'
        html += '<div id="T4Penalty"></div>';
        html += '<div id="T4line"></div>'

        html += '</li>'

        $('.txContent').append(html);

        $('#T4Adv').LineProgressbar({
            fillBackgroundColor: '#0080B1',
            ShowProgressCount: true,
            radius: '9px',
          percentage: 30 // in %
        });
        $('#T4Violations').LineProgressbar({
            fillBackgroundColor: '#0080B1',
            radius: '9px',
          percentage: 30 // in %
        });
        $('#T4Penalty').LineProgressbar({
          fillBackgroundColor: 'rgb(217, 83, 79)',
radius: '9px',
          percentage: 2 // in %
        });


      }
  // function callBlocks(chainHeight){
  //   var lastBlock = chainHeight-1;
  //   var blockUrl = "http://10.70.1.8:7050/chain/blocks/" + lastBlock;
  //   $.ajax({url: blockUrl, success: function(result){
  //       console.log(result);
  //     }});
  // }

  function makeBlockRed(){
    $('.lastblock').css({"border-color": "red"});
    $('.lastblock').css({"background": "pink"});
  }

function buildNotifHtml(data, pos, truck) {
  var html = '';
  var T1Span = '<span>'
  html += '<li class="timeline voil">';
    html +=   '<div class="txCount">TX ' + (Number(pos)) + '</div>';
  html +=   T1Span + truck + ' </span>' + T1Span + data.shock + '</span> <div></div>'
  html +=   T1Span + getJSTime(data.time) + '</span> <div></div>'
  html +=   T1Span + 'SHOCK </span>' + T1Span + data.shock + '</span> <div></div>'
  html += '</li>'

  return html;



  function getJSTime(unix_timestamp){
    // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unix_timestamp*1000);
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = "0" + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = "0" + date.getSeconds();

  // Will display time in 10:30:23 format
  var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  return formattedTime;

  }
}

  //build a tx history div
  function build_a_tx(data, pos) {
  	var html = '';


  	// html += '<div class="txDetails">';
  	// html +=		'<div class="txCount">TX ' + (Number(pos) + 1) + '</div>';
  	// html +=		'<p>';
  	// html +=			'<div class="marbleLegend">Transaction: </div>';
  	// html +=			'<div class="marbleName txId">' + data.txId + '...</div>';
  	// html +=		'</p>';
  	// html +=		'<p>';
  	// html +=			'<div class="marbleLegend">Owner: </div>';
  	// html +=			'<div class="marbleName">' + username + '</div>';
  	// html +=		'</p>';
  	// html +=		'<p>';
  	// html +=			'<div class="marbleLegend">Company: </div>';
  	// html +=			'<div class="marbleName">' + company  + '</div>';
  	// html +=		'</p>';
  	// html +=		'<p>';
  	// html +=			'<div class="marbleLegend">Ower Id: </div>';
  	// html +=			'<div class="marbleName">' + id  + '</div>';
  	// html +=		'</p>';
  	// html +=	'</div>';
    var strErrorSpan =  '<span class="err">';
    var strSpan = '<span>'
    var T1Span = strSpan;
    var T2Span = strSpan;
    var T3Span = strSpan;
    var T4Span = strSpan;

    if(data.Truck1.shock > 2.8){
      T1Span = strErrorSpan;
    }
    if(data.Truck2.shock > 2.8){
      T2Span = strErrorSpan;
    }
    if(data.Truck3.shock > 2.8){
      T3Span = strErrorSpan;
    }
    if(data.Truck4.shock > 2.8){
      T4Span = strErrorSpan;
    }

    html += '<li class="timeline"  >';
    html +=   '<div class="txCount">TX ' + (Number(pos)) + '</div>';
    html +=   T1Span + 'Truck 1: </span>' + T1Span + data.Truck1.shock + '</span> <div></div>'
    html +=   T2Span + 'Truck 2: </span>' + T2Span + data.Truck2.shock + '</span> <div></div>'
    html +=   T3Span + 'Truck 3: </span>' + T3Span + data.Truck3.shock + '</span> <div></div>'
    html +=   T4Span + 'Truck 4: </span>' + T4Span + data.Truck4.shock + '</span> <div></div>'
    html += '</li>'

  	return html;


  }


  window.setInterval(function(){
      checkBlock()
  }, 1500);

}
