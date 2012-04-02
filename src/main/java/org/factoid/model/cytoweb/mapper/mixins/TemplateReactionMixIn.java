package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.TemplateReactionImpl;
import org.biopax.paxtools.model.level3.NucleicAcid;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.TemplateDirectionType;
import org.biopax.paxtools.model.level3.TemplateReaction;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = TemplateReactionImpl.class)
public abstract class TemplateReactionMixIn implements TemplateReaction {

	@JsonIgnore
	public abstract Set<PhysicalEntity> getProduct();

	@JsonIgnore
	public abstract NucleicAcid getTemplate();

	@JsonIgnore
	public abstract TemplateDirectionType getTemplateDirection();

}
