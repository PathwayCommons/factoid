package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.DnaRegionImpl;
import org.biopax.paxtools.model.level3.DnaRegion;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = DnaRegionImpl.class)
public abstract class DnaRegionMixIn implements DnaRegion {

}
