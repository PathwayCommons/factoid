package org.factoid.model.cytoweb;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.biopax.paxtools.impl.level3.Level3FactoryImpl;
import org.biopax.paxtools.model.BioPAXElement;
import org.biopax.paxtools.model.BioPAXFactory;
import org.biopax.paxtools.model.level3.Catalysis;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.Dna;
import org.biopax.paxtools.model.level3.DnaRegion;
import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.Gene;
import org.biopax.paxtools.model.level3.GeneticInteraction;
import org.biopax.paxtools.model.level3.Interaction;
import org.biopax.paxtools.model.level3.Modulation;
import org.biopax.paxtools.model.level3.MolecularInteraction;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.Protein;
import org.biopax.paxtools.model.level3.Rna;
import org.biopax.paxtools.model.level3.RnaRegion;
import org.biopax.paxtools.model.level3.SmallMolecule;
import org.biopax.paxtools.model.level3.TemplateReaction;

/**
 * Object exposed to web app containing type info
 */
public class Type {
	private String val; // corresponds to paxtools class name
	private String jsConstantName;

	// internal, editable list of types
	private static Map<String, Type> typesByName = new HashMap<String, Type>();
	private static List<Type> types = new LinkedList<Type>();

	private Type(String val) {
		this(val, val);
	}

	private Type(String jsConstantName, String val) {
		this.val = val;
		this.jsConstantName = jsConstantName;

		typesByName.put(jsConstantName, this);
		types.add(this);
	}

	// interactions
	public static final Type INTERACTION = new Type("INTERACTION",
			"Interaction");
	public static final Type PATHWAY = new Type("PATHWAY", "Pathway");
	public static final Type PATHWAY_STEP = new Type("PATHWAY_STEP",
			"PathwayStep");
	public static final Type CONVERSION = new Type("CONVERSION", "Conversion");
	public static final Type CONTROL = new Type("CONTROL", "Control");
	public static final Type CATALYSIS = new Type("CATALYSIS", "Catalysis");
	public static final Type MODULATION = new Type("MODULATION", "Modulation");
	public static final Type GENETIC_INTERACTION = new Type(
			"GENETIC_INTERACTION", "GeneticInteraction");
	public static final Type TEMPLATE_REACTION = new Type("TEMPLATE_REACTION",
			"TemplateReaction");
	public static final Type MOLECULAR_INTERACTION = new Type(
			"MOLECULAR_INTERACTION", "MolecularInteraction");

	// entities
	public static final Type ENTITY = new Type("ENTITY", "Entity");
	public static final Type SMALL_MOLECULE = new Type("SMALL_MOLECULE",
			"SmallMolecule");
	public static final Type COMPLEX = new Type("COMPLEX", "Complex");
	public static final Type PROTEIN = new Type("PROTEIN", "Protein");
	public static final Type RNA_REGION = new Type("RNA_REGION", "RnaRegion");
	public static final Type RNA = new Type("RNA", "Rna");
	public static final Type DNA = new Type("DNA", "Dna");
	public static final Type DNA_REGION = new Type("DNA_REGION", "DnaRegion");
	public static final Type GENE = new Type("GENE", "Gene");

	// exposed list of types (can't edit)
	public static final Map<String, Type> TYPES_BY_NAME = typesByName;
	public static final List<Type> TYPES = types;

	public boolean isInteraction() {

		if (this.val == INTERACTION.val) {
			return true;
		} else if (this.val == PATHWAY.val) {
			return true;
		} else if (this.val == PATHWAY_STEP.val) {
			return true;
		} else if (this.val == CONTROL.val) {
			return true;
		} else if (this.val == CATALYSIS.val) {
			return true;
		} else if (this.val == MODULATION.val) {
			return true;
		} else if (this.val == GENETIC_INTERACTION.val) {
			return true;
		} else if (this.val == TEMPLATE_REACTION.val) {
			return true;
		} else if (this.val == MOLECULAR_INTERACTION.val) {
			return true;
		} else if (this.val == CONVERSION.val) {
			return true;
		}

		return false;
	}

	public boolean isEntity() {
		return !this.isInteraction();
	}

	public boolean isControl() {
		if (this.val == CONTROL.val) {
			return true;
		} else if (this.val == CATALYSIS.val) {
			return true;
		} else if (this.val == MODULATION.val) {
			return true;
		}

		return false;
	}

	public boolean equals(Object other) {
		if (other instanceof Type) {
			Type otherType = (Type) other;
			return otherType.getVal().equals(this.getVal());
		}

		return false;
	}

	public String getVal() {
		return val;
	}

	public static BioPAXElement toElement(Type type) {
		BioPAXFactory factory = new Level3FactoryImpl();
		return factory.create(type.val, "");
	}

	public static Type fromVal(String val) {
		for (Type type : types) {
			if (type.getVal().equals(val)) {
				return type;
			}
		}

		return null;
	}

	public static Type fromObject(Object obj) {

		// interactions
		if (obj instanceof Pathway) {
			return Type.PATHWAY;
		} else if (obj instanceof PathwayStep) {
			return Type.PATHWAY_STEP;
		} else if (obj instanceof Catalysis) {
			return Type.CATALYSIS;
		} else if (obj instanceof Modulation) {
			return Type.MODULATION;
		} else if (obj instanceof Control) {
			return Type.CONTROL;
		} else if (obj instanceof GeneticInteraction) {
			return Type.GENETIC_INTERACTION;
		} else if (obj instanceof TemplateReaction) {
			return Type.TEMPLATE_REACTION;
		} else if (obj instanceof MolecularInteraction) {
			return Type.MOLECULAR_INTERACTION;
		} else if (obj instanceof Conversion) {
			return Type.CONVERSION;
		} else if (obj instanceof Interaction) {
			return Type.INTERACTION;
		}

		// entites
		else if (obj instanceof SmallMolecule) {
			return Type.SMALL_MOLECULE;
		} else if (obj instanceof Complex) {
			return Type.COMPLEX;
		} else if (obj instanceof Protein) {
			return Type.PROTEIN;
		} else if (obj instanceof RnaRegion) {
			return Type.RNA_REGION;
		} else if (obj instanceof Rna) {
			return Type.RNA;
		} else if (obj instanceof Dna) {
			return Type.DNA;
		} else if (obj instanceof DnaRegion) {
			return Type.DNA_REGION;
		} else if (obj instanceof Gene) {
			return Type.GENE;
		} else if (obj instanceof Entity) {
			return Type.ENTITY;
		}

		return null;
	}
}