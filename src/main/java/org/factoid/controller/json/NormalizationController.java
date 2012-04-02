package org.factoid.controller.json;

import java.io.IOException;
import java.io.StringWriter;
import java.util.LinkedList;
import java.util.List;
import java.util.Vector;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.factoid.model.cytoweb.NetworkData;
import org.factoid.model.normalization.Normalization;
import org.factoid.model.normalization.Sentence;
import org.factoid.service.NormalizationService;
import org.factoid.service.PaperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import abner.Tagger;

@Controller
public class NormalizationController {

	@Autowired
	private NormalizationService normalizationService;

	@Autowired
	private PaperService paperService;

	@Autowired
	public ObjectMapper mapper;

	@RequestMapping(method = RequestMethod.POST, value = "/normalization/save/text/{id}")
	@ResponseBody
	public Normalization saveText(
			@PathVariable("id") String id,
			@RequestParam(value = "file", required = false) CommonsMultipartFile file,
			@RequestParam(value = "text", required = false) String text,
			HttpSession session, HttpServletRequest request) throws IOException {

		if (file != null) {
			StringWriter writer = new StringWriter();
			IOUtils.copy(file.getInputStream(), writer);
			text = writer.toString();
		} else if (text == null) {
			text = ""; // no text specified
		}

		Normalization normalization = normalizationService.normalize(text);
		paperService.getPaper(id).setNormalization(normalization);

		return normalization;
	}

	@RequestMapping(method = RequestMethod.POST, value = "/normalization/save/json/{id}")
	@ResponseBody
	public void saveJson(@PathVariable("id") String id,
			@RequestParam("normalization") String normalizationText,
			HttpSession session, HttpServletRequest request) throws IOException {

		Normalization normalization = mapper.readValue(normalizationText,
				Normalization.class);
		paperService.getPaper(id).setNormalization(normalization);
	}

	@RequestMapping(method = RequestMethod.GET, value = "/normalization/get/{id}")
	@ResponseBody
	public Normalization get(@PathVariable("id") String id,
			HttpSession session, HttpServletRequest request) {
		return paperService.getPaper(id).getNormalization();
	}

	public NormalizationService getNormalizationService() {
		return normalizationService;
	}

	public void setNormalizationService(
			NormalizationService normalizationService) {
		this.normalizationService = normalizationService;
	}

	public PaperService getPaperService() {
		return paperService;
	}

	public void setPaperService(PaperService paperService) {
		this.paperService = paperService;
	}

	public ObjectMapper getMapper() {
		return mapper;
	}

	public void setMapper(ObjectMapper mapper) {
		this.mapper = mapper;
	}

}
