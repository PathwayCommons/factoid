package org.factoid.model.normalization;

public class Match implements Comparable {
	private String string;
	private int start;
	private int end;

	public String getString() {
		return string;
	}

	public void setString(String string) {
		this.string = string;
	}

	public int getStart() {
		return start;
	}

	public void setStart(int start) {
		this.start = start;
	}

	public int getEnd() {
		return end;
	}

	public void setEnd(int end) {
		this.end = end;
	}

	@Override
	public int compareTo(Object arg0) {

		if (arg0 instanceof Match) {
			Match other = (Match) arg0;

			if (this.start < other.start) {
				return -1;
			} else if (this.start > other.start) {
				return 1;
			} else {
				if (this.end < other.end) {
					return -1;
				} else if (this.end > other.end) {
					return 1;
				}
			}
		}

		return 0;
	}

}
