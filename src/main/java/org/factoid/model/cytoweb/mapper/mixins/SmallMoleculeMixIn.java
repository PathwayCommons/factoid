package org.factoid.model.cytoweb.mapper.mixins;

import org.biopax.paxtools.impl.level3.SmallMoleculeImpl;
import org.biopax.paxtools.impl.level3.SmallMoleculeReferenceImpl;

import org.biopax.paxtools.model.level3.SmallMolecule;

import org.biopax.paxtools.model.level3.EntityReference;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = SmallMoleculeImpl.class)
public abstract class SmallMoleculeMixIn implements SmallMolecule {

	@JsonDeserialize(as = SmallMoleculeReferenceImpl.class)
	public abstract void setEntityReference(EntityReference entityReference);

}
