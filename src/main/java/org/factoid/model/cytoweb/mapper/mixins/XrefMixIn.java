package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.impl.level3.XrefImpl;
import org.biopax.paxtools.model.BioPAXElement;
import org.biopax.paxtools.model.level3.XReferrable;
import org.biopax.paxtools.model.level3.Xref;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonDeserialize;

@JsonDeserialize(as = XrefImpl.class)
public abstract class XrefMixIn implements Xref {

	@JsonIgnore
	public abstract Class<? extends BioPAXElement> getModelInterface();

	@JsonIgnore
	public abstract Set<XReferrable> getXrefOf();

}
