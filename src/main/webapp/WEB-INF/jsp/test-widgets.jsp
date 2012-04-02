<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<c:set var="title">
Widget demo page
</c:set>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
		
		<script type="text/javascript">
			$(function(){
							
				$("button").button();

				$("#open-command").click(function(){
					$(this).commandtip({
						content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.',
						title: 'A command tooltip'
					});
				});

				var interval;
				$("#open-command-no-title").click(function(){
					$(this).commandtip({
						content: 'This will automatically close in <span id="open-command-no-title-seconds">3</span>.',
						close: 3000
					});
					
					clearInterval(interval);
					interval = setInterval(function(){
						var seconds = parseInt( $("#open-command-no-title-seconds").text() ) - 1;
						$("#open-command-no-title-seconds").html(seconds);
						if( seconds <= 0 ){
							clearInterval(interval);
						}
					}, 1000);
				});
				
				$("#open-command-scrollbar").click(function(){
					$(this).commandtip({
						content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.',
						title: 'A command tooltip with a scrollbar',
						height: 300,
						width: 300
					});
				});

				$("#open-command-buttons").click(function(){
					$(this).commandtip({
						content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.',
						title: 'A command tooltip with buttons',
						height: 300,
						width: 300,
						buttons: [
							{
								text: "Yay",
								click: function(){ $("#open-command-buttons-text").html('Yay for the buttonpane'); },
								close: true
							},
							{
								text: "Nay",
								click: function(){ $("#open-command-buttons-text").html('Nay for the buttonpane'); },
								close: true
							}
						],
						draggable: true
					});
				});

				$("#open-menu-command").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip',
						items: [
							{ 
								name: "Hello!  This is some text to make the line longer.", 
								select: function(){ $("#open-menu-command-text").html('Hello there!'); }
							},
							{ 
								name: "Goodbye!",
								select: function(){ $("#open-menu-command-text").html('Goodbye, then!'); }
							}
						]
					});
				});
				
				$("#open-menu-command-scroll").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip',
						height: 250,
						items: [
							{ 
								name: "Hello, Joe!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Joe!'); },
								newSection: true
							},
							{ 
								name: "Hello, Sarah!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Sarah!'); }
							},
							{ 
								name: "Hello, Frank!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Frank!'); }
							},
							{ 
								name: "Hello, Bill!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Bill!'); }
							},
							{ 
								name: "Hello, Bob!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Bob!'); }
							},
							{ 
								name: "Hello, Mary!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Mary!'); },
								newSection: true
							},
							{ 
								name: "Hello, Christine!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Christine!'); }
							},
							{ 
								name: "Hello, Daniel!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Daniel!'); }
							},
							{ 
								name: "Hello, John!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, John!'); }
							},
							{ 
								name: "Hello, Andrew!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Andrew!'); }
							},
							{ 
								name: "Hello, George!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, George!'); }
							},
							{ 
								name: "Hello, Jim!", 
								select: function(){ $("#open-menu-command-scroll-text").html('Hello there, Jim!'); }
							},
						]
					});
				});
				
				$("#open-menu-command-multiple").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip',
						items: [
							{ 
								name: "Add something", 
								items: [
							        {
							        	name: "Foo",
							        	select: function(){ $("#open-menu-command-multiple-text").html('Add foo'); }
							        },
							        {
							        	name: "Bar",
							        	select: function(){ $("#open-menu-command-multiple-text").html('Add bar'); }
							        }
								]
							},
							{ 
								name: "Delete something",
								select: function(){ $("#open-menu-command-multiple-text").html('Delete something'); }
							}
						]
					});
				});
				
				$("#open-menu-command-info").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip with an infopanel',
						content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis.',
						items: [
							{ 
								name: "Hello!", 
								select: function(){ $("#open-menu-command-info-text").html('Hello there!'); }
							},
							{ 
								name: "Goodbye!",
								select: function(){ $("#open-menu-command-info-text").html('Goodbye, then!'); }
							}
						]
					});
				});
				
				$("#open-menu-command-info-scroll").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip with an infopanel',
						content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.',
						items: [
							{ 
								name: "Hello!", 
								select: function(){ $("#open-menu-command-info-scroll-text").html('Hello there!'); }
							},
							{ 
								name: "Goodbye!",
								select: function(){ $("#open-menu-command-info-scroll-text").html('Goodbye, then!'); }
							}
						],
						height: 200
					});
				});
				
				$("#open-menu-command-info-all").click(function(){
					$(this).menucommandtip({
						title: 'A menu command tooltip with everything',
						content: '<p>This tooltip has a set of commands to the left.  The list of commands resets to the top level list once a bottom level command has been selected.</p>' +
							'<p>A destructive command, such as delete, causes the tooltip to close.  Thus, access to erroneous commands is not allowed.</p>' +
							'<p>Clicking a command parent that you have previously clicked goes back to that level.</p>',
						items: [
								{ 
									name: "Add something", 
									items: [
								        {
								        	name: "Foo",
								        	items: [
								        		{
								        			name: "Somewhat foo",
								        			select: function(){ $("#open-menu-command-info-all-text").html('Add somewhat foo'); }
								        		},
								        		{
								        			name: "Very foo",
								        			select: function(){ $("#open-menu-command-info-all-text").html('Add very foo'); }
								        		}
								        	]
								        },
								        {
								        	name: "Bar",
								        	items: [
									        		{
									        			name: "Somewhat bar",
									        			select: function(){ $("#open-menu-command-info-all-text").html('Add somewhat bar'); }
									        		},
									        		{
									        			name: "Very bar; very, very, very bar",
									        			select: function(){ $("#open-menu-command-info-all-text").html('Add very bar'); }
									        		}
									        	]
								        }
									]
								},
								{ 
									name: "Delete selected thing",
									select: function(){ $("#open-menu-command-info-all-text").html('Delete selected thing'); },
									menuClose: true
								}
							],
						height: 200,
						menuClose: false,
						draggable: true
					});
				});
				
				$("#accordion").accordion();

				$("#autocomplete").autocomplete({
					source: ["foo", "foobar", "fooooo", "fooius barius", "foo bar"]
				});

				$("#open-dialog").click(function(){
					$('<div>"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.</div>').dialogpaper({
						title: "A dialog",
						width: 400,
						height: 300,
						modal: true
					});	
				});
				
				$("#open-dialog-loading").click(function(){
					$.loadingdialog({
						title: "Loading",
						content: 'This will automatically close in <span id="open-dialog-loading-seconds">3</span>'
					});	
					
					$("#open-dialog-loading-seconds").html(3);
					
					var interval = setInterval(function(){
						var seconds = parseInt( $("#open-dialog-loading-seconds").text() ) - 1;
						$("#open-dialog-loading-seconds").html( seconds );
						
						if( seconds == 0 ){
							clearInterval(interval);
							$.loadingdialog({
								destroy: true
							});
						}
					}, 1000);
				});
				
				$("#open-dialog-buttons").click(function(){
					$('<div>"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae lacus mi, id ultricies odio. Donec ultrices odio at justo lacinia venenatis. Nulla nisl tortor, ultricies id faucibus eget, elementum nec felis. Integer ornare scelerisque tellus, id molestie turpis blandit non. Proin risus quam, luctus non vehicula nec, dapibus eleifend nulla. Suspendisse luctus, diam sit amet aliquet mollis, ligula erat vehicula diam, fringilla condimentum ligula lacus vitae nunc. In laoreet eros id tellus auctor non molestie leo molestie. Duis vitae risus est, id cursus tortor. Donec justo ligula, viverra ac tempor ut, laoreet ut tellus. Nam accumsan, felis vehicula cursus lacinia, tortor neque aliquam dui, nec elementum enim justo ac nibh. Etiam dapibus pharetra nisi nec vulputate. Maecenas ipsum neque, porttitor ornare elementum id, auctor sed eros. Phasellus laoreet vulputate blandit.</div>').dialogpaper({
						title: "A dialog with buttons",
						buttons: [
						            {
						                text: "Goodbye!",
						                click: function() { $('#open-dialog-buttons-text').html('Goodbye!'); $(this).dialog("close"); }
						            },
						            {
						                text: "See you later!",
						                click: function() { $('#open-dialog-buttons-text').html('See you later!'); $(this).dialog("close"); }
						            }
						        ],
						width: 400,
						height: 300
					});	
				});

				var progress = 0;
				$("#progress-bar").progressbar();
				setInterval(function(){
					$("#progress-bar").progressbar("value", progress++);

					if(progress > 100){
						progress = 0;
					}
				}, 50);

				$("#slider").slider({
					range: true,
					min: 0,
					max: 100,
					values: [33, 66]
				});

				$("#slider2").slider({
					range: true,
					min: 0,
					max: 100,
					values: [33, 66],
					orientation: "vertical"
				});

				$("#tabs").tabs();

				$("#datepicker").datepicker();
				
				$("#menubar").menubar({
					items: [
							{ 
								name: "A drop down menu", 
								open: function(){
									$("#menubar-command").html("drop down menu");
								},
								labelAttr: { tooltip: "Click to open." },
								items: [
									{ 
										name: "A check option", 
										checkable: true,
										labelAttr: { tooltip: "Click to toggle whether it's checked.", tipposition: "right" },
										selecton: function(){ 
											$("#menubar-command").html("check on");
										},
										selectoff: function(){
											$("#menubar-command").html("check off");
										}
									},{ 
										name: "An action", 
										labelAttr: { tooltip: "A super fancy action thing.", tipposition: "right" },
										selecton: function(){
											$("#menubar-command").html("action on");
										} 
									},{ 
										name: "A parent", 
										items: [
											{ 
												name: "One", 
												selecton: function(){ 
													$("#menubar-command").html("action on 1");
												},
												labelAttr: { tooltip: "Un", tipposition: "right" }
											},{
												 name: "Two",
												 selecton: function(){ 
												 	$("#menubar-command").html("action on 2");
												 },
												labelAttr: { tooltip: "Deux", tipposition: "right" }
											},{ 
												name: "Three", 
												selecton: function(){ 
													$("#menubar-command").html("action on 3");
												},
												labelAttr: { tooltip: "Trois", tipposition: "right" }
											}
										]
									},
									{
										name: "Disabled checkable",
										checkable: true,
										disabled: true,
										select: function(event, on){ $("#menubar-command").html("error: should not be able to click disabled checkable " + on); }
									},
									{
										name: "Disabled clickable",
										disabled: true,
										selecton: function(){ $("#menubar-command").html("error: should not be able to click disabled clickable"); }
									},
									{
										name: "Disabled parent",
										disabled: true,
										selecton: function(){ $("#menubar-command").html("error: should not be able to click disabled parent"); },
										items: [
											{ 
												name: "Disabled child",
												disabled: true,
												selecton: function(){ $("#menubar-command").html("error: should not be able to click disabled child"); }
											},
											{ 
												name: "Enabled child",
												selecton: function(){ $("#menubar-command").html("error: should not be able to get to enabled child"); }
											}
										]
									}
								]
							},
							{ 
								name: "An action",
								selecton: function(){ $("#menubar-command").html("top level action on"); },
								attr: { tooltip: "Maybe this is a complicated command we want a tooltip for." }
							},
							{ 
								name: "A toggle option",
								checkable: true, 
								selecton: function(){ $("#menubar-command").html("toggle on"); },
								selectoff: function(){ $("#menubar-command").html("toggle off"); },
								attr: { tooltip: "Click to toggle whether this is pressed down." }
							},
							{ 
								name: "D. action",
								disabled: true,
								selecton: function(){ $("#menubar-command").html("error: top level action on; not possible"); }
							},
							{ 
								name: "D. toggle",
								checkable: true, 
								disabled: true,
								selecton: function(){ $("#menubar-command").html("error: toggle on not possible for disabled"); },
								selectoff: function(){ $("#menubar-command").html("toggle off not possible for disabled"); }
							},
							{ 
								name: "D. parent",
								disabled: true,
								selecton: function(){ $("#menubar-command").html("error: parent open not possible for disabled"); },
								items: [
									{ 
										name: "Enabled child",
										selecton: function(){ $("#menubar-command").html("error: should not be able to get to enabled child"); }
									}
								]
							}
						]
				});
				
				$("#buttonset").buttonset();
			});
			
			
		</script>
		
		<style>
			body { margin: 2em; }
			#autocomplete { width: 30em; }
		</style>
	</head>

	<body>
		<h1>Factoid widget demo page</h1>
		
		<h2>Description</h2>
		
		<p>Use this page to confirm that the jQuery UI CSS styles are correct for the Factoid project.</p>
		
		<p>This page tests whether jquery.ui.override.css is overriding jquery-ui-VERSION-custom.css.  jquery-ui-VERSION-custom.css is 
		created by the jQuery theme roller---with the image URL references fixed for our directory structure.  This page also tests
		whether our custom widgets are working.</p>
		
		<p>Use this page to test the widgets and styles acrosss different browsers.  It is less error prone than testing the app
		itself.</p>
		
		<h2>Text</h2>
		
		<h3>Sub-heading</h3>
		
		<p>Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipiscing elit</a>. Aenean tincidunt commodo diam, in aliquam dolor eleifend eu. Suspendisse quis sapien est. Cras blandit lacus vitae dolor vestibulum vestibulum. In bibendum ante nec erat elementum consequat sit amet eget lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut convallis odio a odio tincidunt faucibus. Vivamus enim est, tempor nec porttitor a, aliquet sit amet lacus. Aliquam sit amet eleifend diam. Aenean sed mi libero. Nullam tincidunt luctus sapien, pulvinar consequat odio cursus sit amet. Maecenas suscipit neque eu elit congue placerat. Etiam eget dui a arcu aliquam vehicula in a nibh. Duis fringilla ultrices eleifend. Nullam eu augue in est imperdiet adipiscing. Nunc eget felis sem. Ut pretium interdum ipsum, ac hendrerit dui consectetur vel. Vivamus ut magna nunc.</p>
	
		<h3>Another sub-heading</h3>
		
		<p>Suspendisse molestie eros quis dolor blandit rutrum. Etiam posuere posuere gravida. Quisque posuere dolor et ipsum vulputate sed molestie diam consequat. Donec non lorem eget nibh consectetur condimentum. Praesent vel enim lacus, dictum gravida est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Cras imperdiet viverra lorem at consequat. Donec molestie sollicitudin elit, at egestas augue mattis aliquam. Aenean lorem enim, aliquam id venenatis sed, consequat in augue. Quisque nibh ipsum, sodales et facilisis quis, pulvinar pellentesque est. Curabitur eu arcu justo. In venenatis, justo vitae iaculis commodo, ante ligula euismod massa, vitae vestibulum tellus libero eget lectus. Nulla sit amet odio eros. Sed bibendum suscipit diam, ac feugiat urna vehicula ut. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam pellentesque, augue varius pharetra consequat, est mauris dapibus dolor, ut hendrerit velit tortor ac lacus. Praesent justo metus, venenatis at ullamcorper in, commodo a mi. Donec tempor sem consectetur odio luctus vehicula. Ut ante nunc, dapibus nec aliquam mollis, facilisis a elit. Nulla quis lorem urna.</p>
	
		<h2>Buttons & tooltip commands</h2>
	
		<p><button id="open-command-no-title" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a command tooltip with no title</button> </p>
	
		<p><button id="open-command" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a command tooltip</button> </p>
		
		<p><button id="open-command-scrollbar" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a command tooltip with a scrollbar</button> </p>
		
		<p><button id="open-command-buttons" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a draggable command tooltip with a scrollbar and a buttonpane</button> <span id="open-command-buttons-text"></span> </p>
		
		<p><button id="open-menu-command" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip</button> <span id="open-menu-command-text"></span></span></p>
		
		<p><button id="open-menu-command-scroll" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip with a scrollbar</button> <span id="open-menu-command-scroll-text"></span></span></p>
		
		<p><button id="open-menu-command-multiple" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip with multiple levels</button> <span id="open-menu-command-multiple-text"></span></span></p>
		
		<p><button id="open-menu-command-info" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip with an infopanel</button> <span id="open-menu-command-info-text"></span></span></p>
		
		<p><button id="open-menu-command-info-scroll" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip with an infopanel and a scrollbar</button> <span id="open-menu-command-info-scroll-text"></span></span></p>
		
		<p><button id="open-menu-command-info-all" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a menu command tooltip with everything</button> <span id="open-menu-command-info-all-text"></span></span></p>
		
		<p><input type="button" id="open-dialog" value="A non jQuery button that opens a modal dialog" tipposition="right" tooltip="This button doesn't have jQuery styling, but it looks just the same." /> </p>
		
		<p><button id="open-dialog-buttons" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a dialog with buttons</button> <span id="open-dialog-buttons-text"></span> </p>
		
		<p><button id="open-dialog-loading" tipposition="right" tooltip="This button is modified by jQuery to have better events and styling.">Open a loading dialog</button></p>
		
		<p><input type="text" id="autocomplete" value="" tooltip="Type 'foo' in this box to try out autocomplete." /> <button class="with-text" tooltip="This button is styled to be grouped with the text box as in a search, for instance.">A button with the text input to the left</button> </p>
		
		<h2>Accordion</h2>
		
		<div id="accordion">
			<div><a href="#" tooltip="Click this name to open the accordion section.">Section 1</a></div>
			<div>
				<p>
				Mauris mauris ante, blandit et, ultrices a, suscipit eget, quam. Integer
				ut neque. Vivamus nisi metus, molestie vel, gravida in, condimentum sit
				amet, nunc. Nam a nibh. Donec suscipit eros. Nam mi. Proin viverra leo ut
				odio. Curabitur malesuada. Vestibulum a velit eu ante scelerisque vulputate.
				</p>
			</div>
			<div><a href="#" tooltip="Click this name to open the accordion section.">Section 2</a></div>
			<div>
				<p>
				Sed non urna. Donec et ante. Phasellus eu ligula. Vestibulum sit amet
				purus. Vivamus hendrerit, dolor at aliquet laoreet, mauris turpis porttitor
				velit, faucibus interdum tellus libero ac justo. Vivamus non quam. In
				suscipit faucibus urna.
				</p>
			</div>
			<div><a href="#" tooltip="Click this name to open the accordion section.">Section 3</a></div>
			<div>
				<p>
				Nam enim risus, molestie et, porta ac, aliquam ac, risus. Quisque lobortis.
				Phasellus pellentesque purus in massa. Aenean in pede. Phasellus ac libero
				ac tellus pellentesque semper. Sed ac felis. Sed commodo, magna quis
				lacinia ornare, quam ante aliquam nisi, eu iaculis leo purus venenatis dui.
				</p>
				<ul>
					<li>List item one</li>
					<li>List item two</li>
					<li>List item three</li>
				</ul>
			</div>
			<div><a href="#" tooltip="Click this name to open the accordion section.">Section 4</a></div>
			<div>
				<p>
				Cras dictum. Pellentesque habitant morbi tristique senectus et netus
				et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in
				faucibus orci luctus et ultrices posuere cubilia Curae; Aenean lacinia
				mauris vel est.
				</p>
				<p>
				Suspendisse eu nisl. Nullam ut libero. Integer dignissim consequat lectus.
				Class aptent taciti sociosqu ad litora torquent per conubia nostra, per
				inceptos himenaeos.
				</p>
			</div>
		</div> 
		
		<h2>Progress bar</h2>
		
		<div id="progress-bar"></div> 
		
		<h2>Menubar</h2>
		
		<div id="menubar"></div>
		
		<p id="menubar-command">nothing clicked yet</p>
		
		<h2>Sliders</h2>
		
		<div id="slider"></div> <br />
		
		<div id="slider2"></div>
		
		<h2>Tabs</h2>
		
		<div id="tabs">
			<ul>
				<li><a href="#tabs-1">Nunc tincidunt</a></li>
				<li><a href="#tabs-2">Proin dolor</a></li>
				<li><a href="#tabs-3">Aenean lacinia</a></li>
			</ul>
			<div id="tabs-1">
				<p>Proin elit arcu, rutrum commodo, vehicula tempus, commodo a, risus. Curabitur nec arcu. Donec sollicitudin mi sit amet mauris. Nam elementum quam ullamcorper ante. Etiam aliquet massa et lorem. Mauris dapibus lacus auctor risus. Aenean tempor ullamcorper leo. Vivamus sed magna quis ligula eleifend adipiscing. Duis orci. Aliquam sodales tortor vitae ipsum. Aliquam nulla. Duis aliquam molestie erat. Ut et mauris vel pede varius sollicitudin. Sed ut dolor nec orci tincidunt interdum. Phasellus ipsum. Nunc tristique tempus lectus.</p>
			</div>
			<div id="tabs-2">
				<p>Morbi tincidunt, dui sit amet facilisis feugiat, odio metus gravida ante, ut pharetra massa metus id nunc. Duis scelerisque molestie turpis. Sed fringilla, massa eget luctus malesuada, metus eros molestie lectus, ut tempus eros massa ut dolor. Aenean aliquet fringilla sem. Suspendisse sed ligula in ligula suscipit aliquam. Praesent in eros vestibulum mi adipiscing adipiscing. Morbi facilisis. Curabitur ornare consequat nunc. Aenean vel metus. Ut posuere viverra nulla. Aliquam erat volutpat. Pellentesque convallis. Maecenas feugiat, tellus pellentesque pretium posuere, felis lorem euismod felis, eu ornare leo nisi vel felis. Mauris consectetur tortor et purus.</p>
			</div>
			<div id="tabs-3">
				<p>Mauris eleifend est et turpis. Duis id erat. Suspendisse potenti. Aliquam vulputate, pede vel vehicula accumsan, mi neque rutrum erat, eu congue orci lorem eget lorem. Vestibulum non ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Fusce sodales. Quisque eu urna vel enim commodo pellentesque. Praesent eu risus hendrerit ligula tempus pretium. Curabitur lorem enim, pretium nec, feugiat nec, luctus a, lacus.</p>
				<p>Duis cursus. Maecenas ligula eros, blandit nec, pharetra at, semper at, magna. Nullam ac lacus. Nulla facilisi. Praesent viverra justo vitae neque. Praesent blandit adipiscing velit. Suspendisse potenti. Donec mattis, pede vel pharetra blandit, magna ligula faucibus eros, id euismod lacus dolor eget odio. Nam scelerisque. Donec non libero sed nulla mattis commodo. Ut sagittis. Donec nisi lectus, feugiat porttitor, tempor ac, tempor vitae, pede. Aenean vehicula velit eu tellus interdum rutrum. Maecenas commodo. Pellentesque nec elit. Fusce in lacus. Vivamus a libero vitae lectus hendrerit hendrerit.</p>
			</div>
		</div> 
		
		<h2>Date</h2>
		
		Date <input type="text" id="datepicker" />
		
		<h2>Buttonset</h2>
		
		<div id="buttonset">
			<input type="radio" checked="checked" name="buttonset-radios" id="buttonset-radio-1" /><label for="buttonset-radio-1">Option 1</label>
			<input type="radio" name="buttonset-radios" id="buttonset-radio-2" /><label for="buttonset-radio-2">Option 2</label>
			<input type="radio" name="buttonset-radios" id="buttonset-radio-3" /><label for="buttonset-radio-3">Option 3</label>
		</div>
		
	</body>

</html>