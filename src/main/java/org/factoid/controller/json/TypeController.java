package org.factoid.controller.json;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.factoid.model.cytoweb.Type;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class TypeController {

	private class TypeStruct {
		private Map<String, Type> typesByName = Type.TYPES_BY_NAME;
		private List<Type> interactions = new LinkedList<Type>();
		private List<Type> entities = new LinkedList<Type>();
		private List<Type> controls = new LinkedList<Type>();

		public TypeStruct() {
			for (Type type : Type.TYPES) {
				if (type.isEntity()) {
					entities.add(type);
				} else {
					interactions.add(type);
				}

				if (type.isControl()) {
					controls.add(type);
				}
			}
		}

		public List<Type> getControls() {
			return controls;
		}

		public Map<String, Type> getTypesByName() {
			return typesByName;
		}

		public List<Type> getInteractions() {
			return interactions;
		}

		public List<Type> getEntities() {
			return entities;
		}

	}

	@RequestMapping(method = RequestMethod.GET, value = "/types")
	@ResponseBody
	public TypeStruct list(HttpSession session) {
		return new TypeStruct();
	}

}
