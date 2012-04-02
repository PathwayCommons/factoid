package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.InteractionImpl;
import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.Interaction;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = InteractionImpl.class)
public abstract class InteractionMixIn implements Interaction {

	@JsonIgnore
	public abstract Set<Entity> getParticipant();

}
