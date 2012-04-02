<%-- meta tags common to the app --%>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    
<c:choose>
 <c:when test="${title != null && title != ''}">
 	<title>${title} &raquo; Factoid</title>
 </c:when>
 <c:otherwise>
 	<title>Factoid</title>
 </c:otherwise>
</c:choose>

<link rel="shortcut icon" href="<%=request.getContextPath()%>/img/icons/favicon.ico" />