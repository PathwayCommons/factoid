package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.ConversionImpl;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.ConversionDirectionType;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.Stoichiometry;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = ConversionImpl.class)
public abstract class ConversionMixIn implements Conversion {

	@JsonIgnore
	public abstract ConversionDirectionType getConversionDirection();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getLeft();

	@JsonIgnore
	public abstract Set<Stoichiometry> getParticipantStoichiometry();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getRight();

}
