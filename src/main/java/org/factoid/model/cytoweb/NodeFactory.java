package org.factoid.model.cytoweb;

/**
 * Makes a node with a unique ID
 */
public class NodeFactory {

	private int lastId = 0;
	private final String idPrefix = "n";

	public Node makeNode() {
		String id = idPrefix + lastId++;
		return new Node(id);
	}

}
