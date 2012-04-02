package org.factoid.model.cytoweb;

/**
 * Makes an edge with a unique ID
 *
 */
public class EdgeFactory {

	private String idPrefix = "e";
	private int lastId = 0;

	public Edge makeEdge() {
		String id = idPrefix + lastId++;
		Edge edge = new Edge(id);
		return edge;
	}

}
