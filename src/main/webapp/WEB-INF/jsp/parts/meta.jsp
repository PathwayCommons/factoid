<%-- meta tags common to the app --%>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta http-equiv="X-UA-Compatible" content="chrome=1">
<script type="text/javascript" 
   src="http://ajax.googleapis.com/ajax/libs/chrome-frame/1/CFInstall.min.js"></script>
    
<c:choose>
 <c:when test="${title != null && title != ''}">
 	<title>${title} &raquo; Factoid</title>
 </c:when>
 <c:otherwise>
 	<title>Factoid</title>
 </c:otherwise>
</c:choose>

<link rel="shortcut icon" href="<%=request.getContextPath()%>/img/icons/favicon.ico" />