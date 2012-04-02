package org.factoid.controller.test;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.factoid.controller.ModelAndViewFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class UploadTestController {

	@RequestMapping(method = RequestMethod.POST, value = "/test/upload")
	public ModelAndView create(@RequestParam("file") CommonsMultipartFile file)
			throws IOException {

		String ret = "No file contents";
		
		if (!file.isEmpty()) {
			BufferedReader reader = new BufferedReader(new InputStreamReader(
					file.getInputStream()));
			ret = "";
			
			while (reader.ready()) {
				ret += reader.readLine() + (reader.ready() ? "\n" : "");
			}
		}

		ModelAndView mv = ModelAndViewFactory.create("/test/upload", "test-upload.jsp");
		mv.addObject("contents", ret);
		return mv;
	}

	@RequestMapping(method = RequestMethod.GET, value = "/test/upload")
	public ModelAndView show() {
		return ModelAndViewFactory.create("/test/upload", "test-upload.jsp");
	}
}