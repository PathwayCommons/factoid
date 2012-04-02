package org.factoid.service;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.text.BreakIterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.Vector;

import org.factoid.model.normalization.Match;
import org.factoid.model.normalization.Normalization;
import org.factoid.model.normalization.Sentence;

import abner.Tagger;

public class NormalizationService {

	private List<Match> getMatches(String text) throws IOException {
		String docid = submitPaper(text);
		List<Match> matches = new LinkedList<Match>();
		Set<Match> sortedMatches = new TreeSet<Match>();

		URL url = new URL(
				"http://factoid.bioinfo.cnio.es/Factoid/abner?_format=raw&docid="
						+ docid);

		BufferedReader br = new BufferedReader(new InputStreamReader(
				url.openStream()));
		while (br.ready()) {
			String line = br.readLine();
			if (!line.matches("^\\s*#.+$")) {
				String[] cols = line.split("\t");

				String id = cols[0];
				int start = Integer.parseInt(cols[1]);
				int end = Integer.parseInt(cols[2]);
				String annotationTypes = cols[3];
				String literal = cols[4];
				String type = cols[5];

				Match match = new Match();
				match.setStart(start);
				match.setEnd(end + 1);
				match.setString(literal);
				sortedMatches.add(match);
			}
		}
		br.close();

		for (Match m : sortedMatches) {
			matches.add(m);
		}

		return matches;
	}

	private String submitPaper(String text) throws IOException {
		URL url = new URL("http://factoid.bioinfo.cnio.es/Factoid/add_doc");
		URLConnection urlConn;
		DataOutputStream printout;
		DataInputStream input;
		BufferedReader br;

		// URL connection channel.
		urlConn = url.openConnection();

		// Let the run-time system (RTS) know that we want input.
		urlConn.setDoInput(true);

		// Let the RTS know that we want to do output.
		urlConn.setDoOutput(true);

		// No caching, we want the real thing.
		urlConn.setUseCaches(false);

		// Specify the content type.
		urlConn.setRequestProperty("Content-Type",
				"application/x-www-form-urlencoded");

		// Send POST output.
		printout = new DataOutputStream(urlConn.getOutputStream());
		String content = "_format=raw&text=" + URLEncoder.encode(text, "utf8");
		printout.writeBytes(content);
		printout.flush();
		printout.close();

		// Get response data.
		br = new BufferedReader(new InputStreamReader(urlConn.getInputStream()));
		String ret = "";
		while (br.ready()) {
			ret += br.readLine();
		}

		return ret;
	}

	public Normalization normalize(String text) throws IOException {
		Normalization normalization = new Normalization();

		// set text
		normalization.setText(text);

		// set sentences
		List<Sentence> sentences = new LinkedList<Sentence>();
		List<Match> matches = getMatches(text);

		BreakIterator boundary = BreakIterator.getSentenceInstance();
		boundary.setText(text);

		int start = 0;
		for (int end = boundary.next(); end != boundary.DONE; end = boundary
				.next()) {

			Sentence sentence = new Sentence();
			sentence.setStart(start);
			sentence.setEnd(end);
			sentence.setString(text.substring(start, end));
			sentences.add(sentence);

			start = end;

			int i;
			for (i = 0; i < matches.size(); i++) {
				Match match = matches.get(i);
				
				if (match.getEnd() > sentence.getEnd()) {
					break;
				} else {
					match.setStart(match.getStart() - sentence.getStart());
					match.setEnd(match.getEnd() - sentence.getStart());
					sentence.getMatches().add(match);
				}
			}
			
			for(int j = 0; j < i; j++){
				matches.remove(0);
			}
		}

		normalization.setSentences(sentences);

		return normalization;
	}

}
