<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<c:set var="title">
Moara lib test page
</c:set>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
		
		<script type="text/javascript">
			$(function(){
				$("#upload").uploadbutton({
					url: "${pageContext.request.contextPath}/json/normalize",
					success: function(meta, response){
						
						$("#results").empty();
						$("#results").append('<p>File: ' + meta.name + '</p>');
						
					},
					label: "Upload an abstract",
					successText: function(){ return "File uploaded" },
					startText: function(){ return "Uploading file..." },
					cancelText: function(){ return "Upload cancelled" },
					errorText: function(meta, msg){ return "Upload error"; },
					progressedText: function(meta){ return "Processing file..."; }
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
			
			
		</style>
	</head>

	<body>
		
		<h1>Moara lib test page</h1>
		
		<h2>Instructions</h2>
		<p> <button id="upload">Upload</button> Upload a file, and the Moara results will be displayed to you.</p>
		
		<h2>Results</h2>
		<div id="results"></div>
		
	</body>

</html>