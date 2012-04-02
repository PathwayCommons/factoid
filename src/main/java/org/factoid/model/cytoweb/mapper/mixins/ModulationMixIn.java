package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.ModulationImpl;
import org.biopax.paxtools.model.level3.Modulation;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ModulationImpl.class)
public abstract class ModulationMixIn implements Modulation {

}
