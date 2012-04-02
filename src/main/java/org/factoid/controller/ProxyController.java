package org.factoid.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class ProxyController {
	@RequestMapping(method = RequestMethod.GET, value = "/proxy")
	public ModelAndView show(@RequestParam("url") String address,
			@RequestParam(value = "json", required = false) Boolean json,
			HttpSession session) {

		String response = "";
		try {
			URL url = new URL(address);

			BufferedReader br = new BufferedReader(new InputStreamReader(
					url.openStream()));
			while (br.ready()) {
				response += br.readLine() + (br.ready() ? "\n" : "");
			}
			br.close();
		} catch (MalformedURLException e) {
			response = "Error: malformed URL";
		} catch (IOException e) {
			response = "Error: could not read contents at URL";
		}

		ModelAndView mv = ModelAndViewFactory.create("/proxy");
		mv.addObject("response", response);
		return mv;
	}
}

