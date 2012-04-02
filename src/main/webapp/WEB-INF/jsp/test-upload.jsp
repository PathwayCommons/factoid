<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<c:set var="title">
Upload test page
</c:set>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
		
		<script type="text/javascript">
			$(function(){
				function metadata(meta){
					$("#file-size").html( meta.size );
					$("#file-name").html( meta.name );
					$("#file-date").html( "" + meta.lastModifiedDate );
				}
				
				function clearMetadata(){
					$("#file-size").html( "" );
					$("#file-name").html( "" );
					$("#file-date").html( "" );
				}
				
				function contents(file){
					var contents = $(file).find("#contents").text();
					$("#contents").html(contents);
				}
				
				$("#upload-ajax").fileupload({
					done: function(e, data){
						contents(data.result);
						clearMetadata();
					},
					dropZone: null
				});
				
				$("#upload-div").upload({
					url: "${pageContext.request.contextPath}/test/upload",
					success: function(meta, file){
						contents(file);
						metadata(meta);
					}
				});
				
				$("#upload-div-enable").buttonset();
				$("#upload-div-enabled").click(function(){
					$("#upload-div").upload("enable");
				});
				$("#upload-div-disabled").click(function(){
					$("#upload-div").upload("disable");
				});
				if( $("#upload-div-enabled").is(":checked") ){
					$("#upload-div").upload("enable");
				} else {
					$("#upload-div").upload("disable");
				}
				
				$("#upload-button").uploadbutton({
					url: "${pageContext.request.contextPath}/test/upload",
					success: function(meta, file){
						contents(file);
						metadata(meta);
					},
					label: "Upload a file",
					successText: function(){ return "File uploaded" },
					startText: function(){ return "Uploading file..." },
					cancelText: function(){ return "Upload cancelled" },
					errorText: function(meta, msg){ return "Upload error"; },
					progressedText: function(meta){ return "Processing file..."; }
				});
				
				$("#upload-button-enable").buttonset();
				$("#upload-button-enabled").click(function(){
					$("#upload-button").uploadbutton("enable");
				});
				$("#upload-button-disabled").click(function(){
					$("#upload-button").uploadbutton("disable");
				});
				if( $("#upload-button-enabled").is(":checked") ){
					$("#upload-button").uploadbutton("enable");
				} else {
					$("#upload-button").uploadbutton("disable");
				}
				
				$("#upload-drag-and-drop").uploaddrop({
					url: "${pageContext.request.contextPath}/test/upload",
					success: function(meta, file){
						contents(file);
						metadata(meta);
					}
				});
				
				$("#upload-drag-and-drop-enable").buttonset();
				$("#upload-drag-and-drop-enabled").click(function(){
					$("#upload-drag-and-drop").uploaddrop("enable");
				});
				$("#upload-drag-and-drop-disabled").click(function(){
					$("#upload-drag-and-drop").uploaddrop("disable");
				});
				if( $("#upload-drag-and-drop-enabled").is(":checked") ){
					$("#upload-drag-and-drop").uploaddrop("enable");
				} else {
					$("#upload-drag-and-drop").uploaddrop("disable");
				}
			});
		</script>
		
		<style>
			body { 
				margin: 2em;
			}
			
			.ui-buttonset {
				margin: 0.5em 0;
			}

			#upload-div,
			#upload-drag-and-drop {
				display: inline-block;
				border-radius: 0.5em;
				padding: 1em 2em;
			}
			
			#upload-div {
				cursor: pointer;
			}
			
			#upload-div .hover,
			#upload-div .mousedown,
			#upload-div .uploading {
				display: none;
				position: absolute;
				left: 0;
				top: 0;
				margin: 0.25em 0.5em;
				font-size: 0.8em;
			}
			
			#upload-div.ui-state-hover .hover {
				display: block;
			}
			
			#upload-div.ui-state-uploading .uploading {
				display: block;
				bottom: 0;
				top: auto;
			}
			
			#upload-div.ui-state-active .mousedown {
				display: block;
				right: 0;
				left: auto;
			}
			
			#upload-drag-and-drop {
				padding: 1em;
				width: 20em;
				text-align: center;
			}
			
			#upload-drag-and-drop * {
				display: none;
			}
			
			#upload-drag-and-drop .instructions {
				display: inline;
			}
						
			#upload-drag-and-drop.ui-state-uploading * {
				display: none;
			}
			
			#upload-drag-and-drop.ui-state-uploading .uploading {
				display: inline;
			}
			
			#upload-drag-and-drop.ui-state-upload-dragged * {
				display: none;
			}
			
			#upload-drag-and-drop.ui-state-upload-dragged .dragged {
				display: inline;
			}
			
			#upload-button {
				width: 12em;
			}

			#upload-drag-and-drop,
			#upload-drag-and-drop * {
				color: #fff;
			}
			
			#results {
				position: fixed;
				right: 0;
				top: 0;
				width: 400px;
				overflow: auto;
				border: 1px solid #ddd;
				border-radius: 0.5em;
				font-size: 0.8em;
				background: #fff;
				padding: 2em;
				margin: 1em;
			}
			
			#forms {
				padding-right: 400px;
				margin-right: 3em;
			}
			
			#contents {
				width: 100%;
				height: 16em;
				margin: -1em;
			}

		</style>
	</head>

	<body>
		<div id="forms">
	
			<h1>Upload test page</h1>
		
			<h2>Regular form</h2>
		
			<form method="post" action="${pageContext.request.contextPath}/test/upload" enctype="multipart/form-data">
	            <input type="file" name="file" />
	            <input type="submit" />
			</form>
			
			
			
			<h2>AJAX form (autosubmit on change)</h2>
			
			<div id="upload-ajax">
				<form method="POST" action="${pageContext.request.contextPath}/test/upload" enctype="multipart/form-data">
		            <input type="file" name="file" />
				</form>
			</div>
	
			
			<h2>AJAX div</h2>
			
			<div id="upload-div">
				Click this area to upload.
				<div class="hover">hover</div>
				<div class="mousedown">mousedown</div>
				<div class="uploading">uploading</div>
			</div>
			
			<div id="upload-div-enable">
				<input type="radio" id="upload-div-enabled" name="upload-div-radio" checked="checked" />
				<label for="upload-div-enabled">Enabled</label>
				
				<input type="radio" id="upload-div-disabled" name="upload-div-radio" />
				<label for="upload-div-disabled">Disabled</label>
			</div>
			
		
			<h2>AJAX button</h2>
			
			<div id="upload-button"></div>
	
			<div id="upload-button-enable">
				<input type="radio" id="upload-button-enabled" name="upload-button-radio" checked="checked" />
				<label for="upload-button-enabled">Enabled</label>
				
				<input type="radio" id="upload-button-disabled" name="upload-button-radio" />
				<label for="upload-button-disabled">Disabled</label>
			</div>
	
	
			<h2>AJAX drag and drop</h2>
			
			<div id="upload-drag-and-drop">
			
				<span class="instructions">Drag a file here to upload.</span>
				<span class="dragged">Now just drop the file here to upload.</span>
				<span class="uploading">Uploading...</span>
				
			</div>
			
			<div id="upload-drag-and-drop-enable">
				<input type="radio" id="upload-drag-and-drop-enabled" name="upload-drag-and-drop-radio" checked="checked" />
				<label for="upload-drag-and-drop-enabled">Enabled</label>
				
				<input type="radio" id="upload-drag-and-drop-disabled" name="upload-drag-and-drop-radio" />
				<label for="upload-drag-and-drop-disabled">Disabled</label>
			</div>

		</div>



		<div id="results">
		
			<h2>Metadata</h2>
			
			<p>Upload a file with an AJAX widget and its metadata will be placed here</p>
			
			<ul>
				<li>Size (bytes): <span id="file-size"></span></li>
				<li>Name: <span id="file-name"></span></li>
				<li>Date: <span id="file-date"></span></li>
			</ul>
	
			<h2>Content</h2>
			
			<p>Upload a file and it will be placed here</p>
			
		
			<textarea id="contents">${contents}</textarea>
	
		
		</div>

		

		
		
	</body>

</html>