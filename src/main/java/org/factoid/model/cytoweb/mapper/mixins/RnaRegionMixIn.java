package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.RnaRegionImpl;
import org.biopax.paxtools.model.level3.RnaRegion;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = RnaRegionImpl.class)
public abstract class RnaRegionMixIn implements RnaRegion {

}
