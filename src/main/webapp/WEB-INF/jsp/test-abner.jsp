<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<c:set var="title">
Normalization test page
</c:set>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
		
		<script type="text/javascript">
			$(function(){
				
				function update(meta, response){
					$("#results").empty();
					$("#results").append('<p><em>File: ' + meta.name + '</em></p>');
					
					
					console.log(response);
					return;
					
					$.each(response, function(i, sentence){
						
						var parts = $('<p><em>Sentence with matches:</em> </p>');
						$("#results").append(parts);
						
						$.each(sentence.matches, function(j, match){
							var prevMatchEnd = j > 0 ? (sentence.matches[j - 1].end) : (0); 
							var beforePart = $('<span></span>');
							beforePart.html( sentence.string.substring(prevMatchEnd, match.start) );
							parts.append(beforePart);
							
							var matchPart = $('<span class="match"></span>');
							matchPart.html( sentence.string.substring(match.start, match.end) );
							parts.append(matchPart);
							
							if( j == sentence.matches.length - 1 ){
								var lastMatchEnd = sentence.matches[sentence.matches.length - 1].end;
								var afterPart = $('<span></span>');
								afterPart.html( sentence.string.substring(lastMatchEnd, sentence.string.length) );
								parts.append(afterPart);
							}
						});
						
					});
				}
				
				$("#upload").uploadbutton({
					url: "${pageContext.request.contextPath}/json/normalize",
					success: function(meta, response){
						update(meta, response);
					},
					label: "Upload an abstract",
					successText: function(){ return "File uploaded" },
					startText: function(){ return "Uploading file..." },
					cancelText: function(){ return "Upload cancelled" },
					errorText: function(meta, msg){ return "Upload error"; },
					progressedText: function(meta){ return "Processing file..."; }
				});
				
				$("#submit").button().click(function(){
					$.ajax({
						type: "POST",
						url: "${pageContext.request.contextPath}/json/normalize",
						data: {
							text: $("#abstract").val()
						},
						success: function(response){
							update({ name: "Text box abstract" }, response);
						},
					});
				});
			});
		</script>
		
		<style>
			body { 
				margin: 2em;
			}
			
			#upload {
				width: 14.5em;
			}
			
			.match {
				background: #feb924;
				border-radius: 0.75em;
				padding: 0.25em 0.5em;
				white-space: nowrap;
			}
			
			#abstract {
				width: 40em;
				height: 10em;
			}
			
		</style>
	</head>

	<body>
		
		<h1>Normalization test page</h1>
		
		<h2>Instructions</h2>
		
		<h3>Upload a file</h3>
		
		<p> <button id="upload">Upload</button> Upload a file, and the normalization results will be displayed to you.</p>
		
		<h3>Paste or write an abstract</h3>
		
		<p>Or put the abstract here</p>
		
		<textarea id="abstract"></textarea> <br/>
		<button id="submit">Upload above text</button>
		
		<h2>Results</h2>
		
		<p>Results will be put here when you've sent an abstract.</p>
		
		<div id="results"></div>
		
	</body>

</html>