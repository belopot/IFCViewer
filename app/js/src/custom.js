$(document).ready(function(){

	

	$(function () {

		$('.avail_option li').click(function(){
		  var val = $(this).text();    
		  $(this).parents().siblings('.selectbox').text(val);
		})

	  	$(".datepicker").datepicker({ 
			autoclose: true, 
			todayHighlight: true
		}).datepicker('update', new Date());
		

	  	// $('.card-header').click(function(){
	  	// 	$(this).children('img').attr('src','img/folderopen.png');
	  	// })

	  	$(".card-header").click(function(){
		    var src = $(this).children('img').attr('src');		    
				var newsrc = (src == '/assets/images/folder.png') ? '/assets/images/folderopen.png' : '/assets/images/folder.png';
		    $(this).children('img').attr('src', newsrc );
		 });

	});

})


$(".modal").each(function(l){$(this).on("show.bs.modal",function(l){var o=$(this).attr("data-easein");
	"shake"==o?$(".modal-dialog").velocity("callout."+o):
	"pulse"==o?$(".modal-dialog").velocity("callout."+o):
	"tada"==o?$(".modal-dialog").velocity("callout."+o):
	"flash"==o?$(".modal-dialog").velocity("callout."+o):
	"bounce"==o?$(".modal-dialog").velocity("callout."+o):
	"swing"==o?$(".modal-dialog").velocity("callout."+o):$(".modal-dialog").velocity("transition."+o)})});


