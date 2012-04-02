package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.PathwayImpl;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.Process;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = PathwayImpl.class)
public abstract class PathwayMixIn implements Pathway {

	@JsonIgnore
	public abstract Set<Process> getPathwayComponent();

	@JsonIgnore
	public abstract Set<PathwayStep> getPathwayOrder();

}
