package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.Process;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class ProcessMixIn implements Process {

	@JsonIgnore
	public abstract Set<Control> getControlledOf();

	@JsonIgnore
	public abstract Set<Pathway> getPathwayComponentOf();

	@JsonIgnore	
	public abstract Set<PathwayStep> getStepProcessOf();

}
