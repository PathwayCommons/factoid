package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.ComplexImpl;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.EntityReference;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.SimplePhysicalEntity;
import org.biopax.paxtools.model.level3.Stoichiometry;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ComplexImpl.class)
public abstract class ComplexMixIn implements Complex {

	@JsonIgnore
	public abstract Set<SimplePhysicalEntity> getSimpleMembers();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getComponent();

	@JsonIgnore
	public abstract Set<Stoichiometry> getComponentStoichiometry();

	@JsonIgnore
	public abstract Set<EntityReference> getMemberReferences();

}
