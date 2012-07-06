
/* jquery.cytoscape-edgehandles.js */

/**
 * This file is part of cytoscape.js 2.0-prerelease-snapshot-2012.07.06-18.24.35.
 * 
 * Cytoscape.js is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * Cytoscape.js is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License along with
 * cytoscape.js. If not, see <http://www.gnu.org/licenses/>.
 */
 
;(function($){
	
	var defaults = {
		handleSize: 10,
		handleColor: "red",
		handleLineWidth: 1,
		hoverDelay: 150,
		enabled: true,
		lineType: "draw", // can be "straight" or "draw"
		edgeType: function( sourceNode, targetNode ){
			return "node"; // can return "flat" for flat edges between nodes or "node" for intermediate node between them
			// returning null/undefined means an edge can't be added between the two nodes
		},
		loopAllowed: function( node ){
			return false;
		},
		nodeParams: function( sourceNode, targetNode ){
			return {};
		},
		edgeParams: function( sourceNode, targetNode ){
			return {};
		},
		start: function( sourceNode ){
			// fired when edgehandles interaction starts (drag on handle)
		},
		complete: function( sourceNode, targetNodes, addedEntities ){
			// fired when edgehandles is done and entities are added
		},
		stop: function( sourceNode ){
			// fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
		}
	};
	
	$.fn.cytoscapeEdgehandles = function( params ){
		var fn = params;
		
		var functions = {
			destroy: function(){
				var $container = $(this);
				var data = $container.data("cyedgehandles");
				
				if( data == null ){
					return;
				}
				
				data.unbind();
				$container.data("cyedgehandles", {});
				
				return $container;
			},
			
			option: function(name, value){
				var $container = $(this);
				var data = $container.data("cyedgehandles");
				
				if( data == null ){
					return;
				}
				
				var options = data.options;
				
				if( value === undefined ){
					if( typeof name == typeof {} ){
						var newOpts = name;
						options = $.extend(true, {}, defaults, newOpts);
						data.options = options;
					} else {
						return options[ name ];
					}
				} else {
					options[ name ] = value;
				}
				
				$container.data("cyedgehandles", data);

				return $container;
			},

			disable: function(){
				return functions.option.apply(this, ["enabled", false]);
			},

			enable: function(){
				return functions.option.apply(this, ["enabled", true]);
			},
				
			init: function(){
				var opts = $.extend(true, {}, defaults, params); 
				var $container = $(this);
				var svg, cy;
				var handle;
				var line, linePoints;
				var mdownOnHandle = false;
				var grabbingNode = false;
				var hx, hy, hr;
				var hoverTimeout;
				
				// write options to data
				var data = $container.data("cyedgehandles");
				if( data == null ){
					data = {};
				}
				data.options = opts;
				
				function options(){
					return $container.data("cyedgehandles").options;
				}

				function enabled(){
					return options().enabled;
				}

				function disabled(){
					return !enabled();
				}

				function svgIsInCy( svgDomElement ){
					var $ele = $(svgDomElement);
					var inside = false;
					var $parents = $ele.parents();

					for( var i = 0; i < $parents.length; i++ ){
						var parent = $parents[i];

						if( parent == $container[0] ){
							inside = true;
							break;
						}
					}
					
					return inside;
				}
				
				function safelyRemoveCySvgChild( svgDomElement ){
					if( svgDomElement != null && svgIsInCy( svgDomElement ) ){
						svg.remove( svgDomElement );
					}
				}
				
				function resetToDefaultState(){
//					console.log("resetToDefaultState");

					safelyRemoveCySvgChild( handle );
					safelyRemoveCySvgChild( line );
					
					setTimeout(function(){
						cy.nodes()
							.removeClass("ui-cytoscape-edgehandles-hover")
							.removeClass("ui-cytoscape-edgehandles-source")
							.removeClass("ui-cytoscape-edgehandles-target")
						;
					}, 1);
					

					linePoints = null;
					
					cy.zoomingEnabled(true).panningEnabled(true);
				}
				
				function makePreview( source, target ){
					makeEdges( true );
				}
				
				function removePreview( source, target ){
					source.edgesWith(target).filter(".ui-cytoscape-edgehandles-preview").remove();
					
					target
						.neighborhood("node.ui-cytoscape-edgehandles-preview")
						.closedNeighborhood(".ui-cytoscape-edgehandles-preview")
						.remove();
					
				}
				
				function makeEdges( preview ){
					
					// console.log("make edges");
					
					var source = cy.nodes(".ui-cytoscape-edgehandles-source");
					var targets = cy.nodes(".ui-cytoscape-edgehandles-target");
					var classes = preview ? "ui-cytoscape-edgehandles-preview" : "";
					var added = cy.collection();
					
					if( source.size() == 0 || targets.size() == 0 ){
						return; // nothing to do :(
					}
					
					// just remove preview class if we already have the edges
					if( !preview && options().preview ){
						added = cy.elements(".ui-cytoscape-edgehandles-preview").removeClass("ui-cytoscape-edgehandles-preview");
						
						options().complete( source, targets, added );
						return;
					} else {
						// remove old previews
						cy.elements(".ui-cytoscape-edgehandles-preview").remove();
					}
					
					for( var i = 0; i < targets.length; i++ ){
						var target = targets[i];
						
						switch( options().edgeType( source, target ) ){
						case "node":
							
							var p1 = source.position();
							var p2 = target.position();
							var p = {
								x: (p1.x + p2.x)/2,
								y: (p1.y + p2.y)/2
							};
												
							var interNode = cy.add($.extend( true, {
								group: "nodes",
								position: p
							}, options().nodeParams(source, target) )).addClass(classes);

							var source2inter = cy.add($.extend( true, {
								group: "edges",
								data: {
									source: source.id(),
									target: interNode.id()
								}
							}, options().edgeParams(source, target) )).addClass(classes);
							
							var inter2target = cy.add($.extend( true, {
								group: "edges",
								data: {
									source: interNode.id(),
									target: target.id()
								}
							}, options().edgeParams(source, target) )).addClass(classes);
							
							added = added.add( interNode ).add( source2inter ).add( inter2target );
							
							break;
						
						case "flat":
							var edge = cy.add($.extend( true, {
								group: "edges",
								data: {
									source: source.id(),
									target: target.id()
								}
							}, options().edgeParams(source, target) )).addClass(classes);
						
							added = added.add( edge );
						
							break;

						default:
							target.removeClass("ui-cytoscape-edgehandles-target");
							break; // don't add anything
						}
					}
					
					if( !preview ){
						options().complete( source, targets, added );
					}
				}
				
				$container.cytoscape(function(e){
					cy = this;
					svg = $container.svg("get");
					
					var transformHandler;
					cy.bind("zoom pan", transformHandler = function(){
						safelyRemoveCySvgChild( handle );
					});
					
					var startHandler, hoverHandler, leaveHandler, grabNodeHandler, freeNodeHandler, mdownNodeHandler;
					cy.on("mouseover", "node", startHandler = function(e){
						if( disabled() || mdownOnHandle || grabbingNode || this.hasClass("ui-cytoscape-edgehandles-preview") ){
							return; // don't override existing handle that's being dragged
							// also don't trigger when grabbing a node
						} 
						
						// console.log("node mouseover");
						
						var node = this;
						var source = this;
						var p = node.renderedPosition();
						var h = node.renderedHeight();
						
						// remove old handle
						safelyRemoveCySvgChild( handle );
						
						hx = p.x;
						hy = p.y - h/2;
						hr = options().handleSize/2;
						
						// add new handle
						handle = svg.circle(hx, hy, hr, {
							fill: options().handleColor
						});
						var $handle = $(handle);
						
						function mdownHandler(e){
							if( e.button != 0 ){
								return; // sorry, no right clicks allowed 
							}
							
//							console.log("-- mdownHandler %o --", e);
							
							mdownOnHandle = true;
							
							e.preventDefault();
							node.unbind("mouseout", removeHandler);
							$handle.unbind("mouseout", removeHandler);
							
							node.addClass("ui-cytoscape-edgehandles-source");
							
							function doneMoving(dmEvent){
//								console.log("doneMoving %o", dmEvent);
								
								if( !mdownOnHandle ){
									return;
								}
								
								var $this = $(this);
								mdownOnHandle = false;
								$(window).unbind("mousemove", moveHandler);
								
								makeEdges();
								resetToDefaultState();
								
								options().stop( node );
							}
							
							$(window).one("mouseup blur", doneMoving).bind("mousemove", moveHandler);
							cy.zoomingEnabled(false).panningEnabled(false);
							
							options().start( node );
						}
						
						function moveHandler(e){
							// console.log("move");
							
							var x = e.pageX - $container.offset().left;
							var y = e.pageY - $container.offset().top;
							
							safelyRemoveCySvgChild( line );
							
							var style = {
								stroke: options().handleColor,
								strokeWidth: options().handleLineWidth,
								fill: "none",
								"pointer-events": "none"
							};
							
							// draw line based on type
							switch( options().lineType ){
							case "straight":
								
								line = svg.line(hx, hy, x, y, style);
								
								break;
							case "draw":
							default:
								
								if( linePoints == null ){
									linePoints = [ [hx, hy], [x, y] ];
								} else {
									linePoints.push([ x, y ]);
								}
								
								line = svg.polyline(linePoints, style);
								
								break;
							}
							
							
						}
						
						function removeHandler(e){		
							//console.log("remove event", e);
							// return;

							var newTargetIsHandle = e.relatedTarget == handle;
							var newTargetIsNode = e.relatedTarget == node.rscratch("svg"); // TODO plugin shouldn't use ele.rscratch
							
							if( newTargetIsHandle || newTargetIsNode || mdownOnHandle ){
								return; // don't consider mouseout
							}
							
//							console.log("removeHandler %o", e);
							
							node.unbind("mouseout", removeHandler);
							resetToDefaultState();
						}
						
						node.bind("mouseout", removeHandler);
						$handle.bind("mouseout", removeHandler);
						$handle.bind("mousedown", mdownHandler);
						
					}).on("mouseover", "node", hoverHandler = function(){
						var node = this;
						var target = this;

						if( disabled() || this.hasClass("ui-cytoscape-edgehandles-preview") ){
							return; // ignore preview nodes
						}
						
						if( mdownOnHandle ){ // only handle mdown case

							clearTimeout( hoverTimeout );
							hoverTimeout = setTimeout(function(){
								var source = cy.nodes(".ui-cytoscape-edgehandles-source");
								
								var isLoop = node.hasClass("ui-cytoscape-edgehandles-source");
								var loopAllowed = options().loopAllowed( node );
								
								if( !isLoop || (isLoop && loopAllowed) ){
									node.addClass("ui-cytoscape-edgehandles-hover");
									node.toggleClass("ui-cytoscape-edgehandles-target");
									
									if( options().preview ){
										if( node.hasClass("ui-cytoscape-edgehandles-target") ){
											makePreview( source, target );
										} else {
											removePreview( source, target );
										}
									}
								}
							}, options().hoverDelay);
						}
					}).on("mouseout", "node", leaveHandler = function(){
						this.removeClass("ui-cytoscape-edgehandles-hover");

						if( mdownOnHandle ){
							clearTimeout(hoverTimeout);
						}
					}).on("mousedown", "node", mdownNodeHandler = function(){
						resetToDefaultState();
					}).on("grab", "node", grabHandler = function(){
						grabbingNode = true;
					}).on("free", "node", freeNodeHandler = function(){
						grabbingNode = false;
					});
					
					data.unbind = function(){
						cy
							.off("mouseover", "node", startHandler)
							.off("mouseover", "node", hoverHandler)
							.off("mouseout", "node", leaveHandler)
							.off("mousedown", "node", mdownNodeHandler)
							.off("grab", "node", grabNodeHandler)
							.off("free", "node", freeNodeHandler)
						;
						
						cy.unbind("zoom pan", transformHandler);
					};
				});
				
				$container.data("cyedgehandles", data);
			}
		};
		
		if( functions[fn] ){
			return functions[fn].apply(this, Array.prototype.slice.call( arguments, 1 ));
		} else if( typeof fn == 'object' || !fn ) {
			return functions.init.apply( this, arguments );
		} else {
			$.error("No such function `"+ fn +"` for jquery.cytoscapeEdgeHandles");
		}
		
		return $(this);
	};
	
})( jQuery );