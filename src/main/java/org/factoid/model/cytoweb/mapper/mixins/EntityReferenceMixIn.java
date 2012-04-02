package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.EntityReference;
import org.biopax.paxtools.model.level3.SimplePhysicalEntity;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class EntityReferenceMixIn implements EntityReference {

	@JsonIgnore
	public abstract Set<SimplePhysicalEntity> getEntityReferenceOf();

	@JsonIgnore
	public abstract Set<EntityReference> getMemberEntityReferenceOf();

}
