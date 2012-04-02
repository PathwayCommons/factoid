package org.factoid.controller;

import java.io.IOException;
import java.io.StringWriter;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.commons.io.IOUtils;
import org.factoid.model.normalization.Sentence;
import org.factoid.model.paper.Paper;
import org.factoid.service.NormalizationService;
import org.factoid.service.PaperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class EditorController {

	@Autowired
	private PaperService paperService;

	// get the editor for paper with id
	@RequestMapping(method = RequestMethod.GET, value = "/editor/{id}")
	public ModelAndView show(@PathVariable("id") String id, HttpSession session) {
		ModelAndView mv = ModelAndViewFactory.create("/editor/{id}",
				"editor.jsp");
		mv.addObject("paper", id);

		return mv;
	}

	// get the editor for a new paper from abstract
	@RequestMapping(method = RequestMethod.POST, value = "/editor")
	public ModelAndView create(
			@RequestParam(value = "text", required = false) String text,
			HttpSession session) throws IOException {
		ModelAndView mv = ModelAndViewFactory.create("/editor");

		Paper paper = paperService.createPaper(text);
		mv.addObject("paper", paper.getId());

		return mv;
	}

	public PaperService getPaperService() {
		return paperService;
	}

	public void setPaperService(PaperService paperService) {
		this.paperService = paperService;
	}

}
