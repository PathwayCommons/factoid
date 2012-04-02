package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.RnaImpl;
import org.biopax.paxtools.model.level3.Rna;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = RnaImpl.class)
public abstract class RnaMixIn implements Rna {

}
