package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.CatalysisImpl;
import org.biopax.paxtools.model.level3.Catalysis;
import org.biopax.paxtools.model.level3.CatalysisDirectionType;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = CatalysisImpl.class)
public abstract class CatalysisMixIn implements Catalysis {

	@JsonIgnore
	public abstract CatalysisDirectionType getCatalysisDirection();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getCofactor();

}
