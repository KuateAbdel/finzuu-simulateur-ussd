package com.simulateurussd

import android.media.AudioManager
import android.media.ToneGenerator
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * TonalitesModule
 * ===============
 * Les tonalites DTMF du clavier — demande Direction du 27/08 : « le son
 * quand on tape sur les numeros ».
 *
 * DTMF (ITU-T Q.23) : chaque touche emet DEUX sinusoides simultanees, une de
 * ligne et une de colonne (le « 5 » = 770 + 1336 Hz, le « # » = 941 + 1477).
 * C'est cette superposition qui donne le timbre reconnaissable ; un ton
 * unique sonnerait comme un bip d'ascenseur, pas comme un telephone.
 *
 * ON NE SYNTHETISE RIEN. `ToneGenerator` est le generateur qu'utilise le
 * clavier SYSTEME : le son est le vrai, et aucun fichier audio n'est
 * embarque (ENF-01 — la taille de l'APK est une exigence).
 *
 * DEUX CHOIX DE FIDELITE :
 *
 *   1. FLUX `STREAM_DTMF`, jamais le flux musique. Il suit le reglage
 *      « tonalites du clavier » du telephone : un usager qui a coupe les
 *      sons de touches n'en entend aucun ici non plus. Imposer un son que
 *      l'appareil a explicitement refuse serait une infidelite au parcours
 *      reel — et une nuisance.
 *   2. LE SON NE DOIT JAMAIS FAIRE ECHOUER UNE SAISIE. `ToneGenerator`
 *      peut lever si le peripherique audio est occupe (appel en cours,
 *      autre application qui tient le flux). On avale : une touche qui ne
 *      s'inscrit pas parce que le haut-parleur est pris serait un defaut
 *      grave pour un agrement mineur. Meme doctrine que le champ `appareil`
 *      du contrat 0.4 : un confort ne fait pas tomber l'essentiel.
 */
class TonalitesModule(contexte: ReactApplicationContext) :
  ReactContextBaseJavaModule(contexte) {

  override fun getName() = NOM

  /** Duree d'un ton, en millisecondes. Sur un vrai terminal le ton dure tant
   *  que la touche est tenue ; nos touches sont des appuis brefs, une duree
   *  fixe et courte est donc plus juste qu'un maintien simule. */
  private val dureeMs = 80

  private val generateur: ToneGenerator? by lazy {
    try {
      ToneGenerator(AudioManager.STREAM_DTMF, VOLUME)
    } catch (_: RuntimeException) {
      null // peripherique audio indisponible : on jouera simplement rien
    }
  }

  /** Joue la tonalite de CETTE touche. Une touche inconnue ne joue rien —
   *  jamais un son par defaut, qui mentirait sur ce qui a ete tape. */
  @ReactMethod
  fun jouer(touche: String) {
    val ton = TONS[touche] ?: return
    try {
      generateur?.startTone(ton, dureeMs)
    } catch (_: RuntimeException) {
      // Voir l'en-tete : le son ne fait jamais echouer une saisie.
    }
  }

  override fun invalidate() {
    try {
      generateur?.release()
    } catch (_: RuntimeException) {
      // rien a faire : l'objet part avec le contexte
    }
    super.invalidate()
  }

  companion object {
    const val NOM = "Tonalites"

    /** 0-100. Le flux DTMF porte deja le reglage de l'usager ; ce volume est
     *  le niveau DANS ce flux, pas une facon de passer outre. */
    private const val VOLUME = 60

    /** Les douze touches du clavier, chacune vers sa constante DTMF. */
    private val TONS =
      mapOf(
        "0" to ToneGenerator.TONE_DTMF_0,
        "1" to ToneGenerator.TONE_DTMF_1,
        "2" to ToneGenerator.TONE_DTMF_2,
        "3" to ToneGenerator.TONE_DTMF_3,
        "4" to ToneGenerator.TONE_DTMF_4,
        "5" to ToneGenerator.TONE_DTMF_5,
        "6" to ToneGenerator.TONE_DTMF_6,
        "7" to ToneGenerator.TONE_DTMF_7,
        "8" to ToneGenerator.TONE_DTMF_8,
        "9" to ToneGenerator.TONE_DTMF_9,
        "*" to ToneGenerator.TONE_DTMF_S, // 941 + 1209 Hz
        "#" to ToneGenerator.TONE_DTMF_P, // 941 + 1477 Hz
      )
  }
}
