package org.factoid.controller.test;

import javax.servlet.http.HttpSession;

import org.factoid.controller.ModelAndViewFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class WidgetTestController {
	@RequestMapping(method = RequestMethod.GET, value = "/test/widgets")
	public ModelAndView show(HttpSession session) {

		ModelAndView mv = ModelAndViewFactory.create("/test/widgets", "test-widgets.jsp");
		return mv;
	}
}
