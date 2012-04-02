package org.factoid.model.cytoweb;

import org.biopax.paxtools.model.BioPAXElement;
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
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.Protein;
import org.biopax.paxtools.model.level3.Rna;
import org.biopax.paxtools.model.level3.RnaRegion;
import org.biopax.paxtools.model.level3.SmallMolecule;
import org.biopax.paxtools.model.level3.TemplateReaction;
import org.codehaus.jackson.annotate.JsonIgnore;

/**
 * Holds BioPAX data in a field named by its type (needed for
 * deserialisation---otherwise how do you know what the type is when it comes
 * from JSON?)
 */
public class Biopax {

	private Interaction bpInteraction;
	private Pathway bpPathway;
	private PathwayStep bpPathwayStep;
	private Conversion bpConversion;
	private Control bpControl;
	private Catalysis bpCatalysis;
	private Modulation bpModulation;
	private GeneticInteraction bpGeneticInteraction;
	private TemplateReaction bpTemplateReaction;
	private MolecularInteraction bpMolecularInteraction;

	private PhysicalEntity bpEntity; // can't create instance of plain entity so
										// use phys
	private SmallMolecule bpSmallMolecule;
	private Complex bpComplex;
	private Protein bpProtein;
	private RnaRegion bpRnaRegion;
	private Rna bpRna;
	private Dna bpDna;
	private DnaRegion bpDnaRegion;
	private Gene bpGene;

	public Biopax() {
	}

	public static Biopax fromObject(Object obj) {
		Biopax bp = new Biopax();

		// interactions
		if (obj instanceof Pathway) {
			bp.bpPathway = (Pathway) obj;
		} else if (obj instanceof PathwayStep) {
			bp.bpPathwayStep = (PathwayStep) obj;
		} else if (obj instanceof Catalysis) {
			bp.bpCatalysis = (Catalysis) obj;
		} else if (obj instanceof Modulation) {
			bp.bpModulation = (Modulation) obj;
		} else if (obj instanceof Control) {
			bp.bpControl = (Control) obj;
		} else if (obj instanceof GeneticInteraction) {
			bp.bpGeneticInteraction = (GeneticInteraction) obj;
		} else if (obj instanceof TemplateReaction) {
			bp.bpTemplateReaction = (TemplateReaction) obj;
		} else if (obj instanceof MolecularInteraction) {
			bp.bpMolecularInteraction = (MolecularInteraction) obj;
		} else if (obj instanceof Conversion) {
			bp.bpConversion = (Conversion) obj;
		} else if (obj instanceof Interaction) {
			bp.bpInteraction = (Interaction) obj;
		}

		// entites
		else if (obj instanceof SmallMolecule) {
			bp.bpSmallMolecule = (SmallMolecule) obj;
		} else if (obj instanceof Complex) {
			bp.bpComplex = (Complex) obj;
		} else if (obj instanceof Protein) {
			bp.bpProtein = (Protein) obj;
		} else if (obj instanceof RnaRegion) {
			bp.bpRnaRegion = (RnaRegion) obj;
		} else if (obj instanceof Rna) {
			bp.bpRnaRegion = (RnaRegion) obj;
		} else if (obj instanceof Dna) {
			bp.bpDna = (Dna) obj;
		} else if (obj instanceof DnaRegion) {
			bp.bpDnaRegion = (DnaRegion) obj;
		} else if (obj instanceof Gene) {
			bp.bpGene = (Gene) obj;
		} else if (obj instanceof Entity) {
			bp.bpEntity = (PhysicalEntity) obj;
		}

		// no type match
		else {
			return null;
		}

		return bp;
	}

	@JsonIgnore
	public BioPAXElement getElement() {

		// interactions
		if (bpPathway != null) {
			return bpPathway;
		} else if (bpPathwayStep != null) {
			return bpPathwayStep;
		} else if (bpCatalysis != null) {
			return bpCatalysis;
		} else if (bpModulation != null) {
			return bpModulation;
		} else if (bpControl != null) {
			return bpControl;
		} else if (bpGeneticInteraction != null) {
			return bpGeneticInteraction;
		} else if (bpTemplateReaction != null) {
			return bpTemplateReaction;
		} else if (bpMolecularInteraction != null) {
			return bpMolecularInteraction;
		} else if (bpConversion != null) {
			return bpConversion;
		} else if (bpInteraction != null) {
			return bpInteraction;
		}

		// entites
		else if (bpSmallMolecule != null) {
			return bpSmallMolecule;
		} else if (bpComplex != null) {
			return bpComplex;
		} else if (bpProtein != null) {
			return bpProtein;
		} else if (bpRnaRegion != null) {
			return bpRnaRegion;
		} else if (bpRnaRegion != null) {
			return bpRnaRegion;
		} else if (bpDna != null) {
			return bpDna;
		} else if (bpDnaRegion != null) {
			return bpDnaRegion;
		} else if (bpGene != null) {
			return bpGene;
		} else if (bpEntity != null) {
			return bpEntity;
		}

		// no type match
		else {
			return null;
		}
	}

	public Interaction getBpInteraction() {
		return bpInteraction;
	}

	public void setBpInteraction(Interaction bpInteraction) {
		this.bpInteraction = bpInteraction;
	}

	public Pathway getBpPathway() {
		return bpPathway;
	}

	public void setBpPathway(Pathway bpPathway) {
		this.bpPathway = bpPathway;
	}

	public PathwayStep getBpPathwayStep() {
		return bpPathwayStep;
	}

	public void setBpPathwayStep(PathwayStep bpPathwayStep) {
		this.bpPathwayStep = bpPathwayStep;
	}

	public Conversion getBpConversion() {
		return bpConversion;
	}

	public void setBpConversion(Conversion bpConversion) {
		this.bpConversion = bpConversion;
	}

	public Control getBpControl() {
		return bpControl;
	}

	public void setBpControl(Control bpControl) {
		this.bpControl = bpControl;
	}

	public Catalysis getBpCatalysis() {
		return bpCatalysis;
	}

	public void setBpCatalysis(Catalysis bpCatalysis) {
		this.bpCatalysis = bpCatalysis;
	}

	public Modulation getBpModulation() {
		return bpModulation;
	}

	public void setBpModulation(Modulation bpModulation) {
		this.bpModulation = bpModulation;
	}

	public GeneticInteraction getBpGeneticInteraction() {
		return bpGeneticInteraction;
	}

	public void setBpGeneticInteraction(GeneticInteraction bpGeneticInteraction) {
		this.bpGeneticInteraction = bpGeneticInteraction;
	}

	public TemplateReaction getBpTemplateReaction() {
		return bpTemplateReaction;
	}

	public void setBpTemplateReaction(TemplateReaction bpTemplateReaction) {
		this.bpTemplateReaction = bpTemplateReaction;
	}

	public MolecularInteraction getBpMolecularInteraction() {
		return bpMolecularInteraction;
	}

	public void setBpMolecularInteraction(
			MolecularInteraction bpMolecularInteraction) {
		this.bpMolecularInteraction = bpMolecularInteraction;
	}

	public Entity getBpEntity() {
		return bpEntity;
	}

	public void setBpEntity(PhysicalEntity bpEntity) {
		this.bpEntity = bpEntity;
	}

	public SmallMolecule getBpSmallMolecule() {
		return bpSmallMolecule;
	}

	public void setBpSmallMolecule(SmallMolecule bpSmallMolecule) {
		this.bpSmallMolecule = bpSmallMolecule;
	}

	public Complex getBpComplex() {
		return bpComplex;
	}

	public void setBpComplex(Complex bpComplex) {
		this.bpComplex = bpComplex;
	}

	public Protein getBpProtein() {
		return bpProtein;
	}

	public void setBpProtein(Protein bpProtein) {
		this.bpProtein = bpProtein;
	}

	public RnaRegion getBpRnaRegion() {
		return bpRnaRegion;
	}

	public void setBpRnaRegion(RnaRegion bpRnaRegion) {
		this.bpRnaRegion = bpRnaRegion;
	}

	public Rna getBpRna() {
		return bpRna;
	}

	public void setBpRna(Rna bpRna) {
		this.bpRna = bpRna;
	}

	public Dna getBpDna() {
		return bpDna;
	}

	public void setBpDna(Dna bpDna) {
		this.bpDna = bpDna;
	}

	public DnaRegion getBpDnaRegion() {
		return bpDnaRegion;
	}

	public void setBpDnaRegion(DnaRegion bpDnaRegion) {
		this.bpDnaRegion = bpDnaRegion;
	}

	public Gene getBpGene() {
		return bpGene;
	}

	public void setBpGene(Gene bpGene) {
		this.bpGene = bpGene;
	}

}
