package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.GeneticInteractionImpl;
import org.biopax.paxtools.model.level3.GeneticInteraction;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = GeneticInteractionImpl.class)
public abstract class GeneticInteractionMixIn implements GeneticInteraction {

}
