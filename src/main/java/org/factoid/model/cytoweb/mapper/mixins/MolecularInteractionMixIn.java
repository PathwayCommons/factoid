package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.MolecularInteractionImpl;
import org.biopax.paxtools.model.level3.MolecularInteraction;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = MolecularInteractionImpl.class)
public abstract class MolecularInteractionMixIn implements MolecularInteraction {

}
