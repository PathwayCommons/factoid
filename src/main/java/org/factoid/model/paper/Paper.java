package org.factoid.model.paper;

import org.factoid.model.cytoweb.NetworkData;
import org.factoid.model.normalization.Normalization;

public class Paper {

	private String id;
	private NetworkData network;
	private Normalization normalization;

	public Normalization getNormalization() {
		return normalization;
	}

	public void setNormalization(Normalization normalization) {
		this.normalization = normalization;
	}

	public Paper() {
		super();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public NetworkData getNetwork() {
		return network;
	}

	public void setNetwork(NetworkData network) {
		this.network = network;
	}

}
