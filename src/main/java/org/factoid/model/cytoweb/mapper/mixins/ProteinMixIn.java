package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.ProteinImpl;
import org.biopax.paxtools.model.level3.Protein;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ProteinImpl.class)
public abstract class ProteinMixIn implements Protein {

}
