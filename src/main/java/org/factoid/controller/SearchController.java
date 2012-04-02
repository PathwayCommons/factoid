package org.factoid.controller;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class SearchController {

	@RequestMapping(method = RequestMethod.GET, value = "/search")
	public ModelAndView search(HttpSession session) {

		ModelAndView mv = ModelAndViewFactory.create("/search");
		return mv;
	}

}
