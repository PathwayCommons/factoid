package org.factoid.controller.json;

import java.io.IOException;

import javax.servlet.http.HttpSession;

import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.factoid.cytoweb.CytowebConvertor;
import org.factoid.model.cytoweb.NetworkData;
import org.factoid.model.paper.Paper;
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

@Controller
public class CytowebController {

	@Autowired
	public ObjectMapper mapper;

	@Autowired
	private NormalizationService normalizationService;

	@Autowired
	PaperService paperService;

	public ObjectMapper getMapper() {
		return mapper;
	}

	public void setMapper(ObjectMapper mapper) {
		this.mapper = mapper;
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

	// send to client
	@RequestMapping(method = RequestMethod.GET, value = "/cytoweb/get/{id}")
	@ResponseBody
	public NetworkData get(@PathVariable("id") String id, HttpSession session) {
		Paper paper = paperService.getPaper(id);

		if (paper != null) {
			return paper.getNetwork();
		} else {
			return null;
		}
	}

	// save to server
	@RequestMapping(method = RequestMethod.POST, value = "/cytoweb/save")
	@ResponseBody
	public void save(@RequestParam("id") String id,
			@PathVariable("network") String networkDataJson, HttpSession session)
			throws JsonParseException, JsonMappingException, IOException {

		NetworkData data = mapper.readValue(networkDataJson, NetworkData.class);

		CytowebConvertor.cytoweb2biopax(data);

		// TODO store somewhere
	}

	// TODO remove when you don't need to test biopax2cytoweb anymore
	@RequestMapping(method = RequestMethod.POST, value = "/upload")
	@ResponseBody
	public NetworkData create(@RequestParam("file") CommonsMultipartFile file,
			HttpSession session) throws IOException {

		return CytowebConvertor.biopax2cytoweb(file.getInputStream());
	}

}
