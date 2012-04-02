package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Map;

import org.biopax.paxtools.model.BioPAXElement;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;

@JsonIgnoreProperties(value = { "comment", "proxyId", "rdfid", "version" })
public abstract class BioPAXElementMixIn implements BioPAXElement {

	@JsonIgnore
	public abstract Class<? extends BioPAXElement> getModelInterface();

	@JsonIgnore
	public abstract Map<String, Object> getAnnotations();
	
}
