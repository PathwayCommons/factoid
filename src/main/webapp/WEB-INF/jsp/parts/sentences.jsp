<%-- textmining sentences rendered in html (from server side) --%>

<c:forEach items="${sentences}" var="sentence">
	<div class="sentence">
		
		<c:forEach items="${sentence.matches}" var="match" varStatus ="status">
			
			<span class="text">${fn:substring(sentence.string, (status.first ? 0 : sentence.matches[status.index - 1].end), match.start)}</span>
			
			<span class="match">${fn:substring(sentence.string, match.start, match.end)}</span>
			
			<c:if test="${status.last}">
				<span class="text">${fn:substring(sentence.string, match.end, fn:length(sentence.string))}</span>
			</c:if>
			
		</c:forEach>
		
	</div>
</c:forEach>