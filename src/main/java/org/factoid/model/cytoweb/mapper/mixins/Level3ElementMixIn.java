package org.factoid.model.cytoweb.mapper.mixins;

import java.util.Set;

import org.biopax.paxtools.model.level3.Level3Element;
import org.codehaus.jackson.annotate.JsonIgnore;

public abstract class Level3ElementMixIn implements Level3Element {

	@JsonIgnore
	public abstract Set<String> getComment();

}
