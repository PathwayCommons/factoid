package org.factoid.cytoweb;

import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.biopax.paxtools.impl.level3.Level3FactoryImpl;
import org.biopax.paxtools.io.SimpleIOHandler;
import org.biopax.paxtools.model.BioPAXFactory;
import org.biopax.paxtools.model.Model;
import org.biopax.paxtools.model.level3.Complex;
import org.biopax.paxtools.model.level3.Control;
import org.biopax.paxtools.model.level3.Controller;
import org.biopax.paxtools.model.level3.Conversion;
import org.biopax.paxtools.model.level3.Entity;
import org.biopax.paxtools.model.level3.GeneticInteraction;
import org.biopax.paxtools.model.level3.Interaction;
import org.biopax.paxtools.model.level3.MolecularInteraction;
import org.biopax.paxtools.model.level3.NucleicAcid;
import org.biopax.paxtools.model.level3.Pathway;
import org.biopax.paxtools.model.level3.PathwayStep;
import org.biopax.paxtools.model.level3.PhysicalEntity;
import org.biopax.paxtools.model.level3.TemplateReaction;
import org.biopax.validator.utils.Normalizer;
import org.factoid.model.cytoweb.Edge;
import org.factoid.model.cytoweb.NetworkData;
import org.factoid.model.cytoweb.Node;
import org.factoid.model.cytoweb.Type;

/**
 * Converts Biopax to Cytoweb JSON format or vice versa
 * 
 */

public class CytowebConvertor {

	static public NetworkData biopax2cytoweb(InputStream biopax) {

		NetworkData network = null;

		SimpleIOHandler simpleReader = new SimpleIOHandler();
		simpleReader.mergeDuplicates(true);

		Normalizer normalizer = new Normalizer();
		Model m = simpleReader.convertFromOWL(biopax);
		normalizer.normalize(m);

		network = new NetworkData(m);
		return network;
	}

	static public Model cytoweb2biopax(NetworkData network) {

		BioPAXFactory factory = new Level3FactoryImpl();
		Model model = factory.createModel();

		// be able to get a node by id for adding references
		class Util {

			private Map<String, Node> idToNode;
			private Map<String, List<Edge>> nodesEdges;

			public Util(NetworkData network) {
				this.idToNode = new HashMap<String, Node>();
				this.nodesEdges = new HashMap<String, List<Edge>>();

				for (Node node : network.getNodes()) {
					idToNode.put(node.getData().getId(), node);
				}

				for (Edge edge : network.getEdges()) {
					addEdge(edge.getData().getSource(), edge);
					addEdge(edge.getData().getTarget(), edge);
				}
			}

			private void addEdge(String nodeId, Edge edge) {
				if (nodesEdges.containsKey(nodeId)) {
					nodesEdges.put(nodeId, new LinkedList<Edge>());
				}

				nodesEdges.get(nodeId).add(edge);
			}

			public Node node(String id) {
				return idToNode.get(id);
			}

			public Node otherNode(Node node, Edge edge) {

				if (!edge.getData().getTarget().equals(node.getData().getId())) {
					return node(edge.getData().getTarget());
				} else if (!edge.getData().getSource().equals(node.getData().getId())) {
					return node(edge.getData().getSource());
				} else {
					return null;
				}

			}

			public List<Edge> edges(Node node) {
				return nodesEdges.get(node.getData().getId());
			}

			public List<Edge> ownedEdges(Node node) {
				List<Edge> edges = new LinkedList<Edge>();

				for (Edge edge : edges(node)) {
					Type edgeType = Type.fromVal(edge.getData().getType());

					if ((edgeType.isInteraction() && edge.getData().getInteraction()
							.equals(node.getData().getId()))
							|| edgeType.equals(Type.COMPLEX)) {
						edges.add(edge);
					}
				}

				return edges;
			}

			public List<Node> nodes(Edge edge) {
				List<Node> nodes = new LinkedList<Node>();

				nodes.add(node(edge.getData().getTarget()));
				nodes.add(node(edge.getData().getSource()));

				return nodes;
			}
		}
		Util util = new Util(network);

		// each node is responsible for adding references corresponding to owned
		// edges
		for (Node node : network.getNodes()) {
			Type type = Type.fromVal(node.getData().getType());

			// interactions

			if (type.equals(Type.PATHWAY)) {
				Pathway pathway = node.getData().getBiopax().getBpPathway();
				model.add(pathway);

				// connect to 1st step
				String firstStepId = util.edges(node).get(0).getData().getId();
				PathwayStep firstStep = util.node(firstStepId).getData().getBiopax()
						.getBpPathwayStep();
				pathway.addPathwayOrder(firstStep);

			} else if (type.equals(Type.PATHWAY_STEP)) {
				PathwayStep step = node.getData().getBiopax().getBpPathwayStep();
				model.add(step);

				for (Edge edge : util.ownedEdges(node)) {
					Node connectedNode = util.otherNode(node, edge);
					Type edgeType = Type.fromVal(edge.getData().getType());

					// connect to next step
					if (edgeType.equals(Type.PATHWAY)) {
						step.addNextStep(connectedNode.getData().getBiopax()
								.getBpPathwayStep());
					}

					// connect to interaction
					else if (edgeType.equals(Type.PATHWAY_STEP)) {
						step.addStepProcess((org.biopax.paxtools.model.level3.Process) connectedNode
								.getData().getBiopax().getElement());
					}
				}

			} else if (type.equals(Type.CATALYSIS)
					|| type.equals(Type.MODULATION)
					|| type.equals(Type.CONTROL)) {
				Control control = (Control) node.getData().getBiopax().getElement();
				model.add(control);

				for (Edge edge : util.ownedEdges(node)) {

					// connect to controlled
					if (edge.getData().getDirected()) {
						control.addControlled((org.biopax.paxtools.model.level3.Process) util
								.otherNode(node, edge).getData().getBiopax().getElement());
					}

					// connect to controller
					else {
						control.addController((Controller) util
								.otherNode(node, edge).getData().getBiopax().getElement());
					}
				}

			} else if (type.equals(Type.GENETIC_INTERACTION)) {
				GeneticInteraction interaction = node.getData().getBiopax()
						.getBpGeneticInteraction();
				model.add(interaction);

				for (Edge edge : util.ownedEdges(node)) {
					interaction.addParticipant((Entity) util.otherNode(node, edge)
							.getData().getBiopax().getElement());
				}

			} else if (type.equals(Type.TEMPLATE_REACTION)) {
				TemplateReaction reaction = node.getData().getBiopax()
						.getBpTemplateReaction();
				model.add(reaction);

				for (Edge edge : util.ownedEdges(node)) {

					// connect to template
					if (edge.getData().getTarget().equals(node.getData().getId())) {
						reaction.setTemplate((NucleicAcid) util
								.otherNode(node, edge).getData().getBiopax().getElement());
					}

					// connect to product
					else {
						reaction.addProduct((PhysicalEntity) util
								.otherNode(node, edge).getData().getBiopax().getElement());
					}
				}

			} else if (type.equals(Type.MOLECULAR_INTERACTION)) {
				MolecularInteraction interaction = node.getData().getBiopax()
						.getBpMolecularInteraction();
				model.add(interaction);

				for (Edge edge : util.ownedEdges(node)) {
					interaction.addParticipant((Entity) util.otherNode(node, edge)
							.getData().getBiopax().getElement());
				}

			} else if (type.equals(Type.CONVERSION)) {
				Conversion conversion = node.getData().getBiopax().getBpConversion();
				model.add(conversion);

				for (Edge edge : util.ownedEdges(node)) {

					PhysicalEntity entity = (PhysicalEntity) util
							.otherNode(node, edge).getData().getBiopax().getElement();

					// connect to lhs
					if (edge.getData().getTarget().equals(node.getData().getId())) {
						conversion.addLeft(entity);
					}

					// connect to rhs
					else {
						conversion.addRight(entity);
					}

				}

			} else if (type.equals(Type.INTERACTION)) {
				Interaction interaction = node.getData().getBiopax().getBpInteraction();
				model.add(interaction);

				for (Edge edge : util.ownedEdges(node)) {
					interaction.addParticipant((Entity) util.otherNode(node, edge)
							.getData().getBiopax().getElement());
				}
			}

			// entities
			else if (type.equals(Type.COMPLEX)) {
				Complex complex = node.getData().getBiopax().getBpComplex();
				model.add(complex);

				for (Edge edge : util.ownedEdges(node)) {
					complex.addMemberPhysicalEntity((PhysicalEntity) util
							.otherNode(node, edge).getData().getBiopax().getElement());
				}

			} else {
				Entity entity = (Entity) node.getData().getBiopax().getElement();
				model.add(entity);
			}

		}

		return model;
	}
}
