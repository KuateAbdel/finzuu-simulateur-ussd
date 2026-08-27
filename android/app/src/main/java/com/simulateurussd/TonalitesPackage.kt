package com.simulateurussd

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Declare `TonalitesModule` au demarrage — il n'est pas auto-lie puisqu'il
 *  vit dans l'application et non dans une bibliotheque. */
class TonalitesPackage : ReactPackage {
  override fun createNativeModules(contexte: ReactApplicationContext): List<NativeModule> =
    listOf(TonalitesModule(contexte))

  override fun createViewManagers(
    contexte: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
