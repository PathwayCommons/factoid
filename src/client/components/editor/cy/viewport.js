let on = require('./on-key');
let defs = require('./defs');

function handlePan( cy ){
  let panAmount = 5;
  let panMult = 4;

  on('down', () => cy.panBy({ y: -panAmount * panMult }));
  on('up', () => cy.panBy({ y: panAmount * panMult }));
  on('left', () => cy.panBy({ x: panAmount * panMult }));
  on('right', () => cy.panBy({ x: -panAmount * panMult }));
  on('shift+down', () => cy.panBy({ y: -panAmount }));
  on('shift+up', () => cy.panBy({ y: panAmount }));
  on('shift+left', () => cy.panBy({ x: panAmount }));
  on('shift+right', () => cy.panBy({ x: -panAmount }));
}

function handleZoom( cy ){
  let zoomAmount = 0.05;
  let zoomMult = 4;

  let zoomBy = mult => {
    let z = cy.zoom();
    let w = cy.width();
    let h = cy.height();

    cy.zoom({
      level: z * mult,
      renderedPosition: { x: w/2, y: h/2 }
    });
  };

  on('=', () => zoomBy( (1 + zoomAmount * zoomMult) ));
  on('-', () => zoomBy( 1/(1 + zoomAmount * zoomMult) ));
  on('+', () => zoomBy( 1 + zoomAmount ));
  on('_', () => zoomBy( 1/(1 + zoomAmount) ));
}

function handleFit( cy, bus ){
  let fit = () => {
    cy.stop().animate({
      fit: {
        eles: cy.elements(),
        padding: defs.padding
      },
      duration: defs.layoutAnimationDuration,
      easing: defs.layoutAnimationEasing
    });
  };

  on('f', fit);
  bus.on('fit', fit);
}

module.exports = function( { bus, cy } ){
  handlePan( cy );
  handleZoom( cy );
  handleFit( cy, bus );
};
