package org.factoid.model.cytoweb;

import java.util.HashSet;
import java.util.Set;

/**
 * node object in cytoweb json format
 * 
 */
public class Node {

	public class Data {
		private String type;
		private String id;
		private Biopax biopax;
		private String match;

		public String getMatch() {
			return match;
		}

		public void setMatch(String match) {
			this.match = match;
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

		public Biopax getBiopax() {
			return biopax;
		}

		public void setBiopax(Biopax biopax) {
			this.biopax = biopax;
		}
	}

	private Data data = new Data();
	private Set<String> classes = new HashSet<String>();

	public Node() {

	}

	public Node(String id) {
		this.data.setId(id);
	}

	public Data getData() {
		return data;
	}

	public void setData(Data data) {
		this.data = data;
	}

	public boolean hasClass(String c) {
		return classes.contains(c);
	}

	public void addClass(String c) {
		for(String cls : c.split("\\s+")){
			classes.add(cls);
		}
	}

	public String getClasses() {
		String ret = "";
		int i = 0;

		for (String cls : classes) {
			ret += cls + (i < classes.size() - 1 ? " " : "");
			i++;
		}

		return ret;
	}
	
	public void setClasses(String c){
		String[] cs = c.split("\\s+");
		
		for(String cls : cs){
			classes.add(cls);
		}
	}

}
