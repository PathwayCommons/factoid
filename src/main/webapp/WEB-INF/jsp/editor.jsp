<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<!DOCTYPE html>
<html contextpath="${pageContext.request.contextPath}" version="${version}">

	<head>
		<%@ include file="parts/meta.jsp" %>
		<%@ include file="parts/css.jsp" %> 
		<%@ include file="parts/js.jsp" %>
	</head>

	<body class="editor" paper="${paper}">
		<div id="debug">
		</div>
	
		<div id="editor" class="side-open">
			
			<div id="menubar">
			</div>
			
			<div id="content">
				<div id="vis"></div>
			
				<div id="side">
					<div id="side-data">	
					</div>
					<div id="side-status">
						<span id="complete-entity-count">0</span> <span class="complete-entity-text">complete</span> and <span id="incomplete-entity-count">0</span> <span class="incomplete-entity-text">incomplete</span> entities
					</div>
				</div>
			</div>
			
		</div>
	</body>

</html>