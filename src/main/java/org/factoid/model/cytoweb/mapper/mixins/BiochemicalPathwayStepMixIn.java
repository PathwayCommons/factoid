package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.model.level3.BiochemicalPathwayStep;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.StepDirection;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class BiochemicalPathwayStepMixIn implements
		BiochemicalPathwayStep {

	@JsonIgnore
	public abstract Conversion getStepConversion();

	@JsonIgnore
	public abstract StepDirection getStepDirection();

}
