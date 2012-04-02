package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.DnaImpl;
import org.biopax.paxtools.model.level3.Dna;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = DnaImpl.class)
public abstract class DnaMixIn implements Dna {

}
