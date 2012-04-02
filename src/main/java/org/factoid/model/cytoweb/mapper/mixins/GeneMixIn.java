package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.GeneImpl;
import org.biopax.paxtools.impl.level3.InteractionImpl;
import org.biopax.paxtools.model.level3.Gene;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = GeneImpl.class)
public abstract class GeneMixIn implements Gene {
	@JsonIgnore
	public abstract Set<String> getName();

	@JsonIgnore
	public abstract String getDisplayName();

	@JsonIgnore
	public abstract String getStandardName();
}
