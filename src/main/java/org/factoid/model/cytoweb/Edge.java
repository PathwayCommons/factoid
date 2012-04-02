package org.factoid.model.cytoweb;

/**
 * Edge object in cytoweb json
 */
public class Edge {

	public class Data {
		private String id;
		private String type = "";
		private Float coefficient;
		private String source;
		private String target;
		private Boolean directed;
		private Boolean bidirectional;
		private String interaction;
		private String complex;

		public String getComplex() {
			return complex;
		}

		public void setComplex(String complex) {
			this.complex = complex;
		}

		public String getInteraction() {
			return interaction;
		}

		public void setInteraction(String interaction) {
			this.interaction = interaction;
		}

		public Boolean getDirected() {
			return directed;
		}

		public Boolean getBidirectional() {
			return bidirectional;
		}

		public void setDirected(Boolean directed) {
			this.directed = directed;
		}

		public String getSource() {
			return source;
		}

		public void setSource(String source) {
			this.source = source;
		}

		public String getTarget() {
			return target;
		}

		public void setTarget(String target) {
			this.target = target;
		}

		public String getId() {
			return id;
		}

		public void setId(String id) {
			this.id = id;
		}

		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		public Float getCoefficient() {
			return coefficient;
		}

		public void setCoefficient(Float coefficient) {
			this.coefficient = coefficient;
		}

		public void setBidirectional(Boolean bidirectional) {
			this.bidirectional = bidirectional;
		}
	}

	private Data data = new Data();

	public Edge() {
	}

	public Edge(String id) {
		this.data.setId(id);
	}

	public Data getData() {
		return data;
	}

	public void setData(Data data) {
		this.data = data;
	}

}
