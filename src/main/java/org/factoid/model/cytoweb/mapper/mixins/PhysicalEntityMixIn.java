package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.CellularLocationVocabulary;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.EntityFeature;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class PhysicalEntityMixIn implements PhysicalEntity {

	@JsonIgnore
	public abstract CellularLocationVocabulary getCellularLocation();

	@JsonIgnore
	public abstract Set<Complex> getComponentOf();

	@JsonIgnore
	public abstract Set<EntityFeature> getFeature();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getMemberPhysicalEntity();

	@JsonIgnore
	public abstract Set<PhysicalEntity> getMemberPhysicalEntityOf();

	@JsonIgnore
	public abstract Class<? extends PhysicalEntity> getModelInterface();

	@JsonIgnore
	public abstract Set<EntityFeature> getNotFeature();

	@JsonIgnore
	public abstract Set<String> getName();

	@JsonIgnore
	public abstract String getDisplayName();

	@JsonIgnore
	public abstract String getStandardName();
}
