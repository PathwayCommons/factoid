package org.factoid.model.cytoweb;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.biopax.paxtools.model.BioPAXElement;
import org.biopax.paxtools.model.Model;
import org.biopax.paxtools.model.level3.Catalysis;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Controller;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.ConversionDirectionType;
import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.Interaction;
import org.biopax.paxtools.model.level3.Modulation;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.Stoichiometry;
import org.biopax.paxtools.model.level3.TemplateDirectionType;
import org.biopax.paxtools.model.level3.TemplateReaction;

/**
 * networkData field in cytoweb
 * 
 */
public class NetworkData {
	private List<Edge> edges = new LinkedList<Edge>();
	private List<Node> nodes = new LinkedList<Node>();
	private EdgeFactory edgeFactory = new EdgeFactory();
	private NodeFactory nodeFactory = new NodeFactory();
	private List<Interaction> interactions = new LinkedList<Interaction>();
	private List<Pathway> pathways = new LinkedList<Pathway>();
	private List<Complex> complexes = new LinkedList<Complex>();
	private Map<String, Node> idToNode = new HashMap<String, Node>();

	private void connectNodesForControl(Interaction interaction) {
		Control control = (Control) interaction;
		Type type;

		if (control instanceof Modulation) {
			type = Type.MODULATION;
		} else if (control instanceof Catalysis) {
			type = Type.CATALYSIS;
		} else {
			type = Type.CONTROL;
		}

		for (org.biopax.paxtools.model.level3.Process controlled : control
				.getControlled()) {
			Edge controlledEdge = addEdge(interaction, controlled, type, true,
					false);
			setInteractionForEdge(interaction, controlledEdge);
		}

		for (Controller controller : control.getController()) {
			Edge controllerEdge = addEdge(controller, interaction, type, false,
					false);
			setInteractionForEdge(interaction, controllerEdge);
		}
	}

	private void connectNodesForTemplateReaction(Interaction interaction) {
		TemplateReaction reaction = (TemplateReaction) interaction;

		if (reaction.getTemplateDirection() == TemplateDirectionType.FORWARD) {
			Edge templateEdge = addEdge(reaction.getTemplate(), interaction,
					Type.TEMPLATE_REACTION, true, false);
			setInteractionForEdge(interaction, templateEdge);

			for (PhysicalEntity product : reaction.getProduct()) {
				Edge productEdge = addEdge(interaction, product,
						Type.TEMPLATE_REACTION, true, false);
				setInteractionForEdge(interaction, productEdge);
			}
		} else {
			Edge templateEdge = addEdge(interaction, reaction.getTemplate(),
					Type.TEMPLATE_REACTION, true, false);
			setInteractionForEdge(interaction, templateEdge);

			for (PhysicalEntity product : reaction.getProduct()) {
				Edge productEdge = addEdge(product, interaction,
						Type.TEMPLATE_REACTION, true, false);
				setInteractionForEdge(interaction, productEdge);
			}
		}
	}

	private Map<Integer, Float> getCoefficients(
			Set<Stoichiometry> stoichiometries) {
		Map<Integer, Float> idToCoefficient = new HashMap<Integer, Float>();

		for (Stoichiometry stoichiometry : stoichiometries) {
			Integer id = stoichiometry.getPhysicalEntity().hashCode();
			float coefficient = stoichiometry.getStoichiometricCoefficient();
			idToCoefficient.put(id, coefficient);
		}

		return idToCoefficient;
	}

	private void connectNodesForConversion(Interaction interaction) {
		Conversion conversion = (Conversion) interaction;
		Map<Integer, Float> idToCoefficient = getCoefficients(conversion
				.getParticipantStoichiometry());

		for (PhysicalEntity physEntity : conversion.getLeft()) {
			Float coefficient = idToCoefficient.get(physEntity.hashCode());

			Edge edge;
			if (conversion.getConversionDirection() == ConversionDirectionType.LEFT_TO_RIGHT) {
				edge = addEdge(physEntity, interaction, Type.CONVERSION, true,
						false);
			} else if (conversion.getConversionDirection() == ConversionDirectionType.RIGHT_TO_LEFT) {
				edge = addEdge(interaction, physEntity, Type.CONVERSION, true,
						false);
			} else {
				edge = addEdge(physEntity, interaction, Type.CONVERSION, true,
						true);
			}

			edge.getData().setCoefficient(coefficient);
			setInteractionForEdge(interaction, edge);
		}

		for (PhysicalEntity physEntity : conversion.getRight()) {
			Float coefficient = idToCoefficient.get(physEntity.hashCode());

			Edge edge;
			if (conversion.getConversionDirection() == ConversionDirectionType.LEFT_TO_RIGHT) {
				edge = addEdge(interaction, physEntity, Type.CONVERSION, true,
						false);
			} else if (conversion.getConversionDirection() == ConversionDirectionType.RIGHT_TO_LEFT) {
				edge = addEdge(physEntity, interaction, Type.CONVERSION, true,
						false);
			} else {
				edge = addEdge(interaction, physEntity, Type.CONVERSION, true,
						true);
			}

			edge.getData().setCoefficient(coefficient);
			setInteractionForEdge(interaction, edge);
		}
	}

	private void connectNodesForComplex(Complex complex) {
		Map<Integer, Float> idToCoefficient = getCoefficients(complex
				.getComponentStoichiometry());

		Node complexNode = getNode(complex);

		for (PhysicalEntity entity : complex.getComponent()) {
			Edge edge = addEdge(complex, entity, Type.COMPLEX, false, false);
			Float coeff = idToCoefficient.get(entity.hashCode());
			edge.getData().setCoefficient(coeff);
			edge.getData().setComplex(complexNode.getData().getId());
		}
	}

	private void connectNodesForInteraction(Interaction interaction) {
		if (interaction instanceof Control) {
			connectNodesForControl(interaction);

		} else if (interaction instanceof TemplateReaction) {
			connectNodesForTemplateReaction(interaction);

		} else if (interaction instanceof Conversion) {
			connectNodesForConversion(interaction);

		} else {
			// otherwise, just add the interaction with the specific type
			for (Entity participant : interaction.getParticipant()) {
				Edge edge = addEdge(interaction, participant,
						Type.fromObject(interaction), false, false);
				setInteractionForEdge(interaction, edge);
			}
		}
	}

	private void connectStepToPathway(Pathway pathway, PathwayStep step) {
		Node stepNode = getNode(step);

		// connect to initial pathway node if first step
		if (step.getNextStepOf() == null || step.getNextStepOf().size() == 0) {
			Node pathwayNode = getNode(pathway);
			Edge edge = addEdge(pathwayNode, stepNode, Type.PATHWAY, false,
					false);
			setInteractionForEdge(pathway, edge);
		}

		// connect next step to current step
		for (PathwayStep nextStep : step.getNextStep()) {
			Node nextStepNode = getNode(nextStep);
			Edge edge = addEdge(stepNode, nextStepNode, Type.PATHWAY, true,
					false);
			setInteractionForEdge(step, edge);
		}

		// edges to step processes
		for (org.biopax.paxtools.model.level3.Process process : step
				.getStepProcess()) {
			Node processNode = getNode(process);
			Edge edge = addEdge(stepNode, processNode, Type.PATHWAY_STEP,
					false, false);
			setInteractionForEdge(step, edge);
		}

	}

	private Node getNode(BioPAXElement element) {
		String key = "" + element.hashCode();

		return idToNode.get(key);
	}

	private void setInteractionForEdge(BioPAXElement interaction, Edge edge) {
		setInteractionForEdge(getNode(interaction), edge);
	}

	private void setInteractionForEdge(Node node, Edge edge) {
		edge.getData().setInteraction(node.getData().getId());
	}

	private Edge addEdge(Entity fromEntity, Entity toEntity, Type type,
			boolean directed, boolean bidirectional) {
		Edge edge = addEdge(fromEntity, toEntity, type);
		edge.getData().setDirected(directed);
		edge.getData().setBidirectional(bidirectional);
		return edge;
	}

	private Edge addEdge(Entity fromEntity, Entity toEntity, Type type) {
		Node from = getNode(fromEntity);
		Node to = getNode(toEntity);

		return addEdge(from, to, type);
	}

	private Edge addEdge(Node from, Node to, Type type, boolean directed,
			boolean bidirectional) {
		Edge edge = addEdge(from, to, type);
		edge.getData().setDirected(directed);
		edge.getData().setBidirectional(bidirectional);
		return edge;
	}

	private Edge addEdge(Node from, Node to, Type type) {
		Edge edge = edgeFactory.makeEdge();
		edge.getData().setSource(from.getData().getId());
		edge.getData().setTarget(to.getData().getId());
		edges.add(edge);
		edge.getData().setType(type.getVal());

		return edge;
	}

	private Node addNode(BioPAXElement biopaxObj) {

		String key = "" + biopaxObj.hashCode();

		// don't add the node if we've already added it
		if (idToNode.containsKey(key)) {
			return null;
		}

		Node node = nodeFactory.makeNode();
		node.getData().setType(Type.fromObject(biopaxObj).getVal());

		nodes.add(node);
		idToNode.put(key, node);

		node.getData().setBiopax(Biopax.fromObject(biopaxObj));

		return node;
	}

	private void addPathwayStepNodes(Set<PathwayStep> order) {
		for (PathwayStep step : order) {
			addNode(step);
			addPathwayStepNodes(step.getNextStep());
		}
	}

	public NetworkData() {
	}

	public NetworkData(Model model) {
		Set<BioPAXElement> objs = model.getObjects();
		for (BioPAXElement obj : objs) {

			if (obj instanceof Entity) {
				Node node = addNode(obj);

				if (node != null) {
					if (obj instanceof Interaction) {
						Interaction interaction = (Interaction) obj;
						interactions.add(interaction);
					}

					if (obj instanceof Pathway) {
						Pathway pathway = (Pathway) obj;
						pathways.add(pathway);
						addPathwayStepNodes(pathway.getPathwayOrder());
					}

					if (obj instanceof Complex) {
						Complex complex = (Complex) obj;
						complexes.add(complex);
					}
				}
			}
		}

		for (Interaction interaction : interactions) {
			connectNodesForInteraction(interaction);
		}

		for (Pathway pathway : pathways) {
			for (PathwayStep step : pathway.getPathwayOrder()) {
				connectStepToPathway(pathway, step);
			}

		}

		for (Complex complex : complexes) {
			connectNodesForComplex(complex);
		}

	}

	public List<Edge> getEdges() {
		return edges;
	}

	public void setEdges(List<Edge> edges) {
		this.edges = edges;
	}

	public List<Node> getNodes() {
		return nodes;
	}

	public void setNodes(List<Node> nodes) {
		this.nodes = nodes;
	}
}
