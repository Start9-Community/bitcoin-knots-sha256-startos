import { IMPOSSIBLE, T, VersionInfo } from '@start9labs/start-sdk'
import { readFile, writeFile } from 'fs/promises'
import { clearOnionTarget } from 'tor-startos/startos/utils/target'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { onionBinding } from '../init/onionTarget'
import { sdk } from '../sdk'
import { cleanChainstateOld } from '../utils'
import { raiseDatacarriercost32 } from './v32.1_0'

/** Knots 29.3's built-in software expiry, which the pre-RDTS Other Settings form wrote on every save. */
const knots293SoftwareExpiry = 1825593420

async function dropInheritedSoftwareExpiry(effects: T.Effects) {
  const conf = await bitcoinConfFile.read().once()
  if (conf?.softwareexpiry === knots293SoftwareExpiry) {
    await bitcoinConfFile.merge(effects, { softwareexpiry: undefined })
  }
}

/** Every mempool policy key, unset so the arriving flavor's own defaults apply. */
const mempoolReset = {
  persistmempool: undefined,
  maxmempool: undefined,
  mempoolexpiry: undefined,
  mempoolfullrbf: undefined,
  permitbaremultisig: undefined,
  datacarrier: undefined,
  datacarriersize: undefined,
  permitbaredatacarrier: undefined,
  rejectparasites: undefined,
  rejecttokens: undefined,
  mempoolreplacement: undefined,
  mempooltruc: undefined,
  permitbareanchor: undefined,
  permitephemeral: undefined,
  minrelaytxfee: undefined,
  bytespersigop: undefined,
  bytespersigopstrict: undefined,
  maxtxlegacysigops: undefined,
  limitancestorcount: undefined,
  limitancestorsize: undefined,
  limitdescendantcount: undefined,
  limitdescendantsize: undefined,
  permitbarepubkey: undefined,
  maxscriptsize: undefined,
  datacarriercost: undefined,
  acceptnonstddatacarrier: undefined,
  dustrelayfee: undefined,
  acceptunknownwitness: undefined,
  minrelaycoinblocks: undefined,
  minrelaymaturity: undefined,
}

// Keys Core does not model and would carry over verbatim; this flavor's writer always emits deprecatedrpc.
const knotsOnlyKey =
  /^(deprecatedrpc=create_bdb|blockmaxsize=|blockreconstructionextratxnsize=)/

const toCore = async ({ effects }: { effects: T.Effects }) => {
  await bitcoinConfFile.merge(effects, mempoolReset)
  const path = '/media/startos/volumes/main/bitcoin.conf'
  const conf = await readFile(path, 'utf8')
  await writeFile(
    path,
    conf
      .split('\n')
      .filter((line) => !knotsOnlyKey.test(line))
      .join('\n'),
  )
  await clearOnionTarget(sdk, effects, onionBinding)
}

async function prepareFlavorSwitch(effects: T.Effects) {
  await dropInheritedSoftwareExpiry(effects)
  await raiseDatacarriercost32(effects)
  await cleanChainstateOld(effects)
}

const fromCore = {
  up: async ({ effects }: { effects: T.Effects }) => {
    await bitcoinConfFile.merge(effects, mempoolReset)
    await prepareFlavorSwitch(effects)
  },
}

const fromKnots = {
  up: async ({ effects }: { effects: T.Effects }) => {
    await prepareFlavorSwitch(effects)
  },
}

export const current = VersionInfo.of({
  version: '#knotssha:32.1:3',
  releaseNotes: {
    en_US: `Bitcoin Knots SHA256 32.1: Bitcoin Knots' relay and mining policy controls, with Knots' defaults, on Bitcoin Core 32.1. It follows the same chain as Bitcoin Core.

- ZeroMQ notifications are now reachable only by other services on this server, no longer from your local network. The ZeroMQ Block and ZeroMQ Transaction interfaces are removed; services that use ZeroMQ, such as LND, are unaffected.
- Peers that connect through your .onion address learn only that address, never your public IP address, and a misbehaving one is disconnected without affecting your other onion peers. Requires Tor 0.4.9.17:4 or later.
- On disks under roughly 900 GB, the Pruning setting can no longer be left empty.
- Send Coins and Send All Coins warn before spending and check the amount and fee rate before they send.
- Peer Settings offers Private Broadcast, which sends each transaction submitted over RPC through its own short-lived Tor or I2P connection.
- Switching here from Bitcoin Core keeps your synced chain and resets the mempool settings to this node's defaults. Switching from this node to Bitcoin Core 31 or older, or to Bitcoin Knots (pre-RDTS), is refused: they run an older major version.
- If Stop does not finish within 10 minutes before you update, restart the server and update once it is back up.

[Full release notes](https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113)`,
    es_ES: `Bitcoin Knots SHA256 32.1: los controles de política de retransmisión y minería de Bitcoin Knots, con los valores predeterminados de Knots, sobre Bitcoin Core 32.1. Sigue la misma cadena que Bitcoin Core.

- Las notificaciones ZeroMQ ahora solo son accesibles para otros servicios de este servidor, ya no desde su red local. Se eliminan las interfaces Bloque ZeroMQ y Transacción ZeroMQ; los servicios que usan ZeroMQ, como LND, no se ven afectados.
- Los pares que se conectan a través de su dirección .onion solo conocen esa dirección, nunca su dirección IP pública, y uno que se comporte mal se desconecta sin afectar a sus demás pares onion. Requiere Tor 0.4.9.17:4 o posterior.
- En discos de menos de unos 900 GB, el ajuste Poda ya no puede quedar vacío.
- Enviar monedas y Enviar todas las monedas avisan antes de gastar y comprueban el importe y la tasa de comisión antes de enviar.
- Configuración de pares ofrece Transmisión privada, que envía cada transacción recibida por RPC a través de su propia conexión Tor o I2P de corta duración.
- Cambiar a este nodo desde Bitcoin Core conserva su cadena sincronizada y restablece la configuración de la mempool a los valores predeterminados de este nodo. Se rechaza el cambio de este nodo a Bitcoin Core 31 o anterior, o a Bitcoin Knots (pre-RDTS): ejecutan una versión mayor más antigua.
- Si Detener no termina en 10 minutos antes de actualizar, reinicie el servidor y actualice cuando vuelva a estar en marcha.

[Notas completas de la versión](https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113)`,
    de_DE: `Bitcoin Knots SHA256 32.1: die Richtlinien für Weiterleitung und Mining von Bitcoin Knots, mit den Standardwerten von Knots, auf Bitcoin Core 32.1. Es folgt derselben Chain wie Bitcoin Core.

- ZeroMQ-Benachrichtigungen sind jetzt nur noch für andere Dienste auf diesem Server erreichbar, nicht mehr aus Ihrem lokalen Netzwerk. Die Schnittstellen ZeroMQ-Block und ZeroMQ-Transaktion wurden entfernt; Dienste, die ZeroMQ nutzen, etwa LND, sind nicht betroffen.
- Peers, die sich über Ihre .onion-Adresse verbinden, erfahren nur diese Adresse, nie Ihre öffentliche IP-Adresse, und ein Peer, der sich fehlverhält, wird getrennt, ohne Ihre anderen Onion-Peers zu beeinträchtigen. Erfordert Tor 0.4.9.17:4 oder neuer.
- Auf Datenträgern unter etwa 900 GB darf die Einstellung Beschneidung nicht mehr leer bleiben.
- Coins senden und Alle Coins senden warnen vor dem Ausgeben und prüfen Betrag und Gebührensatz, bevor sie senden.
- Die Peer-Einstellungen bieten Privater Broadcast, der jede per RPC übermittelte Transaktion über eine eigene kurzlebige Tor- oder I2P-Verbindung sendet.
- Ein Wechsel von Bitcoin Core zu diesem Knoten behält Ihre synchronisierte Chain und setzt die Mempool-Einstellungen auf die Standardwerte dieses Knotens zurück. Ein Wechsel von diesem Knoten zu Bitcoin Core 31 oder älter oder zu Bitcoin Knots (pre-RDTS) wird abgelehnt: Sie laufen auf einer älteren Hauptversion.
- Wenn Stoppen vor dem Update nicht innerhalb von 10 Minuten abgeschlossen ist, starten Sie den Server neu und aktualisieren Sie, sobald er wieder läuft.

[Vollständige Versionshinweise](https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113)`,
    pl_PL: `Bitcoin Knots SHA256 32.1: ustawienia zasad przekazywania i kopania z Bitcoin Knots, z domyślnymi wartościami Knots, na Bitcoin Core 32.1. Podąża za tym samym łańcuchem co Bitcoin Core.

- Powiadomienia ZeroMQ są teraz dostępne tylko dla innych usług na tym serwerze, a nie z sieci lokalnej. Usunięto interfejsy Blok ZeroMQ i Transakcja ZeroMQ; usługi korzystające z ZeroMQ, takie jak LND, działają bez zmian.
- Węzły łączące się przez Twój adres .onion poznają tylko ten adres, nigdy Twojego publicznego adresu IP, a węzeł, który źle się zachowuje, zostaje rozłączony bez wpływu na pozostałe węzły onion. Wymaga Tor 0.4.9.17:4 lub nowszego.
- Na dyskach mniejszych niż około 900 GB ustawienie Przycinanie nie może już pozostać puste.
- Wyślij monety i Wyślij wszystkie monety ostrzegają przed wydaniem środków i sprawdzają kwotę oraz stawkę opłaty przed wysłaniem.
- Ustawienia peerów oferują Prywatne rozgłaszanie, które wysyła każdą transakcję przekazaną przez RPC własnym, krótkotrwałym połączeniem Tor lub I2P.
- Przełączenie na ten węzeł z Bitcoin Core zachowuje zsynchronizowany łańcuch i przywraca ustawienia mempoola do wartości domyślnych tego węzła. Przełączenie z tego węzła na Bitcoin Core 31 lub starszy albo na Bitcoin Knots (pre-RDTS) jest odrzucane: działają one na starszej wersji głównej.
- Jeśli Zatrzymaj nie zakończy się w ciągu 10 minut przed aktualizacją, uruchom ponownie serwer i zaktualizuj, gdy znów będzie działał.

[Pełne informacje o wydaniu](https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113)`,
    fr_FR: `Bitcoin Knots SHA256 32.1 : les réglages de politique de relais et de minage de Bitcoin Knots, avec les valeurs par défaut de Knots, sur Bitcoin Core 32.1. Il suit la même chaîne que Bitcoin Core.

- Les notifications ZeroMQ ne sont désormais accessibles qu’aux autres services de ce serveur, et non plus depuis votre réseau local. Les interfaces Bloc ZeroMQ et Transaction ZeroMQ sont supprimées ; les services qui utilisent ZeroMQ, comme LND, ne sont pas affectés.
- Les pairs qui se connectent via votre adresse .onion ne connaissent que cette adresse, jamais votre adresse IP publique, et un pair au comportement abusif est déconnecté sans affecter vos autres pairs onion. Nécessite Tor 0.4.9.17:4 ou une version ultérieure.
- Sur les disques de moins de 900 Go environ, le réglage Élagage ne peut plus rester vide.
- Envoyer des pièces et Envoyer toutes les pièces avertissent avant de dépenser et vérifient le montant et le taux de frais avant d’envoyer.
- Paramètres des pairs propose Diffusion privée, qui envoie chaque transaction soumise par RPC via sa propre connexion Tor ou I2P de courte durée.
- Passer à ce nœud depuis Bitcoin Core conserve votre chaîne synchronisée et rétablit les paramètres du mempool aux valeurs par défaut de ce nœud. Le passage de ce nœud à Bitcoin Core 31 ou antérieur, ou à Bitcoin Knots (pre-RDTS), est refusé : ils exécutent une version majeure plus ancienne.
- Si Arrêter ne se termine pas en 10 minutes avant la mise à jour, redémarrez le serveur et mettez à jour une fois qu’il est de nouveau en marche.

[Notes de version complètes](https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113)`,
  },
  migrations: {
    up: async ({ effects }) => {
      await cleanChainstateOld(effects)
    },
    down: IMPOSSIBLE,
    // Arrival from another flavor. Leaving goes back to Bitcoin Core 32 only: older lines cannot take 32.x data.
    other: {
      '^32': {
        up: fromCore.up,
        down: toCore,
      },
      '^31': fromCore,
      '^30': fromCore,
      '^29': fromCore,
      '^28': fromCore,
      '^#knotsprerdts:29.3': fromKnots,
      // #knots after :7 is the RDTS chain.
      '<=#knots:29.3:7': fromKnots,
    },
  },
})
  // Bitcoin Core's 32.x version and its satisfies list; claim a revision only once every dependent-facing change up to it is here.
  .satisfies('32.1:5')
  .satisfies('31.2:5')
  .satisfies('30.4:4')
  .satisfies('29.5:4')
  .satisfies('28.4:42')
