package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.ChemicalStructureImpl;
import org.biopax.paxtools.model.level3.ChemicalStructure;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ChemicalStructureImpl.class)
public abstract class ChemicalStructureMixIn implements ChemicalStructure {

}
