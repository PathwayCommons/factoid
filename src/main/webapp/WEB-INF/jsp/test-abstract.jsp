<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<c:set var="title">
Abstract test page
</c:set>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
		
		<script type="text/javascript">
			$(function(){
				$("#submit").button();
				
				$("#example").button().click(function(){
					$("#abstract").val('Chromosomal double-strand breaks (DSBs) have the potential to permanently arrest cell cycle progression and endanger cell survival. They must therefore be efficiently repaired to preserve genome integrity and functionality. Homologous recombination (HR) provides an important error-free mechanism for DSB repair in mammalian cells. In addition to RAD51, the central recombinase activity in mammalian cells, a family of proteins known as the RAD51 paralogs and consisting of five proteins (RAD51B, RAD51C, RAD51D, XRCC2 and XRCC3), play an essential role in the DNA repair reactions through HR. The RAD51 paralogs act to transduce the DNA damage signal to effector kinases and to promote break repair. However, their precise cellular functions are not fully elucidated. Here we discuss recent advances in our understanding of how these factors mediate checkpoint responses and act in the HR repair process. In addition, we highlight potential functional similarities with the BRCA2 tumour suppressor, through the recently reported links between RAD51 paralog deficiencies and tumorigenesis triggered by genome instability.');
				});
			});
		</script>
		
		<style>
			body { 
				margin: 2em;
			}
			
			#abstract {
				width: 40em;
				height: 10em;
			}
			
		</style>
	</head>

	<body>
		
		<h1>Abstract test page</h1>
		
		<p>Paste or write an abstract &mdash; <button id="example">example</button></p>
		
		<form action="${pageContext.request.contextPath}/editor" method="post">
			<textarea name="text" id="abstract"></textarea> <br/>
			<button id="submit" type="submit">Use this abstract in the editor</button>
		</form>
		
	</body>

</html>