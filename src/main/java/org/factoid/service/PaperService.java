package org.factoid.service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.factoid.model.cytoweb.Edge;
import org.factoid.model.cytoweb.EdgeFactory;
import org.factoid.model.cytoweb.NetworkData;
import org.factoid.model.cytoweb.Node;
import org.factoid.model.cytoweb.NodeFactory;
import org.factoid.model.cytoweb.Type;
import org.factoid.model.normalization.Match;
import org.factoid.model.normalization.Normalization;
import org.factoid.model.normalization.Sentence;
import org.factoid.model.paper.Paper;
import org.springframework.beans.factory.annotation.Autowired;

public class PaperService {

	private Map<String, Paper> idToPaper = new HashMap<String, Paper>();
	private int lastId = 0;

	@Autowired
	private NormalizationService normalizationService;

	public NormalizationService getNormalizationService() {
		return normalizationService;
	}

	public void setNormalizationService(
			NormalizationService normalizationService) {
		this.normalizationService = normalizationService;
	}

	public Paper createPaper(String abstractText) throws IOException {

		if (abstractText == null) {
			abstractText = "";
		}

		Paper paper = new Paper();
		paper.setId("" + lastId++);

		NetworkData data = new NetworkData();
		paper.setNetwork(data);

		Map<String, Node> matchToNode = new HashMap<String, Node>();

		Normalization normalization = normalizationService
				.normalize(abstractText);
		paper.setNormalization(normalization);

		NodeFactory nodeFactory = new NodeFactory();
		EdgeFactory edgeFactory = new EdgeFactory();

		for (Sentence sentence : normalization.getSentences()) {

			if (sentence.getMatches() != null) {

				Node interaction = nodeFactory.makeNode();
				interaction.getData().setType(Type.INTERACTION.getVal());
				interaction.addClass("interaction");

				if (sentence.getMatches().size() > 1) {
					data.getNodes().add(interaction);
				}

				for (Match match : sentence.getMatches()) {
					Node node;

					if (matchToNode
							.containsKey(match.getString().toLowerCase())) {
						node = matchToNode.get(match.getString().toLowerCase());
					} else {
						node = nodeFactory.makeNode();
						node.getData().setType(Type.ENTITY.getVal());
						node.addClass("brand-new entity");
						node.getData().setMatch(match.getString());
						data.getNodes().add(node);

						matchToNode.put(match.getString().toLowerCase(), node);
					}

					if (sentence.getMatches().size() > 1) {
						Edge edge = edgeFactory.makeEdge();
						edge.getData().setSource(interaction.getData().getId());
						edge.getData().setTarget(node.getData().getId());
						edge.getData().setBidirectional(false);
						edge.getData().setDirected(false);
						edge.getData().setInteraction(interaction.getData().getId());
						edge.getData().setType(Type.INTERACTION.getVal());
						data.getEdges().add(edge);
					}
				}
			}
		}

		idToPaper.put(paper.getId(), paper);

		return paper;
	}

	public Paper getPaper(String id) {
		return idToPaper.get(id);
	}

}
