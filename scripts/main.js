const moduleName = "fvtt-token-targeting";
let userToken = {};
let deselectedToken;

Hooks.once("init", () => {

  game.settings.register( moduleName, "altTargeting", {
    "name": game.i18n.localize( "TT.altTargeting" ),
    "hint": game.i18n.localize( "TT.altTargetingHint" ),
    "scope": "client",
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
        token.document.setFlag( moduleName, "targets", culledTargets );
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

Hooks.on( "targetToken", async ( user, token, active ) => {
    const activeModule = game.settings.get( moduleName, "altTargeting" );
    const gmOnly = game.settings.get( moduleName, "gmOnly" );
    const activeUser = gmOnly ? game.user.isGM : true;
    let emptyUserToken;
    let currTargets = userToken?.document?.getFlag( moduleName, "targets" ) || [];

    if( game.data.release.generation < 10 ) {
      /* deprecated in V10 */
      emptyUserToken = foundry.utils.isObjectEmpty( userToken );
    } else {
      emptyUserToken = foundry.utils.isEmpty( userToken );
    }
    if( activeModule && !emptyUserToken && activeUser ) {
      if( active ) {
        /* check if target already exists in array */
        if( !currTargets.includes( token.id ) ) {
          currTargets.push( token.id );
        }

        if( user.id === game.userId ) {
          userToken.document.setFlag( moduleName, "targets", currTargets );
        }
      } else {
        if( !deselectedToken ) {
          currTargets = currTargets.filter( t => t !== token.id );
          if( user.id === game.userId ) {
            try {
              await userToken.document.setFlag( moduleName, "targets", currTargets );
            } catch( error ) {
              if( error.message.includes( "does not exist in the EmbeddedCollection Collection" ) ) {
                console.log( "catching Token deletion error due to sync-only hooks, ignore" )
              } else {
                console.error( error );
              }
            }
          }
        }
      }

      /* refresh current users targets in case of changes from user/GM */
      if( user.id !== game.userId ) {
        const currTargetsMap = currTargets.map( t => canvas.tokens.get( t ).document.name );
        console.log( currTargetsMap );
        game.user.updateTokenTargets( currTargets );
      }
    }
});
