package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Map;
import java.util.Set;

import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.Interaction;
import org.biopax.paxtools.model.level3.Provenance;
import org.biopax.paxtools.model.level3.Xref;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class EntityMixIn implements Entity {

	@JsonIgnore
	public abstract Set<String> getAvailability();

	@JsonIgnore
	public abstract Set<Provenance> getDataSource();

	@JsonIgnore
	public abstract Set<Interaction> getParticipantOf();

	@JsonIgnore
	public abstract Map<String, Object> getAnnotations();

	@JsonIgnore
	public abstract Set<Xref> getXref();

}
