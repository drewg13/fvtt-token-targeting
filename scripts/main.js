const moduleName = "fvtt-token-targeting";
let userToken = {};
let deselectedToken;

Hooks.once("init", () => {

  game.settings.register( moduleName, "altTargeting", {
    "name": game.i18n.localize( "TT.altTargeting" ),
    "hint": game.i18n.localize( "TT.altTargetingHint" ),
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean
  });

  game.settings.register( moduleName, "gmOnly", {
    "name": game.i18n.localize( "TT.gmOnly" ),
    "hint": game.i18n.localize( "TT.gmOnlyHint" ),
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean
  });

});

Hooks.on( "controlToken", ( token, active ) => {
  const activeModule = game.settings.get( moduleName, "altTargeting" );
  const gmOnly = game.settings.get( moduleName, "gmOnly" );
  const activeUser = gmOnly ? game.user.isGM : true;
  if( activeModule && activeUser ) {
    if( active ) {
      deselectedToken = false;
      const targets = token.document.getFlag( moduleName, "targets" ) || [];

      /* check for tokens deleted from scene */
      const canvasTokens = canvas.tokens.placeables.map( t => t.id );
      let culledTargets = canvasTokens.filter( c => targets.includes( c ) );
      if( targets !== culledTargets ){
        token.document.setFlag( moduleName, "targets", culledTargets);
      }

      game.user.updateTokenTargets( culledTargets );
      userToken = token;
    } else {
      deselectedToken = true;
      game.user.updateTokenTargets([]);
      userToken = {};

    }
  }
});

Hooks.on( "targetToken", ( user, token, active ) => {
  const activeModule = game.settings.get( moduleName, "altTargeting" );
  const gmOnly = game.settings.get( moduleName, "gmOnly" );
  const activeUser = gmOnly ? game.user.isGM : true;
  let emptyUserToken;

  if( game.data.release.generation < 10 ){
    /* deprecated in V10 */
    emptyUserToken = foundry.utils.isObjectEmpty( userToken );
  } else {
    emptyUserToken = foundry.utils.isEmpty( userToken );
  }
  if( activeModule && !emptyUserToken && activeUser ) {
    if( active ) {
      let currTargets = userToken.document.getFlag( moduleName, "targets" ) || [];

      /* check if target already exists in array */
      if( !currTargets.includes( token.id ) ){ currTargets.push( token.id ); }

      userToken.document.setFlag( moduleName, "targets", currTargets );
    } else {
      if( !deselectedToken ) {
        let currTargets = userToken.document.getFlag( moduleName, "targets" ) || [];
        currTargets = currTargets.filter( t => t !== token.id );
        userToken.document.setFlag( moduleName, "targets", currTargets );
      }
    }
  }
});
