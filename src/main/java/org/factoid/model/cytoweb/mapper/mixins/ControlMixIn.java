package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.ControlImpl;
import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Controller;
import org.biopax.paxtools.model.level3.Process;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ControlImpl.class)
public abstract class ControlMixIn implements Control {

	@JsonIgnore
	public abstract Set<Process> getControlled();

	@JsonIgnore
	public abstract Set<Controller> getController();
}
