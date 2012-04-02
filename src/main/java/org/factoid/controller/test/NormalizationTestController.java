package org.factoid.controller.test;

import org.factoid.controller.ModelAndViewFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class NormalizationTestController {
	@RequestMapping(method = RequestMethod.GET, value = "/test/normalization")
	public ModelAndView show() {
		return ModelAndViewFactory.create("/test/normalization", "test-normalization.jsp");
	}
}