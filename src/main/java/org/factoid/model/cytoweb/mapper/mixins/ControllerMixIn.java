package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Controller;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class ControllerMixIn implements Controller {

	@JsonIgnore
	public abstract Set<Control> getControllerOf();
	
}
