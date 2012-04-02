package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.PathwayStepImpl;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.Process;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = PathwayStepImpl.class)
public abstract class PathwayStepMixIn implements PathwayStep {

	@JsonIgnore
	public abstract Set<PathwayStep> getNextStep();

	@JsonIgnore
	public abstract Set<PathwayStep> getNextStepOf();

	@JsonIgnore
	public abstract Pathway getPathwayOrderOf();

	@JsonIgnore
	public abstract Set<Process> getStepProcess();

}
