package org.factoid.model.cytoweb.mapper;

import java.util.HashMap;
import java.util.Map;

import org.biopax.paxtools.model.BioPAXElement;
import org.biopax.paxtools.model.level3.BiochemicalPathwayStep;
import org.biopax.paxtools.model.level3.Catalysis;
import org.biopax.paxtools.model.level3.ChemicalStructure;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Controller;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.Dna;
import org.biopax.paxtools.model.level3.DnaRegion;
import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.EntityReference;
import org.biopax.paxtools.model.level3.Gene;
import org.biopax.paxtools.model.level3.GeneticInteraction;
import org.biopax.paxtools.model.level3.Interaction;
import org.biopax.paxtools.model.level3.Level3Element;
import org.biopax.paxtools.model.level3.Modulation;
import org.biopax.paxtools.model.level3.MolecularInteraction;
import org.biopax.paxtools.model.level3.Observable;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.Process;
import org.biopax.paxtools.model.level3.Protein;
import org.biopax.paxtools.model.level3.Rna;
import org.biopax.paxtools.model.level3.RnaRegion;
import org.biopax.paxtools.model.level3.SimplePhysicalEntity;
import org.biopax.paxtools.model.level3.SmallMolecule;
import org.biopax.paxtools.model.level3.TemplateReaction;
import org.biopax.paxtools.model.level3.Xref;
import org.codehaus.jackson.map.DeserializationConfig;
import org.factoid.model.cytoweb.mapper.mixins.BioPAXElementMixIn;
import org.factoid.model.cytoweb.mapper.mixins.BiochemicalPathwayStepMixIn;
import org.factoid.model.cytoweb.mapper.mixins.CatalysisMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ChemicalStructureMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ComplexMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ControlMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ControllerMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ConversionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.DnaMixIn;
import org.factoid.model.cytoweb.mapper.mixins.DnaRegionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.EntityMixIn;
import org.factoid.model.cytoweb.mapper.mixins.EntityReferenceMixIn;
import org.factoid.model.cytoweb.mapper.mixins.GeneMixIn;
import org.factoid.model.cytoweb.mapper.mixins.GeneticInteractionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.InteractionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.Level3ElementMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ModulationMixIn;
import org.factoid.model.cytoweb.mapper.mixins.MolecularInteractionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ObservableMixIn;
import org.factoid.model.cytoweb.mapper.mixins.PathwayMixIn;
import org.factoid.model.cytoweb.mapper.mixins.PathwayStepMixIn;
import org.factoid.model.cytoweb.mapper.mixins.PhysicalEntityMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ProcessMixIn;
import org.factoid.model.cytoweb.mapper.mixins.ProteinMixIn;
import org.factoid.model.cytoweb.mapper.mixins.RnaMixIn;
import org.factoid.model.cytoweb.mapper.mixins.RnaRegionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.SimplePhysicalEntityMixIn;
import org.factoid.model.cytoweb.mapper.mixins.SmallMoleculeMixIn;
import org.factoid.model.cytoweb.mapper.mixins.TemplateReactionMixIn;
import org.factoid.model.cytoweb.mapper.mixins.XrefMixIn;

/**
 * Controls serialisation and deserialisation options for JSON. Mixins are used
 * to control options for particular classes. A mixin implements the interface
 * of the class it describes and is annotated using Jackson JSON annotations.
 * 
 * http://wiki.fasterxml.com/JacksonFAQ
 * 
 */
public class ObjectMapper extends org.codehaus.jackson.map.ObjectMapper {

	public ObjectMapper() {
		super();

		this.configure(
				DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);

		// you must add mixins to this map for them to take effect
		Map<Class<?>, Class<?>> mixIns = new HashMap<Class<?>, Class<?>>() {
			{
				// parent classes
				put(Level3Element.class, Level3ElementMixIn.class);
				put(BioPAXElement.class, BioPAXElementMixIn.class);
				put(Observable.class, ObservableMixIn.class);
				put(SimplePhysicalEntity.class, SimplePhysicalEntityMixIn.class);
				put(PhysicalEntity.class, PhysicalEntityMixIn.class);

				// entities
				put(Entity.class, EntityMixIn.class);
				put(SmallMolecule.class, SmallMoleculeMixIn.class);
				put(Complex.class, ComplexMixIn.class);
				put(Protein.class, ProteinMixIn.class);
				put(RnaRegion.class, RnaRegionMixIn.class);
				put(Rna.class, RnaMixIn.class);
				put(DnaRegion.class, DnaRegionMixIn.class);
				put(Dna.class, DnaMixIn.class);
				put(Gene.class, GeneMixIn.class);

				// interactions
				put(Interaction.class, InteractionMixIn.class);
				put(Conversion.class, ConversionMixIn.class);
				put(Control.class, ControlMixIn.class);
				put(Catalysis.class, CatalysisMixIn.class);
				put(Modulation.class, ModulationMixIn.class);
				put(Pathway.class, PathwayMixIn.class);
				put(PathwayStep.class, PathwayStepMixIn.class);
				put(GeneticInteraction.class, GeneticInteractionMixIn.class);
				put(BiochemicalPathwayStep.class,
						BiochemicalPathwayStepMixIn.class);
				put(Process.class, ProcessMixIn.class);
				put(TemplateReaction.class, TemplateReactionMixIn.class);
				put(MolecularInteraction.class, MolecularInteractionMixIn.class);

				// misc
				put(Xref.class, XrefMixIn.class);
				put(EntityReference.class, EntityReferenceMixIn.class);
				put(Controller.class, ControllerMixIn.class);
				put(ChemicalStructure.class, ChemicalStructureMixIn.class);
			}
		};

		this.getDeserializationConfig().setMixInAnnotations(mixIns);
		this.getSerializationConfig().setMixInAnnotations(mixIns);

	}
}
