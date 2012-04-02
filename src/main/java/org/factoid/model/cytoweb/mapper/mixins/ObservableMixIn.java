package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.Evidence;
import org.biopax.paxtools.model.level3.Observable;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class ObservableMixIn implements Observable {

	@JsonIgnore
	public abstract Set<Evidence> getEvidence();
	
}
