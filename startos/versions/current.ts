import { FileHelper, IMPOSSIBLE, VersionInfo, z } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile, toBitcoinConf } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. Applied on Core ↔ Knots transitions only: Knots
 * flavors share the same policy defaults, so switching between them leaves
 * the mempool config alone.
 */
/**
 * Knots 29.3's built-in software expiry (2027-11-07). The pre-RDTS packages'
 * Other Settings form wrote it into bitcoin.conf on every save whether or not
 * the user changed it, so a switched-over node would otherwise expire a year
 * before this release does. Only that exact value is dropped; a value the user
 * chose (0 included) is kept.
 */
const knots293SoftwareExpiry = 1825593420

async function dropInheritedSoftwareExpiry(
  effects: Parameters<typeof bitcoinConfFile.merge>[0],
) {
  const conf = await bitcoinConfFile.read().once()
  if (conf?.softwareexpiry === knots293SoftwareExpiry) {
    await bitcoinConfFile.merge(effects, { softwareexpiry: undefined })
  }
}

/**
 * Bitcoin Knots SHA256 32.x raised the -datacarriercost default from 1 to 2. Installs
 * up to 31.x wrote 1 into bitcoin.conf, which cannot be told apart from a deliberate
 * choice, so a stored 1 becomes 2 once, on the first update to a 32.x package
 * (decisions/0027, as decisions/0026 does for Umbrel; the release notes say how to set
 * 1 again). The store.json flag makes it run once: a 1 set afterwards stays.
 */
async function raiseDatacarriercost32(
  effects: Parameters<typeof bitcoinConfFile.merge>[0],
) {
  const store = await storeJson.read().once()
  if (store?.datacarriercost32) return
  const conf = await bitcoinConfFile.read().once()
  if (conf?.datacarriercost === 1) {
    await bitcoinConfFile.merge(effects, { datacarriercost: 2 })
  }
  await storeJson.merge(effects, { datacarriercost32: true })
}

const mempoolReset = {
  // Shared mempool settings
  persistmempool: undefined,
  maxmempool: undefined,
  mempoolexpiry: undefined,
  mempoolfullrbf: undefined,
  permitbaremultisig: undefined,
  datacarrier: undefined,
  datacarriersize: undefined,
  // Knots-specific mempool settings
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

/**
 * This node is Bitcoin Core 31.x underneath, so its datadir carries two
 * things an older bitcoind refuses to read. Removing them is what the
 * official Core 31.x package does on its own downgrade path; both are
 * rebuilt by the destination binary.
 */
const removeFeeEstimates = async () => {
  // v31 changed CURRENT_FEES_FILE_VERSION (149900 → 309900) and the fee
  // estimator bucket size; ≤30 hard-fails on a v31-written file.
  await rm('/media/startos/volumes/main/fee_estimates.dat', {
    force: true,
  }).catch(console.error)
}
const removeCoinstatsIndex = async () => {
  // Core 30 moved the coinstatsindex layout; a ≤29 node cannot read it.
  await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
    recursive: true,
    force: true,
  }).catch(console.error)
}

/**
 * Revisions up to #knotssha:31.1:4 wrote bitcoin.conf with FileHelper.ini's quoting
 * and escapes, which bitcoind keeps verbatim. Re-read such a file that way and rewrite
 * it raw, as Bitcoin Core's package does on its own upgrade to 31.1:27. Only on our own
 * upgrade path: a flavor switched over from may already write raw (Core 31.1:27+), and
 * re-reading a raw file as ini would cut a Block Notify command at its first \`;\`.
 */
async function rewriteConfRaw(
  effects: Parameters<typeof bitcoinConfFile.write>[0],
) {
  const conf = await FileHelper.ini(bitcoinConfFile.path, z.looseObject({}), {
    bracketedArray: false,
  })
    .read()
    .once()
  if (conf)
    await FileHelper.string(bitcoinConfFile.path).write(
      effects,
      toBitcoinConf(conf),
    )
}

const notesByLocale = {
  en_US: [
    "Bitcoin Knots SHA256 32.1 (32.1.knots-sha256.20261113) on Bitcoin Core 32.1. This is revision 2 of the 32.1 package. It is built with the current StartOS packaging tools, which also stop the status checks from using a little more memory each time they run, and like Bitcoin Core's package it needs StartOS 0.4.2 or later. Revision 1 replaced the 31.x line: there will be no further 31.x release. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113",
    "Fixes Stop, updates and restarts that never finish. A status check that sent the node a request that never came back stayed at Starting from then on, and it also kept the service from stopping: the RPC proxy and I2P shut down, but the node itself was never asked to, so an update sat at Installing 80% and a restart of the server hung. Each check now gives up on a request after a minute and asks again, so it can no longer hold up a stop. This does not shorten the node's own shutdown, which still has its full 5 minutes to save its data.",
    'Before updating to this version, press Stop and wait until it shows Stopped. If it does not stop within 10 minutes, or a status check has been stuck at Starting for a long time, the version you are running has this problem: restart the server, and update once it is back up. If the restart also hangs, turn the server off and on again. The node recovers from that, though its next start can take longer while it catches up on what it had not yet saved.',
    'The Datacarrier Cost default is now 2: each byte of data counts as at least 2 virtual bytes, at admission to the mempool and for mining order, eviction and fee bumping. Earlier versions of this package wrote 1 into the settings at install, so a stored 1 becomes 2 once, on this update. To keep 1, set it again in Mempool Settings after the update; it then stays.',
    'New spam filters, on by default: output hashes and keys that are all printable text, witness items a script drops without using them, and multisig keys that no signature proves now count as data. Payments to future witness versions are no longer relayed (Accept Unknown Witness is off by default).',
    'Bitcoin Core 32.1 underneath. Maximum Connections now defaults to 200 on a new install; a value already saved in Peer Settings is kept, except that the minimum is now 53 (a lower saved value is raised to 53), so services that connect to the node directly, such as Electrs, still find a free slot.',
    'Bitcoin now also accepts peers and ZMQ connections over IPv6. It no longer tries to set up its own Tor onion service, which only produced a warning every few minutes: StartOS serves the onion address, and incoming Tor peers work as before.',
    'Download UTXO Snapshot accepts https links only and needs 11 GiB of free space. It is not offered on a pruned node with the Block Filter Index or Coinstats Index on: in that combination Bitcoin Core 32.1, and so this node, stops when the snapshot finishes validating (https://github.com/bitcoin/bitcoin/issues/36939). Turn the index off first, or sync without a snapshot.',
    "Keeps the shared RPC login volume and RPC proxy 0.8.4 from revision 31.2:2. Stands in for Bitcoin Core's package 32.1:2 and 31.2:5, so services that require them, such as Electrs 0.12.1:1, LND 0.21.8-beta:2 and Mempool 3.3.2:7, keep working.",
    "Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.",
    'Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.',
  ].join(' '),
  es_ES: [
    'Bitcoin Knots SHA256 32.1 (32.1.knots-sha256.20261113) sobre Bitcoin Core 32.1. Esta es la revisión 2 del paquete 32.1. Está compilada con las herramientas de empaquetado actuales de StartOS, que además evitan que las comprobaciones de estado usen un poco más de memoria cada vez que se ejecutan, y, al igual que el paquete de Bitcoin Core, requiere StartOS 0.4.2 o posterior. La revisión 1 sustituyó a la línea 31.x: no habrá más versiones 31.x. Notas completas de la versión: https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113',
    'Corrige Detener, las actualizaciones y los reinicios que nunca terminaban. Una comprobación de estado que enviaba al nodo una solicitud que nunca recibía respuesta se quedaba en Iniciando desde ese momento y, además, impedía que el servicio se detuviera: el proxy RPC e I2P se cerraban, pero al nodo nunca se le pedía que se detuviera, por lo que una actualización se quedaba en Instalando 80 % y un reinicio del servidor se colgaba. Ahora cada comprobación abandona una solicitud al cabo de un minuto y vuelve a preguntar, así que ya no puede bloquear una detención. Esto no acorta el apagado del propio nodo, que sigue disponiendo de sus 5 minutos completos para guardar sus datos.',
    'Antes de actualizar a esta versión, pulse Detener y espere hasta que aparezca Detenido. Si no se detiene en 10 minutos, o si una comprobación de estado lleva mucho tiempo en Iniciando, la versión que está usando tiene este problema: reinicie el servidor y actualice cuando vuelva a estar en marcha. Si el reinicio también se cuelga, apague el servidor y vuelva a encenderlo. El nodo se recupera de ello, aunque su siguiente arranque puede tardar más mientras recupera lo que aún no había guardado.',
    'El valor predeterminado de Datacarrier Cost es ahora 2: cada byte de datos cuenta como al menos 2 bytes virtuales, al admitirse en la mempool y para el orden de minado, el desalojo y el aumento de comisiones. Las versiones anteriores de este paquete escribían 1 en la configuración durante la instalación, por lo que un 1 guardado pasa a ser 2 una sola vez, en esta actualización. Para mantener 1, vuelva a establecerlo en Configuración de Mempool después de la actualización; a partir de entonces se conserva.',
    'Nuevos filtros de spam, activados por defecto: los hashes y claves de salida compuestos solo por texto imprimible, los elementos de testigo que un script descarta sin usarlos y las claves multifirma que ninguna firma demuestra ahora cuentan como datos. Los pagos a versiones de testigo futuras ya no se retransmiten (Accept Unknown Witness está desactivado por defecto).',
    'Bitcoin Core 32.1 por debajo. Conexiones máximas tiene ahora un valor predeterminado de 200 en una instalación nueva; se conserva un valor ya guardado en Configuración de pares, salvo que el mínimo es ahora 53 (un valor guardado menor se eleva a 53), para que los servicios que se conectan directamente al nodo, como Electrs, sigan encontrando un hueco libre.',
    'Bitcoin ahora también acepta pares y conexiones ZMQ por IPv6. Ya no intenta configurar su propio servicio onion de Tor, lo que solo producía un aviso cada pocos minutos: StartOS sirve la dirección onion y los pares Tor entrantes funcionan como antes.',
    'Descargar instantánea UTXO (assumeutxo) solo acepta enlaces https y necesita 11 GiB de espacio libre. No se ofrece en un nodo podado con el Índice de filtros de bloques o el Índice Coinstats activado: en esa combinación, Bitcoin Core 32.1, y por tanto este nodo, se detiene cuando la instantánea termina de validarse (https://github.com/bitcoin/bitcoin/issues/36939). Desactive primero el índice o sincronice sin instantánea.',
    'Mantiene el volumen compartido de inicio de sesión RPC y el proxy RPC 0.8.4 de la revisión 31.2:2. Sustituye a los paquetes 32.1:2 y 31.2:5 de Bitcoin Core, por lo que los servicios que los requieren, como Electrs 0.12.1:1, LND 0.21.8-beta:2 y Mempool 3.3.2:7, siguen funcionando.',
    'Cambie a él desde Bitcoin Core, Bitcoin Knots (pre-RDTS) o Bitcoin Knots (Legacy) heredado de StartOS 0.3.5.1, y conserve su cadena sincronizada. Cambiar desde Bitcoin Core restablece la configuración de la mempool para que se apliquen los valores predeterminados de política de este nodo. Bitcoin Knots (RDTS) sigue una cadena diferente y no se puede cambiar ni a él ni desde él.',
    'Volver a Bitcoin Core 30 o anterior, o a Bitcoin Knots (pre-RDTS), elimina las estimaciones de comisiones y, en el caso de Bitcoin Core 29 o anterior y de Bitcoin Knots (pre-RDTS), también el índice Coinstats, porque el nodo más antiguo no puede leerlos; ambos se reconstruyen.',
  ].join(' '),
  de_DE: [
    'Bitcoin Knots SHA256 32.1 (32.1.knots-sha256.20261113) auf Bitcoin Core 32.1. Dies ist Revision 2 des 32.1-Pakets. Sie wird mit den aktuellen StartOS-Paketierungswerkzeugen gebaut, die außerdem verhindern, dass die Statusprüfungen bei jedem Lauf etwas mehr Speicher belegen, und benötigt wie das Paket von Bitcoin Core StartOS 0.4.2 oder neuer. Revision 1 hat die 31.x-Reihe abgelöst: Es wird keine weitere 31.x-Version geben. Vollständige Versionshinweise: https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113',
    'Behebt Stoppen, Updates und Neustarts, die nie fertig wurden. Eine Statusprüfung, die dem Knoten eine Anfrage schickte, auf die nie eine Antwort kam, blieb von da an auf Startet stehen und verhinderte außerdem, dass der Dienst anhielt: Der RPC-Proxy und I2P wurden beendet, aber der Knoten selbst wurde nie dazu aufgefordert, sodass ein Update bei Wird installiert 80 % hängen blieb und ein Neustart des Servers hängte. Jede Prüfung gibt eine Anfrage jetzt nach einer Minute auf und fragt erneut, sodass sie ein Stoppen nicht mehr aufhalten kann. Das verkürzt nicht das Herunterfahren des Knotens selbst, der weiterhin seine vollen 5 Minuten hat, um seine Daten zu speichern.',
    'Drücken Sie vor dem Update auf diese Version auf Stoppen und warten Sie, bis Gestoppt angezeigt wird. Wenn er nicht innerhalb von 10 Minuten anhält oder eine Statusprüfung schon lange auf Startet steht, hat die laufende Version dieses Problem: Starten Sie den Server neu und aktualisieren Sie, sobald er wieder läuft. Wenn auch der Neustart hängt, schalten Sie den Server aus und wieder ein. Der Knoten erholt sich davon, auch wenn sein nächster Start länger dauern kann, während er nachholt, was er noch nicht gespeichert hatte.',
    'Der Standardwert von Datacarrier Cost ist jetzt 2: Jedes Datenbyte zählt als mindestens 2 virtuelle Bytes, bei der Aufnahme in den Mempool sowie für Mining-Reihenfolge, Verdrängung und Gebührenerhöhung. Frühere Versionen dieses Pakets haben bei der Installation 1 in die Einstellungen geschrieben, daher wird eine gespeicherte 1 bei diesem Update einmalig zu 2. Um 1 zu behalten, setzen Sie den Wert nach dem Update in den Mempool-Einstellungen erneut; danach bleibt er erhalten.',
    'Neue Spamfilter, standardmäßig aktiv: Ausgabe-Hashes und -Schlüssel, die nur aus druckbarem Text bestehen, Witness-Elemente, die ein Skript ungenutzt verwirft, und Multisig-Schlüssel, die durch keine Signatur belegt sind, zählen jetzt als Daten. Zahlungen an zukünftige Witness-Versionen werden nicht mehr weitergeleitet (Accept Unknown Witness ist standardmäßig aus).',
    'Darunter Bitcoin Core 32.1. Maximale Verbindungen ist bei einer Neuinstallation jetzt standardmäßig 200; ein bereits in den Peer-Einstellungen gespeicherter Wert bleibt erhalten, nur ist das Minimum jetzt 53 (ein niedrigerer gespeicherter Wert wird auf 53 angehoben), damit Dienste, die sich direkt mit dem Knoten verbinden, wie Electrs, weiterhin einen freien Platz finden.',
    'Bitcoin akzeptiert Peers und ZMQ-Verbindungen jetzt auch über IPv6. Es versucht nicht mehr, einen eigenen Tor-Onion-Dienst einzurichten, was nur alle paar Minuten eine Warnung erzeugte: StartOS stellt die Onion-Adresse bereit, und eingehende Tor-Peers funktionieren wie bisher.',
    'UTXO-Snapshot herunterladen (assumeutxo) akzeptiert nur https-Links und benötigt 11 GiB freien Speicherplatz. Es wird auf einem gekürzten (pruned) Knoten mit aktiviertem Blockfilter-Index oder Coinstats-Index nicht angeboten: In dieser Kombination hält Bitcoin Core 32.1, und damit dieser Knoten, an, sobald die Validierung des Snapshots abgeschlossen ist (https://github.com/bitcoin/bitcoin/issues/36939). Schalten Sie zuerst den Index aus oder synchronisieren Sie ohne Snapshot.',
    'Behält das gemeinsame RPC-Anmeldevolume und den RPC-Proxy 0.8.4 aus Revision 31.2:2. Tritt an die Stelle der Bitcoin-Core-Pakete 32.1:2 und 31.2:5, sodass Dienste, die diese voraussetzen, wie Electrs 0.12.1:1, LND 0.21.8-beta:2 und Mempool 3.3.2:7, weiter funktionieren.',
    'Wechseln Sie von Bitcoin Core, Bitcoin Knots (pre-RDTS) oder dem aus StartOS 0.3.5.1 übernommenen Bitcoin Knots (Legacy) dazu und behalten Sie Ihre synchronisierte Chain. Ein Wechsel von Bitcoin Core setzt die Mempool-Einstellungen zurück, damit die Richtlinien-Standardwerte dieses Knotens gelten. Bitcoin Knots (RDTS) folgt einer anderen Chain; dorthin oder von dort kann nicht gewechselt werden.',
    'Ein Wechsel zurück zu Bitcoin Core 30 oder älter oder zu Bitcoin Knots (pre-RDTS) entfernt die Gebührenschätzungen und bei Bitcoin Core 29 oder älter und Bitcoin Knots (pre-RDTS) auch den Coinstats-Index, weil der ältere Knoten sie nicht lesen kann; beide werden neu aufgebaut.',
  ].join(' '),
  pl_PL: [
    'Bitcoin Knots SHA256 32.1 (32.1.knots-sha256.20261113) na Bitcoin Core 32.1. To jest rewizja 2 pakietu 32.1. Jest zbudowana aktualnymi narzędziami do pakowania StartOS, które dodatkowo sprawiają, że sprawdzenia stanu nie zużywają nieco więcej pamięci przy każdym uruchomieniu, i podobnie jak pakiet Bitcoin Core wymaga StartOS 0.4.2 lub nowszego. Rewizja 1 zastąpiła linię 31.x: kolejnych wydań 31.x nie będzie. Pełne informacje o wydaniu: https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113',
    'Naprawia zatrzymywanie, aktualizacje i ponowne uruchomienia, które nigdy się nie kończyły. Sprawdzenie stanu, które wysłało do węzła żądanie bez odpowiedzi, od tej chwili pozostawało w stanie Uruchamianie i dodatkowo uniemożliwiało zatrzymanie usługi: proxy RPC i I2P się wyłączały, ale sam węzeł nigdy nie otrzymywał polecenia zatrzymania, więc aktualizacja stała na Instalowanie 80%, a ponowne uruchomienie serwera się zawieszało. Każde sprawdzenie rezygnuje teraz z żądania po minucie i pyta ponownie, więc nie może już wstrzymać zatrzymania. Nie skraca to wyłączania samego węzła, który nadal ma pełne 5 minut na zapisanie swoich danych.',
    'Przed aktualizacją do tej wersji naciśnij Zatrzymaj i poczekaj, aż pojawi się Zatrzymano. Jeśli węzeł nie zatrzyma się w ciągu 10 minut albo sprawdzenie stanu od dawna stoi na Uruchamianie, używana wersja ma ten problem: uruchom ponownie serwer i zaktualizuj, gdy znów będzie działał. Jeśli ponowne uruchomienie również się zawiesi, wyłącz serwer i włącz go ponownie. Węzeł sobie z tym poradzi, choć jego następne uruchomienie może potrwać dłużej, gdy będzie nadrabiał to, czego jeszcze nie zapisał.',
    'Domyślna wartość Datacarrier Cost wynosi teraz 2: każdy bajt danych liczy się jako co najmniej 2 bajty wirtualne, przy przyjmowaniu do mempoola oraz przy kolejności kopania, usuwaniu z mempoola i podbijaniu opłat. Wcześniejsze wersje tego pakietu zapisywały 1 w ustawieniach podczas instalacji, więc zapisana wartość 1 zmienia się jednorazowo na 2 przy tej aktualizacji. Aby zachować 1, ustaw ją ponownie w Ustawieniach Mempool po aktualizacji; potem pozostanie.',
    'Nowe filtry spamu, domyślnie włączone: skróty i klucze wyjść składające się wyłącznie z drukowalnego tekstu, elementy świadka, które skrypt odrzuca bez użycia, oraz klucze multisig, których nie potwierdza żaden podpis, są teraz liczone jako dane. Płatności do przyszłych wersji świadka nie są już przekazywane dalej (Accept Unknown Witness jest domyślnie wyłączone).',
    'Pod spodem Bitcoin Core 32.1. Maksymalna liczba połączeń wynosi teraz domyślnie 200 przy nowej instalacji; wartość już zapisana w Ustawieniach peerów zostaje zachowana, z tym że minimum wynosi teraz 53 (niższa zapisana wartość zostaje podniesiona do 53), aby usługi łączące się bezpośrednio z węzłem, takie jak Electrs, nadal znajdowały wolne miejsce.',
    'Bitcoin akceptuje teraz także peery i połączenia ZMQ przez IPv6. Nie próbuje już tworzyć własnej usługi onion Tor, co powodowało jedynie ostrzeżenie co kilka minut: adres onion obsługuje StartOS, a przychodzące peery Tor działają jak wcześniej.',
    'Pobierz migawkę UTXO (assumeutxo) przyjmuje tylko linki https i wymaga 11 GiB wolnego miejsca. Nie jest dostępna na przyciętym węźle z włączonym Indeksem filtrów bloków lub Indeksem Coinstats: w takim połączeniu Bitcoin Core 32.1, a więc i ten węzeł, zatrzymuje się po zakończeniu walidacji migawki (https://github.com/bitcoin/bitcoin/issues/36939). Najpierw wyłącz indeks lub synchronizuj bez migawki.',
    'Zachowuje współdzielony wolumin logowania RPC i proxy RPC 0.8.4 z rewizji 31.2:2. Zastępuje pakiety Bitcoin Core 32.1:2 i 31.2:5, więc usługi, które ich wymagają, takie jak Electrs 0.12.1:1, LND 0.21.8-beta:2 i Mempool 3.3.2:7, nadal działają.',
    'Przełącz się na niego z Bitcoin Core, Bitcoin Knots (pre-RDTS) lub Bitcoin Knots (Legacy) przeniesionego ze StartOS 0.3.5.1 i zachowaj zsynchronizowany łańcuch. Przełączenie z Bitcoin Core resetuje ustawienia mempoola, aby obowiązywały domyślne zasady tego węzła. Bitcoin Knots (RDTS) podąża za innym łańcuchem i nie można się na niego ani z niego przełączyć.',
    'Powrót do Bitcoin Core 30 lub starszego albo do Bitcoin Knots (pre-RDTS) usuwa szacunki opłat, a w przypadku Bitcoin Core 29 lub starszego i Bitcoin Knots (pre-RDTS) także indeks Coinstats, ponieważ starszy węzeł nie potrafi ich odczytać; oba są odbudowywane.',
  ].join(' '),
  fr_FR: [
    "Bitcoin Knots SHA256 32.1 (32.1.knots-sha256.20261113) sur Bitcoin Core 32.1. Ceci est la révision 2 du paquet 32.1. Elle est construite avec les outils de paquetage actuels de StartOS, qui empêchent aussi les vérifications d'état d'utiliser un peu plus de mémoire à chaque exécution, et, comme le paquet de Bitcoin Core, elle nécessite StartOS 0.4.2 ou une version ultérieure. La révision 1 a remplacé la branche 31.x : il n'y aura plus de version 31.x. Notes de version complètes : https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113",
    "Corrige l'arrêt, les mises à jour et les redémarrages qui ne se terminaient jamais. Une vérification d'état qui envoyait au nœud une requête restée sans réponse restait ensuite bloquée sur Démarrage, et empêchait aussi le service de s'arrêter : le proxy RPC et I2P s'arrêtaient, mais le nœud lui-même n'en recevait jamais la demande, si bien qu'une mise à jour restait à Installation 80 % et qu'un redémarrage du serveur se bloquait. Chaque vérification abandonne désormais une requête au bout d'une minute et redemande, elle ne peut donc plus retenir un arrêt. Cela ne raccourcit pas l'arrêt du nœud lui-même, qui dispose toujours de ses 5 minutes complètes pour enregistrer ses données.",
    "Avant de mettre à jour vers cette version, appuyez sur Arrêter et attendez que Arrêté s'affiche. S'il ne s'arrête pas en 10 minutes, ou si une vérification d'état est bloquée sur Démarrage depuis longtemps, la version que vous utilisez a ce problème : redémarrez le serveur, puis mettez à jour une fois qu'il est de nouveau en marche. Si le redémarrage se bloque aussi, éteignez le serveur puis rallumez-le. Le nœud s'en remet, même si son démarrage suivant peut prendre plus de temps, le temps de rattraper ce qu'il n'avait pas encore enregistré.",
    "La valeur par défaut de Datacarrier Cost est désormais 2 : chaque octet de données compte pour au moins 2 octets virtuels, à l'admission dans le mempool ainsi que pour l'ordre de minage, l'éviction et l'augmentation des frais. Les versions précédentes de ce paquet écrivaient 1 dans les paramètres à l'installation, si bien qu'un 1 enregistré devient 2 une seule fois, lors de cette mise à jour. Pour garder 1, définissez-le à nouveau dans Paramètres du Mempool après la mise à jour ; il est alors conservé.",
    "Nouveaux filtres anti-spam, activés par défaut : les hachages et clés de sortie composés uniquement de texte imprimable, les éléments de témoin qu'un script abandonne sans les utiliser et les clés multisig qu'aucune signature ne prouve comptent désormais comme des données. Les paiements vers de futures versions de témoin ne sont plus relayés (Accept Unknown Witness est désactivé par défaut).",
    'Bitcoin Core 32.1 en dessous. Connexions maximales vaut désormais 200 par défaut sur une nouvelle installation ; une valeur déjà enregistrée dans Paramètres des pairs est conservée, sauf que le minimum est désormais de 53 (une valeur enregistrée inférieure est portée à 53), afin que les services qui se connectent directement au nœud, comme Electrs, trouvent toujours une place libre.',
    "Bitcoin accepte désormais aussi les pairs et les connexions ZMQ en IPv6. Il n'essaie plus de mettre en place son propre service onion Tor, ce qui ne produisait qu'un avertissement toutes les quelques minutes : StartOS fournit l'adresse onion, et les pairs Tor entrants fonctionnent comme avant.",
    "Télécharger l'instantané UTXO (assumeutxo) n'accepte que les liens https et nécessite 11 Gio d'espace libre. Il n'est pas proposé sur un nœud élagué dont l'Index des filtres de blocs ou l'Index Coinstats est activé : dans cette combinaison, Bitcoin Core 32.1, et donc ce nœud, s'arrête lorsque la validation de l'instantané se termine (https://github.com/bitcoin/bitcoin/issues/36939). Désactivez d'abord l'index, ou synchronisez sans instantané.",
    "Conserve le volume partagé d'identifiants RPC et le proxy RPC 0.8.4 de la révision 31.2:2. Remplace les paquets 32.1:2 et 31.2:5 de Bitcoin Core, de sorte que les services qui les exigent, comme Electrs 0.12.1:1, LND 0.21.8-beta:2 et Mempool 3.3.2:7, continuent de fonctionner.",
    "Passez-y depuis Bitcoin Core, Bitcoin Knots (pre-RDTS) ou Bitcoin Knots (Legacy) hérité de StartOS 0.3.5.1, en conservant votre chaîne synchronisée. Passer depuis Bitcoin Core réinitialise les paramètres du mempool afin que les valeurs de politique par défaut de ce nœud s'appliquent. Bitcoin Knots (RDTS) suit une autre chaîne : on ne peut ni y passer ni en revenir.",
    "Revenir à Bitcoin Core 30 ou antérieur, ou à Bitcoin Knots (pre-RDTS), supprime les estimations de frais et, pour Bitcoin Core 29 ou antérieur et Bitcoin Knots (pre-RDTS), aussi l'index Coinstats, car l'ancien nœud ne peut pas les lire ; les deux sont reconstruits.",
  ].join(' '),
}

export const current = VersionInfo.of({
  // #knotssha — the flavor is letters only (StartOS's exver grammar), so the
  // product name "knots-sha256" cannot be used verbatim. 32.1 is the Bitcoin
  // Core base of the installed release; the Knots SHA256 series date lives in
  // the VERSION build-arg in startos/manifest/index.ts, not here. The trailing
  // number is this package's own revision and bumps on every wrapper release.
  version: '#knotssha:32.1:2',
  releaseNotes: notesByLocale,
  migrations: {
    up: async ({ effects }) => {
      await rewriteConfRaw(effects)
      await raiseDatacarriercost32(effects)
    },
    down: IMPOSSIBLE,
    other: {
      // Bitcoin Core ↔ #knotssha, keyed by Core major series. `up` (arriving
      // from Core) resets the mempool config so Knots' policy defaults apply;
      // the data upgrade to a 32.x datadir is bitcoind's own. `down` (leaving
      // for Core) resets the mempool config again and removes what the older
      // binary cannot read.
      // Newest first: given a version range rather than an exact target, the SDK's
      // version graph takes the first matching edge, and the gentlest cleanup must win.
      // Bitcoin Core 32 (Start9's 32.x line, 32.1:0 from 2026-11-19). Same major as this
      // node: nothing to clean up.
      ['^32']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
        },
      },
      ['^29']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      ['^28']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      // Bitcoin Knots (pre-RDTS) ↔ #knotssha. Same chain, same policy
      // defaults, same data layout apart from the 31.x files above, so the
      // mempool config is left alone. That flavor is pinned to Knots
      // 29.3.knots20260507 forever, which is exactly the release this series
      // inherits from.
      ['^#knotsprerdts:29.3']: {
        up: async ({ effects }) => {
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      // `#knots` only up to :7, which ran Knots 29.3.knots20260210 or earlier
      // (pre-RDTS, the same chain; StartOS 0.3.5.1's Knots included). From :8 on,
      // and for `#knotsrdts`, Bitcoin Knots enforces BIP-110 and later mines
      // BLAKE2b proof-of-work, so those datadirs are on a different chain and a
      // migration in either direction is refused, as the pre-RDTS package refuses it.
      ['<=#knots:29.3:7']: {
        up: async ({ effects }) => {
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
      },
    },
  },
})
  // The Bitcoin Core revisions this package stands in for when a dependent's
  // `versionRange` is evaluated: the official bitcoin-core-startos `version`
  // plus the `.satisfies(...)` it carries. Copied from Core 31.x at 31.2:1 on
  // 2026-11-01 (Core's own list no longer names a 31.1 revision: 31.2:1 is above
  // every 31.1 floor); see UPDATING.md. Kept at 31.2:1 for 32.1:0 (2026-11-15):
  // Core 31.x is at 31.2:3, but :2 is the move to start-sdk 4 (StartOS 0.4.1,
  // which this package does not require) and :3 IPv6 listeners, neither of which
  // a dependent relies on; there is no Core 32 package yet.
  //
  // Claim a Core revision only when this package offers every dependent-facing
  // feature up to it. At 31.1:25 those are: REST on the bridge-only `rpc-local`
  // binding with btc-rpc-proxy v0.8.2 fronting `rpc` (:17/:18; electrs 0.12
  // requires >=31.1:17 and reads the node over REST), the dependent-enabled
  // wallet (:19), and coinbase block weight that mining services can reserve
  // (:25); Block Notify written raw (:27); Bitcoin Core 31.2 (31.2:0) and the
  // Background Validation health check electrs 0.12.0:7 requires (31.2:1). Host
  // ids, interface ids and ports are identical to Core's.
  // 2026-11-20 (31.2:2, hotfix): Core's 31.2:4 publishes .cookie and prune in a
  // `public` volume that dependents mount alone (electrs 0.12.1:1, lnd
  // 0.21.8-beta:2 and mempool 3.3.2:7 require >=31.2:4 and mount it), and 31.2:5
  // is btc-rpc-proxy 0.8.3, which refuses fetched blocks with repeated
  // transactions. This package has both (proxy 0.8.4, as Core's 31.2:6), so it
  // claims 31.2:5 and the other lines' releases with the same layout, as Core's
  // 31.x list does. Core's 31.2:2 (start-sdk 4) and 31.2:3 (IPv6 listeners) are
  // not dependent-facing.
  // 2026-11-23 (32.1:1): Core's 32.x is at 32.1:2 (32.1:0 = Core 32.1 base and the
  // 53-connection floor, :1 = snapshot download bounds + proxy 0.8.4, :2 = -listenonion=0);
  // this package has all of them and Core's 31.2:3 IPv6 listeners, so it claims 32.1:2.
  // Core's 32.x migration rework (ce11a3d) is about its own version history, not dependents.
  // 2026-11-23 (32.1:2): start-sdk 4.1.0 and StartOS 0.4.2, as Core's 32.x; no dependent-facing change,
  // so the claims are unchanged.
  .satisfies('32.1:2')
  .satisfies('31.2:5')
  .satisfies('30.4:4')
  .satisfies('29.5:4')
  .satisfies('28.4:42')
